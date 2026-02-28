# KG 查询层重构

> Source: Notion local DB page `f10e1c65-13fe-4b74-931b-5840b8df6faf`

> 🔮

混合策略重构 KG 查询层 — CTE 图遍历 + 迭代化 DFS + Aho-Corasick 文本匹配 + Deque BFS，全部卸载到 ComputeProcess。

---

## 定位

重构 Knowledge Graph 查询层，采用混合策略——CTE 做图遍历、JS 做业务逻辑、Aho-Corasick 做文本匹配——消除 KG 相关的所有主线程阻塞、崩溃与性能退化。

> ⚠️

关键取舍：CTE 不是银弹。 图遍历用 CTE 是最优解，但 buildRulesInjection 的复杂业务逻辑和 entityMatcher 的文本匹配问题，CTE 完全不适合。必须按查询类型选择最佳策略。

---

## 待覆盖问题

- P0 #3 — 多个查询接口先全量拉图再计算

- P0 #4 — queryValidate 递归 DFS 无深度保护（栈溢出）

- P0 #5 — BFS 队列 Array.shift() 退化 O(n²)

- P1 #10 — Retrieved 实体匹配 N×M 同步扫描

- P1 #12 — KG 识别会话级内存泄漏

---

## 按查询类型的最优策略

| 查询类型 | 当前实现 | 最优策略 | 执行位置 | 理由 |
| --- | --- | --- | --- | --- |
| querySubgraph（BFS 展开 N 度子图） | JS .all() 全量拉取 + Array.shift() BFS | ✅ WITH RECURSIVE CTE | ComputeProcess SQLite | CTE 天然就是 BFS，SQLite 索引直接加速，零序列化开销 |
| queryPath（A→B 最短路径） | JS 全量拉取 + BFS 搜索 | ✅ CTE + LIMIT 剪枝 | ComputeProcess SQLite | CTE 做 BFS 找路径，LIMIT 找到即停 |
| queryValidate（DFS 验证图约束） | JS 递归 DFS，无深度保护 | ⚠️ 迭代化 BFS + maxDepth | ComputeProcess JS 层 | CTE 做 DFS 需要 LIFO trick 且有 SQLITE_MAX_RECURSIVE_DEPTH 限制；迭代化 BFS 更可控 |
| buildRulesInjection（规则注入） | JS 全量拉取 + 业务逻辑 | ⚠️ CTE 一次性拉取 + JS 业务逻辑 | ComputeProcess 混合 | 需要 JS 层的条件判断、字符串拼接、token 计算，CTE 做不了这些 |
| entityMatcher（N×M 文本匹配） | JS text.indexOf 暴力扫描 O(n×m×len) | ❌ Aho-Corasick 自动机 | ComputeProcess JS 层 | 这是 NLP 问题不是图遍历。预构建自动机，匹配时 O(text_length) 一趟扫完 |

---

## 3. CTE 重写：querySubgraph 与 queryPath

### 3.1 querySubgraph — BFS N 度子图展开

```
-- ── kgQueryService.ts → querySubgraph CTE 重写 ─────

WITH RECURSIVE subgraph(entity_id, depth) AS (
  -- 种子节点
  SELECT :rootEntityId, 0

  UNION ALL

  -- BFS 扩展：通过关系找邻居
  SELECT
    CASE
      WHEN r.source_entity_id = sg.entity_id THEN r.target_entity_id
      ELSE r.source_entity_id
    END,
    sg.depth + 1
  FROM subgraph sg
  JOIN kg_relations r ON (
    r.source_entity_id = sg.entity_id
    OR r.target_entity_id = sg.entity_id
  )
  WHERE sg.depth < :maxDepth           -- 深度限制
    AND r.project_id = :projectId      -- 项目隔离
)
SELECT DISTINCT e.*
FROM subgraph sg
JOIN kg_entities e ON e.entity_id = sg.entity_id
WHERE e.project_id = :projectId;
```

利用的索引（需在 migration 中确认存在）：

- idx_kg_relations_source — (project_id, source_entity_id)

- idx_kg_relations_target — (project_id, target_entity_id)

- idx_kg_entities_project — (project_id, entity_id)

### 3.2 queryPath — A→B 最短路径

```
-- ── kgQueryService.ts → queryPath CTE 重写 ─────────

WITH RECURSIVE path(entity_id, path_json, depth) AS (
  -- 起点
  SELECT :startId, json_array(:startId), 0

  UNION ALL

  -- BFS 扩展（记录完整路径用于防环 + 结果返回）
  SELECT
    CASE
      WHEN r.source_entity_id = p.entity_id THEN r.target_entity_id
      ELSE r.source_entity_id
    END,
    json_insert(p.path_json, '$[#]',
      CASE
        WHEN r.source_entity_id = p.entity_id THEN r.target_entity_id
        ELSE r.source_entity_id
      END
    ),
    p.depth + 1
  FROM path p
  JOIN kg_relations r ON (
    r.source_entity_id = p.entity_id
    OR r.target_entity_id = p.entity_id
  )
  WHERE p.depth < :maxDepth
    AND r.project_id = :projectId
    -- 防环：新节点不在已访问路径中
    AND NOT EXISTS (
      SELECT 1 FROM json_each(p.path_json)
      WHERE json_each.value = (
        CASE
          WHEN r.source_entity_id = p.entity_id THEN r.target_entity_id
          ELSE r.source_entity_id
        END
      )
    )
)
SELECT path_json, depth
FROM path
WHERE entity_id = :endId
ORDER BY depth ASC
LIMIT 1;  -- 最短路径，找到即停
```

### 3.3 TypeScript 封装层

```
// ── services/kg/kgCteQueries.ts ─────────────────────

import type { Database } from 'better-sqlite3';

interface SubgraphOptions {
  rootEntityId: string;
  projectId: string;
  maxDepth?: number;  // 默认 3
}

interface PathOptions {
  startId: string;
  endId: string;
  projectId: string;
  maxDepth?: number;  // 默认 10
}

// ── 预编译 Statement（ComputeProcess 启动时执行一次）──
let stmtSubgraph: ReturnType<Database['prepare']>;
let stmtPath: ReturnType<Database['prepare']>;

export function prepareCteStatements(db: Database): void {
  stmtSubgraph = db.prepare(SUBGRAPH_SQL);
  stmtPath = db.prepare(PATH_SQL);
}

export function querySubgraph(opts: SubgraphOptions): KgEntity[] {
  const { rootEntityId, projectId, maxDepth = 3 } = opts;
  return stmtSubgraph.all({ rootEntityId, projectId, maxDepth });
}

export function queryPath(opts: PathOptions): { path: string[]; depth: number } | null {
  const { startId, endId, projectId, maxDepth = 10 } = opts;
  const row = stmtPath.get({ startId, endId, projectId, maxDepth });
  if (!row) return null;
  return {
    path: JSON.parse(row.path_json),
    depth: row.depth,
  };
}
```

### 3.4 性能预估

| 场景 | 当前（JS 全量拉取） | CTE 重写后 | 提升倍数 |
| --- | --- | --- | --- |
| 1k 节点 2 度子图 | ~200ms（拉取全图 + JS BFS） | ~5ms（索引直达） | ~40x |
| 10k 节点 3 度子图 | ~2s（全图 + OOM 风险） | ~20ms | ~100x |
| 50k 节点最短路径 | ~10s（全量拉取不可行） | ~50ms（LIMIT 1 剪枝） | ~200x |

---

## 4. 迭代化 DFS：queryValidate

### 4.1 问题根因

当前递归 walk() 有两个致命缺陷：

1. 无深度保护 — 环形图或深链导致 RangeError: Maximum call stack size exceeded

1. 无访问标记 — 同一节点可能被重复访问，环路时无限递归

### 4.2 迭代化改写

```
// ── services/kg/kgValidateService.ts ────────────────

interface ValidateOptions {
  maxDepth: number;    // 默认 100
  maxVisited: number;  // 默认 10_000（防止遍历过多节点）
}

interface Violation {
  entityId: string;
  type: 'MAX_DEPTH_EXCEEDED' | 'CONSTRAINT_VIOLATED' | string;
  depth: number;
  detail?: string;
}

type ValidationReport =
  | { status: 'complete'; violations: Violation[]; visitedCount: number }
  | { status: 'aborted'; violations: Violation[] }
  | { status: 'exceeded_max_visited'; violations: Violation[]; visitedCount: number };

function validateGraph(
  rootId: string,
  getNeighbors: (id: string) => string[],
  isValid: (id: string, depth: number) => { ok: boolean } & Partial<Violation>,
  opts: ValidateOptions = { maxDepth: 100, maxVisited: 10_000 },
  signal?: AbortSignal,
): ValidationReport {
  // ── 显式栈替代递归（LIFO = DFS）──
  const stack: Array<{ id: string; depth: number }> = [
    { id: rootId, depth: 0 },
  ];
  const visited = new Set<string>();
  const violations: Violation[] = [];

  while (stack.length > 0) {
    // AbortController 检查点
    if (signal?.aborted) {
      return { status: 'aborted', violations };
    }

    const { id, depth } = stack.pop()!;

    // 防环
    if (visited.has(id)) continue;
    visited.add(id);

    // 节点数上限
    if (visited.size > opts.maxVisited) {
      return {
        status: 'exceeded_max_visited',
        violations,
        visitedCount: visited.size,
      };
    }

    // 深度保护
    if (depth > opts.maxDepth) {
      violations.push({
        entityId: id,
        type: 'MAX_DEPTH_EXCEEDED',
        depth,
      });
      continue; // 不展开更深层
    }

    // 校验当前节点
    const result = isValid(id, depth);
    if (!result.ok) {
      violations.push({ entityId: id, depth, ...result });
    }

    // 展开邻居（入栈）
    const neighbors = getNeighbors(id);
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        stack.push({ id: neighborId, depth: depth + 1 });
      }
    }
  }

  return { status: 'complete', violations, visitedCount: visited.size };
}
```

### 4.3 对比

| 方面 | 当前（递归 walk） | 重写后（迭代化） |
| --- | --- | --- |
| 栈溢出风险 | ❌ 深链 → RangeError | ✅ 显式栈，堆内存分配 |
| 环路处理 | ❌ 无 → 无限递归 | ✅ visited Set 防环 |
| 深度限制 | ❌ 无 | ✅ maxDepth（默认 100） |
| 节点数限制 | ❌ 无 | ✅ maxVisited（默认 10,000） |
| 可取消 | ❌ 无 | ✅ AbortSignal 每轮检查 |
| V8 调用栈消耗 | O(depth) 栈帧 | O(1) 栈帧 |

---

## 5. BFS 数据结构修正：Deque

### 5.1 Array.shift() 的性能陷阱

```
Array.shift() = O(n) — 每次移除头部，所有元素前移一位
N 次 shift 累计 = O(n²)

10,000 个节点 BFS：
  Array.shift()  → ~500ms
  Deque.popFront → ~10ms（50x 差距）
```

### 5.2 循环数组 Deque 实现

```
// ── utils/Deque.ts ──────────────────────────────────

/**
 * 基于循环数组的双端队列。
 * pushBack / popFront 均 O(1) amortized。
 */
export class Deque<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(initialCapacity = 16) {
    this.buf = new Array(initialCapacity);
  }

  get size(): number {
    return this.count;
  }

  pushBack(item: T): void {
    if (this.count === this.buf.length) this.grow();
    this.buf[this.tail] = item;
    this.tail = (this.tail + 1) % this.buf.length;
    this.count++;
  }

  popFront(): T | undefined {
    if (this.count === 0) return undefined;
    const item = this.buf[this.head];
    this.buf[this.head] = undefined; // 释放引用供 GC
    this.head = (this.head + 1) % this.buf.length;
    this.count--;
    return item;
  }

  peekFront(): T | undefined {
    return this.count === 0 ? undefined : this.buf[this.head];
  }

  private grow(): void {
    const newCap = this.buf.length * 2;
    const newBuf = new Array(newCap);
    for (let i = 0; i < this.count; i++) {
      newBuf[i] = this.buf[(this.head + i) % this.buf.length];
    }
    this.buf = newBuf;
    this.head = 0;
    this.tail = this.count;
  }
}
```

### 5.3 替换清单

所有 JS 层 BFS 遍历中的 Array.shift() 替换为 Deque.popFront()：

| 文件 | 当前 | 替换为 |
| --- | --- | --- |
| kgQueryService.ts — querySubgraph 回退路径 | queue.shift() | deque.popFront() |
| kgQueryService.ts — queryPath 回退路径 | queue.shift() | deque.popFront() |
| contextService.ts — 上下文 BFS 展开 | queue.shift() | deque.popFront() |
| 其他 service 中发现的 .shift() 调用 | 全局 grep \.shift\( | 逐个确认并替换 |

---

## 6. Aho-Corasick 自动机：entityMatcher

### 6.1 当前问题

```
当前：N 个实体名 × M 段文本 × L 平均长度
  = O(N × M × L) 暴力 indexOf 扫描
  1000 实体 × 10 段 × 10KB ≈ 500ms（同步阻塞）

目标：预构建自动机后
  = O(M × L + matches) 一趟扫完所有实体
  同样规模 ≈ 5ms
```

### 6.2 自动机生命周期

```
flowchart TD
    A["实体列表变更\n（CRUD / 项目切换）"] --> B["标记自动机 stale"]
    B --> C["下次 match() 调用\n惰性重建自动机"]
    C --> D["Aho-Corasick 自动机\n缓存在 ComputeProcess 内存"]
    D --> E["匹配：O(text_length)\n一趟扫完所有实体"]

    F["项目切换"] --> G["ProjectLifecycle\n.onProjectUnbind()"]
    G --> H["清除自动机缓存"]

    style D fill:#e8f5e9,stroke:#4CAF50
```

### 6.3 实现方案

```
// ── services/kg/entityMatcher.ts（重写）─────────────

import { AhoCorasick } from './ahoCorasick';

interface MatchResult {
  entityId: string;
  name: string;
  start: number;  // 在文本中的起始位置
  end: number;
}

export class EntityMatcher {
  private ac: AhoCorasick | null = null;
  private stale = true;
  private entityMap: Map<string, { id: string; name: string }> = new Map();

  /**
   * 注册实体列表（实体变更时调用）。
   * 仅标记 stale，不立即重建——惰性构建。
   */
  setEntities(entities: Array<{ id: string; name: string; aliases?: string[] }>): void {
    this.entityMap.clear();
    for (const e of entities) {
      // 主名
      this.entityMap.set(e.name.toLowerCase(), { id: e.id, name: e.name });
      // 别名
      for (const alias of e.aliases ?? []) {
        this.entityMap.set(alias.toLowerCase(), { id: e.id, name: alias });
      }
    }
    this.stale = true;
    this.ac = null;
  }

  /**
   * 在文本中匹配所有已注册实体。
   * 首次调用或 stale 时自动重建自动机。
   */
  match(text: string): MatchResult[] {
    if (this.stale || !this.ac) {
      this.rebuild();
    }
    return this.ac!.search(text.toLowerCase()).map(hit => {
      const entry = this.entityMap.get(hit.pattern)!;
      return {
        entityId: entry.id,
        name: entry.name,
        start: hit.start,
        end: hit.end,
      };
    });
  }

  /** 项目切换时清除缓存 */
  dispose(): void {
    this.ac = null;
    this.entityMap.clear();
    this.stale = true;
  }

  private rebuild(): void {
    const patterns = Array.from(this.entityMap.keys());
    this.ac = new AhoCorasick(patterns);
    this.stale = false;
  }
}
```

### 6.4 Aho-Corasick 核心（精简版）

```
// ── services/kg/ahoCorasick.ts ──────────────────────

interface TrieNode {
  children: Map<string, TrieNode>;
  fail: TrieNode | null;
  output: string[];  // 命中的模式串
}

export interface SearchHit {
  pattern: string;
  start: number;
  end: number;
}

export class AhoCorasick {
  private root: TrieNode;

  constructor(patterns: string[]) {
    this.root = this.createNode();
    // 1. 构建 Trie
    for (const p of patterns) {
      this.insert(p);
    }
    // 2. 构建 fail 指针（BFS）
    this.buildFailLinks();
  }

  search(text: string): SearchHit[] {
    const results: SearchHit[] = [];
    let node = this.root;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      while (node !== this.root && !node.children.has(ch)) {
        node = node.fail!;
      }
      node = node.children.get(ch) ?? this.root;

      // 收集所有命中（沿 output 链）
      let tmp: TrieNode | null = node;
      while (tmp !== this.root && tmp !== null) {
        for (const pattern of tmp.output) {
          results.push({
            pattern,
            start: i - pattern.length + 1,
            end: i + 1,
          });
        }
        tmp = tmp.fail;
      }
    }
    return results;
  }

  private insert(pattern: string): void {
    let node = this.root;
    for (const ch of pattern) {
      if (!node.children.has(ch)) {
        node.children.set(ch, this.createNode());
      }
      node = node.children.get(ch)!;
    }
    node.output.push(pattern);
  }

  private buildFailLinks(): void {
    const queue: TrieNode[] = [];
    // 第一层子节点 fail → root
    for (const child of this.root.children.values()) {
      child.fail = this.root;
      queue.push(child);
    }
    // BFS 构建
    while (queue.length > 0) {
      const curr = queue.shift()!; // 构建阶段节点数有限，shift 可接受
      for (const [ch, child] of curr.children) {
        let fallback = curr.fail!;
        while (fallback !== this.root && !fallback.children.has(ch)) {
          fallback = fallback.fail!;
        }
        child.fail = fallback.children.get(ch) ?? this.root;
        // 合并 output
        child.output = child.output.concat(child.fail.output);
        queue.push(child);
      }
    }
  }

  private createNode(): TrieNode {
    return { children: new Map(), fail: null, output: [] };
  }
}
```

### 6.5 性能对比

| 场景 | 当前（indexOf 暴力扫描） | Aho-Corasick | 提升 |
| --- | --- | --- | --- |
| 100 实体 × 5KB 文本 | ~50ms | ~0.5ms | ~100x |
| 1000 实体 × 10KB 文本 | ~500ms | ~2ms | ~250x |
| 5000 实体 × 50KB 文本 | ~12s（不可用） | ~10ms | ~1200x |
| 自动机构建（1000 实体） | N/A | ~5ms（一次性） | 惰性构建，按需触发 |

---

## 7. buildRulesInjection：分离数据获取与业务逻辑

### 7.1 当前问题

```
// ── 当前实现（简化）──────────────────────────────────
function buildRulesInjection(projectId: string, context: Context): string {
  // ❌ 全量拉取所有实体和关系
  const entities = db.prepare('SELECT * FROM kg_entities WHERE project_id = ?').all(projectId);
  const relations = db.prepare('SELECT * FROM kg_relations WHERE project_id = ?').all(projectId);

  // 然后在 JS 中做复杂的过滤、排序、token 计算、字符串拼接
  let rules = '';
  for (const entity of entities) {
    if (isRelevant(entity, context)) {
      rules += formatRule(entity, getRelatedEntities(entity, relations));
      if (tokenCount(rules) > MAX_TOKENS) break;
    }
  }
  return rules;
}
```

### 7.2 重构：CTE 精确拉取 + JS 业务逻辑

```
// ── 重构后 ──────────────────────────────────────────

// 第一步：CTE 只拉取上下文相关的子图（而非全量）
const RULES_SUBGRAPH_SQL = `
  WITH RECURSIVE relevant(entity_id, depth) AS (
    -- 种子：当前上下文提及的实体 ID
    SELECT e.entity_id, 0
    FROM kg_entities e
    WHERE e.project_id = :projectId
      AND e.entity_id IN (SELECT value FROM json_each(:seedEntityIds))

    UNION ALL

    SELECT
      CASE
        WHEN r.source_entity_id = rv.entity_id THEN r.target_entity_id
        ELSE r.source_entity_id
      END,
      rv.depth + 1
    FROM relevant rv
    JOIN kg_relations r ON (
      r.source_entity_id = rv.entity_id
      OR r.target_entity_id = rv.entity_id
    )
    WHERE rv.depth < :maxDepth
      AND r.project_id = :projectId
  )
  SELECT DISTINCT
    e.*,
    r.relation_type,
    r.source_entity_id,
    r.target_entity_id
  FROM relevant rv
  JOIN kg_entities e ON e.entity_id = rv.entity_id
  LEFT JOIN kg_relations r ON (
    r.project_id = :projectId
    AND (r.source_entity_id = rv.entity_id OR r.target_entity_id = rv.entity_id)
  )
  WHERE e.project_id = :projectId;
`;

function buildRulesInjection(projectId: string, context: Context): string {
  // ── 第一步：CTE 精确拉取（只拉上下文相关的 2 度子图）──
  const seedIds = context.mentionedEntityIds;
  const rows = stmtRulesSubgraph.all({
    projectId,
    seedEntityIds: JSON.stringify(seedIds),
    maxDepth: 2,
  });

  // ── 第二步：JS 业务逻辑（不变，但输入数据量大幅减少）──
  const entityMap = groupByEntity(rows);
  let rules = '';
  let tokens = 0;

  for (const [entityId, data] of entityMap) {
    const rule = formatRule(data.entity, data.relations);
    const ruleTokens = estimateTokens(rule);
    if (tokens + ruleTokens > MAX_TOKENS) break;
    rules += rule;
    tokens += ruleTokens;
  }

  return rules;
}
```

### 7.3 优化效果

| 方面 | 当前 | 重构后 |
| --- | --- | --- |
| 数据获取量 | 全量（可能 10k+ 实体） | 仅上下文相关子图（通常 50~200 实体） |
| 序列化开销 | 全量 JSON → JS 对象 | 减少 95%+ |
| JS 处理时间 | 遍历全量实体做过滤 | 仅处理相关实体 |
| 业务逻辑 | 不变 | 不变（formatRule / tokenCount 保留） |

---

## 8. KG Session 生命周期

### 8.1 当前泄漏

```
// ── 当前 kgRecognitionRuntime.ts ────────────────────
class KgRecognitionRuntime {
  // ❌ 只增不减
  private sessions = new Map<string, RecognitionSession>();

  startSession(sessionId: string): void {
    this.sessions.set(sessionId, new RecognitionSession());
  }

  // 没有 endSession / cleanup 方法
}
```

### 8.2 修复：接入 ProjectLifecycle + BoundedMap + TTL

```
// ── 修复后 ──────────────────────────────────────────

import { BoundedMap } from '../utils/BoundedMap';
import { ProjectLifecycle } from '../lifecycle/ProjectLifecycle';

class KgRecognitionRuntime {
  // ✅ BoundedMap：LRU + TTL + 容量上限
  private sessions: BoundedMap<string, RecognitionSession>;

  constructor(
    private lifecycle: ProjectLifecycle,
    opts: { maxSessions?: number; ttlMs?: number } = {},
  ) {
    const { maxSessions = 100, ttlMs = 30 * 60 * 1000 } = opts; // 30 min TTL

    this.sessions = new BoundedMap({
      maxSize: maxSessions,
      ttlMs,
      onEvict: (key, session) => session.dispose(),
    });

    // ✅ 注册到 ProjectLifecycle
    this.lifecycle.onProjectUnbind(() => {
      this.sessions.clear(); // 项目切换时清除所有 session
    });
  }

  startSession(sessionId: string): RecognitionSession {
    const session = new RecognitionSession();
    this.sessions.set(sessionId, session);
    return session;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.dispose();
      this.sessions.delete(sessionId);
    }
  }

  /** 定期清理过期 session（可选，BoundedMap 的 TTL 已处理惰性清理） */
  pruneExpired(): number {
    return this.sessions.pruneExpired();
  }
}
```

### 8.3 EntityMatcher 接入 ProjectLifecycle

```
// ── 在 ComputeProcess 初始化中 ─────────────────────

const entityMatcher = new EntityMatcher();
const kgRuntime = new KgRecognitionRuntime(projectLifecycle);

// 实体变更时 invalidate 自动机
ipcHandle('kg:entities-changed', async ({ projectId }) => {
  const entities = stmtAllEntities.all({ projectId });
  entityMatcher.setEntities(entities); // 标记 stale，下次 match 时惰性重建
});

// 项目切换时清除
projectLifecycle.onProjectUnbind(() => {
  entityMatcher.dispose();
});
```

---

## 9. TDD 策略

| 测试类别 | 测试内容 | 断言 | 工具 |
| --- | --- | --- | --- |
| CTE 正确性 | 固定图 → querySubgraph(root, depth=2) 结果 | 返回节点集合 === 预期集合 | Vitest + better-sqlite3 in-memory |
| CTE 最短路径 | 已知图 → queryPath(A, B) 返回最短路径 | 路径长度 === 预期，路径合法（每步有边） | Vitest |
| CTE 防环 | 环形图 → querySubgraph 不死循环 | 结果有限，耗时 < 100ms | Vitest |
| 迭代 DFS 栈安全 | 1000 深度链图 → validateGraph | 不抛 RangeError，返回 complete | Vitest |
| 迭代 DFS 防环 | 强连通图 → validateGraph | visitedCount === 节点总数，不死循环 | Vitest |
| 迭代 DFS 可取消 | 大图 + 100ms 后 abort() | 返回 { status: 'aborted' } | Vitest |
| Deque 正确性 | pushBack / popFront 序列 | FIFO 顺序正确，size 正确 | Vitest |
| Deque 性能 | 10k 次 push + pop | 耗时 < 5ms（vs Array.shift ~500ms） | Vitest + performance.now() |
| Aho-Corasick 正确性 | 已知模式集 + 文本 → 匹配结果 | 命中实体 === 预期，位置正确 | Vitest |
| Aho-Corasick 性能 | 1000 实体 × 10KB 文本 | 匹配耗时 < 10ms | Vitest + performance.now() |
| Aho-Corasick 惰性重建 | setEntities → match → setEntities → match | 第二次 match 使用新自动机 | Vitest |
| Session 泄漏 | 创建 200 session（上限 100） | sessions.size <= 100，被驱逐的 session 已 dispose | Vitest |
| Session TTL | 创建 session → 等待 TTL → pruneExpired | 过期 session 被清除 | Vitest + fake timers |
| 项目切换集成 | 切换项目 → 检查 sessions / entityMatcher | 全部清空，无残留引用 | Vitest |
| E2E 性能基准 | 50k 节点图 CTE vs JS 全量对比 | CTE 延迟 < JS 的 1/10 | Vitest benchmark mode |

---

## 10. 依赖关系

```
flowchart LR
    UP["⚡ UtilityProcess\n双进程架构"] --> KG["🔮 KG 查询层重构"]
    LC["♻️ 资源生命周期管理\nProjectLifecycle"] --> KG
    DL["💾 数据层设计\nSQLite 索引"] --> KG

    KG --> AC["Aho-Corasick\n自动机"]
    KG --> CTE["CTE 查询\nComputeProcess"]
    KG --> DFS["迭代化 DFS\n+ Deque"]
    KG --> SL["Session\n生命周期"]

    style KG fill:#e3f2fd,stroke:#1976D2
```

- 前置依赖：⚡ UtilityProcess 双进程架构（CTE 查询卸载到 ComputeProcess）

- 前置依赖：♻️ 资源生命周期管理（KG session 清理 + Aho-Corasick 缓存 invalidate）

- 前置依赖：💾 数据层设计（kg_entities / kg_relations 索引确认）

- 被依赖：🧬 Embedding & RAG 优化（entityMatcher 为 RAG 提供实体识别）

- 被依赖：🎯 Skill 系统优化（buildRulesInjection 为 Skill 提供 KG 规则注入）

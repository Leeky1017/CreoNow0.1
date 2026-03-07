# CreoNow 后端代码专项审计报告


> "好风凭借力，送我上青云。"——后端是 CreoNow 的底盘，底盘稳了，才有资格谈上层建筑。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 总体评级 | A- 评级与评分维度 |
| 二 | 架构优势 | 后端优于前端的原因 |
| 三 | 问题分析 | 局部盲区与风险 |
| 四 | 差异化治理 | 后端 vs 前端建议 |
| 五 | 改进路线图 | P0-P2 优先级排序 |
| 六 | 总结 | 整体结论 |

---

## 一、总体评级：A-

后端代码整体质量显著优于前端。核心指标全部达标，但存在局部盲区。

| 指标 | 数值 | 评价 |
|------|------|------|
| 生产代码 | 128 文件 / 46,085 行 | 规模中等，结构清晰 |
| 测试代码 | 147 文件 / 19,175 行（服务内）+ 25 集成测试 | 测试:产品 ≈ 0.42:1（合理） |
| `any` 使用 | **0** | 完美 |
| `console.log` | **4**（均在合理位置） | 优秀 |
| `@ts-ignore` / `@ts-nocheck` | **0** | 完美 |
| `TODO/FIXME` | **1** | 极少技术债 |
| 结构化日志 | 328 处 `logger.*` | 可观测性强 |
| 错误处理 | 274 `try/catch` + 506 `ipcError()` + 51 `throw` | 分层完整 |
| 依赖注入 | `createXxxService(deps)` 工厂模式 | 测试友好 |
| ServiceResult 模式 | 363 处使用 | 统一错误表达 |
| DB 迁移 | 23 个有序迁移文件 | 规范 |

---

## 二、架构优势：为什么后端比前端好

### 2.1 工厂式依赖注入

```typescript
// 典型模式：所有服务都通过 create 工厂 + deps 注入
export function createStatsService(deps: {
  db: Database.Database;
  logger: Logger;
}): StatsService { ... }
```

这意味着：
- **测试时可以完全 mock** 所有依赖——不需要真实 DB、真实 LLM
- **无隐式全局状态**——每个服务的边界清晰
- Agent 写测试时只需构造一个 `deps` 对象即可

### 2.2 统一的 ServiceResult + ipcError 模式

```typescript
// 成功：{ ok: true, data: ... }
// 失败：{ ok: false, error: { code: 'DB_ERROR', message: '...' } }
```

506 处 `ipcError()` 调用意味着几乎所有错误路径都有结构化输出。Agent 不需要猜测错误格式。

### 2.3 结构化日志

328 处 `logger.info/warn/error/debug` 对比仅 4 处 `console.*`（且 4 处都在最底层——logger 自身失败和 mutex 错误）。

### 2.4 IPC 契约层

2,296 行的 `ipc-contract.ts` + 28 个 IPC handler 文件 = 前后端通信有严格的类型契约。CI 中的 `contract-check` 和 `ipc-acceptance` 守护这一层。

---

## 三、问题分析：后端的局部盲区

### 3.1 测试盲区（4 个模块零测试）

| 模块 | 生产行数 | 测试数 | 风险等级 | 说明 |
|------|----------|--------|----------|------|
| **search** | 2,028 | 0 | 🔴 高 | FTS + 混合排序 + 搜索替换——核心交互功能，零测试 |
| **judge** | 172 | 0 | 🟡 中 | AI 评审模型管理，行数少但涉及异步状态机 |
| **stats** | 183 | 0 | 🟢 低 | SQL CRUD，逻辑简单，但用户可见 |
| **shared** | 225 | 0 | 🟡 中 | `concurrency.ts` + `ipcResult.ts`——被所有模块依赖 |

**memory** 模块：4,355 行但只有 1 个测试文件。`episodicMemoryService.ts`（2,311 行）是全后端最大的单文件，几乎零直接覆盖。

### 3.2 巨型文件（7 个文件 > 1,500 行）

| 文件 | 行数 | 问题 |
|------|------|------|
| `episodicMemoryService.ts` | 2,311 | 最大文件，仅 1 个测试覆盖整个 memory 模块 |
| `ipc-contract.ts` | 2,296 | 自动生成，可接受 |
| `documentCoreService.ts` | 2,274 | 文档核心，5 个测试可能不足 |
| `kgCoreService.ts` | 2,257 | 知识图谱核心，15 个测试覆盖尚可 |
| `aiService.ts` | 1,864 | AI 调用核心，26 个测试覆盖较好 |
| `skillService.ts` | 1,661 | 技能系统，10 个测试 |
| `projectService.ts` | 1,575 | 项目管理，7 个测试 |

这些文件都超过了合理的单文件上限（~500 行），但考虑到它们是各自模块的核心 service，暂时可以接受。**优先拆分目标**：`episodicMemoryService.ts`（2,311 行 + 几乎零测试）。

### 3.3 memory 模块：最大风险点

memory 模块是后端唯一的系统性风险：

| 维度 | 数据 |
|------|------|
| 总行数 | 4,355 |
| 最大文件 | `episodicMemoryService.ts`（2,311 行） |
| 测试数 | 1（`memoryService.previewInjection.test.ts`） |
| 测试覆盖点 | 仅 `previewInjection` 一个 scenario |
| 包含功能 | 记忆存储、记忆衰减、情景记忆、偏好学习、向量记忆 |

这是"CreoNow = 创作者的 Cursor"最核心的差异化模块之一，却几乎没有测试。

### 3.4 console.error 的 4 处使用

```
logger.ts:31        — logger 自身写入失败时的 fallback（合理）
concurrency.ts:26   — mutex 错误处理器自身失败（合理）
concurrency.ts:36   — mutex 前序任务失败（合理）
skillScheduler.ts:132 — 技能调度事件（应改为 logger.error）
```

只有 `skillScheduler.ts:132` 需要修复——应换成 `logger.error`。

---

## 四、后端 vs 前端：差异化治理建议

### 结论：后端不需要额外的治理改革

后端已经具备的内生质量保障：
1. **TypeScript strict mode**——0 `any` 证明编译器是第一道防线
2. **工厂+DI 模式**——天然适配 TDD
3. **ServiceResult 模式**——错误路径可测
4. **IPC 契约**——前后端边界有类型守护
5. **结构化日志**——线上可观测

后端需要的不是更多流程，而是**补齐测试盲区**：

| 优先级 | 行动 | 理由 |
|--------|------|------|
| P0 | search 模块补测试 | 2,028 行零测试，是用户天天用的功能 |
| P0 | memory 模块补测试 | 4,355 行仅 1 测试，是产品核心差异化 |
| P1 | shared 模块补测试 | 225 行但被所有模块依赖 |
| P1 | episodicMemoryService 拆分 | 2,311 行需要分解 |
| P2 | stats 模块补测试 | 183 行，逻辑简单但应有覆盖 |
| P2 | judge 模块补测试 | 172 行，涉及异步状态 |
| P3 | skillScheduler console.error → logger.error | 1 行修复 |

### 后端同样不需要的治理层

以下治理层对后端**同样无用**，理由与前端一致：

| 废止项 | 对后端的影响 | 结论 |
|--------|-------------|------|
| Rulebook | 同样是 openspec 的镜像 | **废止** |
| RUN_LOG | CI 日志就是记录 | **废止** |
| Main Session Audit | CI 通过 = 验收 | **废止** |
| Independent Review .md | PR comment 足够 | **废止** |
| EXECUTION_ORDER.md | 后端很少有并行 change | **废止** |
| 6 段式 TDD 文档 | 后端 TDD 是自然的，不需要文档仪式 | **废止** |
| openspec-log-guard | 检查已废止的文档 | **废止** |

### 后端保留的核心纪律

| 保留项 | 理由 |
|--------|------|
| **Spec-first (P1)** | 后端模块行为必须有 spec 定义 |
| **Test-first (P2)** | 后端天然适配，且已证明有效 |
| **CI 全绿** | lint + typecheck + unit-test-core + integration-test |
| **IPC 契约检查** | ipc-acceptance + contract-check（仅 IPC 变更时） |
| **Escalate (P7)** | spec 不明确时上报 |

---

## 五、后端改进路线图

### 第零阶段：CI coverage-gate 拆分（立即可做）

当前 `coverage-gate` job 仅执行前端覆盖率检查（`pnpm test:coverage:desktop`），后端覆盖率不在 CI 门禁中。
这意味着后端测试盲区（4 个零测试模块）无法被 CI 自动发现。

**建议**：拆分 coverage-gate 为前端 + 后端两部分，详见 [CI 简化提案 §八](../audit/ci-simplification-proposal.md#八coverage-gate-拆分建议)。

### 第一阶段：补齐测试盲区（1-2 周）

```
search/ftsService.ts              → 补 5-8 个测试
search/hybridRankingService.ts    → 补 5-8 个测试
search/searchReplaceService.ts    → 补 8-10 个测试
memory/episodicMemoryService.ts   → 补 10-15 个测试
memory/memoryService.ts           → 补 5-8 个测试
memory/preferenceLearning.ts      → 补 3-5 个测试
shared/concurrency.ts             → 补 3-5 个测试
shared/ipcResult.ts               → 补 2-3 个测试
stats/statsService.ts             → 补 3-5 个测试
judge/judgeService.ts             → 补 2-3 个测试
```

### 第二阶段：拆分巨型文件

`episodicMemoryService.ts`（2,311 行）可按功能拆分：
- `episodicMemoryStore.ts` — 存储层
- `episodicMemoryRetrieval.ts` — 检索层
- `episodicMemoryDecay.ts` — 衰减逻辑
- `episodicMemoryService.ts` — 编排层（调用上述三者）

### 第三阶段：微调

- `skillScheduler.ts:132` 的 `console.error` → `logger.error`
- documents 模块补充测试（`documentCoreService.ts` 2,274 行仅 5 个测试覆盖）

---

## 六、总结

> 后端是 CreoNow 的稳固基石。A- 的评分不是偶然——它来自 0 `any`、工厂式 DI、ServiceResult 模式、结构化日志这四根柱子。

后端的问题不在架构，在**覆盖率的局部空白**。4 个模块零测试 + memory 模块（产品核心差异化）几乎零覆盖，是当前最大的技术风险。

后端与前端的治理改革方向**完全一致**：
- 废止 Rulebook、RUN_LOG、审计 .md — **相同**
- 保留 Spec-first、Test-first、CI 全绿 — **相同**
- 不需要额外的治理层 — **相同**

差异化的地方：
- 后端不需要 P-Visual（无视觉界面）
- 后端不需要 i18n-completeness 和 token-compliance CI 检查
- 后端需要**补测试**，前端需要**补 i18n 和 token**

> "君子务本，本立而道生。"——把测试补上，比写 20 个 RUN_LOG 有用一万倍。

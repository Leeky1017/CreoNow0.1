# Tasks: A0-05 Skill Router 否定语境守卫

- **GitHub Issue**: #987
- **分支**: `task/987-skill-router-negation-guard`
- **Delta Spec**: `specs/skill-system/spec.md`

---

## 验收标准

| ID   | 标准                                                                                  | 对应 Scenario    |
| ---- | ------------------------------------------------------------------------------------- | ---------------- |
| AC-1 | 中文否定词（不要/别/不想/不用/不需要/停止/取消/禁止）+ 关键词 → 路由到 `builtin:chat` | S-NEG-1, S-NEG-2 |
| AC-2 | 英文否定词（don't/do not/stop/no/never/cancel）+ 关键词 → 路由到 `builtin:chat`       | S-NEG-3          |
| AC-3 | 双重否定（不是不想/并非不要）+ 关键词 → 恢复正向匹配，路由到对应技能                  | S-NEG-4          |
| AC-4 | 正向关键词（无否定前缀）保持原有匹配行为不变                                          | S-NEG-5          |
| AC-5 | 否定词与关键词距离超出检测窗口时不触发守卫                                            | S-NEG-6          |
| AC-6 | `REWRITE_KEYWORDS` 匹配路径同样受否定守卫保护                                         | S-NEG-7          |
| AC-7 | `explicitSkillId` 路径不受否定守卫影响                                                | S-NEG-8          |
| AC-8 | 原有 `skillRouter.test.ts` 中的所有测试用例继续通过（回归）                           | 回归             |

---

## Phase 1: Red（测试先行）

### Task 1.1: 否定守卫核心单元测试——中文否定

**映射验收标准**: AC-1

编写 `isNegated` 辅助函数的中文否定模式测试：

- [x] 测试：`isNegated("不要续写", index("续写"), "续写")` → `true`
- [x] 测试：`isNegated("别帮我扩写", index("扩写"), "扩写")` → `true`
- [x] 测试：`isNegated("不想让你翻译", index("翻译"), "翻译")` → `true`
- [x] 测试：`isNegated("不用总结了", index("总结"), "总结")` → `true`
- [x] 测试：`isNegated("不需要续写", index("续写"), "续写")` → `true`
- [x] 测试：`isNegated("停止续写", index("续写"), "续写")` → `true`
- [x] 测试：`isNegated("禁止扩写", index("扩写"), "扩写")` → `true`

**文件**: `apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts`（新建）

### Task 1.2: 否定守卫核心单元测试——英文否定

**映射验收标准**: AC-2

- [x] 测试：`isNegated("don't continue writing", index("continue writing"), "continue writing")` → `true`
- [x] 测试：`isNegated("do not expand this", index("expand"), "expand")` → `true`
- [x] 测试：`isNegated("stop summarize", index("summarize"), "summarize")` → `true`
- [x] 测试：`isNegated("never translate this", index("translate"), "translate")` → `true`

**文件**: `apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts`

### Task 1.3: 双重否定识别测试

**映射验收标准**: AC-3

- [x] 测试：`isNegated("不是不想续写", index("续写"), "续写")` → `false`（双重否定 = 正向）
- [x] 测试：`isNegated("并非不要扩写", index("扩写"), "扩写")` → `false`（双重否定 = 正向）
- [x] 测试：`inferSkillFromInput({ input: "不是不想续写，请帮我续写后面的内容", hasSelection: false })` → `"builtin:continue"`

**文件**: `apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts`

### Task 1.4: 正向回归测试

**映射验收标准**: AC-4, AC-8

确认否定守卫不影响正向匹配：

- [x] 测试：`inferSkillFromInput({ input: "帮我续写这个段落", hasSelection: false })` → `"builtin:continue"`
- [x] 测试：`inferSkillFromInput({ input: "头脑风暴一下", hasSelection: false })` → `"builtin:brainstorm"`
- [x] 测试：`inferSkillFromInput({ input: "请写下去", hasSelection: false })` → `"builtin:continue"`
- [x] 测试：`inferSkillFromInput({ input: "", hasSelection: true })` → `"builtin:polish"`
- [x] 测试：原有 `skillRouter.test.ts` 全部用例继续通过

**文件**: `apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts`

### Task 1.5: 否定检测窗口边界测试

**映射验收标准**: AC-5

- [x] 测试：`inferSkillFromInput({ input: "我不喜欢上次的结果，这次请帮我续写得更好一些", hasSelection: false })` → `"builtin:continue"`（否定词距离关键词超出窗口）
- [x] 测试：`isNegated("前面不好，续写", index("续写"), "续写")` → 依据窗口大小判断

**文件**: `apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts`

### Task 1.6: `inferSkillFromInput` 集成测试——否定场景

**映射验收标准**: AC-1, AC-2, AC-6, AC-7

- [x] 测试：`inferSkillFromInput({ input: "不要续写，我想自己写", hasSelection: false })` → `"builtin:chat"`
- [x] 测试：`inferSkillFromInput({ input: "别帮我扩写这段", hasSelection: true })` → `"builtin:chat"`
- [x] 测试：`inferSkillFromInput({ input: "don't continue writing this", hasSelection: false })` → `"builtin:chat"`
- [x] 测试：`inferSkillFromInput({ input: "不用改写", hasSelection: true })` → `"builtin:chat"`（REWRITE_KEYWORDS 路径）
- [x] 测试：`inferSkillFromInput({ input: "不要续写", hasSelection: false, explicitSkillId: "builtin:continue" })` → `"builtin:continue"`（显式覆盖不受否定守卫影响）
- [x] 测试：`inferSkillFromInput({ input: "不用改", hasSelection: true })` → `"builtin:chat"`（短改写指令 + 否定）

**文件**: `apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `isNegated` 辅助函数

实现否定语境检测逻辑：

- [x] 定义中文否定词列表：`["不要", "别", "不想", "不用", "不需要", "停止", "取消", "禁止", "不必", "无需"]`
- [x] 定义英文否定词列表：`["don't", "do not", "stop", "no ", "never", "cancel", "not ", "without"]`
- [x] 定义中文双重否定前缀：`["不是不想", "不是不要", "并非不要", "并非不想"]`
- [x] 实现窗口检测：取关键词前方 N 个字符（中文 6，英文 12），在窗口内搜索否定词
- [x] 检测到否定词后，进一步检查窗口内是否包含双重否定前缀；若是双重否定，返回 `false`
- [x] 导出 `isNegated` 函数供测试直接调用

**文件**: `apps/desktop/main/src/services/skills/skillRouter.ts`（修改）

### Task 2.2: 修改关键词匹配逻辑

将否定守卫集成到 `inferSkillFromInput`：

- [x] `KEYWORD_RULES` 遍历：对每个 `input.includes(kw)` 命中，追加 `!isNegated(input, input.indexOf(kw), kw)` 判断
- [x] `REWRITE_KEYWORDS` 匹配：同样追加否定守卫判断
- [x] 确保所有关键词匹配路径一致受到否定守卫保护

**文件**: `apps/desktop/main/src/services/skills/skillRouter.ts`（修改）

---

## Phase 3: Refactor（重构优化）

### Task 3.1: 提取关键词匹配为独立函数

- [x] 将"包含关键词且未被否定"逻辑提取为 `matchesKeyword(input: string, keyword: string): boolean` 函数
- [x] `KEYWORD_RULES` 和 `REWRITE_KEYWORDS` 两条路径复用此函数，消除重复逻辑
- [x] 确认重构后所有测试继续通过

**文件**: `apps/desktop/main/src/services/skills/skillRouter.ts`（修改）

---

## 验证命令

```bash
# 运行否定守卫专项测试
pnpm -C apps/desktop vitest run --config vitest.config.core.ts apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts

# 运行原有路由测试（回归）
pnpm -C apps/desktop vitest run --config vitest.config.core.ts apps/desktop/main/src/services/skills/__tests__/skillRouter.test.ts

# TypeScript 编译检查
pnpm -C apps/desktop tsc --noEmit
```

---

## TDD 规范引用

> 本 Change 的所有测试必须遵循 `docs/references/testing/` 中的规范。开始写测试前，先阅读以下文档。

**必读文档**：

- 测试哲学与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策树：`docs/references/testing/02-test-type-decision-guide.md`
- 后端测试模式：`docs/references/testing/04-backend-testing-patterns.md`
- 命令与 CI 映射：`docs/references/testing/07-test-command-and-ci-map.md`

**本地验证命令**：

```bash
pnpm -C apps/desktop vitest run <test-file-pattern>   # 单元/集成测试
pnpm typecheck                                         # 类型检查
pnpm lint                                              # ESLint
```

**五大反模式（Red Line）**：

1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为

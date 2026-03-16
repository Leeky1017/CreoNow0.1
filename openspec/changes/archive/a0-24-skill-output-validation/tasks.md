# Tasks: A0-24 Skill 输出校验扩展

- **GitHub Issue**: #985
- **分支**: `task/985-skill-output-validation`
- **Delta Spec**: `specs/skill-system/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

P0-6: 基础输入输出防线

---

## 验收标准

| ID   | 标准                                                                 | 对应 Scenario    |
| ---- | -------------------------------------------------------------------- | ---------------- |
| AC-1 | `polish`、`rewrite`、`continue`、`expand` 的正常输出通过校验不受影响 | S-OUT-1          |
| AC-2 | 空输出（trim 后长度为 0）被拦截，返回 `SKILL_OUTPUT_INVALID`         | S-OUT-2          |
| AC-3 | 包含 ` ``` ` 代码块的输出被拦截                                      | S-OUT-3          |
| AC-4 | 包含 HTML 标签的输出被拦截                                           | S-OUT-4          |
| AC-5 | `polish`/`rewrite` 输出超过输入 10 倍时被拦截                        | S-OUT-5          |
| AC-6 | `continue`/`expand` 输出在 20 倍以内通过，超过 20 倍被拦截           | S-OUT-6, S-OUT-7 |
| AC-7 | `synopsis` 的已有校验逻辑不受影响                                    | S-OUT-8          |
| AC-8 | 输入基准为空时跳过膨胀检测，仅执行格式校验                           | S-OUT-9          |
| AC-9 | `SKILL_OUTPUT_INVALID` 已注册到 `IpcErrorCode` 联合类型              | 全部             |

---

## Phase 1: Red（测试先行）

### Task 1.1: 正常输出回归测试

**映射验收标准**: AC-1

- [x] 测试：`polish` skill，输入 500 字、输出 480 字纯文本，断言 `validateSkillRunOutput()` 返回 `{ ok: true }`
- [x] 测试：`rewrite` skill，输入 300 字、输出 350 字纯文本，断言校验通过
- [x] 测试：`continue` skill，输入上下文 200 字、输出 1,500 字纯文本，断言校验通过
- [x] 测试：`expand` skill，输入 100 字、输出 800 字纯文本，断言校验通过

**文件**: `apps/desktop/main/src/services/skills/__tests__/apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`（新建）

### Task 1.2: 空输出检测测试

**映射验收标准**: AC-2

- [x] 测试：输出为空字符串 `""`，断言返回 `{ ok: false, error: { code: "SKILL_OUTPUT_INVALID" } }`，message 包含 `"空内容"`
- [x] 测试：输出为仅含空白 `"   \n  \t  "`，断言同样被拦截
- [x] 测试：输出为 `undefined`，断言被拦截

**文件**: `apps/desktop/main/src/services/skills/__tests__/apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`

### Task 1.3: 代码块污染检测测试

**映射验收标准**: AC-3

- [x] 测试：输出包含 ` ```python\ncode\n``` `，断言被拦截且 message 包含 `"代码块"`
- [x] 测试：输出包含 ` ``` ` 但无语言标识（裸代码块），断言同样被拦截
- [x] 测试：输出包含单个反引号（`inline code`）而非三个，断言通过（不误伤 inline code）

**文件**: `apps/desktop/main/src/services/skills/__tests__/apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`

### Task 1.4: HTML 标签污染检测测试

**映射验收标准**: AC-4

- [x] 测试：输出包含 `<div>text</div>`，断言被拦截且 message 包含 `"HTML"`
- [x] 测试：输出包含 `<script>alert(1)</script>`，断言被拦截
- [x] 测试：输出包含 `<p class="x">段落</p>`，断言被拦截
- [x] 测试：输出包含中文书名号 `《红楼梦》` 或数学不等式 `a < b`，断言通过（不误伤非 HTML 尖括号）

**文件**: `apps/desktop/main/src/services/skills/__tests__/apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`

### Task 1.5: 膨胀检测测试

**映射验收标准**: AC-5, AC-6

- [x] 测试：`polish`，输入 200 字，输出 2,500 字（12.5 倍），断言被拦截
- [x] 测试：`polish`，输入 200 字，输出 1,800 字（9 倍），断言通过
- [x] 测试：`rewrite`，输入 100 字，输出 1,100 字（11 倍），断言被拦截
- [x] 测试：`continue`，输入 300 字，输出 4,000 字（13.3 倍），断言通过（未超 20 倍）
- [x] 测试：`continue`，输入 300 字，输出 7,000 字（23.3 倍），断言被拦截
- [x] 测试：`expand`，输入 100 字，输出 2,100 字（21 倍），断言被拦截

**文件**: `apps/desktop/main/src/services/skills/__tests__/apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`

### Task 1.6: synopsis 回归测试

**映射验收标准**: AC-7

- [x] 测试：`synopsis` skill 的输出仍走 `validateSynopsisOutput()` 函数，断言行为与变更前一致
- [x] 测试：确认 `validateSkillRunOutput()` 对 `synopsis` 的分支逻辑未改变

**文件**: `apps/desktop/main/src/services/skills/__tests__/apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`

### Task 1.7: 无输入基准跳过膨胀检测测试

**映射验收标准**: AC-8

- [x] 测试：`polish`，`inputText` 为空字符串，输出 5,000 字，断言跳过膨胀检测，仅执行格式校验，最终通过
- [x] 测试：`polish`，`inputText` 为 `undefined`，输出 5,000 字，断言同上

**文件**: `apps/desktop/main/src/services/skills/__tests__/apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 注册错误码

- [x] 在 `ipc-contract.ts` 的 `IpcErrorCode` 联合类型中注册 `"SKILL_OUTPUT_INVALID"`

**文件**: `apps/desktop/main/src/ipc/contract/ipc-contract.ts`（修改）

### Task 2.2: 实现通用输出校验函数

- [x] 创建 `validateCreativeSkillOutput(args: { skillId: string; outputText?: string; inputText?: string }): ServiceResult<true>` 函数
- [x] 按规则顺序实现 V-EMPTY → V-CODEBLOCK → V-HTML → V-INFLATE-\* 校验链
- [x] 膨胀阈值根据 skill ID 选择 10 倍或 20 倍
- [x] 输入基准为空时跳过膨胀检测

**文件**: `apps/desktop/main/src/services/skills/skillExecutor.ts`（修改）

### Task 2.3: 修改 `validateSkillRunOutput()` 分发逻辑

- [x] 将 `if (leafSkillId(args.skillId) !== "synopsis") return { ok: true }` 替换为按 skill ID 分发：
  - `synopsis` → 调用 `validateSynopsisOutput()`（不变）
  - `polish` / `rewrite` / `continue` / `expand` → 调用 `validateCreativeSkillOutput()`
  - 其余 skill → `return { ok: true }`（维持现有行为）
- [x] 确保 `inputText` 从调用参数中正确传递到校验函数

**文件**: `apps/desktop/main/src/services/skills/skillExecutor.ts`（修改）

### Task 2.4: 错误消息人话映射

- [x] 在 `errorMessages.ts` 中为 `SKILL_OUTPUT_INVALID` 添加人话映射：「AI 输出异常，请重新尝试」

**文件**: `apps/desktop/renderer/src/lib/errorMessages.ts`（修改）

---

## Phase 3: Refactor（收尾）

### Task 3.1: 运行全量测试

- [x] 运行 `pnpm -C apps/desktop vitest run`，确认无回归
- [x] 运行 `pnpm -C apps/desktop tsc --noEmit`，确认无类型错误

### Task 3.2: 代码审查

- [x] 确认 synopsis 测试（`synopsisSkill.execution.test.ts`）仍全绿
- [x] 确认 HTML 正则不误伤书名号 `《》` 和数学不等式 `<` `>`
- [x] 确认错误码已纳入 `IpcErrorCode` 类型，TypeScript strict 编译通过
- [x] 确认无冗余导入或临时文件

---

## 验收标准 → 测试映射

| 验收标准                  | 对应测试文件                                                                    | 测试用例名                                  | 状态 |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- | ---- |
| AC-1: 正常输出通过        | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | polish/rewrite/continue/expand 正常输出通过 | [x]  |
| AC-2: 空输出拦截          | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | 空字符串/空白/undefined 被拦截              | [x]  |
| AC-3: 代码块拦截          | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | 三反引号代码块被拦截                        | [x]  |
| AC-4: HTML 拦截           | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | div/script/p 标签被拦截                     | [x]  |
| AC-5: strict 膨胀拦截     | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | polish 12.5 倍被拦截、9 倍通过              | [x]  |
| AC-6: loose 膨胀通过/拦截 | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | continue 13.3 倍通过、23.3 倍拦截           | [x]  |
| AC-7: synopsis 不变       | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | synopsis 走 validateSynopsisOutput          | [x]  |
| AC-8: 无基准跳过膨胀      | `apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts` | inputText 空时跳过膨胀检测                  | [x]  |
| AC-9: 错误码注册          | TypeScript 编译                                                                 | IpcErrorCode 包含 SKILL_OUTPUT_INVALID      | [x]  |

---

## Done 定义

- [x] 所有 Scenario（S-OUT-1 到 S-OUT-9）有对应测试且通过
- [x] PR body 包含 `Closes #985`
- [x] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）
- [x] TypeScript strict 编译通过，无新增 `any` 类型
- [x] `synopsisSkill.execution.test.ts` 已有测试全绿，无回归

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

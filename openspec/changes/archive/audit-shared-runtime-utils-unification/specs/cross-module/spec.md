# Cross-Module Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-shared-runtime-utils-unification

### Requirement: nowTs 必须收敛到唯一共享定义 [ADDED]

完全相同的 `function nowTs(): number { return Date.now(); }` 在 11 个文件中独立定义。**必须**抽取到共享工具模块，所有调用方统一 import。

#### Scenario: AUD-C5-S1 静态扫描验证 nowTs 无本地重复定义 [ADDED]

- **假设** 所有 11 个文件已完成迁移
- **当** 执行 `rg "function nowTs" --type ts` 扫描代码库
- **则** 仅在共享工具模块中匹配到 `nowTs` 函数定义
- **并且** 原 11 个文件均通过 import 引用共享定义

#### Scenario: AUD-C5-S2 nowTs 迁移后行为一致 [ADDED]

- **假设** 共享 `nowTs()` 函数已就位
- **当** 任意原调用方调用 `nowTs()`
- **则** 返回值与 `Date.now()` 一致
- **并且** 类型检查与单测全绿

### Requirement: estimateTokenCount 必须收敛到 @shared/tokenBudget [ADDED]

`runtimeConfig.ts`、`ipc/ai.ts`、`buildLLMMessages.ts` 中的独立 token 估算实现**必须**迁移为 `@shared/tokenBudget.ts` 的 `estimateUtf8TokenCount` 共享 import。

#### Scenario: AUD-C5-S3 静态扫描验证 estimateTokenCount 无本地重复 [ADDED]

- **假设** 3 个独立副本已迁移到共享 import
- **当** 执行 `rg "estimateTokenCount|estimateMessageTokens" --type ts` 扫描代码库
- **则** 本地函数定义仅存在于 `@shared/tokenBudget.ts`
- **并且** `runtimeConfig.ts`、`ipc/ai.ts`、`buildLLMMessages.ts` 均通过 import 引用

#### Scenario: AUD-C5-S4 token 估算迁移后结果一致 [ADDED]

- **假设** 原 `estimateTokenCount("hello world")` 返回值为 X
- **当** 迁移后调用 `estimateUtf8TokenCount("hello world")`
- **则** 返回值与 X 一致（或在可接受误差范围内）
- **并且** 所有依赖 token 估算的上层逻辑行为不变

### Requirement: hash 工具函数必须收敛到唯一共享定义 [ADDED]

5 处独立的 `createHash("sha256").update(text,"utf8").digest("hex")` 实现**必须**抽取到共享工具模块。

#### Scenario: AUD-C5-S5 静态扫描验证 hash 工具无本地重复 [ADDED]

- **假设** 5 个文件的 hash 函数已迁移
- **当** 执行 `rg "function (hashJson|sha256Hex|hashText)" --type ts` 扫描代码库
- **则** 本地 hash 函数定义仅存在于共享工具模块
- **并且** `projectService.ts`、`documentCoreService.ts`、`searchReplaceService.ts`、`semanticChunkIndexService.ts`、`ipc/contextAssembly.ts` 均通过 import 引用

### Requirement: 魔法数字必须替换为已有常量引用 [ADDED]

`aiService.ts` 的 `max_tokens: 256` 和 `skillValidator.ts` 的 `timeoutMs > 120000` **必须**替换为 `runtimeConfig.ts` 中已定义的对应常量。

#### Scenario: AUD-C5-S6 aiService max_tokens 引用常量 [ADDED]

- **假设** `runtimeConfig.ts` 已导出 `DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE`
- **当** 查看 `aiService.ts` 的 max_tokens 赋值
- **则** 使用 `DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE` 常量而非硬编码 `256`
- **并且** 运行时行为与修改前一致

#### Scenario: AUD-C5-S7 skillValidator timeoutMs 引用常量 [ADDED]

- **假设** `runtimeConfig.ts` 已导出 `MAX_SKILL_TIMEOUT_MS`
- **当** 查看 `skillValidator.ts` 的 timeout 校验逻辑
- **则** 使用 `MAX_SKILL_TIMEOUT_MS` 常量而非硬编码 `120000`
- **并且** 运行时行为与修改前一致

#### Scenario: AUD-C5-S8 防回归守卫阻止新增重复工具函数 [ADDED]

- **假设** 迁移完成且守卫测试已就位
- **当** 开发者在新文件中定义本地 `nowTs` 或 `hashJson` 函数
- **则** 守卫测试失败，提示应使用共享模块
- **并且** CI 流水线阻止该提交合并

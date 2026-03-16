# Tasks: A0-23 文档 5MB 限制实施

- **GitHub Issue**: #984
- **分支**: `task/984-document-size-limit-enforcement`
- **Delta Spec**: `specs/document-management/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

P0-6: 基础输入输出防线

---

## 验收标准

| ID   | 标准                                                                          | 对应 Scenario      |
| ---- | ----------------------------------------------------------------------------- | ------------------ |
| AC-1 | `contentJson` 字节长度 ≤ 5 MB 的保存请求正常写入数据库                        | S-SIZE-1, S-SIZE-3 |
| AC-2 | `contentJson` 字节长度 > 5 MB 的保存请求被拦截，返回 `DOCUMENT_SIZE_EXCEEDED` | S-SIZE-2, S-SIZE-4 |
| AC-3 | 自动保存（`reason: 'autosave'`）同样受体积校验约束                            | S-SIZE-5           |
| AC-4 | `documentCoreService.save()` 独立实施体积校验，作为第二道防线                 | S-SIZE-6           |
| AC-5 | 体积计算使用 `Buffer.byteLength(contentJson, 'utf-8')` 而非 `string.length`   | S-SIZE-2           |
| AC-6 | 体积阈值定义为具名常量 `MAX_DOCUMENT_SIZE_BYTES`，非魔法数字                  | 全部               |
| AC-7 | `DOCUMENT_SIZE_EXCEEDED` 已注册到 `IpcErrorCode` 联合类型                     | S-SIZE-2           |

---

## Phase 1: Red（测试先行）

### Task 1.1: IPC 层体积校验测试

**映射验收标准**: AC-1, AC-2, AC-5

- [x] 测试：构造 2 MB 大小的 `contentJson`，调用 `file:document:save` 处理函数，断言返回 `{ ok: true }`
- [x] 测试：构造 7.3 MB 大小的 `contentJson`，调用 `file:document:save` 处理函数，断言返回 `{ ok: false, error: { code: "DOCUMENT_SIZE_EXCEEDED" } }`
- [x] 测试：断言返回的 error.message 中包含当前文档大小信息（如 `"7.3 MB"`）

**文件**: `apps/desktop/main/src/apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`（新建）

### Task 1.2: 边界值测试

**映射验收标准**: AC-2

- [x] 测试：构造恰好 5,242,880 字节的 `contentJson`，断言保存成功（`{ ok: true }`）
- [x] 测试：构造 5,242,881 字节的 `contentJson`，断言保存被拦截（`{ ok: false, error: { code: "DOCUMENT_SIZE_EXCEEDED" } }`）

**文件**: `apps/desktop/main/src/apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`

### Task 1.3: 自动保存场景测试

**映射验收标准**: AC-3

- [x] 测试：构造 6 MB 大小的 `contentJson`，`reason` 设为 `'autosave'`，调用保存处理函数，断言返回 `{ ok: false, error: { code: "DOCUMENT_SIZE_EXCEEDED" } }`
- [x] 测试：确认自动保存请求与手动保存请求使用相同的体积校验逻辑

**文件**: `apps/desktop/main/src/apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`

### Task 1.4: Service 层独立校验测试

**映射验收标准**: AC-4

- [x] 测试：直接调用 `documentCoreService.save()` 传入 6 MB 的 `contentJson`，断言返回体积超限错误
- [x] 测试：直接调用 `documentCoreService.save()` 传入 2 MB 的 `contentJson`，断言正常保存

**文件**: `apps/desktop/main/src/services/apps/desktop/main/src/services/documents/__tests__/documentCoreService-size-limit.test.ts`（新建）

### Task 1.5: 多字节字符体积计算测试

**映射验收标准**: AC-5

- [x] 测试：构造纯中文字符组成的 `contentJson`（中文字符 UTF-8 编码每字 3 字节），验证体积计算使用字节而非字符数——例如 1,747,627 个中文字符（约 5 MB UTF-8）应被拦截，即使 `string.length` 仅约 1.7M
- [x] 测试：构造相同字符数的纯 ASCII 字符 `contentJson`，验证 ASCII 场景下 `string.length` 与字节数一致时仍走 `Buffer.byteLength` 逻辑

**文件**: `apps/desktop/main/src/apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 定义体积常量与错误码

- [x] 在合适的共享位置定义 `MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024`
- [x] 在 `ipc-contract.ts` 的 `IpcErrorCode` 联合类型中注册 `"DOCUMENT_SIZE_EXCEEDED"`

**文件**: `apps/desktop/main/src/ipc/contract/ipc-contract.ts`（修改）

### Task 2.2: IPC 层实施体积校验

- [x] 在 `file:document:save` 处理函数中，参数校验通过后、调用 `documentCoreService.save()` 之前，增加体积校验逻辑
- [x] 校验逻辑：`if (Buffer.byteLength(payload.contentJson, 'utf-8') > MAX_DOCUMENT_SIZE_BYTES)` 返回 `DOCUMENT_SIZE_EXCEEDED` 错误
- [x] 错误消息包含当前文档大小（MB，保留一位小数）

**文件**: `apps/desktop/main/src/ipc/file.ts`（修改）

### Task 2.3: Service 层实施体积校验

- [x] 在 `documentCoreService.save()` 的事务开启前，增加同样的体积校验
- [x] 返回 Service 级别的错误结果

**文件**: `apps/desktop/main/src/services/documents/documentCoreService.ts`（修改）

### Task 2.4: 错误消息人话映射

- [x] 在 `errorMessages.ts` 中为 `DOCUMENT_SIZE_EXCEEDED` 添加人话映射：「文档内容过大，请精简后重试」

**文件**: `apps/desktop/renderer/src/lib/errorMessages.ts`（修改）

---

## Phase 3: Refactor（收尾）

### Task 3.1: 运行全量测试

- [x] 运行 `pnpm -C apps/desktop vitest run`，确认无回归
- [x] 运行 `pnpm -C apps/desktop tsc --noEmit`，确认无类型错误

### Task 3.2: 代码审查

- [x] 确认体积常量在 IPC 层和 Service 层共享同一定义，无重复硬编码
- [x] 确认无残留 `string.length` 形式的体积判断
- [x] 确认错误码已纳入 `IpcErrorCode` 类型，TypeScript strict 编译通过

---

## 验收标准 → 测试映射

| 验收标准                  | 对应测试文件                                                                                | 测试用例名                               | 状态 |
| ------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------- | ---- |
| AC-1: 正常体积保存成功    | `apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`                          | 2 MB 文档保存成功                        | [x]  |
| AC-2: 超限保存被拦截      | `apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`                          | 7.3 MB 文档返回 DOCUMENT_SIZE_EXCEEDED   | [x]  |
| AC-2: 边界值 5MB+1 被拦截 | `apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`                          | 5,242,881 字节文档被拦截                 | [x]  |
| AC-3: 自动保存受约束      | `apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`                          | autosave 6 MB 被拦截                     | [x]  |
| AC-4: Service 层独立校验  | `apps/desktop/main/src/services/documents/__tests__/documentCoreService-size-limit.test.ts` | Service 层拦截 6 MB                      | [x]  |
| AC-5: 字节计算非字符数    | `apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`                          | 中文多字节字符体积计算                   | [x]  |
| AC-6: 具名常量            | 代码审查                                                                                    | MAX_DOCUMENT_SIZE_BYTES 存在且被引用     | [x]  |
| AC-7: 错误码注册          | TypeScript 编译                                                                             | IpcErrorCode 包含 DOCUMENT_SIZE_EXCEEDED | [x]  |

---

## Done 定义

- [x] 所有 Scenario（S-SIZE-1 到 S-SIZE-6）有对应测试且通过
- [x] PR body 包含 `Closes #984`
- [x] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）
- [x] TypeScript strict 编译通过，无新增 `any` 类型

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

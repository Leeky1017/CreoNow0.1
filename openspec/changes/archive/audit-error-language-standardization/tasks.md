更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（后端错误消息统一英文 error code, 前端翻译映射, runtime-validation/providerResolver 中文硬编码清理）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：未映射 error code 兜底策略、runtime-validation 6 处中文替换后功能一致、providerResolver 错误路径回归）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（后端错误响应零中文字符；前端翻译映射覆盖所有 error code；runtime-validation/providerResolver 零中文硬编码）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C2 `audit-fatal-error-visibility-guardrails`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                          |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AUD-C13-S1  | `apps/desktop/main/src/__tests__/unit/ipc-error-response-format.test.ts`                   | `backend error response should contain English code and message with no Chinese characters`   |
| AUD-C13-S2  | `apps/desktop/renderer/src/__tests__/unit/error-code-translation-map.test.ts`              | `frontend translation map should cover all backend error codes with Chinese fallback`         |
| AUD-C13-S3  | `apps/desktop/main/src/__tests__/integration/ipc-error-language-guard.test.ts`             | `lint/static check should detect Chinese characters in backend IPC error messages`            |
| AUD-C13-S4  | `apps/desktop/main/src/__tests__/unit/runtime-validation-error-english.test.ts`            | `runtime-validation should have zero Chinese characters and use English error code + message` |
| AUD-C13-S5  | `apps/desktop/main/src/__tests__/integration/runtime-validation-error-mapping.test.ts`     | `frontend should map runtime-validation error codes to Chinese prompts with same semantics`   |
| AUD-C13-S6  | `apps/desktop/main/src/__tests__/unit/provider-resolver-error-english.test.ts`             | `providerResolver should have zero Chinese characters and use English error code + message`   |
| AUD-C13-S7  | `apps/desktop/main/src/__tests__/integration/provider-resolver-error-regression.test.ts`   | `providerResolver error paths should return English code mappable to Chinese by frontend`     |

## 3. Red（先写失败测试）

- [ ] 3.1 **后端错误纯英文**：触发后端 IPC error 响应，断言 `message` 字段不含中文字符（正则 `/[\u4e00-\u9fff]/` 匹配为 0）（AUD-C13-S1）
- [ ] 3.2 **前端翻译覆盖率**：枚举所有后端 error code，断言前端翻译映射表对每个 code 均有对应中文条目（AUD-C13-S2）
- [ ] 3.3 **静态守卫**：扫描后端 IPC error 创建点的 message 参数，断言不含中文字符（AUD-C13-S3）
- [ ] 3.4 **runtime-validation 纯英文**：触发 runtime-validation 所有 6 个错误路径，断言每个错误的 code 和 message 均为英文（AUD-C13-S4）
- [ ] 3.5 **runtime-validation 前端映射**：前端接收 runtime-validation error code，断言翻译映射产出的中文含义与原硬编码中文语义一致（AUD-C13-S5）
- [ ] 3.6 **providerResolver 纯英文**：触发 providerResolver 所有 2 个错误路径，断言错误为英文 code + message（AUD-C13-S6）
- [ ] 3.7 **providerResolver 前端映射**：前端接收 providerResolver error code，断言翻译后语义与原中文一致（AUD-C13-S7）

## 4. Green（最小实现通过）

- [ ] 4.1 在 `runtime-validation.ts` 中将 6 处中文错误消息替换为英文 error code（如 `VALIDATION_FIELD_REQUIRED`）+ 英文 message
- [ ] 4.2 在 `providerResolver.ts` 中将 2 处中文错误消息替换为英文 error code + message
- [ ] 4.3 创建 `renderer/src/lib/errorTranslation.ts`，建立 `Record<string, string>` 映射表，将后端 error code 映射为用户可见中文提示
- [ ] 4.4 在前端错误展示组件中调用翻译映射，未映射 code 兜底显示英文 message

## 5. Refactor（保持绿灯）

- [ ] 5.1 将后端 error code 常量抽取为 `packages/shared/errorCodes.ts`，前后端共享引用（避免硬编码字符串漂移）
- [ ] 5.2 评估翻译映射是否应按模块分文件还是统一一个文件（当前规模推荐统一）
- [ ] 5.3 为后端新增 error code 的 PR 添加 lint 守卫：error message 含中文字符则 CI 报错

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG

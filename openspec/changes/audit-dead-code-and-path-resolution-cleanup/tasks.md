更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（phase4-delivery-gate.ts 接入或删除, 模板/预加载路径确定性解析）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：模板文件缺失明确报错、preload 文件缺失明确报错、死代码守卫回归检测）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（零孤立模块；路径解析无暴力搜索模式；缺失文件报错含确定路径信息）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C10 `audit-editor-save-queue-extraction`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                          |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AUD-C12-S1  | `apps/desktop/main/src/__tests__/unit/phase4-delivery-gate-disposal.test.ts`                | `phase4-delivery-gate should be production-imported or fully deleted with its test files`     |
| AUD-C12-S2  | `apps/desktop/main/src/__tests__/unit/dead-code-guard-continuity.test.ts`                   | `ping-dead-code-cleanup guard test should remain valid after phase4 disposal`                 |
| AUD-C12-S3  | `apps/desktop/main/src/__tests__/unit/template-path-deterministic-resolve.test.ts`          | `templateService should resolve path from build config without brute-force candidates`        |
| AUD-C12-S4  | `apps/desktop/main/src/__tests__/unit/template-path-missing-error.test.ts`                  | `templateService should throw clear error with expected path when template file missing`      |
| AUD-C12-S5  | `apps/desktop/main/src/__tests__/unit/preload-path-deterministic-resolve.test.ts`           | `main process should resolve preload path from build config without brute-force candidates`   |
| AUD-C12-S6  | `apps/desktop/main/src/__tests__/unit/preload-path-missing-error.test.ts`                   | `main process should throw clear error with expected path when preload file missing`          |

## 3. Red（先写失败测试）

- [ ] 3.1 **phase4-delivery-gate 处置**：扫描生产代码 import 图，断言 `phase4-delivery-gate.ts` 要么被生产代码 import 要么文件已不存在（AUD-C12-S1）
- [ ] 3.2 **死代码守卫延续**：`ping-dead-code-cleanup.test.ts` 运行通过，断言守卫测试在 phase4 处置后仍有效（AUD-C12-S2）
- [ ] 3.3 **模板路径确定性**：mock 构建配置输出路径，调用 templateService 路径解析，断言直接命中目标路径而非遍历 5 个候选（AUD-C12-S3）
- [ ] 3.4 **模板缺失明确报错**：构建配置路径下模板文件不存在，断言抛出的错误包含确切的期望路径（AUD-C12-S4）
- [ ] 3.5 **preload 路径确定性**：mock 构建配置，断言 preload 路径直接从配置解析，无候选列表遍历（AUD-C12-S5）
- [ ] 3.6 **preload 缺失明确报错**：preload 文件不存在，断言错误包含确切期望路径而非"在 N 个位置均未找到"（AUD-C12-S6）

## 4. Green（最小实现通过）

- [ ] 4.1 决策 `phase4-delivery-gate.ts`：若无生产用途则连同其测试文件一并删除；若有用途则补齐生产代码的 import
- [ ] 4.2 更新 `ping-dead-code-cleanup.test.ts` 守卫测试以反映 phase4 处置后的文件清单
- [ ] 4.3 在 `templateService.ts` 中从 `electron.vite.config.ts` 或构建输出 manifest 读取模板路径，替换 5 候选暴力搜索
- [ ] 4.4 在 `index.ts` 中从构建配置读取 preload 路径，替换 3 候选暴力搜索
- [ ] 4.5 为路径不存在场景添加包含具体路径的 Error message（如 `Template not found at ${expectedPath}`）

## 5. Refactor（保持绿灯）

- [ ] 5.1 评估是否可抽取 `resolveFromBuildConfig(configKey)` 工具函数，templateService 和 index.ts 共用
- [ ] 5.2 确保构建配置路径的读取方式在 dev 和 production 环境下均可用（electron.vite dev 模式 vs 打包后的路径）
- [ ] 5.3 清理删除 phase4 后可能残留的空目录或无用测试 helper

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG

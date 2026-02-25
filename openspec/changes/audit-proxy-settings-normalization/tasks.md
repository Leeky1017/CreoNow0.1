更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（ProxySettings 统一结构, fallback 链收敛, 旧配置迁移）
- [ ] 1.2 审阅并确认错误路径与边界路径（缺失字段归一化不崩溃；旧格式配置迁移后功能无损）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（getRaw 遗留 fallback 逻辑归零；仅写入规范格式字段）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C4 `audit-ipc-result-unification`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件 | 计划用例名 / 断言块 |
| ----------- | --- | --- |
| AUD-C7-S1 | `apps/desktop/main/src/__tests__/unit/proxy-settings-normalization.test.ts` | `config read should auto-normalize legacy flat fields to canonical nested structure` |
| AUD-C7-S2 | `apps/desktop/main/src/__tests__/unit/proxy-settings-normalization.test.ts` | `config update should only write canonical format fields (no legacy fields)` |
| AUD-C7-S3 | `apps/desktop/main/src/__tests__/integration/proxy-provider-resolver.test.ts` | `providerResolver should resolve credentials directly without three-level fallback` |
| AUD-C7-S4 | `apps/desktop/main/src/__tests__/integration/proxy-settings-migration.test.ts` | `oldest legacy config should migrate losslessly with all providers resolvable` |
| AUD-C7-S5 | `apps/desktop/main/src/__tests__/unit/proxy-settings-normalization.test.ts` | `normalization should fill safe defaults for missing fields without throwing` |
| AUD-C7-S6 | `apps/desktop/main/src/__tests__/unit/proxy-settings-normalization.test.ts` | `getRaw should contain zero legacy fallback logic after refactor` |

## 3. Red（先写失败测试）

- [ ] 3.1 **自动归一化**：构造含 legacy flat fields（`baseUrl` / `apiKey`）的配置对象，调用 `getRaw()`，断言返回的结构中 legacy 字段已迁移到 canonical nested 位置（AUD-C7-S1）
- [ ] 3.2 **仅写规范格式**：调用 `update()` 写入配置，断言存储内容仅包含 canonical 字段、无 `baseUrl` / `apiKey` / `encryptedLegacyKey` 等遗留字段（AUD-C7-S2）
- [ ] 3.3 **直接解析**：调用 `providerResolver.resolve(provider)`，断言直接从 canonical nested 结构获取 credentials，无三级 fallback 逻辑执行（AUD-C7-S3）
- [ ] 3.4 **最旧配置无损迁移**：构造 v1（最早）格式配置，经 normalize 后断言所有 provider 均可正确 resolve（AUD-C7-S4）
- [ ] 3.5 **缺失字段安全默认**：构造部分字段缺失的配置，断言 normalize 填充安全默认值且不抛异常（AUD-C7-S5）
- [ ] 3.6 **getRaw 零 legacy fallback**：源码扫描 `getRaw` 方法体，断言不包含 `baseUrl` / `apiKey` / `encryptedLegacyKey` 字符串（AUD-C7-S6）

## 4. Green（最小实现通过）

- [ ] 4.1 实现 `normalizeProxySettings(raw)` 纯函数：检测 legacy flat 字段，迁移到 canonical nested 结构，填充缺失字段默认值
- [ ] 4.2 在 `getRaw()` 入口处调用 `normalizeProxySettings()`，移除原有的遗留字段 fallback 逻辑
- [ ] 4.3 修改 `update()` 方法，确保写入时仅保存 canonical 格式（通过 normalizeProxySettings 过滤后再写入）
- [ ] 4.4 重写 `providerResolver` 中每个 provider 的 credentials 获取逻辑为直接读取 canonical 路径，移除三级 fallback
- [ ] 4.5 删除 `resolveSettingsBackupProvider()` 中重复的 fallback 构造代码

## 5. Refactor（保持绿灯）

- [ ] 5.1 将 `normalizeProxySettings` 的字段映射规则提取为声明式配置表（`{ legacyField → canonicalPath }`），而非 if-else 链
- [ ] 5.2 检查 `resolveSettingsBackupProvider()` 是否可完全委托给 `providerResolver.resolve()`，消除重复函数
- [ ] 5.3 确保 normalize 后的对象通过 `ProxySettings` 类型的 strict type check（无多余字段）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG

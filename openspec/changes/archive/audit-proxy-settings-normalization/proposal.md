# 提案：audit-proxy-settings-normalization

更新时间：2026-02-25 23:50

## 背景

`aiProxySettingsService.ts:279-300` 的 `getRaw()` 保留了 `baseUrl`/`apiKey` 两个遗留字段作为新字段的 fallback，`update()` 方法中也保留了 `encryptedLegacyKey` 的处理路径。`providerResolver.ts:81-145` 中每个 provider 的 credentials 都有三级 fallback（新嵌套字段 → 旧扁平字段 → 最古老字段），且 `resolveSettingsBackupProvider()` 又完整重复了一遍这些 fallback 构造。属于审计报告类别三-3.4/3.5（中严重程度）。不改的风险：fallback 链持续膨胀，新增 provider 时必须理解并维护三代配置格式，容易引入隐蔽的配置回退 bug。

## 变更内容

- 统一 `ProxySettings` 数据结构为单一规范形式，消除三级 fallback
- 在配置读取层做一次性归一化（normalize），将旧格式迁移为新格式
- 移除 `providerResolver.ts` 中重复的 fallback 构造逻辑
- 编写旧配置迁移测试，确保已有用户配置无损升级

## 受影响模块

- ai-service — `aiProxySettingsService.ts` 配置读写与 `providerResolver.ts` 凭据解析逻辑收敛

## 不做什么

- 不改变用户可见的 AI 设置 UI 交互
- 不迁移 renderer 侧的 ProxySection/AiSettingsSection 组件（类型强转问题属于 C8 范围）
- 不涉及 provider 新增或删除
- 不改变加密/解密密钥的存储机制

## 依赖关系

- 上游依赖：
  - C4 `audit-ipc-result-unification`（共享模块产出，aiProxySettingsService 引用 ipcError/ServiceResult）
- 下游依赖：
  - C8 `audit-type-contract-alignment`（ProxySettings 类型统一后，C8 可消除 renderer 侧的 `as unknown as` 强转）

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 §三-3.4（AI Proxy Settings 遗留字段兼容） | `getRaw()` 保留遗留 fallback，`update()` 保留 encryptedLegacyKey | `specs/ai-service/spec.md`、`tasks.md` |
| 审计报告 §三-3.5（Provider Resolver 多层 fallback） | 三级 fallback + resolveSettingsBackupProvider 重复构造 | `specs/ai-service/spec.md`、`tasks.md` |
| 拆解计划 C7 | 风险中，规模 M，依赖 C4 | `proposal.md` |

## 审阅状态

- Owner 审阅：`PENDING`

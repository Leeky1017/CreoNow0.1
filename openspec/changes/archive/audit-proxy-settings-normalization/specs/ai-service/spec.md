# AI Service Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-proxy-settings-normalization

### Requirement: ProxySettings 必须统一为单一规范结构并消除多层 fallback [ADDED]

`aiProxySettingsService.ts` 与 `providerResolver.ts` 中的遗留字段兼容层和三级 fallback 链**必须**收敛为单一规范的 `ProxySettings` 数据结构。配置读取层做一次性归一化，消除 `getRaw()` 的遗留 fallback 和 `resolveSettingsBackupProvider()` 的重复构造。

#### Scenario: AUD-C7-S1 配置读取时自动归一化遗留格式 [ADDED]

- **假设** 用户存储中包含旧格式配置（`baseUrl`/`apiKey` 扁平字段）
- **当** 调用配置读取接口
- **则** 返回归一化后的单一规范结构（新嵌套字段格式）
- **并且** 调用方无需感知旧格式的存在

#### Scenario: AUD-C7-S2 配置写入时仅写入规范格式 [ADDED]

- **假设** 调用方提交新的 ProxySettings 配置
- **当** 调用 `update()` 写入配置
- **则** 仅写入规范格式字段
- **并且** 不再写入 `encryptedLegacyKey` 等遗留字段

#### Scenario: AUD-C7-S3 Provider 凭据解析不再包含三级 fallback [ADDED]

- **假设** 配置已通过归一化层统一为规范格式
- **当** `providerResolver` 解析 provider 凭据
- **则** 直接从规范字段读取，不再执行三级 fallback 链
- **并且** `resolveSettingsBackupProvider()` 不再重复构造 fallback 逻辑

#### Scenario: AUD-C7-S4 旧格式配置迁移后功能无损 [ADDED]

- **假设** 用户存储中包含最古老格式的配置（第一代扁平字段）
- **当** 系统启动并执行配置归一化
- **则** 所有 provider 的凭据均可正确解析
- **并且** AI 服务功能与迁移前完全一致

#### Scenario: AUD-C7-S5 缺失字段的配置归一化不崩溃 [ADDED]

- **假设** 用户存储中的配置缺少部分字段（如仅有 `baseUrl` 无 `apiKey`）
- **当** 执行配置归一化
- **则** 缺失字段填充为安全默认值或标记为未配置
- **并且** 不抛出异常，返回可用的配置结构

#### Scenario: AUD-C7-S6 归一化后 getRaw 不再包含遗留 fallback 逻辑 [ADDED]

- **假设** 重构完成后
- **当** 静态扫描 `aiProxySettingsService.ts` 的 `getRaw()` 方法
- **则** 不再包含 `baseUrl`/`apiKey` 遗留字段的 fallback 读取
- **并且** 遗留字段兼容代码行数归零

# Context Engine Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-contextfs-async-ssot

### Requirement: contextFs 同步/异步逻辑必须收敛为单一事实来源 [ADDED]

`services/context/contextFs.ts` 中 4 对同步/异步函数（`ensureCreonowDirStructure` / `ensureCreonowDirStructureAsync`、`getCreonowDirStatus` / `getCreonowDirStatusAsync`）的业务逻辑**必须**收敛为单一实现，消除双份维护。异步版本作为 SSOT，同步版本改为薄包装或委托。

#### Scenario: AUD-C6-S1 异步版本作为 SSOT 创建目录结构 [ADDED]

- **假设** 项目目录尚未创建 `.creonow` 子目录结构
- **当** 调用 `ensureCreonowDirStructureAsync(projectPath)`
- **则** 异步创建完整的 `.creonow` 目录结构（含所有必需子目录）
- **并且** 返回成功结果，目录结构与原实现一致

#### Scenario: AUD-C6-S2 同步版本委托异步逻辑后行为一致 [ADDED]

- **假设** 同步版本 `ensureCreonowDirStructure(projectPath)` 已改为委托共享逻辑
- **当** 分别调用同步版本和异步版本创建相同项目的目录结构
- **则** 两者产生的目录结构完全一致
- **并且** 同步版本不再包含独立的业务逻辑副本

#### Scenario: AUD-C6-S3 异步版本作为 SSOT 查询目录状态 [ADDED]

- **假设** 项目目录已存在 `.creonow` 子目录结构
- **当** 调用 `getCreonowDirStatusAsync(projectPath)`
- **则** 返回与原实现一致的目录状态信息
- **并且** 状态查询逻辑仅在异步版本中维护

#### Scenario: AUD-C6-S4 同步版本查询状态与异步版本结果一致 [ADDED]

- **假设** 同步版本 `getCreonowDirStatus(projectPath)` 已改为委托共享逻辑
- **当** 分别调用同步版本和异步版本查询相同项目的目录状态
- **则** 两者返回的状态信息完全一致

#### Scenario: AUD-C6-S5 目录创建失败时 sync/async 错误行为一致 [ADDED]

- **假设** 目标路径不可写（权限不足或磁盘满）
- **当** 分别调用同步版本和异步版本创建目录结构
- **则** 两者返回相同语义的错误结果
- **并且** 错误信息包含失败原因

#### Scenario: AUD-C6-S6 重复调用目录创建具有幂等性 [ADDED]

- **假设** `.creonow` 目录结构已存在
- **当** 再次调用 `ensureCreonowDirStructureAsync(projectPath)`
- **则** 不报错，不重复创建
- **并且** 已有目录内容不受影响

#### Scenario: AUD-C6-S7 源码中不再存在重复的业务逻辑 [ADDED]

- **假设** 重构完成后
- **当** 静态扫描 `contextFs.ts` 的 `ensureCreonowDirStructure` 与 `getCreonowDirStatus` 相关函数
- **则** 目录创建/状态查询的核心业务逻辑仅出现一次
- **并且** 同步版本仅包含 API 适配层（无重复的 mkdir/stat 逻辑序列）

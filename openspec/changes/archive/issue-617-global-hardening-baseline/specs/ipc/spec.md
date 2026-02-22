# IPC Specification Delta

更新时间：2026-02-22 19:37

## Change: issue-617-global-hardening-baseline

### Requirement: 后端基础防护基线（SQLite PRAGMA / Fatal Shutdown / Atomic Write） [ADDED]

后端基础设施**必须**提供可验证的“基础防护底线”，用于降低 IPC 请求在并发、崩溃、停机与写入中断场景下的系统性风险。

- SQLite 连接**必须**应用推荐 PRAGMA，避免锁冲突时直接失败并建立稳定性能基线。
- 发生致命异常时**必须**记录并触发优雅停机链路，避免“半死不活”继续运行导致数据损坏。
- 关键写入路径**必须**使用原子写策略，避免生成部分文件/损坏文件。

#### Scenario: BE-GHB-S1 SQLite 推荐 PRAGMA 被统一应用 [ADDED]

- **假设** 主进程创建用于处理 IPC 请求的 SQLite 连接（WAL 模式）
- **当** 初始化连接并应用推荐 PRAGMA
- **则** 连接至少包含 `busy_timeout`、`synchronous`、`mmap_size`、`cache_size` 的推荐配置
- **并且** 该配置可被自动化测试验证（不依赖外部环境）

#### Scenario: BE-GHB-S2 致命异常触发优雅停机并以失败退出 [ADDED]

- **假设** 主进程发生 `uncaughtException` 或 `unhandledRejection`
- **当** 全局异常捕获器处理该致命异常
- **则** 系统记录致命事件并触发优雅停机链路（含超时保护）
- **并且** 最终以非 0 exit code 退出，避免继续处理后续 IPC 请求

#### Scenario: BE-GHB-S4 原子写不产生部分文件 [ADDED]

- **假设** 某次写入需要落盘关键文件（如元数据/导出产物/中间态）
- **当** 写入过程中发生中断（崩溃或异常）
- **则** 目标路径不会留下“部分写入”的损坏文件
- **并且** 写入要么完整成功（可读）要么不生效（保持旧内容/不存在）

### Requirement: BrowserWindow 安全基线（新窗口与导航限制） [ADDED]

主进程**必须**阻断越权窗口与越权导航路径，避免渲染进程通过窗口/导航绕过既有 IPC 边界与安全约束。

#### Scenario: BE-GHB-S3 新窗口创建与越权导航被阻断 [ADDED]

- **假设** 渲染进程尝试通过 `window.open` 创建新窗口或发起越权导航
- **当** BrowserWindow 安全策略执行校验
- **则** 新窗口创建被拒绝，并阻断导航到非白名单来源
- **并且** 记录可审计的安全事件（不包含敏感信息）

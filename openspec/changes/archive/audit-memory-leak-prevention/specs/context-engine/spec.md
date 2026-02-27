# Context Engine Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-memory-leak-prevention

### Requirement: watchService watcher 错误监听器必须在 watcher 关闭时显式移除 [ADDED]

`watchService.ts:84-98` 的 `watcher.on("error", ...)` 监听器在 watcher 生命周期内从未显式移除。watcher 关闭时**必须**通过 `.off()` 或 `.removeListener()` 显式移除 error 监听器，防止 watcher 对象被其他引用持有时监听器泄漏。

#### Scenario: AUD-C15-S1 watcher 关闭时 error 监听器被移除 [ADDED]

- **假设** watchService 已创建文件监视器并注册了 error 监听器
- **当** watcher 被关闭（调用 close/dispose）
- **则** error 监听器通过 `.off()` 或 `.removeListener()` 显式移除
- **并且** watcher 对象上的 `error` 事件监听器数量归零

#### Scenario: AUD-C15-S2 watcher 关闭后 error 事件不触发已移除的监听器 [ADDED]

- **假设** watchService 的 watcher 已关闭且 error 监听器已移除
- **当** watcher 对象（仍被其他引用持有）触发 error 事件
- **则** 已移除的 error 监听器不被调用
- **并且** 不产生未捕获异常或副作用

#### Scenario: AUD-C15-S3 多次创建和关闭 watcher 不累积监听器 [ADDED]

- **假设** watchService 在运行期间多次创建和关闭 watcher（如项目切换场景）
- **当** 连续执行 N 次 create→close 循环
- **则** 每次 close 后 error 监听器数量归零
- **并且** 不出现 Node.js `MaxListenersExceededWarning` 警告

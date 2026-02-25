# Workbench Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-fatal-error-visibility-guardrails

### Requirement: 主进程 fatal 日志写入失败必须有 stderr fallback [ADDED]

`index.ts:466` 的 catch 块在日志写入失败时完全吞没异常。**必须**添加 `process.stderr.write()` fallback，确保启动失败时至少有 stderr 输出可供诊断。

#### Scenario: AUD-C2-S1 日志写入失败时 stderr 输出错误信息 [ADDED]

- **假设** 应用主进程启动过程中触发 fatal 级别日志写入
- **当** 日志写入操作抛出异常（如磁盘满、权限不足）
- **则** catch 块通过 `process.stderr.write()` 输出原始错误信息与日志写入失败的诊断上下文
- **并且** stderr 输出包含原始 fatal 错误的 message 和 stack

#### Scenario: AUD-C2-S2 stderr fallback 自身失败不导致进程崩溃 [ADDED]

- **假设** 日志写入失败且 `process.stderr.write()` 也抛出异常
- **当** fallback 链执行到末端
- **则** 进程不因 fallback 失败而崩溃（静默降级）
- **并且** 不产生未捕获异常

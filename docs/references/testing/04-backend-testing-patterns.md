# 后端与边界测试模式

更新时间：2026-03-07 11:40

## Service 测试

后端 service 测试应优先围绕“输入 -> 状态变化 / 返回结果 / 错误码”来写。

推荐模式：

- 通过 `createXxxService(deps)` 或等价注入方式隔离外部依赖。
- mock DAO、文件系统、HTTP 边界，但不要 mock service 自己的核心行为。
- 每个核心行为至少覆盖：
  - happy path
  - edge path
  - error path

重点断言：

- 返回值结构
- 错误码与错误消息
- 状态转移
- 关键副作用是否发生 / 未发生

## IPC Handler / Contract 测试

IPC 测试的目标不是证明 Electron 能运行，而是证明契约可靠。

推荐断言：

- request schema 校验是否生效
- response envelope 是否符合约定
- 错误码是否稳定
- timeout / abort / validation failure 是否有明确信号

推荐写法：

- 直接调用 handler 或 handler factory。
- mock `ipcMain` / `ipcRenderer` / preload bridge。
- 将“契约结构”与“业务逻辑”分层验证。

不要：

- 用脚本式测试把多个契约检查揉成一大块顶层逻辑。
- 用 `console.log` 代替断言。

## 数据库测试

DB 测试应使用内存 SQLite 或临时文件数据库，禁止依赖本机真实业务库。

推荐流程：

1. 建立隔离数据库实例。
2. 跑迁移。
3. 写入最小测试数据。
4. 调用 DAO / service。
5. 断言查询结果、约束与错误行为。

注意：

- 每个测试独立建库或彻底清理。
- 不要依赖真实时间，必要时注入固定时钟。

## AI / LLM 测试

仓库原则是 fake-first：

- 单元 / 集成 / E2E 都必须 mock LLM。
- 只在 AI Eval 或人工验证时接真实模型。

推荐模式：

- fake HTTP server 或 fake provider
- 明确流式 chunk 序列
- 明确取消、超时、错误映射

重点断言：

- 事件顺序
- 终态是否唯一
- timeout / cancel 后是否还有幽灵执行

## 确定性测试

凡涉及：

- 时间
- 随机数
- 并发顺序
- retried backoff

都必须显式收口。

推荐手段：

- fake timer
- 固定 seed
- deferred promise
- 手工控制调度顺序

正例参考：

- `apps/desktop/renderer/src/stores/__tests__/searchStore.race.test.ts`

## 后端测试 review 清单

- 是否把边界依赖与核心逻辑分开了？
- 错误码、错误消息、错误路径是否明确断言？
- timeout / cancel 是否只是“Promise 超时”，还是连底层副作用也被中止？
- 是否避免依赖真实时间、真实网络、真实 LLM？
- 契约测试是否真的在测契约，而不是测脚本流程？

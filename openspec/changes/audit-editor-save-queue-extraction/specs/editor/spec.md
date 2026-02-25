# Editor Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-editor-save-queue-extraction

### Requirement: Editor save queue 必须提取为独立模块并移除函数规模豁免 [ADDED]

`editorStore.tsx:367-465` 内联的 save queue 逻辑（优先级插入、串行处理、错误恢复）**必须**提取为独立模块，具备独立单测覆盖。`editorStore.tsx:128` 的 `eslint-disable-next-line max-lines-per-function` 豁免**必须**移除。

#### Scenario: AUD-C10-S1 save queue 串行执行写入任务 [ADDED]

- **假设** 多个 save 请求同时提交到 save queue
- **当** save queue 处理这些请求
- **则** 按入队顺序串行执行，不并发写入
- **并且** 每个任务完成后才开始下一个

#### Scenario: AUD-C10-S2 save queue 支持优先级插入 [ADDED]

- **假设** save queue 中已有普通优先级的待处理任务
- **当** 一个高优先级 save 请求提交
- **则** 高优先级任务插入到队列前端（当前执行任务之后）
- **并且** 不中断正在执行的任务

#### Scenario: AUD-C10-S3 save queue 单个任务失败后继续处理后续任务 [ADDED]

- **假设** save queue 中有 3 个待处理任务
- **当** 第 1 个任务执行失败（如 IPC 写入超时）
- **则** 失败被记录，队列继续处理第 2、第 3 个任务
- **并且** 失败任务的错误信息可被调用方获取

#### Scenario: AUD-C10-S4 save queue 错误恢复不丢失待处理任务 [ADDED]

- **假设** save queue 正在执行一个任务且队列中还有后续任务
- **当** 当前任务抛出未预期异常
- **则** 队列状态恢复为可用，后续任务不丢失
- **并且** 队列不进入死锁或停滞状态

#### Scenario: AUD-C10-S5 提取后的模块可独立实例化和测试 [ADDED]

- **假设** save queue 已提取为独立模块（如 `saveQueue.ts`）
- **当** 在单测中直接实例化 save queue（不依赖 editorStore）
- **则** 可独立验证串行执行、优先级插入、错误恢复行为
- **并且** 不需要 mock zustand store 或 IPC 层

#### Scenario: AUD-C10-S6 editorStore 通过调用独立模块实现 save 功能 [ADDED]

- **假设** save queue 已提取为独立模块
- **当** `createEditorStore` 工厂函数初始化
- **则** 内部创建 save queue 实例并委托 save 操作
- **并且** `createEditorStore` 函数体不再包含 save queue 的实现逻辑

#### Scenario: AUD-C10-S7 eslint-disable 豁免移除后 lint 通过 [ADDED]

- **假设** save queue 提取完成，`createEditorStore` 函数规模缩减
- **当** 移除 `editorStore.tsx:128` 的 `eslint-disable-next-line max-lines-per-function`
- **则** `eslint` 检查通过，函数规模在规则允许范围内
- **并且** 不引入新的 eslint-disable 注释

#### Scenario: AUD-C10-S8 save queue 空队列时无副作用 [ADDED]

- **假设** save queue 已初始化但无任何待处理任务
- **当** 队列处于空闲状态
- **则** 不产生定时器、轮询或其他副作用
- **并且** 内存占用保持最小

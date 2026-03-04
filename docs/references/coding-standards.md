# 代码原则

## 通用原则

- 拒绝隐式注入：所有依赖必须显式传入
- 一条链路一套实现：禁止「向后兼容/双栈并存」
- 不写非必要代码：禁止过度抽象；先跑通最短链路再扩展
- 显式注释：新增/修改的函数必须有 JSDoc；注释只解释 why，不写 what
- 禁止 `any` 类型；类型必须完备（TS strict mode 下可编译）
- 禁止 silent failure：任何 `catch` 必须显式处理
- 超时/取消必须有明确状态

## IPC 约束

- 所有 IPC 通道必须通过 TypeScript Type Map 定义，禁止裸字符串 channel + `any`
- IPC 通道按业务域分组（editor / ai / project / knowledge / memory / system）
- 三种通信模式必须明确：Request-Response（`invoke/handle`）、Fire-and-Forget（`send/on`）、Push Notification（`webContents.send/on`）
- 所有 IPC 必须通过 `contextBridge.exposeInMainWorld` 暴露，禁止渲染进程直接使用 `ipcRenderer`
- 所有从渲染进程进入主进程的数据必须进行运行时参数校验（Zod）
- IPC 边界必须返回统一结构化结果（`{ success: boolean, data?: T, error?: { code, message } }`）
- Handler 业务逻辑必须与 IPC 层解耦，通过依赖注入接收外部依赖

## 前端约束

- 状态管理统一使用 Zustand，禁止 React Context 传递可变状态
- 组件必须先有 Storybook Story 再集成到页面
- L1/L2 组件通过 props 接收数据，禁止直接调用 Store 或 IPC
- L3 Feature 组件禁止使用原生 HTML 交互元素（`<button>`、`<input>`、`<select>`），必须使用 L1 Primitives（根因：75 文件 / 357 处违规）
- 禁止使用 Tailwind 内置阴影类（`shadow-lg`、`shadow-xl`、`shadow-2xl`），必须走 `--shadow-*` Design Token（根因：19 文件违规）
- 所有用户可见文本必须通过 `t()` / i18n 输出，禁止 JSX 中直接写裸字符串字面量（根因：~500+ 处英文硬编码）

## 后端约束

- 数据库操作统一通过 DAO 层，禁止在 Service 中直接写 SQL
- LLM 调用必须通过 AI Service 抽象层，禁止在业务模块中直接调用 API
- 所有持久化操作必须支持事务回滚

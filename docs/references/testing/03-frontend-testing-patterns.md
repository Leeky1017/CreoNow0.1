# 前端测试模式

更新时间：2026-03-07 11:40

## 目标

前端测试应优先证明：

- 用户是否能看到正确内容
- 用户操作后状态是否变化
- 错误与空态是否可见
- i18n、a11y、Storybook 是否与真实实现同向而行

## 组件测试（RTL）

推荐流程：

1. `render` 组件或页面片段。
2. 用 `getByRole`、`getByLabelText`、`getByTestId` 找到用户可交互元素。
3. 用 `userEvent` 驱动真实输入、点击、键盘操作。
4. 断言最终 DOM、回调、状态文本或错误提示。

优先级建议：

1. `getByRole`
2. `getByLabelText`
3. `getByTestId`
4. 最后才考虑 `getByText`

避免：

- 直接依赖硬编码中文文案，尤其在 i18n 收敛阶段。
- 只验证“按钮存在”，却不点击、不输入、不等待结果。

正例参考：

- `apps/desktop/renderer/src/features/export/ExportDialog.test.tsx`

## Store 测试

Store 测试的重点是状态转移，不是 UI 壳层。

推荐模式：

- 直接创建 store 或用受控 provider 包裹。
- mock IPC 边界，不 mock store 自己。
- 覆盖初始态、成功路径、并发/竞态、错误路径、非法输入回退。

正例参考：

- `apps/desktop/renderer/src/stores/onboardingStore.test.tsx`
- `apps/desktop/renderer/src/stores/__tests__/searchStore.race.test.ts`

## Hook 测试

适用场景：

- hook 内部封装了异步状态、订阅、派生值或副作用清理。

推荐模式：

- 使用 `renderHook`。
- 对时间、订阅、IPC 回调使用受控 mock。
- 必须验证 unmount 或依赖变化时的清理行为。

## i18n 测试

要测什么：

- 关键用户流在切换语言后是否仍能完成。
- i18n key 是否正确接线，动态值是否能插值。

不要测什么：

- 不要为每个组件写“是否导入了 `t()`”的 Guard 测试。
- 不要把所有查询都绑死在某一条中文文案上。

实践建议：

- 优先按 role / label / testid 查询。
- 若必须校验文案，优先校验业务关键句，而非整页所有字符串。

## a11y 与可访问性

基础要求：

- 交互元素应能被 role 查询到。
- 关键按钮、输入框要有可访问名称。
- 错误提示与 loading 状态应对辅助技术可见。

如果一个组件很难用 `getByRole` 找到，通常不是测试写法有问题，而是组件语义本身有缺口。

## Storybook 不是测试替代品

Storybook 的作用：

- 展示状态面
- 辅助视觉验收
- 为 review 提供“看得见的行为切片”

Storybook 不能替代：

- 状态转移断言
- 错误路径验证
- 回归保护

前端变更完成前至少应满足：

- 相关测试通过
- `pnpm -C apps/desktop storybook:build` 可构建

## 前端测试 review 清单

- 是否从用户视角发起交互，而不是直接调内部方法？
- 是否覆盖空态、加载态、错误态？
- 查询方式是否尽量语义化？
- 是否避免把硬编码文案当作唯一锚点？
- 如果改了 UI 行为，是否同步有 Storybook / 视觉验证？

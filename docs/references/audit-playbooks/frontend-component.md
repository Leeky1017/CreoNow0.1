# 前端组件审计 Playbook

> 适用条件：变更层 WHERE=`frontend`（`apps/desktop/renderer/**`）
> 审计层级：Tier S 及以上

---

## 必查项（Tier S）

### 1. Design Token 合规

- [ ] 是否有 Tailwind 原始色值（`bg-red-600`、`text-gray-500`）？（禁止）
- [ ] 是否有硬编码 hex / rgba 值？（禁止，除 `SettingsAppearancePage` 主题预览等灰色地带需记录）
- [ ] 是否使用了 Tailwind 内置阴影类（`shadow-lg`、`shadow-xl`、`shadow-2xl`）？（禁止，必须走 `--shadow-*` Token）
- [ ] 新增样式是否全部引用 `tokens.css` 中定义的语义化 Token？

### 2. i18n 覆盖

- [ ] 所有用户可见文本是否使用 `t()` 调用？（含中文 **和** 英文裸字符串）
- [ ] 新增的 i18n key 是否已在 locale 文件中注册（`zh-CN.json` + `en.json`）？
- [ ] 动态文本（如错误消息、提示语）是否也走 i18n？
- [ ] `aria-label`、`placeholder`、`title` 属性中的文本是否 i18n？

### 3. 可访问性（a11y）

- [ ] 交互元素（按钮、链接、输入框）是否有 `aria-label` 或可被屏幕阅读器识别？
- [ ] 键盘导航是否可用（Tab 序列合理、Enter/Space 触发操作）？
- [ ] `aria-live` 区域是否用于状态更新通知？
- [ ] 颜色对比度是否足够（前景/背景）？

### 4. Storybook

- [ ] 新组件是否有对应 Story？
- [ ] 修改组件的 Story 是否同步更新？
- [ ] Story 是否覆盖主要状态（default / loading / error / empty / disabled）？

### 5. 文本溢出与 CJK

- [ ] CJK 长文本是否会溢出容器？（需设置 `overflow-wrap` / `word-break`）
- [ ] 中英文混排是否正常显示（无截断、无重叠）？
- [ ] 固定宽度容器中的长文本是否有省略号或滚动处理？

### 6. 暗色 / 浅色主题

- [ ] 两个主题下组件是否都可用？
- [ ] 是否有 `dark:` 前缀违规？（应通过 Token 自动适配，不应手动指定 dark 模式样式）

### 7. 状态管理

- [ ] Zustand store 是否使用 selector 模式（`useStore(s => s.field)`），而非 `useStore()` 全量订阅？
- [ ] 是否避免了在 render 函数中创建新对象导致不必要的 re-render？

### 8. 测试覆盖

- [ ] 新增组件 / 交互逻辑是否有对应测试？
- [ ] 测试是否使用正确的查询优先级：`getByRole` > `getByLabelText` > `getByTestId` >> `getByText`？
- [ ] 是否覆盖了 error / empty / loading 状态？

---

## 追加项（Tier D / 复杂组件必查）

### 9. 性能

- [ ] 是否有不必要的 re-render？（React DevTools Profiler 检查）
- [ ] 大列表是否使用虚拟化（`react-window` / `react-virtuoso`）？
- [ ] 动画是否使用 GPU 加速属性（`transform`、`opacity`）而非 `top`/`left`/`width`？

### 10. 错误边界

- [ ] 组件是否被 `ErrorBoundary` 包裹（或上层已有覆盖）？
- [ ] 异步操作的失败是否有用户可见的错误提示？

### 11. 响应式

- [ ] 组件在不同宽度下是否正常？
- [ ] 面板折叠 / 展开时是否平滑过渡？

### 12. Spec 对齐

- [ ] 组件行为是否完全符合 `openspec/specs/<module>/spec.md` 定义的 scenario？
- [ ] 是否有超出 spec 范围的行为（需 Owner 确认）？

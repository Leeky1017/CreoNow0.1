> 非 `task/*` 分支：请先填写 `Skip-Reason:`（必须保留该前缀）
> 示例：`Skip-Reason: automated quality iteration by 天野 (non-task branch)`
>
> `task/*` 分支：填写 `Skip-Reason: N/A (task branch)`。

Skip-Reason: <必填，按上方示例替换>

## 主题

- 简要说明本次改动解决的问题

## 关联 Issue

- Fixes #<issue_number>

## 用户影响

- 本次改动对用户/交付链路的影响

## 不修最坏后果

- 若不合入该 PR，最坏会发生什么

## 验证证据

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test:unit`
- [ ] `pnpm test:discovery:consistency`（若涉及测试脚本 / 测试发现 / 治理）
- [ ] `pnpm -C apps/desktop storybook:build`（若涉及前端组件 / 样式 / 交互）
- 其他补充验证：

## 回滚点

- 回滚 commit/分支：
- 回滚后需要恢复的数据或配置：

## 非自动化检查（Tier 3）

> 涉及 UI 改动时必填。仅改 `main/src/`、`scripts/`、`openspec/` 等后端/工具/文档的 PR 可标 N/A。

- [ ] **字体渲染**：验证中英文混排页面无方块字/fallback 异常，附 DevTools 截图或 `document.fonts.check()` 输出（参见 `docs/references/font-verification-checklist.md`）
- [ ] **品牌调性**：新增样式全部使用 Design Token（`--font-family-*`、`--color-*`、`--shadow-*`），未引入 Tailwind 原始色值或硬编码值
- [ ] **无障碍**：动态内容区域（Toast、Alert、状态栏）使用 `aria-live` 或 `role="alert"`，键盘可达
- [ ] **CJK 场景**：中文/日文/韩文文本无截断、无溢出，长文本段落排版正常

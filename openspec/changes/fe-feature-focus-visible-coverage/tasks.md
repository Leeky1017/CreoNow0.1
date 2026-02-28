## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：补齐 Feature 层所有可交互元素的 `focus-visible` 样式。优先通过复用 Primitives/Composites 收敛，避免逐点打补丁。不改业务逻辑。
- [ ] 1.2 审阅并确认错误路径与边界路径：无新增错误路径。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：键盘 Tab 导航时，Feature 层所有可交互元素必须展示 `focus-visible` 样式；焦点反馈在亮/暗主题下均清晰可见。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：建议先行 `fe-composites-*`（用 Composite 统一落地 focus-visible）

### 1.5 预期实现触点

- Feature 层当前仅 15 处有 `focus-visible` 样式，但约 377 处原生交互元素（`<button>`/`<a>`/`onClick`/`role="button"` 等）未使用 Primitive 且缺失焦点反馈。
- 主要策略：
  1. 将原生 `<button>`/`<a>` 替换为 `<Button>`/Primitive（自带 focus-visible）→ 最优解
  2. 无法替换的，添加统一 focus ring utility class
- `apps/desktop/renderer/src/styles/main.css`
  - 新增全局 focus ring utility：`.focus-ring { @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]; }`
- `apps/desktop/renderer/src/styles/tokens.css`
  - 确认 `--color-focus-ring` Token 存在（亮/暗两套值）
- 高优先级 Feature（交互密度最高）：
  - `features/search/SearchPanel.tsx`（17 处 SVG 按钮 → 替换为 Primitive 后自带 focus）
  - `features/editor/EditorToolbar.tsx`、`EditorBubbleMenu.tsx`
  - `features/ai/AiPanel.tsx`、`ChatHistory.tsx`
  - `features/dashboard/DashboardPage.tsx`
  - `features/character/CharacterPanel.tsx`、`CharacterDetailDialog.tsx`
  - `features/commandPalette/CommandPalette.tsx`

**为什么是这些触点**：交互密度最高的 Feature 优先，其余可在 Composite 迁移时自然收敛。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-A11Y-FV-S1` | `apps/desktop/renderer/src/features/__tests__/focus-visible-feature-guard.test.ts` | `it('feature layer has no raw <button> without focus-visible or Primitive usage')` | 扫描 `features/**/*.tsx`，断言原生 `<button` 标签要么使用 `focus-visible`/`focus:ring` class，要么已被 `<Button>` Primitive 替代 | `fs`/`glob` 读源码 | `pnpm -C apps/desktop test:run features/__tests__/focus-visible-feature-guard` |
| `WB-FE-A11Y-FV-S2` | 同上 | `it('tokens.css defines --color-focus-ring')` | 读取 tokens.css，断言包含 `--color-focus-ring` | `fs.readFileSync` | 同上 |
| `WB-FE-A11Y-FV-S3` | 同上 | `it('main.css defines .focus-ring utility class')` | 读取 main.css，断言包含 `.focus-ring` 且引用 `--color-focus-ring` | `fs.readFileSync` | 同上 |

### 可复用测试范本

- Primitive 测试范本：`apps/desktop/renderer/src/components/primitives/Button.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-A11Y-FV-S1`：扫描 `features/**/*.tsx`，找出所有原生 `<button` 标签，断言每个要么有 `focus-visible`/`focus:ring` class，要么是 `<Button>` Primitive。
  - 期望红灯原因：大量原生 `<button>` 和 `onClick` div 缺失焦点样式。
- [ ] 3.2 `WB-FE-A11Y-FV-S2`：读取 tokens.css，断言包含 `--color-focus-ring`。
  - 期望红灯原因：当前可能未定义此 Token（需验证）。
- [ ] 3.3 `WB-FE-A11Y-FV-S3`：读取 main.css，断言包含 `.focus-ring` utility。
  - 期望红灯原因：当前无此 utility class。
- 运行：`pnpm -C apps/desktop test:run features/__tests__/focus-visible-feature-guard`

## 4. Green（最小实现通过）

- [ ] 4.1 `tokens.css`：新增 `--color-focus-ring`（亮：`rgba(59, 130, 246, 0.5)`；暗：`rgba(96, 165, 250, 0.5)`）→ S2 转绿
- [ ] 4.2 `main.css`：新增 `.focus-ring` utility class：
  ```css
  .focus-ring {
    @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)];
  }
  ```
  → S3 转绿
- [ ] 4.3 高优先级 Feature 逐目录处理：
  - 策略 A（优先）：将原生 `<button>` 替换为 `<Button>` Primitive（自带 focus-visible）
  - 策略 B（兜底）：对无法替换的元素添加 `className="focus-ring"` + `tabIndex={0}`
  - 按交互密度排序：search → editor → ai → dashboard → character → commandPalette → 其余
  → S1 逐步转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 将 `focus-ring` utility 与 Primitive 的 focus 样式对齐（确保视觉一致）
- [ ] 5.2 对 `onClick` 的 `<div>`/`<span>` 评估是否应改为 `<button>`（语义化 HTML），可选但推荐

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 guard 测试失败的输出（含缺失 focus-visible 的元素计数）
- [ ] 6.2 记录 RUN_LOG：Green 阶段 guard 测试通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-composites-*` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）

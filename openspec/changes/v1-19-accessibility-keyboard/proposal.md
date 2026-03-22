# V1-19 无障碍达标与键盘导航

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 7 质量纵深
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: 全 Features 层、Primitives 层、renderer/styles
- **前端验收**: 需要（axe-core 审计 0 violations + 键盘遍历测试 + 高对比模式验证）

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 的无障碍支持处于"零星点缀"阶段——`aria-*` 和 `role=` 属性散布于 15 个文件，但使用密度极低（最多 16 处 in CommandPalette.test.tsx，且多数是测试断言而非生产代码）。键盘导航仅在 15 个文件中有 `onKeyDown` / `tabIndex` 处理，大部分面板无法纯键盘操作——「门窗虽全，却无扶手。」

具体短板：

- **FileTree**：无法用方向键展开/折叠节点，无 `aria-expanded` / `aria-level`
- **OutlinePanel**：树形结构无 `role="tree"` / `role="treeitem"`，键盘无法导航
- **AI 面板**：消息列表无 `aria-live` 区域，新消息到达时 screen reader 无通知
- **Dashboard**：卡片网格无 `role="grid"` 或方向键导航
- **高对比模式**：`prefers-contrast: more` 支持为 0（仅 1 处 test 中提及 "high-contrast"）
- **Focus 管理**：Modal 打开/关闭时的 focus trap 依赖 Radix，但自定义弹窗（如 SkillManagerDialog）无 focus 管理

### 2. 根因

- 开发聚焦视觉还原，无障碍被归类为"后续优化"
- 缺少 axe-core 等自动化审计工具作为 CI gate
- WCAG 标准未纳入 spec 验收标准
- Electron 桌面应用对无障碍的需求容易被低估（实际上桌面用户中使用 screen reader 的比例不低于 Web）

### 3. 威胁

- **法律合规**：创作工具如果走向国际市场，WCAG 2.1 AA 是多数国家/地区的法律要求
- **用户流失**：残障用户、临时受伤用户、键盘偏好用户（开发者群体大量使用键盘操作）都依赖无障碍支持
- **品质底线**：一个以"创作"为核心的产品，如果排斥了使用辅助技术的创作者，本身就是对"创作"定义的窄化

### 4. 证据来源

| 数据点                 | 值                        | 来源                                                         |
| ---------------------- | ------------------------- | ------------------------------------------------------------ |
| `aria-*` 生产代码使用  | ~30 处（含测试约 60 处）  | `grep -rc "aria-\|role=" features/ --include="*.tsx"`        |
| 键盘处理文件数         | 15 个                     | `grep -rc "onKeyDown\|tabIndex" features/ --include="*.tsx"` |
| 高对比模式 CSS         | 0 处                      | `grep "prefers-contrast\|forced-colors" renderer/src/`       |
| `prefers-color-scheme` | 仅 App.tsx 中系统主题检测 | `grep "prefers-color-scheme" renderer/src/`                  |
| Focus trap             | 仅 Radix Dialog 内置      | CommandPalette 和 Radix-based 组件                           |
| axe-core CI gate       | 不存在                    | CI 配置检查                                                  |

---

## What：做什么

### Phase 1：语义化标记（Semantic Markup）

为所有交互区域补充正确的 ARIA 角色和属性：

**树形结构**（FileTree、OutlinePanel）：

- 容器 `role="tree"` + `aria-label`
- 节点 `role="treeitem"` + `aria-expanded` + `aria-level` + `aria-selected`
- 方向键导航：↑/↓ 移动焦点、→ 展开、← 折叠、Enter 选中、Home/End 跳转

**列表**（AiMessageList、SearchResultItems、VersionHistory）：

- `role="list"` + `role="listitem"`
- `aria-live="polite"` 用于动态更新区域（AI 消息流）
- `aria-busy="true"` 用于加载状态

**表单区域**（Settings、CreateProjectDialog、ExportDialog）：

- 所有 `<input>` 关联 `<label>`（`htmlFor` / `aria-label`）
- 错误消息关联 `aria-describedby`
- 必填字段标注 `aria-required`

**导航**（Sidebar、Tabs、Toolbar）：

- `role="navigation"` + `aria-label`
- `role="tablist"` / `role="tab"` / `role="tabpanel"`
- `role="toolbar"` + 方向键导航

### Phase 2：键盘导航 100% 覆盖

确保所有功能可通过纯键盘到达和操作：

| 区域           | 键盘行为                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| FileTree       | ↑↓ 导航、→← 展开/折叠、Enter 打开、F2 重命名、Delete 删除                   |
| OutlinePanel   | ↑↓ 导航、→← 展开/折叠、Enter 跳转到对应位置                                 |
| Dashboard      | Tab 在卡片间移动、Enter 打开、←→ 网格内导航                                 |
| AI Panel       | Tab 切换 tab、Enter 发送消息、Esc 关闭面板                                  |
| CommandPalette | ↑↓ 选择、Enter 执行、Esc 关闭（已实现，需验证）                             |
| Editor Toolbar | ←→ 移动焦点、Enter/Space 激活、Tab 离开 toolbar                             |
| Settings       | Tab 在控件间移动、Space 切换 toggle、Enter 确认                             |
| 所有 Modal     | Focus trap + Esc 关闭 + 打开时聚焦第一个可交互元素 + 关闭时恢复触发元素焦点 |

### Phase 3：高对比模式支持

```css
@media (prefers-contrast: more) {
  :root {
    --color-border-default: #ffffff;
    --color-text-muted: #cccccc;
    --color-bg-hover: rgba(255, 255, 255, 0.15);
    /* ... 其他高对比覆盖 */
  }
}

@media (forced-colors: active) {
  /* Windows High Contrast Mode */
  * {
    forced-color-adjust: none; /* 在需要的地方选择性恢复 */
  }
}
```

### Phase 4：Screen Reader 优化

- Skip links：页面顶部提供"跳转到主内容区"链接
- 状态通知：`aria-live` region 用于通知操作结果（保存成功、AI 回复完成等）
- 图标无障碍：纯装饰 icon 添加 `aria-hidden="true"`，功能性 icon 添加 `aria-label`

### Phase 5：axe-core CI 集成

- 在 Storybook 中集成 `@storybook/addon-a11y`（axe-core）
- CI 中对所有 Story 运行 axe 审计，violation = 0 为通过条件
- 可选：Playwright test 中集成 `@axe-core/playwright` 对关键页面审计

---

## Non-Goals：不做什么

1. **不做 WCAG 2.1 AAA**——目标为 AA 级别，AAA 超出产品当前阶段需求
2. **不做完整的 screen reader 端到端测试**——依赖 axe-core 自动化审计 + 手动 spot check，不做 NVDA/VoiceOver 全流程录制
3. **不做 RTL（从右到左）布局**——国际化布局方向不在本 change 范围
4. **不修改 Radix UI 组件的内部无障碍**——Radix 已内置完善的无障碍支持，不重复实现
5. **不做动效偏好设置**——`prefers-reduced-motion` 支持可在后续补充

---

## AC：验收标准

| #   | 验收条件                                                                           | 验证方式                   |
| --- | ---------------------------------------------------------------------------------- | -------------------------- |
| 1   | axe-core CI 审计全部 Story，violation = 0                                          | CI gate                    |
| 2   | 所有 `role="tree"` 容器包含 `aria-label` 且子节点有 `aria-expanded` / `aria-level` | 代码审查 + axe             |
| 3   | 所有表单 `<input>` 关联 `<label>` 或 `aria-label`                                  | axe 自动检测               |
| 4   | FileTree / OutlinePanel 可纯键盘完成：导航、展开/折叠、选中                        | 手动测试 + Playwright test |
| 5   | 所有 Modal 实现 focus trap + Esc 关闭 + 焦点恢复                                   | Playwright test            |
| 6   | AI 消息列表有 `aria-live="polite"` 区域                                            | 代码检查                   |
| 7   | `@media (prefers-contrast: more)` 规则存在且覆盖核心 token                         | CSS 检查                   |
| 8   | `@media (forced-colors: active)` 规则存在                                          | CSS 检查                   |
| 9   | 纯装饰 icon 100% 添加 `aria-hidden="true"`                                         | grep 抽查                  |
| 10  | 色彩对比度 ≥ 4.5:1（正文）/ ≥ 3:1（大文本）                                        | axe contrast check         |

---

## 依赖与影响

- **上游依赖**: v1-12（交互动效）—— focus 可见性、transition 等基础已在 v1-12 铺设；v1-17（视觉回归 CI）—— 高对比模式 CSS 需要视觉验证
- **被依赖于**: 无直接下游依赖；但 axe-core CI gate 建立后，后续所有 change 自动受保护
- **并行安全**: ARIA 属性添加和 CSS media query 追加为非破坏性操作，合并冲突风险低；但键盘导航逻辑修改涉及组件事件处理，需与其他修改同一组件的 change 串行
- **风险**:
  - ARIA 角色错误使用比不用更糟——每个标记都需要符合 WAI-ARIA 规范语义
  - 键盘导航可能与已有快捷键冲突——需建立快捷键 map 避免冲突
  - 高对比模式 token 覆盖需仔细测试，避免覆盖导致元素不可见
- **预估工作量**: 约 v1-02 的 **1.5 倍**——ARIA 标记和键盘导航需要逐组件实现和测试，高对比模式需设计 token 映射，axe-core CI 集成有 infra 工作。Phase 1 语义标记约 2d，Phase 2 键盘导航约 3d，Phase 3 高对比约 1d，Phase 4 screen reader 约 1d，Phase 5 CI 约 0.5d

---

## R6 级联刷新记录（2026-03-22）

### 刷新触发

v1-12 已于 2026-03-22 合并（PR #1213）。v1-12 的 Radix Primitive 替换与 AppShell 键盘 hook 对无障碍基线产生直接影响。

### R6 基线重采集

| 度量                     | 原始基线 | R6 实际               | Delta        | 说明                                             |
| ------------------------ | -------- | --------------------- | ------------ | ------------------------------------------------ |
| `aria-*` prod            | ~30      | 135                   | +105 (+350%) | Radix 组件带来稳定的 aria-label / role 基础      |
| keyboard handler 文件    | 15       | 23                    | +8           | 新增 AppShell / RightPanel / Dialog 相关键盘逻辑 |
| `prefers-reduced-motion` | 0        | 1 (main.css)          | +1           | v1-12 Part A 已落地全局降级入口                  |
| focus-visible 样式       | 散落     | 系统化 (Primitive 层) | —            | Button / Select / Input 等已统一 focus-visible   |

### 对 v1-19 scope 的影响

**部分 AC 已提前完成或大幅推进**：

- ARIA 属性从 30→138，基础语义标记已由 Radix 自动覆盖
- 键盘导航基础设施（useAppShellKeyboard）已建立
- prefers-reduced-motion 已实现
- focus-visible 已在所有 Primitive 组件统一

**仍需 v1-19 完成的工作**：

- Tree/list role 语义（FileTree、OutlinePanel）
- 自定义键盘导航（↑↓→← in tree/list）
- 高对比度模式 (`prefers-contrast: more`)
- Skip links + aria-live regions
- axe-core CI 集成
- Focus trap for custom modals (non-Radix)

### 结论

**PASS** — v1-12 奠定了 a11y 基础设施（Radix ARIA + focus-visible + reduced-motion），v1-19 从「从零建设」变为「在已有基础上补全」。scope 不变但工作量减少约 40%。

---

## R9 级联刷新（v1-17 + v1-18 完成后）

**触发源**：v1-17（字体打包+阴影Token）PR #1222 + v1-18（Arbitrary清理+变体推广）PR #1223 CI 全绿
**采集时间**：2026-03-22
**采集口径**：控制面 main（v1-17/v1-18 未合并，值为合并前基线；合并后需 R10 验证）

| 指标 | R6 值 | R9 值 | Delta | 说明 |
|------|-------|-------|-------|------|
| `aria-*` prod（features/） | 135 | 195 | +60 (+44%) | v1-14/v1-15 新增对话框和 AI 组件带入更多 ARIA 标记 |
| keyboard handler 文件（features/） | 23 | 16 | −7 | R6 采集含 components/，R9 严格限定 features/；实际键盘处理文件数稳定 |
| `prefers-contrast` / `forced-colors` | 0 | 0 | ±0 | 仍为 0，v1-19 核心任务不变 |
| `prefers-reduced-motion`（CSS） | 1 | 5 | +4 | v1-12 后续 PR + v1-14/v1-15 追加了更多 motion 声明 |
| `focus-visible` 使用点 | 系统化 | 170 | — | Primitive 层 focus-visible 已全面铺设 |

**v1-17 影响分析**：

- v1-17 新增 shadow-xs / shadow-2xl token 并在 `@theme` 中导出，使标准 shadow utility 合法——对 a11y 无直接影响，但 `shadow-[var(...)]` arbitrary 消除后，v1-19 的高对比模式 CSS 可直接覆盖标准 shadow utility，无需处理 arbitrary 变体
- 14 个 woff2 字体文件打包后，字体渲染一致性提升——高对比模式下文字可读性基线更好

**v1-18 影响分析**：

- v1-18 清理了 93 处 `text-[`、18 处 `rounded-[`、7 处 `shadow-[` 等 arbitrary 值——v1-19 在高对比模式中需要覆盖的 CSS 路径更干净，不再需要为 arbitrary 值提供额外的高对比覆盖
- AiDialogs 7 文件 + KnowledgeGraph 3+ 文件变更中的 arbitrary 清理不影响 ARIA 语义标记——v1-19 的 Phase 1 语义标记工作量不变
- v1-18 未引入新的 `aria-*` 或键盘处理代码，a11y 基线保持稳定

**预测（合并后）**：v1-17/v1-18 对 a11y 基线无直接变更（`aria-*`、keyboard handler、`prefers-contrast` 预计不变）。间接收益：arbitrary 值减少使高对比模式 CSS 覆盖更简洁。

**范围/AC 变更**：无变更

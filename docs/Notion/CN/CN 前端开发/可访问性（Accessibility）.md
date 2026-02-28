# 可访问性（Accessibility）

> Source: Notion local DB page `44a5ffd3-b39f-4319-89dd-2d4b0a242c03`

> 📍

Radix UI 底座自带优秀的 a11y 基因，但业务层绕过 Primitives 散写原生元素，恰好把这层保护击穿了。 可访问性不是锦上添花，是 IDE 级产品的底线。

## 为什么写作 IDE 必须重视 Accessibility

> 写作者群体中，视觉疲劳、RSI（重复性劳损）、注意力障碍的比例远高于普通用户。

- 长时间高强度用眼 — 写作者日均屏幕时间 6-10 小时，低对比度 = 眼睛加速疲劳

- 键盘重度依赖 — 专业写作者厌恶鼠标中断 Flow State，键盘导航必须完整

- 系统字体缩放 — 很多写作者会把系统字体调到 125%-150%，布局必须弹性响应

- Reduced Motion 偏好 — 部分用户对动画敏感，必须尊重系统设置

---

## 现状评估

| 维度 | 现状 | 评估 |
| --- | --- | --- |
| 键盘导航 | Radix Primitives 内建 Tab/Arrow 键导航 | ✅ Primitives 层达标；❌ 业务层散写的原生元素无键盘支持 |
| Focus 管理 | ListItem 已有 focus-visible:outline-[var(--color-ring-focus)] | ⚠️ 部分 Primitives 已收敛，但未覆盖所有交互元素 |
| Focus Trap | Radix Dialog 自带 Focus Trap | ⚠️ 仅限使用 Radix Dialog 的弹窗；自建弹窗无 Trap |
| ARIA 标注 | Radix 组件自动注入 ARIA 属性 | ❌ 散写的原生 <button> / <input> 无 ARIA label |
| 颜色对比度 | Token 体系定义了语义色 | ⚠️ 未验证是否达到 WCAG AA（4.5:1 正文 / 3:1 大字） |
| Reduced Motion | 未实现 | ❌ 无 prefers-reduced-motion 媒体查询 |
| 屏幕阅读器 | 未测试 | ❌ 未知状态，需用 VoiceOver / NVDA 实测 |
| 字体缩放响应 | 大量 px 硬编码 + h-screen 锁定 | ❌ 系统字体缩放到 150% 时布局大概率崩塌 |

---

## 核心问题

### 1. 散写原生元素击穿 Radix 的 a11y 保护

Radix UI 的最大价值之一是开箱即用的 Accessibility（键盘导航、ARIA 属性、Focus 管理）。但当前业务层大量绕过 Primitives 直接写 <button> 和 <input>，等于主动放弃了这层保护。

这意味着： 组件架构页中"原生元素替换为 Primitives"的改造，同时也是 a11y 的最大单次修复。

### 2. Focus Visible 未全局收敛

ListItem 已定义 focus-visible:outline-[var(--color-ring-focus)]，但其他 Primitives（Button、Input、Select、Card 等）的 focus-visible 状态不一致。

目标： 所有可交互元素统一使用 --color-ring-focus 作为 focus 指示器，2px offset，确保在深色和浅色模式下都清晰可见。

### 3. 颜色对比度未经验证

当前 Token 体系定义了 72 个 --color-* 变量，但从未检查过：

- 正文文字与背景的对比度是否 ≥ 4.5:1（WCAG AA）

- 辅助文字（text-secondary）与背景的对比度是否 ≥ 4.5:1

- 交互元素（按钮、链接）的对比度是否 ≥ 3:1

- 暗色模式下的对比度——暗色模式最容易翻车

### 4. 零 Reduced Motion 支持

微交互页定义了完整的 Motion Choreography Sheet，但没有一行代码处理 prefers-reduced-motion。

对动画敏感的用户（前庭障碍、偏头痛等）在使用 CN 时会感到不适。

### 5. 语义化 HTML 不足

- 侧边栏应该是 <nav> 而非 <div>

- 主编辑区应该有 <main> landmark

- 面板区域应该有 <aside> 或 role="complementary"

- 状态栏应该有 role="status" 以便屏幕阅读器播报变化

---

## 改造方案

### Phase 1：搭便车（与现有改造协同，零额外成本）

以下改造已在其他页面的计划中，它们同时也是 a11y 修复，不需要额外工作：

| 已有计划 | a11y 收益 |
| --- | --- |
| 散写原生元素 → 替换为 Primitives | 自动获得 Radix 的键盘导航 + ARIA + Focus Trap |
| Primitives 统一 hover/focus/disabled 状态 | 所有交互元素获得一致的 focus-visible 指示器 |
| Typography Token 语义化 | 字号阶梯使用 rem 单位后自动支持系统字体缩放 |
| 去除 h-screen / w-screen 硬编码 | 布局弹性恢复，字体缩放不再崩塌 |

### Phase 2：Reduced Motion 支持（0.5 天）

在 tokens.css 中加入全局 Reduced Motion 覆盖：

```
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

更精细的方案（推荐）：

```
/* tokens.css */
--duration-fast:    100ms;
--duration-normal:  200ms;
--duration-slow:    300ms;

@media (prefers-reduced-motion: reduce) {
  --duration-fast:    0ms;
  --duration-normal:  0ms;
  --duration-slow:    0ms;
}
```

优势： 因为所有动画已经（或即将）引用 Token 变量，这一条媒体查询就能一次性关闭全站动画。这是 Token 系统的结构性红利。

### Phase 3：颜色对比度审计（0.5 天）

工具：

- Chrome DevTools → Rendering → Emulate vision deficiencies

- WebAIM Contrast Checker 或 Figma 插件 Stark

检查清单：

- [ ] --color-text-primary vs --color-surface-default ≥ 4.5:1

- [ ] --color-text-secondary vs --color-surface-default ≥ 4.5:1

- [ ] --color-text-tertiary vs --color-surface-default ≥ 3:1（仅限大字/图标）

- [ ] --color-accent vs --color-surface-default ≥ 3:1

- [ ] --color-ring-focus vs 所有可能的背景色 ≥ 3:1

- [ ] 暗色模式下重复以上全部检查

- [ ] 色盲模拟（红绿色盲、蓝黄色盲）下信息是否仍可区分

### Phase 4：语义化 HTML 标注（0.5 天）

在 LayoutShell 拆分时同步加入 landmark：

```
// LayoutShell.tsx
<div className="app-shell">
  <header role="banner">         {/* Topbar */}
    ...
  </header>
  <nav aria-label="主导航">       {/* LeftActivityBar */}
    ...
  </nav>
  <main id="main-content">       {/* MainEditor */}
    ...
  </main>
  <aside aria-label="辅助面板">   {/* RightPanel */}
    ...
  </aside>
  <footer role="status">         {/* StatusBar */}
    ...
  </footer>
</div>
```

### Phase 5：屏幕阅读器实测（1 天）

测试矩阵：

| 平台 | 屏幕阅读器 | 优先级 |
| --- | --- | --- |
| macOS | VoiceOver（内置） | P0 — Mac 是 CN 主要平台 |
| Windows | NVDA（免费） | P1 |
| Windows | JAWS | P3 — 商业软件，非必须 |

测试场景：

- [ ] 启动后 focus 是否自动落在编辑区

- [ ] Tab 键能否遍历所有可交互元素，顺序是否合理

- [ ] Dialog 打开后 focus 是否被 trap 住，Escape 是否能关闭

- [ ] 侧边栏折叠/展开后 focus 是否正确转移

- [ ] AI 面板的流式输出是否有 aria-live="polite" 播报

- [ ] 编辑器内的 Slash Command 是否可用键盘完整操作

---

## 与现有改造的协同关系

```
组件架构改造（原生元素 → Primitives）
        ↓ 自动获得
    键盘导航 + ARIA + Focus Trap

Design Token 改造（Typography 用 rem）
        ↓ 自动获得
    系统字体缩放支持

Motion Token 改造（duration 引用变量）
        ↓ 加一条媒体查询
    Reduced Motion 全站生效

AppShell 拆分（LayoutShell）
        ↓ 同步加入
    语义化 HTML landmarks
```

> 💡

关键洞察： 80% 的 a11y 修复可以搭便车在现有改造计划中完成，不需要额外工期。只有颜色对比度审计和屏幕阅读器实测是纯增量工作（合计 ~1.5 天）。

---

## ESLint 自动化守护

在 AI 工作流页已计划的 ESLint 规则基础上，追加 a11y 规则：

```
// .eslintrc
{
  "extends": ["plugin:jsx-a11y/recommended"],
  "rules": {
    "jsx-a11y/no-autofocus": "warn",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/anchor-is-valid": "error"
  }
}
```

eslint-plugin-jsx-a11y 可以在 CI 中自动拦截：

- <div onClick> 缺少 onKeyDown + role + tabIndex

- <img> 缺少 alt

- 表单元素缺少 <label>

- 颜色作为唯一信息传达手段

---

## 目标清单

- [ ] 所有可交互元素统一 focus-visible 指示器（搭便车 Primitives 改造）

- [ ] 散写原生元素全部替换为 Radix Primitives（搭便车组件架构改造）

- [ ] Typography Token 使用 rem 单位支持系统字体缩放

- [ ] prefers-reduced-motion 媒体查询覆盖全站

- [ ] 颜色对比度通过 WCAG AA 标准（亮色 + 暗色）

- [ ] LayoutShell 加入语义化 HTML landmarks

- [ ] macOS VoiceOver 核心场景实测通过

- [ ] eslint-plugin-jsx-a11y 加入 CI pipeline

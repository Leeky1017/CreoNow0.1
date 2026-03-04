# CreoNow 前端设计决策

> **状态**: 已锁定  
> **更新日期**: 2026-01-30  
> **来源**: 与创始人的产品讨论 + Variant 设计稿  
> **参考设计稿**: `design/Variant/designs/` 目录下的 19 个 HTML 文件

---

## 规范级别说明

- **MUST**: 必须遵守，违反即为 bug
- **SHOULD**: 强烈建议，除非有明确理由
- **MAY**: 可选，根据具体场景决定

---

## 1. 布局架构

### 1.1 整体布局

```
+---------------------------------------------------------------------+
|                        顶部标题栏 (可选，Electron)                    |
+----+----------+---------------------------------+-------------------+
|    |          |                                 |                   |
| I  |  Left    |         Main Content            |   Right Panel     |
| c  |  Sidebar |         (Editor)                |   (AI/Info)       |
| o  |          |                                 |                   |
| n  |  可拖拽   |                                 |   可拖拽           |
|    |  <->     |                                 |   <->             |
| B  |          |                                 |                   |
| a  |          +---------------------------------+                   |
| r  |          |         底部状态栏               |                   |
+----+----------+---------------------------------+-------------------+
```

### 1.2 页面类型

| 页面      | 布局                                          | 设计稿参考                       |
| --------- | --------------------------------------------- | -------------------------------- |
| 登录/注册 | 全屏居中                                      | `01-login.html`                  |
| 引导页    | 全屏居中                                      | `02-onboarding.html`             |
| Dashboard | 左侧导航 + 主内容                             | `05-dashboard-sidebar-full.html` |
| 编辑器    | 三栏布局（Icon Bar + Sidebar + Main + Panel） | `09-editor-full-ide.html`        |
| 禅模式    | 全屏纯编辑                                    | `07-editor-simple.html`          |

### 1.3 禅模式

- **触发**: MUST 使用 F11 键
- **效果**: MUST 隐藏所有面板，仅保留编辑区和最小化工具栏
- **退出**: MUST 支持再次按 F11 或 Esc

### 1.4 布局高度分配 (MUST)

**核心约束:**

- 窗口高度 = 100vh（固定视口高度）
- 左中右三栏 MUST 在固定高度内分配
- 每个面板的高度 = 窗口高度 - 状态栏高度（28px）

**Flex 布局结构:**

```
┌─────────────────────────────────────────┐ ← height: 100vh
│            flex-direction: column       │
├─────────────────────────────────────────┤
│ .main-layout (flex: 1, min-height: 0)   │ ← 关键：min-height: 0
│ ┌────┬──────────────────┬──────────────┐│
│ │Left│      Main        │   Right      ││ ← 各自 overflow-y: auto
│ │ 48+│                  │              ││
│ │240 │                  │     320      ││
│ └────┴──────────────────┴──────────────┘│
├─────────────────────────────────────────┤
│ .status-bar (height: 28px, flex-shrink: 0)
└─────────────────────────────────────────┘
```

**为什么需要 `min-height: 0`:**

- Flex 子元素默认 `min-height: auto`，会阻止收缩
- 不设置会导致内容超出时，容器被撑开而非内部滚动
- 这是"面板随内容无限延伸"问题的根本原因

---

## 2. 尺寸与布局规范

### 2.1 固定尺寸 (MUST)

| 元素           | 尺寸    | 说明                  |
| -------------- | ------- | --------------------- |
| Icon Bar       | 48px 宽 | 固定不可调整          |
| 底部状态栏     | 28px 高 | 固定不可调整          |
| 最小窗口宽度   | 1024px  | Electron 窗口最小宽度 |
| 最小窗口高度   | 640px   | Electron 窗口最小高度 |
| 主内容最小宽度 | 400px   | 确保编辑区可用        |

### 2.2 可调整尺寸

| 元素         | 默认  | 最小  | 最大  | 拖拽      |
| ------------ | ----- | ----- | ----- | --------- |
| 左侧 Sidebar | 240px | 180px | 400px | MUST 支持 |
| 右侧面板     | 320px | 280px | 480px | MUST 支持 |

### 2.3 网格对齐规则 (MUST)

- 所有间距 MUST 基于 **4px 网格**
- 组件尺寸 SHOULD 基于 **8px 网格**（4px 网格的倍数）
- 禁止使用非 4px 倍数的间距值
- 例外: 滚动条尺寸 MAY 使用 6px 作为可用性例外（见 §7.4）

### 2.4 拖拽调整规范

```
拖拽手柄:
- 可点击区域: 8px 宽
- 可见分割线: 1px 宽，使用 --color-separator
- 悬停时: MUST 变为 2px 宽高亮线 + cursor: col-resize
- 拖拽中: MUST 显示实时预览线

行为:
- 双击手柄: MUST 恢复默认宽度
- 拖拽时: MUST 实时更新布局
- 释放后: MUST 持久化用户偏好（见 §13 Preference Store）
```

### 2.5 面板折叠

| 面板         | 折叠方式               | 快捷键       |
| ------------ | ---------------------- | ------------ |
| 左侧 Sidebar | 点击 Icon Bar 当前图标 | `Cmd/Ctrl+\` |
| 右侧面板     | 点击折叠按钮           | Cmd/Ctrl+L   |

折叠后:

- 左侧: 仅保留 Icon Bar (48px)
- 右侧: 完全隐藏 (0px)

### 2.6 滚动行为 (MUST)

**整体布局高度约束:**

- 窗口 MUST 为固定视口高度 `height: 100vh`
- 左侧 Sidebar、主内容区、右侧面板 MUST 各自独立滚动
- 每个可滚动区域 MUST 设置 `overflow-y: auto`
- 状态栏 MUST 始终固定在底部，不随内容滚动

**实现要点:**

```css
/* 整体布局 */
html,
body,
#root {
  height: 100vh;
  overflow: hidden;
}

/* 主容器 */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 内容区 */
.main-layout {
  display: flex;
  flex: 1;
  min-height: 0; /* 关键：允许 flex 子元素收缩 */
}

/* 各面板 */
.sidebar,
.main-content,
.right-panel {
  height: 100%;
  overflow-y: auto;
}

/* 状态栏 */
.status-bar {
  height: 28px;
  flex-shrink: 0;
}
```

**禁止事项:**

- MUST NOT 让面板随内容无限延伸
- MUST NOT 让整个页面滚动（除非是全屏页面如 Login/Onboarding）
- MUST NOT 忽略 `min-height: 0`（Flex 子元素溢出的常见原因）

---

## 3. Design Tokens

### 3.1 实现落点

```
文件位置: apps/desktop/renderer/src/styles/tokens.css
Tailwind 映射: Tailwind CSS 4 CSS-first 配置——通过 @theme 块在 CSS 中直接引用 CSS Variables（不使用 tailwind.config.ts）
使用方式: MUST 使用 CSS Variable，禁止硬编码颜色值
主题切换: MUST 在 <html>（document.documentElement）设置 data-theme="dark" | "light"
```

### 3.2 颜色系统 - 背景层级

**深色主题:**

```css
:root[data-theme="dark"] {
  /* 背景层级（按 elevation 递增：base → surface → raised） */
  --color-bg-base: #080808; /* 最底层：窗口背景 */
  --color-bg-surface: #0f0f0f; /* 面板/卡片/输入框背景 */
  --color-bg-raised: #141414; /* 浮起元素背景（popover/dropdown） */
  --color-bg-disabled: rgba(0, 0, 0, 0.4); /* 禁用状态覆盖层 */

  /* 交互状态背景 */
  --color-bg-hover: #1a1a1a; /* 悬停状态 */
  --color-bg-active: #1f1f1f; /* 激活/按下状态 */
  --color-bg-selected: #222222; /* 选中项 */
}
```

**浅色主题:**

```css
:root[data-theme="light"] {
  /* 背景层级（按 elevation 递增，靠阴影区分而非颜色深浅） */
  --color-bg-base: #ffffff; /* 最底层：窗口背景 */
  --color-bg-surface: #fafafa; /* 面板层：面板/卡片/输入框背景 */
  --color-bg-raised: #ffffff; /* 浮起层：popover/dropdown，用阴影区分 */
  --color-bg-disabled: rgba(255, 255, 255, 0.5); /* 禁用状态覆盖层 */

  /* 交互状态背景 */
  --color-bg-hover: #f5f5f5;
  --color-bg-active: #efefef;
  --color-bg-selected: #e8e8e8;
}
```

### 3.3 颜色系统 - 前景（文字/图标）

**深色主题:**

```css
:root[data-theme="dark"] {
  --color-fg-default: #ffffff; /* 主要文字 */
  --color-fg-muted: #888888; /* 次要文字 */
  --color-fg-subtle: #666666; /* 辅助文字 */
  --color-fg-placeholder: #444444; /* 占位符 */
  --color-fg-disabled: #333333; /* 禁用状态 */
  --color-fg-inverse: #080808; /* 反色（用于 Primary 按钮文字） */
  --color-fg-on-accent: #ffffff; /* 强调色上的文字 */
}
```

**浅色主题:**

```css
:root[data-theme="light"] {
  --color-fg-default: #1a1a1a;
  --color-fg-muted: #666666;
  --color-fg-subtle: #888888;
  --color-fg-placeholder: #999999;
  --color-fg-disabled: #cccccc;
  --color-fg-inverse: #ffffff;
  --color-fg-on-accent: #ffffff;
}
```

### 3.4 颜色系统 - 边框与分割线

**深色主题:**

```css
:root[data-theme="dark"] {
  --color-border-default: #222222; /* 默认边框 */
  --color-border-hover: #333333; /* 悬停边框 */
  --color-border-focus: #444444; /* 聚焦边框（非 focus ring） */
  --color-separator: rgba(
    255,
    255,
    255,
    0.06
  ); /* 1px 细分割线（hairline，低 alpha 防锐利） */
  --color-separator-bold: #222222; /* 粗分割线（组件间分隔） */
  --color-scrim: rgba(0, 0, 0, 0.6); /* 遮罩层（模态框/抽屉背后） */
  --color-shadow: rgba(
    0,
    0,
    0,
    0.5
  ); /* 阴影基色（用于 box-shadow 的颜色部分） */
}
```

**浅色主题:**

```css
:root[data-theme="light"] {
  --color-border-default: #e0e0e0;
  --color-border-hover: #d0d0d0;
  --color-border-focus: #c0c0c0;
  --color-separator: rgba(0, 0, 0, 0.06); /* 1px 细分割线 */
  --color-separator-bold: #e0e0e0; /* 粗分割线 */
  --color-scrim: rgba(0, 0, 0, 0.3); /* 遮罩层 */
  --color-shadow: rgba(0, 0, 0, 0.1); /* 阴影基色 */
}
```

### 3.5 颜色系统 - Focus Ring (MUST 统一使用)

**深色主题:**

```css
:root[data-theme="dark"] {
  --color-ring-focus: rgba(255, 255, 255, 0.4);
}
```

**浅色主题:**

```css
:root[data-theme="light"] {
  --color-ring-focus: rgba(0, 0, 0, 0.15);
}
```

**共用变量:**

```css
:root {
  --ring-focus-width: 2px;
  --ring-focus-offset: 2px;
}
```

**Focus 规则 (MUST):**

- 使用 `:focus-visible` 而非 `:focus`（浏览器自动区分键盘/鼠标）
- 键盘导航时 MUST 显示 focus ring
- 鼠标点击 MUST NOT 显示 focus ring
- **唯一实现方式**: `outline`（避免与 elevation 阴影的 `box-shadow` 叠加造成实现分裂）

```css
/* 标准 focus ring 实现 */
:focus-visible {
  outline: var(--ring-focus-width) solid var(--color-ring-focus);
  outline-offset: var(--ring-focus-offset);
}

/* 移除浏览器默认 focus 样式 */
:focus:not(:focus-visible) {
  outline: none;
}
```

**为什么用 outline 而非 box-shadow:**

- `outline` 不占用布局空间，不影响元素尺寸
- `outline-offset` 可精确控制与元素边缘的距离
- 避免与 `--shadow-*`（elevation）争用 `box-shadow`（否则需要组合多层 shadow，容易导致实现分裂）
- 注意：若祖先容器开启 overflow 裁切，ring 仍可能被裁切；此时 SHOULD 将 focus ring 绘制在外层 wrapper 上或避免在可聚焦区域使用 overflow 裁切

### 3.6 颜色系统 - 强调色与功能色

**强调色（纯白系，极简主义）:**

深色主题下使用纯白作为强调色，让内容成为焦点：

```css
:root[data-theme="dark"] {
  /* 主强调色（纯白系） */
  --color-accent: #ffffff;
  --color-accent-hover: rgba(255, 255, 255, 0.9);
  --color-accent-muted: rgba(255, 255, 255, 0.6);
  --color-accent-subtle: rgba(255, 255, 255, 0.1);
}

:root[data-theme="light"] {
  /* 浅色主题使用深色强调 */
  --color-accent: #1a1a1a;
  --color-accent-hover: rgba(26, 26, 26, 0.9);
  --color-accent-muted: rgba(26, 26, 26, 0.6);
  --color-accent-subtle: rgba(26, 26, 26, 0.1);
}
```

**功能色（两个主题共用，MAY 微调亮度）:**

```css
--color-error: #ef4444;
--color-error-subtle: rgba(239, 68, 68, 0.1);
--color-success: #22c55e;
--color-success-subtle: rgba(34, 197, 94, 0.1);
--color-warning: #f59e0b;
--color-warning-subtle: rgba(245, 158, 11, 0.1);
--color-info: #3b82f6;
--color-info-subtle: rgba(59, 130, 246, 0.1);
```

**知识图谱节点色（功能需求，非主强调色）:**

```css
--color-node-character: #3b82f6; /* 角色 - 蓝色 */
--color-node-location: #22c55e; /* 地点 - 绿色 */
--color-node-event: #f97316; /* 事件 - 橙色 */
--color-node-item: #06b6d4; /* 物品 - 青色 */
--color-node-other: #8b5cf6; /* 其他 - 紫色 */
```

### 3.7 阴影系统

**定义:**

```css
/* 阴影几何保持一致；颜色来自 --color-shadow（主题变量，见 §3.4） */
:root {
  --shadow-sm: 0 1px 2px var(--color-shadow);
  --shadow-md: 0 4px 8px var(--color-shadow);
  --shadow-lg: 0 8px 16px var(--color-shadow);
  --shadow-xl: 0 16px 32px var(--color-shadow);
}
```

**注意**: 阴影强度通过主题内的 `--color-shadow` alpha 值控制（深色 0.5，浅色 0.1），阴影尺寸保持一致。

**阴影使用规则 (MUST 遵守优先级):**

| 优先级 | 组件             | 默认状态      | hover 状态        | 条件                              |
| ------ | ---------------- | ------------- | ----------------- | --------------------------------- |
| P0     | 面板/侧边栏      | 无阴影        | 无阴影            | 始终使用 `--color-separator` 分割 |
| P0     | 卡片             | 无阴影        | MAY `--shadow-sm` | 仅当卡片可点击且需要强调交互时    |
| P1     | Popover/Dropdown | `--shadow-md` | -                 | 浮起即用阴影                      |
| P1     | 模态框           | `--shadow-xl` | -                 | 浮起即用阴影                      |
| P1     | Toast            | `--shadow-lg` | -                 | 浮起即用阴影                      |
| P1     | Tooltip          | `--shadow-sm` | -                 | 浮起即用阴影                      |

### 3.8 间距系统

```css
--space-0: 0px;
--space-1: 4px; /* 最小间距 */
--space-2: 8px; /* 紧凑间距 */
--space-3: 12px; /* 常用间距 */
--space-4: 16px; /* 标准间距 */
--space-5: 20px;
--space-6: 24px; /* 区块间距 */
--space-8: 32px; /* 大间距 */
--space-10: 40px;
--space-12: 48px; /* 模块间距 */
--space-16: 64px;
--space-20: 80px; /* 页面间距 */
```

### 3.9 圆角系统

```css
--radius-none: 0px;
--radius-sm: 4px; /* 输入框、小按钮、列表项 */
--radius-md: 8px; /* 一般按钮、下拉菜单 */
--radius-lg: 12px; /* 对话框、弹窗 */
--radius-xl: 16px; /* 卡片 */
--radius-2xl: 24px; /* 大卡片、面板 */
--radius-full: 9999px; /* 胶囊按钮、头像、标签 */
```

### 3.10 动效系统

```css
/* 缓动曲线 */
--ease-default: cubic-bezier(0.2, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* 时长 */
--duration-instant: 50ms; /* 即时反馈 */
--duration-fast: 100ms; /* 微交互（hover 颜色变化） */
--duration-normal: 200ms; /* 标准过渡 */
--duration-slow: 300ms; /* 面板展开/折叠 */
--duration-slower: 500ms; /* 页面切换 */
```

---

## 4. 字体系统与 Typography 映射

### 4.1 字体族

```css
--font-family-ui:
  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-family-body: "Lora", "Crimson Pro", Georgia, serif;
--font-family-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
```

### 4.2 Typography 映射表 (MUST 遵守)

| 用途       | 字体族 | 字号 | 字重 | 行高 | 字间距  |
| ---------- | ------ | ---- | ---- | ---- | ------- |
| 页面标题   | ui     | 24px | 600  | 1.2  | -0.02em |
| 卡片标题   | ui     | 16px | 600  | 1.3  | -0.01em |
| 小标题     | ui     | 14px | 500  | 1.4  | 0       |
| UI 正文    | ui     | 13px | 400  | 1.5  | 0       |
| 编辑器正文 | body   | 16px | 400  | 1.8  | 0       |
| 辅助信息   | ui     | 12px | 400  | 1.4  | 0       |
| 大写标签   | ui     | 10px | 500  | 1.2  | 0.1em   |
| 侧栏树节点 | ui     | 13px | 400  | 1.3  | 0       |
| 状态栏     | ui     | 11px | 400  | 1.2  | 0       |
| 代码/等宽  | mono   | 13px | 400  | 1.5  | 0       |

---

## 5. 层级与 z-index 规范

### 5.1 z-index Scale (MUST)

```css
--z-base: 0; /* 默认层 */
--z-sticky: 100; /* 粘性元素（工具栏） */
--z-dropdown: 200; /* 下拉菜单 */
--z-popover: 300; /* 弹出层 */
--z-modal: 400; /* 模态框 */
--z-toast: 500; /* Toast 通知 */
--z-tooltip: 600; /* Tooltip */
--z-max: 9999; /* 紧急覆盖（调试用） */
```

### 5.2 Elevation 规则

**分层原则 (MUST):**

- **静态层 (z-base)**: 使用边框分割，MUST NOT 使用阴影
- **浮起层 (z-dropdown 及以上)**: MUST 使用阴影，MAY 使用边框

| 组件类型              | 分层方式    | z-index  | 阴影               |
| --------------------- | ----------- | -------- | ------------------ |
| 面板/侧边栏           | 边框分割    | base     | MUST NOT           |
| 卡片（默认）          | 边框分割    | base     | MUST NOT           |
| 卡片（hover，可点击） | 边框分割    | base     | MAY `--shadow-sm`  |
| 下拉菜单              | 阴影        | dropdown | MUST `--shadow-md` |
| Popover               | 阴影        | popover  | MUST `--shadow-md` |
| 模态框                | 阴影 + 遮罩 | modal    | MUST `--shadow-xl` |
| Toast                 | 阴影        | toast    | MUST `--shadow-lg` |
| Tooltip               | 阴影        | tooltip  | MUST `--shadow-sm` |

**卡片阴影条件形式化:**

```
卡片.阴影 =
  IF 卡片.可点击 AND 卡片.状态 == hover THEN MAY --shadow-sm
  ELSE MUST NOT 使用阴影
```

---

## 6. 组件规范

### 6.1 按钮

**变体 (MUST):**

| 类型      | 背景               | 文字               | 边框                       | 用途     |
| --------- | ------------------ | ------------------ | -------------------------- | -------- |
| Primary   | --color-fg-default | --color-fg-inverse | 无                         | 主要操作 |
| Secondary | transparent        | --color-fg-default | 1px --color-border-default | 次要操作 |
| Ghost     | transparent        | --color-fg-muted   | 无                         | 轻量操作 |
| Danger    | transparent        | --color-error      | 1px --color-error          | 危险操作 |

**尺寸 (MUST):**

| 尺寸 | 高度 | 水平内边距 | 字号 | 圆角        |
| ---- | ---- | ---------- | ---- | ----------- |
| sm   | 28px | 12px       | 12px | --radius-sm |
| md   | 36px | 16px       | 13px | --radius-md |
| lg   | 44px | 20px       | 14px | --radius-md |

**状态矩阵 (MUST 全部实现):**

| 状态          | 视觉表现                                      | 行为                          | 触发方式      |
| ------------- | --------------------------------------------- | ----------------------------- | ------------- |
| default       | 正常颜色                                      | 可点击                        | 初始状态      |
| hover         | opacity: 0.9 (Primary) / 边框变化 (Secondary) | cursor: pointer               | 鼠标悬停      |
| active        | 背景加深                                      | 按下反馈                      | 鼠标按下      |
| focus-visible | 显示 focus ring                               | -                             | Tab 键聚焦    |
| disabled      | opacity: 0.5                                  | cursor: not-allowed, 不可点击 | disabled=true |
| loading       | 显示 Spinner，隐藏文字                        | 不可点击                      | loading=true  |

**注意:**

- Hover 状态 MUST NOT 使用 translateY（避免布局漂移）
- Loading 状态 MUST 同时禁用点击（disabled 行为）

**特例 - 允许 translateY 的场景 (MAY):**

- 仅限 Hero 区域的大按钮 (lg + Primary)
- 仅限单独放置、周围有足够空间的按钮
- 列表中的按钮 MUST NOT 使用位移效果

### 6.2 输入框

**基础样式 (MUST):**

```css
height: 40px;
padding: 0 12px;
background: var(--color-bg-surface);
border: 1px solid var(--color-border-default);
border-radius: var(--radius-sm);
font-size: 13px;
color: var(--color-fg-default);
```

**状态:**

- Hover: border-color: var(--color-border-hover)
- Focus-visible: border-color: var(--color-border-focus) + focus ring
- Error: border-color: var(--color-error) + 底部错误文字
- Disabled: opacity: 0.5, cursor: not-allowed

### 6.3 卡片

```css
background: var(--color-bg-surface);
border: 1px solid var(--color-border-default);
border-radius: var(--radius-xl); /* 16px */
padding: var(--space-6); /* 24px */
```

**悬停效果 (MAY):**

- border-color: var(--color-border-hover)
- 阴影: 默认不用，MAY 添加 --shadow-sm

### 6.4 列表项

```css
height: 32px; /* 紧凑列表 */
/* 或 */
height: 40px; /* 标准列表 */
padding: 0 12px;
border-radius: var(--radius-sm);
```

**状态:**

- Hover: background: var(--color-bg-hover)
- Selected: background: var(--color-bg-selected)
- Active (Icon Bar): 左侧 2px 白色指示条

---

## 7. 交互规范

### 7.1 悬停状态 (MUST)

所有可交互元素 MUST 有悬停反馈:

- 背景色变化 或
- 边框色变化 或
- 文字色变化
- 过渡时长: var(--duration-fast)

### 7.2 Focus 规范 (MUST)

参见 §3.5 Focus Ring 定义。实现代码:

```css
/* 统一使用 :focus-visible + outline */
:focus-visible {
  outline: var(--ring-focus-width) solid var(--color-ring-focus);
  outline-offset: var(--ring-focus-offset);
}

/* 移除鼠标点击时的 focus 样式 */
:focus:not(:focus-visible) {
  outline: none;
}

/* 输入框特殊处理：边框变化 + focus ring */
input:focus-visible,
textarea:focus-visible {
  border-color: var(--color-border-focus);
  outline: var(--ring-focus-width) solid var(--color-ring-focus);
  outline-offset: var(--ring-focus-offset);
}
```

### 7.3 拖拽交互

**文件树拖拽:**

- 拖拽开始: 源项目 opacity: 0.5
- 拖拽中: 目标位置显示 2px 指示线（使用 --color-accent）
- 放置区域: 目标文件夹 background: var(--color-bg-hover)

**面板宽度拖拽:**

- 手柄悬停: cursor: col-resize, 分割线高亮
- 拖拽中: 实时预览，MAY 显示当前宽度值

### 7.4 滚动条 (MUST 跨浏览器)

```css
/* Webkit (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

/* 兜底：无自定义时允许系统默认 */
@supports not (scrollbar-width: thin) {
  /* 使用系统默认滚动条 */
}
```

### 7.5 键盘导航 (MUST)

| 按键             | 行为                 |
| ---------------- | -------------------- |
| Tab              | 移动焦点到下一个元素 |
| Shift+Tab        | 移动焦点到上一个元素 |
| Enter            | 激活当前元素         |
| Space            | 激活按钮/切换复选框  |
| Escape           | 关闭弹窗/取消操作    |
| Arrow Up/Down    | 列表中移动选择       |
| Arrow Left/Right | 树形结构展开/折叠    |

---

## 8. 像素对齐规则

### 8.1 图标对齐 (MUST)

- Icon 尺寸: 24px (在 24x24 视口内)
- 点击区域: 40px x 40px
- 居中方式: MUST 使用 flexbox `align-items: center; justify-content: center;`
- Optical alignment: 某些图标（如播放按钮）MAY 需要 1-2px 偏移补偿视觉重心

### 8.2 1px 分割线 (MUST)

- 使用 `--color-separator`（低 alpha 值）而非固定色值
- 在 2x/3x DPR 屏幕上 MUST 保持 1px（物理像素）
- 实现: `border-width: 1px;` 或 `height: 1px;`
- MUST NOT 使用 0.5px（兼容性问题）

### 8.3 文字基线对齐

- 多个文字元素并排时 MUST 使用 `align-items: baseline`
- 图标与文字并排时 SHOULD 使用 `align-items: center`，MAY 微调图标 `margin-top: -1px`

---

## 9. 面板配置

### 9.1 左侧 Icon Bar (48px)

按顺序排列:

1. [files] 文件树 (默认)
2. [outline] 大纲
3. [character] 角色
4. [media] 媒体
5. [graph] 知识图谱
6. [settings] 设置 (底部固定)

**图标规格:**

- 图标尺寸: 24px
- 按钮区域: 40px x 40px
- 激活指示: 左侧 2px 白色条

### 9.2 左侧 Sidebar

- **默认宽度**: 240px
- **可拖拽范围**: 180px - 400px
- **记忆用户偏好**: 见 §13 Preference Store
- **默认展开的面板**: 记住上次使用

### 9.3 右侧面板

- **默认宽度**: 320px（AI 和信息共用同一宽度）
- **可拖拽范围**: 280px - 480px
- **记忆用户偏好**: 见 §13 Preference Store
- **切换方式**: 顶部标签 [AI] [信息]
- **默认显示**: AI 面板

---

## 10. 快捷键规范

### 10.1 全局快捷键 (MUST)

| 功能     | Mac         | Windows      | 说明              |
| -------- | ----------- | ------------ | ----------------- |
| 命令面板 | Cmd+P       | Ctrl+P       | 搜索文件和命令    |
| AI 面板  | Cmd+L       | Ctrl+L       | 打开/关闭 AI 面板 |
| 左侧边栏 | `Cmd+\`     | `Ctrl+\`     | 折叠/展开左侧边栏 |
| 禅模式   | F11         | F11          | 全屏专注写作      |
| 设置     | Cmd+,       | Ctrl+,       | 打开设置          |
| 新建文件 | Cmd+N       | Ctrl+N       | 新建文件          |
| 新建项目 | Cmd+Shift+N | Ctrl+Shift+N | 新建项目          |
| 保存     | Cmd+S       | Ctrl+S       | 手动保存          |

说明:

- `Cmd/Ctrl+B` MUST 保留给编辑器加粗；侧边栏折叠使用 `Cmd/Ctrl+\` 避免快捷键冲突

### 10.2 编辑器快捷键 (MUST)

| 功能     | Mac         | Windows      |
| -------- | ----------- | ------------ |
| 当前搜索 | Cmd+F       | Ctrl+F       |
| 全局搜索 | Cmd+Shift+F | Ctrl+Shift+F |
| 加粗     | Cmd+B       | Ctrl+B       |
| 斜体     | Cmd+I       | Ctrl+I       |
| 撤销     | Cmd+Z       | Ctrl+Z       |
| 重做     | Cmd+Shift+Z | Ctrl+Y       |
| 标题 1   | Cmd+1       | Ctrl+1       |
| 标题 2   | Cmd+2       | Ctrl+2       |
| 标题 3   | Cmd+3       | Ctrl+3       |

---

## 11. 组件契约（Props/State/Events）

### 11.1 Sidebar

```typescript
/** 侧边栏面板 ID - 固定集合，MUST NOT 使用其他值 */
type SidebarPanelId =
  | "files"
  | "outline"
  | "characters"
  | "media"
  | "graph"
  | "settings";

interface SidebarProps {
  width: number; // 当前宽度
  minWidth?: number; // 最小宽度，默认 180
  maxWidth?: number; // 最大宽度，默认 400
  collapsed?: boolean; // 是否折叠
  activePanel: SidebarPanelId;
  onWidthChange: (width: number) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onPanelChange: (panel: SidebarPanelId) => void;
}
```

### 11.2 Panel (右侧面板)

```typescript
interface PanelProps {
  width: number;
  minWidth?: number; // 默认 280
  maxWidth?: number; // 默认 480
  collapsed?: boolean;
  activeTab: "ai" | "info";
  onWidthChange: (width: number) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onTabChange: (tab: "ai" | "info") => void;
}
```

### 11.3 FileTree

```typescript
interface FileTreeProps {
  items: FileTreeItem[];
  selectedId?: string;
  expandedIds: string[];
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onCollapse: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, targetId: string) => void;
  onContextMenu: (id: string, event: React.MouseEvent) => void;
}

interface FileTreeItem {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileTreeItem[];
}
```

### 11.4 CommandPalette

```typescript
interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  recentItems?: CommandItem[];
  onSelect: (item: CommandItem) => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  category?: "file" | "command" | "recent";
}
```

### 11.5 Dialog

```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  // 关闭行为
  closeOnEscape?: boolean; // 默认 true
  closeOnOverlayClick?: boolean; // 默认 true
}
```

### 11.6 Toast

```typescript
interface ToastProps {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  duration?: number; // 默认 5000ms
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 使用方式
toast.info("已保存");
toast.error("保存失败", { description: "网络连接超时" });
```

---

## 12. 状态显示

### 12.1 空状态 (MUST)

| 场景       | 显示内容                        | 操作           |
| ---------- | ------------------------------- | -------------- |
| 空项目     | 插图 + "开始创建你的第一个文件" | 新建文件按钮   |
| 空文件树   | 插图 + "暂无文件"               | 新建文件按钮   |
| 空搜索结果 | 插图 + "未找到匹配结果"         | 修改关键词建议 |
| 空角色列表 | 插图 + "暂无角色"               | 创建角色按钮   |

### 12.2 加载状态 (MUST)

- **顶部进度条**: 2px 高，窗口最顶部，动画滚动
- **内容骨架屏**: 使用 --color-bg-hover 占位块模拟内容形状
- **按钮 Loading**: 显示 spinner，禁用点击

### 12.3 错误状态 (MUST)

- **内联错误**: 输入框下方红色文字，使用 --color-error
- **Toast 通知**: 右上角短暂显示，5s 后消失
- **错误对话框**: 严重错误，需用户确认

---

## 13. Preference Store

### 13.1 存储抽象 (MUST)

```typescript
interface PreferenceStore {
  get<T>(key: PreferenceKey): T | null;
  set<T>(key: PreferenceKey, value: T): void;
  remove(key: PreferenceKey): void;
  clear(): void;
}

// 接口 MUST 保持同步（UI 交互/拖拽持久化需要同步读写）
// 实现可选: electron-store（Electron）/ localStorage（Web）
// IndexedDB MAY 通过“内存镜像 + 异步 flush”方式接入，但 MUST NOT 直接把接口改成 async
```

### 13.2 命名域与 Key 规范 (MUST)

**应用命名域:**

```typescript
/** 应用唯一标识符 - 用于存储 key 前缀、IPC channel 前缀等 */
const APP_ID = "creonow" as const;

/**
 * 注意: 本项目代号为 CreoNow，与旧项目 WriteNow 完全独立。
 * 若未来需要多应用共存或数据迁移，MUST 在迁移脚本中显式处理。
 */
```

**Key 格式:**

```typescript
type PreferenceCategory = "layout" | "editor" | "theme" | "recent";

// 格式: ${APP_ID}.${category}.${name}
// 示例: creonow.layout.sidebarWidth

/** 所有合法的 preference key - 类型约束，防止非法 key 进入 */
type PreferenceKey =
  | `${typeof APP_ID}.layout.${"sidebarWidth" | "panelWidth" | "sidebarCollapsed" | "panelCollapsed" | "activePanel" | "activePanelTab"}`
  | `${typeof APP_ID}.editor.${"fontSize" | "fontFamily" | "lineHeight"}`
  | `${typeof APP_ID}.theme.${"mode"}`
  | `${typeof APP_ID}.version`;
```

**版本 Key:**

```
creonow.version = "1"
```

### 13.3 版本迁移 (MUST)

```typescript
const APP_ID = "creonow" as const;
const CURRENT_VERSION = "1";

function migratePreferences(): void {
  const versionKey = `${APP_ID}.version` as const;
  const storedVersion = store.get(versionKey);

  if (storedVersion !== CURRENT_VERSION) {
    // 执行迁移逻辑
    // ...
    store.set(versionKey, CURRENT_VERSION);
  }
}
```

---

## 14. 验收清单

### 14.1 像素验收 (MUST 全部通过)

- [ ] 所有间距为 4px 的倍数
- [ ] Icon Bar 宽度为 48px
- [ ] 图标尺寸为 24px，点击区域为 40x40px
- [ ] 分割线使用 --color-separator，1px 宽
- [ ] 卡片圆角为 --radius-xl (16px)
- [ ] 按钮圆角按尺寸使用正确的 radius
- [ ] 输入框高度为 40px

### 14.2 交互验收 (MUST 全部通过)

- [ ] 所有可点击元素有 hover 状态
- [ ] 键盘导航时显示 focus-visible ring
- [ ] 鼠标点击不显示 focus ring
- [ ] 面板宽度可拖拽调整
- [ ] 双击拖拽手柄恢复默认宽度
- [ ] 面板宽度变化后持久化
- [ ] 所有快捷键正常工作

### 14.3 主题验收 (MUST 全部通过)

- [ ] 深色主题下所有颜色使用 CSS Variable
- [ ] 浅色主题下所有颜色使用 CSS Variable
- [ ] 主题切换无闪烁
- [ ] 跟随系统主题自动切换

---

## 15. 设计稿清单

### 已有设计稿（深色主题，19个）

| 编号 | 文件名                          | 用途             | 状态 |
| ---- | ------------------------------- | ---------------- | ---- |
| 01   | 01-login.html                   | 登录页           | 采用 |
| 02   | 02-onboarding.html              | 引导页           | 采用 |
| 03   | 03-dashboard-bento-cards.html   | Dashboard 大卡片 | 备选 |
| 04   | 04-dashboard-list-progress.html | Dashboard 列表   | 备选 |
| 05   | 05-dashboard-sidebar-full.html  | Dashboard 侧边栏 | 采用 |
| 06   | 06-dashboard-sidebar-dark.html  | Dashboard 深色   | 备选 |
| 07   | 07-editor-simple.html           | 禅模式参考       | 参考 |
| 08   | 08-editor-workspace.html        | 编辑器工作区     | 备选 |
| 09   | 09-editor-full-ide.html         | 编辑器完整版     | 采用 |
| 10   | 10-settings.html                | 设置页           | 采用 |
| 11   | 11-analytics.html               | 数据分析         | 采用 |
| 12   | 12-sidebar-filetree.html        | 文件树           | 采用 |
| 13   | 13-sidebar-outline.html         | 大纲视图         | 采用 |
| 14   | 14-ai-panel.html                | AI 面板          | 采用 |
| 15   | 15-info-panel.html              | 信息面板         | 采用 |
| 16   | 16-create-project-dialog.html   | 创建项目         | 采用 |
| 17   | 17-command-palette.html         | 命令面板         | 采用 |
| 18   | 18-character-manager.html       | 角色管理         | 采用 |
| 19   | 19-knowledge-graph.html         | 知识图谱         | 采用 |

### 待补充设计稿

**浅色主题 (P1+，V1 明确不做):** 所有现有设计稿的浅色版本（见 `LIGHT_THEME_PROMPTS.md`）

> 注意：根据 `creonow-v1-workbench/spec.md`，V1 只交付深色主题，浅色主题不作为 P0 阻塞项。

**缺失状态 (P1):**

- 禅模式界面
- 空状态（空项目、空文件树、空搜索）
- 加载状态（顶部进度条、骨架屏）
- 错误对话框
- 模板选择对话框
- 版本对比视图
- 导出对话框

**缺失交互 (P2):**

- 选中文字浮动工具栏
- 选中文字 AI 按钮
- 拖拽调整宽度指示器
- 右键菜单

---

## 16. 技术栈锁定 (MUST)

| 类别         | 选型                         | 版本   |
| ------------ | ---------------------------- | ------ |
| 框架         | React                        | 18.x   |
| 语言         | TypeScript                   | 5.x    |
| 构建         | Vite                         | 6.x    |
| 样式         | Tailwind CSS + CSS Variables | 4.x    |
| 组件原语     | Radix UI                     | latest |
| 富文本编辑器 | TipTap                       | 2.x    |
| 路由         | React Router                 | 6.x    |
| 状态管理     | Zustand                      | 4.x    |
| Electron     | electron-vite                | latest |

---

## 附录: 实现落点

### A.1 文件结构

```
apps/desktop/renderer/src/
├── styles/
│   ├── tokens.css          # Design Tokens (本文档 §3)
│   ├── fonts.css           # 字体定义
│   └── globals.css         # 全局样式 + 滚动条
├── components/
│   ├── primitives/         # 原子组件 (Button, Input, Card...)
│   ├── patterns/           # 通用模式 (EmptyState, LoadingState...)
│   └── layout/             # 布局组件 (AppShell, Sidebar, Panel...)
├── features/               # 功能模块
├── stores/                 # Zustand stores (含 PreferenceStore)
└── lib/
    └── preferences.ts      # Preference Store 实现
```

### A.2 Tailwind 映射

> **注意**：项目使用 Tailwind CSS 4 CSS-first 配置（`@theme` / `@layer`），
> 不再使用 `tailwind.config.ts`。以下代码仅为说明 Token → Tailwind 的映射关系，
> 实际配置通过 CSS `@theme` 块完成。

```css
/* 在 CSS 中通过 @theme 块配置（Tailwind CSS 4 方式） */
@theme {
  --color-bg-base: var(--color-bg-base);
  --color-bg-surface: var(--color-bg-surface);
  --color-bg-raised: var(--color-bg-raised);
  --color-bg-hover: var(--color-bg-hover);
  --color-bg-active: var(--color-bg-active);
  --color-bg-selected: var(--color-bg-selected);
  /* ... 其他颜色 */
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
}
```

### A.3 Radix UI 约束

- MUST 使用 Radix UI 的无样式组件（Dialog, Popover, Dropdown, etc.）
- MUST 通过 className 添加 Tailwind 类
- MUST NOT 使用 Radix 的默认主题
- SHOULD 封装成业务组件，统一样式

---

## 附录 B: Agent 参考说明

### B.1 设计稿与规范的关系

`design/Variant/designs/` 目录下的 HTML 设计稿（包括原有的 01-19 号和后续补充的设计稿）**仅作为布局和交互参考**。

**规范优先级:**

1. **本文档 (DESIGN_DECISIONS.md)** 是前端实现的唯一真相源
2. 设计稿中的颜色值、间距数值等 **以本文档定义为准**
3. 设计稿主要参考价值：布局结构、组件组合、交互流程

### B.2 设计稿颜色映射

设计稿中可能存在蓝色（#3b82f6）或紫色（#5E6AD2）强调色，实现时 **MUST 替换为本文档定义的强调色**：

| 设计稿中的颜色            | 实现时使用                                    |
| ------------------------- | --------------------------------------------- |
| #3b82f6（蓝色）           | --color-accent（纯白）                        |
| #5E6AD2 / #5D3FD3（紫色） | --color-accent（纯白）                        |
| rgba(59, 130, 246, ...)   | --color-accent-subtle 或 --color-accent-muted |
| rgba(94, 106, 210, ...)   | --color-accent-subtle 或 --color-accent-muted |

**例外:** 知识图谱节点保持多色区分，使用 `--color-node-*` 变量。

### B.3 Agent 开发时的颜色使用原则

1. **强调色场景**（激活状态、选中项、主按钮）→ 使用 `--color-accent`
2. **功能反馈**（成功/错误/警告/信息）→ 使用对应功能色
3. **知识图谱节点**→ 使用 `--color-node-*` 变量
4. **禁止硬编码颜色值**，所有颜色 MUST 使用 CSS Variable

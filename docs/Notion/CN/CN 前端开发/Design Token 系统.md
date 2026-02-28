# Design Token 系统

> Source: Notion local DB page `f4b9bbf6-5eac-45be-a5ac-47b3254f507f`

## 现状评估

> 📍

Token 体系已存在，但执行层大面积逃逸。 基础设施是对的，问题在纪律。

### 已有的 Token 基础

定义位置：src/styles/tokens.css + main.css

| Token 类别 | 已定义数量 | 覆盖情况 |
| --- | --- | --- |
| Color | 72 个 --color-* 变量 | ⚠️ Primitives 覆盖率高，Features 层 ~70% |
| Spacing | 4px Grid 系统（--space-1 ~ --space-20） | ⚠️ 业务层大量 p-[120px]、px-[80px] 等魔法值逃逸 |
| Z-Index | --z-base ~ --z-tooltip（100/200/300/...） | ❌ 执行层完全击穿，业务代码泛滥 z-10/z-30/z-50 |
| 圆角 | 已定义 | ✅ 基本统一 |
| 阴影 | 部分定义（如 --shadow-md） | ❌ 多处魔法阴影如 shadow-[0_18px_48px_rgba(0,0,0,0.45)] |
| 动画 | --duration-fast: 100ms、--ease-default | ⚠️ 存在但未被充分引用，大量 transition-all duration-300 |
| Typography | 仅字体栈 --font-family-ui | ❌ 完全缺失——无字号阶梯、行高、字重的语义化 Token |

---

## 核心问题

### 1. 颜色逃逸

~24 个文件存在硬编码颜色，脱离主题管控：

- character/types.ts — 直接使用 text-blue-400、text-red-400、text-purple-400 等 Tailwind 原始色

- SearchPanel.tsx、VersionHistoryPanel.tsx — hex/rgba 硬编码

- 多处 !bg-* 强制覆盖类

后果： 主题切换（暗色/亮色）时出现明显的视觉违和。

### 2. Z-Index 层级系统失效

tokens.css 中已规划完整层级：

```
--z-sticky:   100
--z-dropdown: 200
--z-popover:  300
--z-modal:    ...
--z-tooltip:  ...
```

但业务代码完全无视，集中违规文件：

- KnowledgeGraph.tsx — z-10、z-30

- DiffHeader.tsx — z-20

- SearchPanel.tsx — z-50

- AiPanel.stories.tsx — z-50

后果： 多面板叠加、上下文菜单与模态框共存时必然发生 Z 轴穿透。

### 3. 阴影未抽象

代码中既有规范的 shadow-[var(--shadow-md)]，又存在：

- DiffHeader.tsx:104 — shadow-[0_18px_48px_rgba(0,0,0,0.45)]

- ModelPicker.tsx — 类似魔法阴影

后果： 深度表达混乱，破坏用户的空间隐喻直觉。

### 4. 间距魔法值

尽管有 4px Grid，业务层大量出现：

- ZenMode.tsx — px-[80px] py-[120px] max-w-[720px]

- DiffView.tsx — max-h-[300px]

- CharacterDetailDialog.tsx — max-h-[calc(100%-3.5rem)]

- DashboardPage.tsx — w-[35%]、min-h-[280px]

### 5. Typography Token 完全缺失

这是当前最大的结构性缺口。现状是"像素级修图"编码：

- DashboardPage.tsx 标题 — text-[28px] font-normal tracking-[-0.02em]

- 辅助文本 — text-[10px] tracking-[0.1em]

- 各处散装 text-[13px]、text-sm、leading-relaxed

没有 Heading-1、Body-Regular、Caption 等语义化规范，导致字阶和信息层级在不同面板间无法对齐。

---

## 改造方案

### Phase 1：补全缺失 Token

在 tokens.css 中新增以下类别：

Typography Token（优先级最高）：

> ⚠️

重要：字号必须使用 rem 而非 px。 rem 基于根字号，用户调整系统字体缩放时布局自动响应。px 硬编码会导致缩放失效，破坏可访问性。基准：1rem = 16px。

字号阶梯设计依据：

CN 当前代码中实际使用的散装字号：10px / 13px / 14px（最多） / 16px / 28px / text-sm(14px) / text-xs(12px)。这些值并非随机，反映了真实的信息层级需求。

对标分析：

| 层级 | iA Writer | Notion | Cursor (VS Code) | CN 建议 | 依据 |
| --- | --- | --- | --- | --- | --- |
| Caption / 标签 | — | 11px | 11px | 0.6875rem (11px) | UI 辅助文字的行业常见最小值 |
| Body-Small / 辅助 | — | 12-13px | 12px | 0.8125rem (13px) | CN 现有 text-[13px] 最频繁，保留 |
| Body / 正文 | 16-18px（可读性研究最优） | 14px | 13px | 0.875rem (14px) | IDE 侧边栏/面板用 14px；编辑区另定 |
| Body-Large | — | 16px | 14px | 1rem (16px) | 编辑区正文、强调信息 |
| Heading-3 | — | 18.75px | 16px | 1.25rem (20px) | 三级标题，比 Body-Large 跳 1.25x |
| Heading-2 | — | 23.44px | 20px | 1.5rem (24px) | 二级标题，比 H3 跳 1.2x |
| Heading-1 | — | 30px | 28px | 2rem (32px) | 一级标题，CN 现有 text-[28px] 向上对齐 |

> 跳跃比例约 1.2-1.33x， 接近 Major Third 谐音音阶（typographic scale 经典比例）。比 Notion 的 1.25x 稍大，因为 CN 的屏幕内容密度比 Notion 低（写作 IDE 大量留白），需要更强的层级对比。

编辑区与 UI 区的字号分离：

iA Writer 的核心洞察：写作正文的最优字号（16-18px）与 UI 控件的最优字号（13-14px）不同。 CN 应该分离两套字号：

- UI Token：--text-xs 到 --text-3xl，用于侧边栏、状态栏、弹窗等

- Editor Token：--editor-text-body: 1rem (16px) / --editor-text-heading-1: 2rem 等，用于主编辑区

- ZenMode / Focus Mode 下可进一步放大编辑区字号到 18px

```
/* UI Token（侧边栏、弹窗、状态栏） */
--text-xs:     0.6875rem;  /* 11px */
--text-sm:     0.8125rem;  /* 13px */
--text-base:   0.875rem;   /* 14px */
--text-lg:     1rem;       /* 16px */
--text-xl:     1.25rem;    /* 20px */
--text-2xl:    1.5rem;     /* 24px */
--text-3xl:    2rem;       /* 32px */

/* Editor Token（主编辑区） */
--editor-text-body:    1rem;       /* 16px，对标 iA Writer 可读性研究 */
--editor-text-h3:      1.25rem;    /* 20px */
--editor-text-h2:      1.5rem;     /* 24px */
--editor-text-h1:      2rem;       /* 32px */
--editor-leading:      1.7;        /* iA Writer 级行高，提升长文可读性 */

/* 行高 */
--leading-tight:   1.25;    /* 标题 */
--leading-normal:  1.5;     /* UI 正文 */
--leading-relaxed: 1.625;   /* 辅助文字 */

/* 字重 */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
```

Shadow Token（补全 + 暗色模式）：

> ⚠️

暗色模式的阴影不能简单复用亮色模式的值。 暗色背景上 rgba(0,0,0,0.08) 几乎不可见，需要显著提高透明度。同时暗色模式应使用"光晕"而非"暗影"——即用浅色半透明边缘模拟层级，而不是纯黑色扩散。

```
/* 亮色模式（默认） */
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 12px rgba(0,0,0,0.08);
--shadow-lg:  0 12px 32px rgba(0,0,0,0.12);
--shadow-xl:  0 18px 48px rgba(0,0,0,0.16);

/* 暗色模式——透明度显著提高 + 叠加微弱浅色边缘 */
@media (prefers-color-scheme: dark) {
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.24);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.32);
  --shadow-lg:  0 12px 32px rgba(0,0,0,0.48);
  --shadow-xl:  0 18px 48px rgba(0,0,0,0.64);

  /* 可选：叠加微弱边缘模拟"光晕"效果 */
  --shadow-ring: 0 0 0 1px rgba(255,255,255,0.06);
}
```

暗色模式对标参考：

- Notion：弹窗和悬浮层使用 1px solid rgba(255,255,255,0.08) 边缘 + 较深阴影

- Cursor / VS Code：弹出菜单有明显的 border: 1px solid var(--vscode-widget-border) + 较重阴影

- Linear：暗色模式下几乎不用阴影，完全依赖微弱边缘区分层级

CN 的策略建议： 采用 Notion 方案——暗色模式下阴影 + 微弱边缘双重层级提示，这对写作 IDE 的多面板场景（编辑区、侧边栏、弹窗、悬浮菜单层叠）最为适用。

### Phase 2：清扫硬编码

批量替换策略（AI 可批量执行）：

| 违规模式 | 替换为 | 影响文件数 |
| --- | --- | --- |
| text-blue-400 等 raw Tailwind colors | text-[var(--color-*)] 语义色 | ~24 |
| z-10 / z-30 / z-50 | z-[var(--z-dropdown)] 等 Token 变量 | ~8 |
| shadow-[0_18px_48px_...] | shadow-[var(--shadow-xl)] | ~5 |
| text-[28px] 等散装字号 | text-[var(--text-3xl)] 或语义化排版组件 | ~20+ |
| !bg-* 强制覆盖 | 修复层叠逻辑，移除 !important | ~5 |

### Phase 3：建立语义化排版组件

封装 Typography 工具类或组件，让业务代码通过语义名称引用，而不是裸写像素值：

```
Heading-1  → text-3xl / font-semibold / leading-tight
Heading-2  → text-2xl / font-semibold / leading-tight
Heading-3  → text-xl  / font-medium  / leading-normal
Body       → text-base / font-normal / leading-normal
Body-Small → text-sm  / font-normal / leading-normal
Caption    → text-xs  / font-normal / leading-relaxed / color-text-secondary
```

---

## Token 命名规范

Token 命名采用三层结构：--{类别}-{语义}-{变体}

```
/* Color：语义优先 */
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-surface-default
--color-surface-elevated
--color-border-default
--color-accent
--color-error
--color-success

/* Typography：区分 UI 和 Editor */
--text-xs / --text-sm / ...        /* UI 字号 */
--editor-text-body / ...            /* 编辑区字号 */

/* Shadow：elevation 阶梯 */
--shadow-sm / --shadow-md / --shadow-lg / --shadow-xl

/* Z-Index：层级语义 */
--z-base / --z-sticky / --z-dropdown / --z-popover / --z-modal / --z-tooltip
```

禁止使用非语义化的 Token 名称（如 --color-gray-900、--shadow-1）。

---

## 目标 Token 完整覆盖清单

- [ ] Color — 语义化（--color-text-primary, --color-surface-elevated 等），禁止 raw Tailwind 色

- [ ] Spacing — 严格 4px Grid，禁止任意绝对值

- [ ] Typography — UI 字号阶梯 + Editor 字号阶梯 + 行高 + 字重 + 语义化组件，使用 rem 单位

- [ ] Z-Index — 严格分层，业务代码只能引用 Token 变量

- [ ] Shadow — 完整 elevation 阶梯（sm/md/lg/xl）+ 暗色模式单独定义

- [ ] Radius — 统一圆角（已基本达成）

- [ ] Motion — duration + easing 统一引用（已定义，需强制执行）+ prefers-reduced-motion 覆盖

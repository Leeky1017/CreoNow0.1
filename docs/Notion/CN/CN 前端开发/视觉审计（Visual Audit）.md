# 视觉审计（Visual Audit）

> Source: Notion local DB page `2b2a0875-ceeb-4b00-9bc0-b73a5cbe9d33`

> 📋

审计来源： Gemini（代码级审计）+ CN Agent（架构级回答）+ Joy 综合分析

## 审计总览

当前 CN 前端的核心设计矛盾：底层试图建立严谨的 Design Token 体系和受控的 Primitive 组件，但业务层为了快速交付，倒退回了滥用 Tailwind 任意值的模式。 架构徒有其表，失去了对全局一致性的约束力。

---

## 一、颜色与主题逃逸

~24 个文件存在硬编码颜色，脱离全局主题管控：

- character/types.ts — 直接使用 text-blue-400、text-red-400、text-purple-400 等 Tailwind 原始色

- SearchPanel.tsx、VersionHistoryPanel.tsx — hex/rgba 硬编码

- 多处 !bg-* 强制覆盖类

后果： 主题切换（暗色/亮色）时出现明显的视觉违和。

改造： 所有颜色统一映射到 --color-* 语义变量，禁止 raw Tailwind colors，移除所有 !important。

---

## 二、Z-Index 层级系统失效

tokens.css:41-48 已规划完整层级（--z-sticky: 100 / --z-dropdown: 200 / --z-popover: 300 ...），但执行层完全击穿：

- KnowledgeGraph.tsx:385 — z-10、z-30

- DiffHeader.tsx — z-20

- SearchPanel.tsx — z-50

- AiPanel.stories.tsx:1146 — z-50

后果： 多面板叠加、Context Menu 与 Modal 共存时必然发生 Z 轴穿透 Bug。

改造： 通过 React Portal 将弹出层提升到根节点，业务代码彻底禁止硬编码 z-index 数字。

---

## 三、阴影与深度（Elevation）滥用

代码中既有规范的 shadow-[var(--shadow-md)]，又存在：

- DiffHeader.tsx:104 — shadow-[0_18px_48px_rgba(0,0,0,0.45)]

- ModelPicker.tsx — 类似魔法阴影

后果： 深度表达混乱，破坏用户的空间隐喻直觉。

改造： 补全 Shadow Token 阶梯（sm/md/lg/xl），收拢所有魔法阴影。

---

## 四、魔法数值与响应式弹性破坏

布局充斥任意绝对值，在极端窗口尺寸或系统字体缩放时极易崩塌：

- ZenMode.tsx — px-[80px] py-[120px] max-w-[720px]

- DiffView.tsx — max-h-[300px]

- CharacterDetailDialog.tsx — max-h-[calc(100%-3.5rem)]

- DashboardPage.tsx:101 — w-[35%] + min-h-[280px]

- 多处 — calc(85vh-160px) 等视口绑定计算，未通过统一 Surface 容器抽象

风险： 13 寸笔记本缩小窗口 → 布局崩塌 + 双滚动条；未来分屏显示 → 不可用；面板拖拽 → 实现路径被切断。

---

## 五、滚动容器碎片化

- 全局约 194 处 独立的 overflow-hidden、overflow-y-auto 或 max-h-* 声明

- 缺乏统一的 <ScrollArea /> 容器级组件

- Dialog 内部、FileTreePanel、VersionHistoryPanel 各自为战

改造： 封装 <ScrollArea> 统一处理滚动条视觉样式、阴影遮罩、越界隐藏和键盘导航。

---

## 六、排版（Typography）语义化缺失

当前排版完全没有抽象层，属于"像素级修图"编码：

- DashboardPage.tsx 标题 — text-[28px] font-normal tracking-[-0.02em]

- 辅助文本 — text-[10px] tracking-[0.1em]

- 各处散装 text-[13px]、text-sm、leading-relaxed 拼接

- 零语义化：无 Heading-1、Body-Regular、Caption 等规范

后果： 用户大脑需要额外算力去解析"这个字号在当前上下文中代表什么权重"——认知疲劳。

---

## 七、布局刚性与容器越权

Feature 级组件不应感知视口边界，但当前大量越权：

- DashboardPage.stories.tsx、CharacterPanel — 强制 h-screen min-h-[700px]

- 多处子模块 — absolute inset-0、w-screen、h-screen

- DashboardPage Hero Card — 写死 w-[35%]，超宽屏空旷，窄屏挤压

改造： 引入 Workbench Shell 统一分配空间（Topbar + LeftActivityBar + MainEditor + RightPanel + BottomStatusArea），业务组件只输出 flex-1 或 size-full，禁止 h-screen / w-screen。

---

## 八、设计哲学断层：IDE vs Web App

> 产品定位是「IDE（创作工作台）」，但前端实现却采用「普通 Web App」的心智模型。

三重心智负担：

1. 焦点阻断 — IDE 强调沉浸式 Flow State，但 ExportDialog 等全屏 Modal 每次弹出都切断上下文

1. 空间不可预测 — IDE 视口应是"可停靠、可伸缩的 Panel"，但模块试图自己接管视口

1. 视觉噪音 — 过度依赖微观边框和阴影争夺焦点

### 关键决策：弹窗 vs 侧边栏

> 💡

结论：对于 CN 这样的写作 IDE，弹窗（Modal/Dialog）在大多数场景下确实更优。

侧边栏的问题：

- Memory 面板展开后已占屏幕近 1/3，主编辑区被压缩

- 编辑区宽度直接关系写作体验，侧边栏侵占是有代价的

- 左侧栏已塞满功能（搜索、大纲、历史、人物、角色关系），每个都用侧边栏会拥挤不可预测

弹窗更适合 CN 的理由：

1. 保持编辑区稳定 — 写作时最怕页面布局跳动，弹窗不会挤压主内容区

1. 聚焦交互 — Memory 设置、规则编辑等属于"配置型"任务，用完即走

1. 空间更充裕 — 屏幕中央弹窗可以比侧边栏更宽更高

1. 一致性好维护 — 所有侧边栏按钮统一走弹窗，交互模式统一

例外： 需要并排比对的场景（如版本历史 Diff）仍应使用可停靠 Panel。

---

## 改造优先级

| 优先级 | 改造项 | 目标文件/区域 |
| --- | --- | --- |
| P0 极危 | Z-Index 硬编码清理 + Portal 提升 | KnowledgeGraph、DiffHeader、SearchPanel、AiPanel |
| P1 高危 | 颜色硬编码清扫 | character/types.ts、SearchPanel、VersionHistoryPanel 等 ~24 文件 |
| P1 高危 | Workbench Shell 引入 | AppShell、DashboardPage、CharacterPanel 等 |
| P2 中危 | ScrollArea 组件封装 | 194 处 overflow 声明 |
| P2 中危 | Typography Token + 语义化排版 | 全局 ~20+ 文件散装字号 |
| P3 改善 | 魔法阴影收拢 | DiffHeader、ModelPicker 等 ~5 文件 |
| P3 改善 | 间距魔法值替换 | ZenMode、DiffView、DashboardPage 等 |

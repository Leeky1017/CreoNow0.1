# V1-08 文件树像素精修

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 3 侧边栏精修
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: files（FileTreePanel）
- **前端验收**: 需要（视觉对齐设计稿 `12-sidebar-filetree.html` + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

文件树是创作者与作品的第一触点——「入门见堂，堂正则室安。」CreoNow 的 FileTreePanel 功能完备（展开/折叠、拖拽排序、右键菜单、重命名、多选），但与 `12-sidebar-filetree.html` 设计稿逐像素比对后，发现八处可观测的精度偏差：

- **Icon Bar 宽度未锁定**：设计稿明确 48px 固定宽度 icon bar（条纹图标切换标签页），当前实现使用 flex 布局未设 `w-12` 或 `min-w-[48px]` 硬约束，侧栏内容过多时可能被撑开——"柱不正则梁歪"
- **树节点行高不精确**：设计稿锁定每行 32px（含图标、文字、padding），当前使用 `py-1.5`（12px 上下 padding）+ 文字行高 = 变动行高，rename input 出现时行高重排——"榫卯之合在于毫厘"
- **拖拽指示器缺圆形手柄**：设计稿的 drag indicator 是 2px 蓝色横线 + 左端 8px 圆形手柄（`border-radius: 50%`），当前只渲染 2px 蓝线，缺少圆形端点——如弓弦无弣，虽能用而失精
- **Rename input focus 边框**：设计稿用 `#3b82f6` 蓝色 1px focus border，当前用 CSS variable（需验证 `--color-accent` 在 focus 态的实际渲染值是否为 `#3b82f6`）
- **Context menu 快捷键标注缺失**：设计稿右键菜单每项右侧显示快捷键（如 `Ctrl+C`、`Ctrl+V`、`Del`），形式为 11px muted 文字，当前菜单项可能缺少快捷键展示
- **选中与 hover 对比度**：设计稿 hover 用 `var(--bg-hover)` (`#1a1a1a`)、selected 用 `var(--bg-selected)` (`#222222`)，两者色差仅 `#080808`（约 3.1%），需验证 WCAG AA 对比度是否达标
- **展开/折叠箭头动效**：设计稿有 0.2s 旋转箭头过渡动画（`transition: transform 0.2s`），当前可能无过渡直接切换——如翻书不转页角
- **文件类型图标颜色**：设计稿不同文件类型用不同色彩编码（`.ts` = 蓝 `#3b82f6`、`.md` = 绿 `#22c55e`、`.json` = 黄 `#eab308`），当前可能使用单色 `--color-fg-muted` 统一着色

### 2. 根因

「构架已成，雕琢未足。」

FileTreePanel.tsx 约 1,320 行，承载文件树全部逻辑——展开/折叠、拖拽排序、右键菜单、重命名、多选、嵌套缩进。功能层面已完善，问题在于视觉精度的「最后一公里」：

- **Icon Bar 宽度**：flex 布局默认行为未设 `flex-shrink-0` + 固定宽度，依赖内容宽度自适应
- **行高不一致**：使用 padding-based 行高（`py-1.5` = 6px × 2 = 12px padding + 文字行高）而非固定 `h-8`（32px），rename input 的 padding 不同导致行高跳动
- **拖拽指示器简化**：开发时只实现了 2px 蓝线的最小可用版本，圆形手柄属于视觉精修被跳过
- **箭头动效遗漏**：`transition` 属性未加到 chevron 旋转上
- **文件图标着色**：可能使用了统一图标组件而未做文件类型→颜色映射

### 3. 威胁

- **专业感知**：文件树是应用启动后用户最先操作的组件，像素级偏差在高频交互中被放大——「千里之堤，溃于蚁穴」
- **拖拽体验**：无圆形手柄的 drag indicator 在精确定位插入位置时缺少视觉锚点，增加用户认知负担
- **快捷键可发现性**：右键菜单不展示快捷键，用户永远不知道可以用 `Ctrl+C` 复制文件——降低效率学习曲线
- **行高跳动**：rename 时行高变化导致下方所有节点重排，在长文件列表中产生视觉抖动
- **可访问性**：hover/selected 对比度不达 WCAG AA 可能导致低视力用户无法区分状态

### 4. 证据来源

| 数据点 | 值 | 来源 |
| --- | --- | --- |
| FileTreePanel.tsx 行数 | ~1,320 行 | `wc -l` |
| 设计稿 icon bar 宽度 | 48px 固定 | `12-sidebar-filetree.html` |
| 设计稿行高 | 32px per item | `12-sidebar-filetree.html` `.tree-item { height: 32px }` |
| 当前行 padding | `py-1.5`（6px × 2） | FileTreePanel.tsx className |
| 拖拽指示器设计稿 | 2px 蓝线 + 8px 圆形手柄 | `12-sidebar-filetree.html` `.drag-indicator::before { width: 8px; border-radius: 50% }` |
| Rename focus border 设计色 | `#3b82f6` | `12-sidebar-filetree.html` `.rename-input:focus { border-color: #3b82f6 }` |
| Hover 背景色 | `--bg-hover` → `#1a1a1a` | `12-sidebar-filetree.html` |
| Selected 背景色 | `--bg-selected` → `#222222` | `12-sidebar-filetree.html` |
| 箭头旋转动效 | `transition: transform 0.2s` | `12-sidebar-filetree.html` `.chevron` |
| 文件类型图标配色 | `.ts`=蓝 `#3b82f6`、`.md`=绿 `#22c55e`、`.json`=黄 `#eab308` | `12-sidebar-filetree.html` |
| 快捷键标注样式 | 11px、`--color-fg-muted` | `12-sidebar-filetree.html` `.shortcut { font-size: 11px }` |
| DESIGN_DECISIONS.md 参考 | §9.1（左侧 Icon Bar）、§11.3（FileTree） | 设计文档 |

---

## What：做什么

### 1. Icon Bar 固定 48px 宽度

锁定左侧 icon bar 为 `w-12`（48px）+ `flex-shrink-0`，确保侧栏图标区不随内容撑开。对齐 `DESIGN_DECISIONS.md` §9.1。

### 2. 树节点统一 32px 行高

将每个 tree item 改为固定 `h-8`（32px）+ `flex items-center`，移除基于 padding 的变动行高。rename input 继承同样的 32px 行高容器，消除行高跳动。

### 3. 拖拽指示器增加圆形手柄

在 2px 蓝色横线左端增加 8px 圆形手柄元素（`w-2 h-2 rounded-full bg-blue-500`），使用 `--color-info` token。提供精确的插入位置视觉锚点。

### 4. Rename Input Focus 边框验证与对齐

验证 rename input 的 focus 边框颜色是否为 `#3b82f6`（`--color-info`）。如不匹配，修正为 `focus:border-[var(--color-info)]` 或对应 token。

### 5. Context Menu 快捷键标注

在右键菜单各项右侧增加快捷键展示（如 `Ctrl+C`、`Ctrl+V`、`Del`），样式为 11px `--color-fg-muted`，对齐设计稿 context menu 规范。

### 6. 选中/Hover 对比度验证

验证 `--bg-hover`（`#1a1a1a`）与 `--bg-selected`（`#222222`）的对比度。如不达 WCAG AA（4.5:1 对比度要求适用于文字，3:1 适用于 UI 组件），调整 `--bg-selected` 使其与 hover 态有足够区分度。

### 7. 展开/折叠箭头旋转动效

为 chevron 图标增加 `transition-transform duration-[var(--duration-fast)]`（150ms）旋转过渡。展开时 `rotate-90`，折叠时 `rotate-0`。

### 8. 文件类型图标颜色映射

建立文件扩展名→图标颜色映射（至少覆盖 `.ts`/`.tsx`→蓝 `--color-info`、`.md`→绿 `--color-success`、`.json`→黄 `--color-warning`、`.css`→`--color-accent`），替代当前单色方案。

### 9. FileTreePanel.tsx 职责解耦——按交互关注点拆分为独立子组件

FileTreePanel.tsx（1,400 行）将节点渲染、右键菜单、拖拽排序、键盘导航、布局编排五个独立关注点耦合在一个文件中，任何单点修改都有影响其他四处的风险。视觉精修过程中按职责边界破坏性拆分：

- **`FileTreeNode.tsx`** — 单节点渲染：文件/文件夹 icon + name + indent + expand/collapse 箭头 + icon 颜色映射（单一职责：节点 UI）
- **`FileTreeContextMenu.tsx`** — 右键上下文菜单 + 快捷键标签展示（单一职责：上下文操作）
- **`FileTreeDragDrop.tsx`** — 拖拽排序逻辑 + 圆形手柄指示器 + drop 位置线（单一职责：拖拽交互）
- **`useFileTreeKeyboard.ts`** — 键盘导航（↑/↓/←/→/Enter）hook（单一职责：键盘交互逻辑）
- **`FileTreePanel.tsx`** — 布局编排：组合子组件 + store 消费分发（单一职责：组合层）

拆分策略与 v1-06 一致：最低耦合优先，拆一个验一个，全量测试不可退步。

---

## Non-Goals：不做什么

1. **FileTreePanel.tsx 职责解耦**——1,400 行巨石组件在视觉精修过程中按交互关注点拆分。提取 `FileTreeNode.tsx`（单节点渲染 + icon 颜色映射）、`FileTreeContextMenu.tsx`（右键菜单 + 快捷键标签）、`FileTreeDragDrop.tsx`（拖拽逻辑 + 圆形手柄指示器）、`useFileTreeKeyboard.ts`（键盘导航 hook），FileTreePanel.tsx 仅保留布局编排职责
2. **不修改文件操作逻辑**——创建/删除/移动等 CRUD 行为不在本 change 范围
3. **不修改拖拽排序算法**——只修改拖拽指示器的视觉表现，不改变排序逻辑
4. **不新增文件类型**——只为现有文件类型增加颜色映射，不扩展文件类型识别逻辑
5. **不做完整的无障碍审计**——本 change 只验证 hover/selected 对比度，完整 a11y 审计属于独立任务
6. **不修改 DESIGN_DECISIONS.md**——设计决策文档由 Owner 维护

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）——需要 `--color-info`、`--color-success`、`--color-warning`、`--color-accent` 等语义色 token 可用；v1-02（Primitive 进化）——如 context menu 使用 Primitive 组件则需其快捷键展示能力
- **被依赖于**: 无直接下游——本 change 是终端叶子节点
- **并行安全**: 与 v1-06（AI Panel）、v1-07（Settings）无文件交叉，可并行开发
- **风险**: FileTreePanel.tsx 1,320 行的单文件修改需谨慎，每次改动需跑全量 file tree 相关测试确认无回归

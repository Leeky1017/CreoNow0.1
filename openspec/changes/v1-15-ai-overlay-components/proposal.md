# V1-15 AI Overlay 组件视觉统一与解耦

- **状态**: ✅ 已实现（随 PR #1198 进入合并审计）
- **GitHub Issue**: #1197（v1-14 / v1-15 共享交付）
- **分支**: `task/1197-v1-14-v1-15-tdd-redo`
- **所属任务簇**: V1（视觉重塑）— Wave 5 全覆盖收口
- **涉及模块**: components/features/AiDialogs（AiDiffModal / AiErrorCard / SystemDialog / AiInlineConfirm）
- **前端验收**: 需要（Storybook Story + 视觉验收截图）

---

## 当前实现结果（2026-03-21）

| 区域            | 原始行数 | 当前结果                                                                                              | 备注                                  |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------- |
| AiDiffModal     | 893      | `AiDiffModal.tsx` 307 / `AiDiffContent.tsx` 227 / `AiDiffSummary.tsx` 169 / `useAiDiffActions.ts` 155 | 已压到壳层 + 内容/摘要/状态逻辑四段式 |
| AiErrorCard     | 855      | `AiErrorCard.tsx` 226 / `AiErrorDetails.tsx` 211 / `AiErrorActions.tsx` 183                           | 错误展示与动作区域已拆开              |
| SystemDialog    | 638      | `SystemDialog.tsx` 250 / `SystemDialogContent.tsx` 200                                                | 已达到原计划主文件 ≤250 行目标        |
| AiInlineConfirm | 398      | `AiInlineConfirm.tsx` 221 / `AiInlinePreview.tsx` 134                                                 | 主文件略超 ≤200 行目标（+21行）       |

## Why：为什么必须做

### 1. 用户现象

V1-06 精修了 AiPanel（2,100 行 AI 面板），但用户在 AI 面板中触发的**每一个操作弹窗**都来自 `components/features/AiDialogs/` 目录——这 4 个文件共 2,784 行，完全未被任何 v1 change 覆盖：

- **接受/拒绝 AI 建议**：弹出 `AiDiffModal.tsx`（893 行）——差异对比 + 应用/驳回操作
- **AI 错误展示**：渲染 `AiErrorCard.tsx`（855 行）——错误原因 + 重试/切换模型
- **系统级 AI 对话**：弹出 `SystemDialog.tsx`（638 行）——长上下文对话框
- **行内 AI 确认**：渲染 `AiInlineConfirm.tsx`（398 行）——编辑器内嵌确认条

用户在精修后的 AI 面板里对话 → 点击「应用」→ 弹出一个风格完全不同的 AiDiffModal。**这是 v1-06 最大的视觉断裂点。**

### 2. 根因

v1-06 以 `features/ai/` 目录为边界，而这 4 个 overlay 组件位于 `components/features/AiDialogs/`——属于组件层而非 Feature 层，被下意识地忽略了。但从用户视角看，它们是 AI 功能的一部分。

### 3. 证据

| 文件                | 行数 | 弹出时机             | 视觉问题                                                    |
| ------------------- | ---- | -------------------- | ----------------------------------------------------------- |
| AiDiffModal.tsx     | 893  | 用户接受 AI 修改建议 | 差异高亮色、按钮样式、modal 圆角均未对齐设计稿              |
| AiErrorCard.tsx     | 855  | AI 调用失败          | 错误卡片布局、severity 色彩、action 按钮未使用 Design Token |
| SystemDialog.tsx    | 638  | 系统级 AI 对话       | Dialog 阴影、内容区间距、按钮排列不一致                     |
| AiInlineConfirm.tsx | 398  | 编辑器内 AI 建议     | 内嵌条样式与编辑器 Token 不协调                             |

---

## What：做什么

### 1. AiDiffModal 破坏性重构（893 → ≤ 250 行 × 4 文件）

AiDiffModal 是最复杂的 overlay：差异对比视图 + 操作按钮栏 + 变更摘要 + 冲突标记。

**破坏性重构方案**：

| 提取文件              | 职责                                                    | 目标行数 |
| --------------------- | ------------------------------------------------------- | -------- |
| `AiDiffModal.tsx`     | Modal shell + header + action bar（应用/驳回/部分应用） | ≤ 200 行 |
| `AiDiffContent.tsx`   | 差异对比渲染（添加/删除/修改的 block 展示）             | ≤ 250 行 |
| `AiDiffSummary.tsx`   | 变更摘要栏（增删行数 + 文件影响范围 + 冲突标记）        | ≤ 150 行 |
| `useAiDiffActions.ts` | 应用/驳回/部分应用的状态管理 + 事件处理                 | ≤ 150 行 |

**视觉对齐**：

- Modal 使用 Dialog primitive（`--radius-lg`、`--shadow-dialog`）
- 差异高亮：添加 `--color-success-subtle` 背景、删除 `--color-danger-subtle` 背景
- Action bar 使用 Button primary/secondary/ghost
- 变更摘要使用 Badge `variant="default"` 展示行数统计

### 2. AiErrorCard 破坏性重构（855 → ≤ 250 行 × 3 文件）

AI 错误展示组件，包含错误分类、详情展开、action 按钮（重试/切换模型/查看日志）。

**破坏性重构方案**：

| 提取文件             | 职责                                                 | 目标行数 |
| -------------------- | ---------------------------------------------------- | -------- |
| `AiErrorCard.tsx`    | 错误卡片 shell + severity 指示 + 展开/折叠           | ≤ 200 行 |
| `AiErrorDetails.tsx` | 错误详情内容（原因分析 + 建议操作 + 技术详情折叠区） | ≤ 200 行 |
| `AiErrorActions.tsx` | 操作按钮区域（重试 + 切换模型 + 查看日志 + 忽略）    | ≤ 150 行 |

**视觉对齐**：

- 与 v1-06 的 `ErrorGuideCard` severity 色彩系统统一
- 错误边框：critical `--color-danger`、warning `--color-warning`、info `--color-info`
- 使用 Card `variant="bordered"` + 左侧 4px 色条
- 折叠区使用 Accordion primitive

### 3. SystemDialog 重构（638 → ≤ 250 行 × 2 文件）

系统级对话框，较直接，主要是 dialog 布局 + 内容区 + action 按钮。

**重构方案**：

| 提取文件                  | 职责                                      | 目标行数 |
| ------------------------- | ----------------------------------------- | -------- |
| `SystemDialog.tsx`        | Dialog shell + header + footer action bar | ≤ 250 行 |
| `SystemDialogContent.tsx` | 对话内容区（消息列表 + 系统提示）         | ≤ 200 行 |

**视觉对齐**：

- 使用 Dialog primitive
- 消息布局与 v1-06 的 AiPanel 消息列表风格统一
- 系统提示使用 `--color-fg-muted` + italic

### 4. AiInlineConfirm 重构（398 → ≤ 200 行 × 2 文件）

编辑器内嵌的 AI 确认条。

**重构方案**：

| 提取文件              | 职责                                                 | 目标行数 |
| --------------------- | ---------------------------------------------------- | -------- |
| `AiInlineConfirm.tsx` | 确认条 shell（accept/reject/edit 按钮 + 键盘快捷键） | ≤ 200 行 |
| `AiInlinePreview.tsx` | 内联预览区域（修改前后对比）                         | ≤ 150 行 |

**视觉对齐**：

- 确认条背景 `--color-bg-elevated` + 顶部 1px `--color-border-subtle`
- 按钮使用 Button `size="sm"` + ghost/primary variant
- 与编辑器区域的 `--space-editor-padding` 对齐

---

## Non-Goals（不做什么）

1. 不改变 AI 调用逻辑——只做视觉 + 结构重构
2. 不修改 IPC 通道或 AI service 层
3. 不重构 diff 算法——仅重构 diff 的 UI 渲染层
4. 不做新功能（如 inline diff 多选应用）

---

## Dependencies

- v1-01（Design Token 补完）：severity 色彩 token
- v1-02（Primitive 进化）：Dialog、Card、Button、Accordion、Badge
- v1-06（AI Panel 重做）：消息风格统一、ErrorGuideCard severity 系统须已定稿
- v1-11（Empty/Loading/Error States）：ErrorState 标准组件

---

## Risks

| 风险                                | 缓解                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| AiDiffModal 功能复杂，UI/逻辑耦合深 | 优先提取 useAiDiffActions hook 解耦状态管理                  |
| AiErrorCard 的 error 类型多样       | 建立 severity 枚举统一映射，不为每种 error 单独写样式        |
| 与 v1-06 的风格一致性               | v1-15 必须在 v1-06 合并后实施，复用 v1-06 建立的 AI 视觉规范 |

---

## R3 Cascade Refresh (2026-03-21)

### 上游依赖状态

| 上游 Change                  | 状态    | 说明                                                                       |
| ---------------------------- | ------- | -------------------------------------------------------------------------- |
| v1-06 AI Panel Overhaul      | ✅ PASS | AiPanel 281行, TabBar 50, MessageList 432, InputArea 293, 27测试文件全通过 |
| v1-07 Settings Visual Polish | ✅ PASS | SettingsDialog 297行, AppearancePage 249, Navigation 103, 91测试全通过     |

### 基线指标更新（已实现，审计阶段）

| 指标                     | proposal 原值  | R3 实测值                         | 趋势          | 采集命令                                                                 |
| ------------------------ | -------------- | --------------------------------- | ------------- | ------------------------------------------------------------------------ |
| AiDiffModal.tsx 行数     | 893            | **307**（主文件）                 | ⬇️ 已拆分     | `wc -l .../AiDialogs/AiDiffModal.tsx`                                    |
| AiDiffContent.tsx        | —              | **227**                           | 📊 拆分产物   | `wc -l .../AiDiffContent.tsx`                                            |
| AiDiffSummary.tsx        | —              | **169**                           | 📊 拆分产物   | `wc -l .../AiDiffSummary.tsx`                                            |
| useAiDiffActions.ts      | —              | **155**                           | 📊 拆分产物   | `wc -l .../useAiDiffActions.ts`                                          |
| AiErrorCard.tsx 行数     | 855            | **226**（主文件）                 | ⬇️ 已拆分     | `wc -l .../AiDialogs/AiErrorCard.tsx`                                    |
| AiErrorDetails.tsx       | —              | **211**                           | 📊 拆分产物   | `wc -l .../AiErrorDetails.tsx`                                           |
| AiErrorActions.tsx       | —              | **183**                           | 📊 拆分产物   | `wc -l .../AiErrorActions.tsx`                                           |
| SystemDialog.tsx 行数    | 638            | **250**（主文件）                 | ⬇️ 已拆分     | `wc -l .../AiDialogs/SystemDialog.tsx`                                   |
| SystemDialogContent.tsx  | —              | **200**                           | 📊 拆分产物   | `wc -l .../SystemDialogContent.tsx`                                      |
| AiInlineConfirm.tsx 行数 | 398            | **221**（主文件）                 | ⬇️ 已拆分     | `wc -l .../AiDialogs/AiInlineConfirm.tsx`                                |
| AiInlinePreview.tsx      | —              | **134**                           | 📊 拆分产物   | `wc -l .../AiInlinePreview.tsx`                                          |
| AiDialogs 模块总行数     | 2,784（4文件） | **4,454**（含测试/stories/types） | 📊 含新增测试 | `find .../AiDialogs/ -name '*.tsx' -o -name '*.ts' \| xargs wc -l`       |
| AiDialogs 测试           | —              | **4 文件 / 83 测试全通过**        | ✅            | `npx vitest run --reporter=verbose AiDiff AiError SystemDialog AiInline` |

### 分析

v1-15 **已实现完成**，当前处于审计阶段。四个 overlay 组件均已完成破坏性拆分：

- AiDiffModal: 893→307（主）+227+169+155 = 四段式
- AiErrorCard: 855→226（主）+211+183 = 三段式
- SystemDialog: 638→250（主）+200 = 二段式
- AiInlineConfirm: 398→221（主）+134 = 二段式

注意 AiDiffModal 主文件（307行）略超 AC-1 的 ≤200 行目标，AiInlineConfirm 主文件（221行）略超 AC-9 的 ≤200 行目标——审计中需评估是否为 blocking issue。83 个测试全部通过，无回归。

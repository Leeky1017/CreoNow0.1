# Tasks: V1-15 AI Overlay 组件视觉统一与解耦

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-ai-overlay-components`
- **Delta Spec**: `openspec/changes/v1-15-ai-overlay-components/specs/`

---

## 验收标准

| ID    | 标准                                                                  | 对应 Scenario |
| ----- | --------------------------------------------------------------------- | ------------- |
| AC-1  | `AiDiffModal.tsx` 从 893 行拆分为 4 文件，主文件 ≤ 200 行             | 架构          |
| AC-2  | AiDiffModal 使用 Dialog primitive（`--radius-lg`、`--shadow-dialog`） | 视觉          |
| AC-3  | Diff 高亮使用 `--color-success-subtle` / `--color-danger-subtle`      | 视觉          |
| AC-4  | `AiErrorCard.tsx` 从 855 行拆分为 3 文件，主文件 ≤ 200 行             | 架构          |
| AC-5  | AiErrorCard severity 色彩与 v1-06 ErrorGuideCard 统一                 | 视觉          |
| AC-6  | AiErrorCard 使用 Card `variant="bordered"` + 左侧 4px severity 色条   | 视觉          |
| AC-7  | `SystemDialog.tsx` 从 638 行拆分为 2 文件，主文件 ≤ 250 行            | 架构          |
| AC-8  | SystemDialog 消息风格与 v1-06 AiPanel 统一                            | 视觉          |
| AC-9  | `AiInlineConfirm.tsx` 从 398 行拆分为 2 文件，主文件 ≤ 200 行         | 架构          |
| AC-10 | AiInlineConfirm 确认条背景 `--color-bg-elevated`                      | 视觉          |
| AC-11 | 所有新增样式使用语义化 Design Token，0 处新增 arbitrary 色值          | 全局          |
| AC-12 | 现有相关测试 100% 通过，0 个新增失败                                  | 全局          |
| AC-13 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）            | 全局          |
| AC-14 | TypeScript 类型检查通过（`pnpm typecheck`）                           | 全局          |
| AC-15 | lint 无新增违规（`pnpm lint`）                                        | 全局          |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` AI 面板相关章节
- [ ] 阅读 4 个目标文件全文：
  - `apps/desktop/renderer/src/components/features/AiDialogs/AiDiffModal.tsx`（893 行）
  - `apps/desktop/renderer/src/components/features/AiDialogs/AiErrorCard.tsx`（855 行）
  - `apps/desktop/renderer/src/components/features/AiDialogs/SystemDialog.tsx`（638 行）
  - `apps/desktop/renderer/src/components/features/AiDialogs/AiInlineConfirm.tsx`（398 行）
- [ ] 阅读 v1-06 已完成的 AiPanel 视觉规范，确保 overlay 与面板风格统一
- [ ] 盘点现有测试文件
- [ ] 运行现有测试基线：`pnpm -C apps/desktop vitest run AiDiff AiError SystemDialog AiInline`
- [ ] 确认 v1-06（AI Panel）、v1-11（状态组件）已合并

---

## Phase 1: Red（测试先行）

### Task 1.1: AiDiffModal 结构测试

**映射验收标准**: AC-1, AC-2, AC-3

- [ ] 测试：AiDiffModal 渲染时使用 Dialog primitive
- [ ] 测试：diff content 区域中添加行有 `--color-success-subtle` 背景
- [ ] 测试：diff content 区域中删除行有 `--color-danger-subtle` 背景
- [ ] 测试：存在「应用」「驳回」action 按钮

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/__tests__/AiDiffModal.test.tsx`（新建）

### Task 1.2: AiErrorCard 结构测试

**映射验收标准**: AC-4, AC-5, AC-6

- [ ] 测试：AiErrorCard 使用 Card 组件
- [ ] 测试：左侧有 4px 宽 severity 色条
- [ ] 测试：critical 错误使用 `--color-danger` 色条
- [ ] 测试：warning 错误使用 `--color-warning` 色条
- [ ] 测试：重试按钮存在

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/__tests__/AiErrorCard.test.tsx`（新建）

### Task 1.3: SystemDialog 结构测试

**映射验收标准**: AC-7, AC-8

- [ ] 测试：SystemDialog 使用 Dialog primitive
- [ ] 测试：消息列表的布局结构与 AiPanel 消息一致
- [ ] 测试：系统提示有 muted 样式

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/__tests__/SystemDialog.test.tsx`（新建）

### Task 1.4: AiInlineConfirm 结构测试

**映射验收标准**: AC-9, AC-10

- [ ] 测试：确认条有 `--color-bg-elevated` 背景
- [ ] 测试：Accept/Reject 按钮使用 Button `size="sm"`
- [ ] 测试：键盘快捷键 Enter(accept)/Esc(reject) 响应

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/__tests__/AiInlineConfirm.test.tsx`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: AiDiffModal 破坏性重构

**映射验收标准**: AC-1, AC-2, AC-3, AC-11

- [ ] 提取 `useAiDiffActions.ts`：应用/驳回/部分应用的状态管理 + 事件处理，≤ 150 行
- [ ] 提取 `AiDiffContent.tsx`：差异对比渲染（添加/删除/修改 block），≤ 250 行
- [ ] 提取 `AiDiffSummary.tsx`：变更摘要栏（增删行数 + 影响范围 + 冲突标记），≤ 150 行
- [ ] 精简 `AiDiffModal.tsx` 至 ≤ 200 行（Dialog shell + header + action bar）
- [ ] Modal 使用 Dialog primitive
- [ ] 添加高亮 `--color-success-subtle` / `--color-danger-subtle`
- [ ] Action 按钮使用 Button primary/secondary/ghost
- [ ] 变更统计使用 Badge

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/`

### Task 2.2: AiErrorCard 破坏性重构

**映射验收标准**: AC-4, AC-5, AC-6, AC-11

- [ ] 提取 `AiErrorDetails.tsx`：错误详情（原因分析 + 建议操作 + 技术详情折叠区），≤ 200 行
- [ ] 提取 `AiErrorActions.tsx`：操作按钮区域（重试 + 切换模型 + 查看日志 + 忽略），≤ 150 行
- [ ] 精简 `AiErrorCard.tsx` 至 ≤ 200 行（Card shell + severity 指示 + 展开/折叠）
- [ ] Card `variant="bordered"` + 左侧 4px severity 色条
- [ ] Severity 色彩对齐 v1-06 ErrorGuideCard 系统
- [ ] 折叠区使用 Accordion primitive

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/`

### Task 2.3: SystemDialog 重构

**映射验收标准**: AC-7, AC-8, AC-11

- [ ] 提取 `SystemDialogContent.tsx`：对话内容区（消息列表 + 系统提示渲染），≤ 200 行
- [ ] 精简 `SystemDialog.tsx` 至 ≤ 250 行（Dialog shell + header + footer action bar）
- [ ] 使用 Dialog primitive
- [ ] 消息布局复用 v1-06 AiPanel 的消息风格
- [ ] 系统提示 `--color-fg-muted` + italic

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/`

### Task 2.4: AiInlineConfirm 重构

**映射验收标准**: AC-9, AC-10, AC-11

- [ ] 提取 `AiInlinePreview.tsx`：内联预览区域（修改前后对比展示），≤ 150 行
- [ ] 精简 `AiInlineConfirm.tsx` 至 ≤ 200 行（确认条 shell + accept/reject/edit 按钮 + 键盘快捷键）
- [ ] 确认条背景 `--color-bg-elevated` + 顶部 1px `--color-border-subtle`
- [ ] 按钮 Button `size="sm"` + ghost/primary
- [ ] 与编辑器区域 `--space-editor-padding` 对齐

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/`

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行全量测试：`pnpm -C apps/desktop vitest run`
- [ ] 运行 `pnpm typecheck` 类型检查
- [ ] 运行 `pnpm lint` lint 检查
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 构建
- [ ] 检查 0 新增 arbitrary 色值
- [ ] 用户路径走查：AiPanel 对话 → 接受建议 → AiDiffModal → 应用修改
- [ ] 用户路径走查：AI 调用失败 → AiErrorCard → 重试
- [ ] PR 创建，含 `Closes #N`

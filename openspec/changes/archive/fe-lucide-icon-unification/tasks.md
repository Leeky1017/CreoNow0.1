## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：将 Feature 层 126 处内联 `<svg>` 替换为 `lucide-react` 图标，统一 `strokeWidth={1.5}`、`size={16|20|24}`。不改交互逻辑。
- [ ] 1.2 审阅并确认错误路径与边界路径：无新增错误路径，纯视觉替换。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：Feature 层（`features/`）不得残留内联 `<svg>` 图标实现。Primitives/Layout 层若有 SVG 可暂不处理。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

按内联 SVG 数量排序的 Feature 目录（共 126 处）：

| Feature | 内联 SVG 数 | 典型文件 |
| ------- | ----------- | -------- |
| editor | 21 | EditorToolbar.tsx、EditorBubbleMenu.tsx、InlineFormatButton.tsx |
| search | 17 | SearchPanel.tsx |
| character | 11 | CharacterPanel.tsx、CharacterDetailDialog.tsx |
| outline | 10 | OutlinePanel.tsx |
| quality-gates | 9 | QualityGatesPanel.tsx |
| commandPalette | 9 | CommandPalette.tsx |
| diff | 8 | InlineDiffControls.tsx |
| ai | 8 | AiPanel.tsx、ChatHistory.tsx |
| version-history | 7 | VersionHistoryPanel.tsx |
| export | 7 | ExportDialog.tsx |
| dashboard | 6 | DashboardPage.tsx |
| settings-dialog | 5 | SettingsDialog.tsx |
| onboarding | 5 | OnboardingPage.tsx |
| projects | 2 | CreateProjectDialog.tsx |
| zen-mode | 1 | ZenMode.tsx |

**为什么是这些触点**：`grep -rn "<svg" features/ --include="*.tsx"` 的全部命中点。每处需要：识别语义 → 找到对应 Lucide 图标名 → 替换为 `<IconName size={N} strokeWidth={1.5} />`。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-ICON-S1` | `apps/desktop/renderer/src/features/__tests__/icon-lucide-guard.test.ts` | `it('feature layer contains no inline <svg> elements')` | 递归读取 `features/**/*.tsx`（排除 test/stories），断言不含 `<svg` 标签 | `fs`/`glob` 读源码 | `pnpm -C apps/desktop test:run features/__tests__/icon-lucide-guard` |
| `WB-FE-ICON-S2` | 同上 | `it('all lucide imports use consistent strokeWidth and size')` | 读取 features 下所有 `.tsx`，断言 Lucide 图标使用处 `strokeWidth` 为 `1.5`（或未指定则使用默认），`size` 为 `16`/`20`/`24` 之一 | `fs`/`glob` | 同上 |

### 可复用测试范本

- 源码 guard 范本：`apps/desktop/renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-ICON-S1`：递归扫描 `features/**/*.tsx`（排除 test/stories/__tests__），断言不含 `<svg` 标签。
  - 期望红灯原因：当前 126 处内联 SVG 分布在 15 个 Feature 目录中。
- [ ] 3.2 `WB-FE-ICON-S2`：扫描 Lucide import 使用处，断言 `strokeWidth` 和 `size` 符合规范。
  - 期望红灯原因：当前已有的 Lucide 使用可能未统一规格（需验证）。
- 运行：`pnpm -C apps/desktop test:run features/__tests__/icon-lucide-guard`

## 4. Green（最小实现通过）

- [ ] 4.1 建立语义映射表：为每个内联 SVG 识别语义并映射到 Lucide 图标名。常见映射：
  - search → `Search`、close/x → `X`、plus → `Plus`、chevron → `ChevronDown`/`ChevronRight`
  - bold/italic/underline → `Bold`/`Italic`/`Underline`
  - copy → `Copy`、trash → `Trash2`、edit → `Pencil`
  - 无对应 Lucide 图标的 → 保留为独立 SVG 组件（放入 `components/icons/`，不算 Feature 层内联）
- [ ] 4.2 按 Feature 逐目录替换（建议从 SVG 最多的 editor/search/character 开始）：
  - 删除内联 `<svg>...</svg>`
  - 替换为 `import { IconName } from "lucide-react"` + `<IconName size={N} strokeWidth={1.5} />`
  - 确保 `size` 为 16（小图标）/20（默认）/24（大图标）之一
  → S1 逐步转绿
- [ ] 4.3 统一已有 Lucide 使用的 `strokeWidth`/`size` → S2 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 若多处使用同一图标+同一 size，可抽取为 `components/icons/` 下的语义别名（如 `<SearchIcon />`），但不强制
- [ ] 5.2 确认替换后视觉权重一致（strokeWidth 1.5 + 对应 size 应与原 SVG 视觉等价）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 guard 测试失败的输出（含内联 SVG 计数）
- [ ] 6.2 记录 RUN_LOG：Green 阶段 guard 测试通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）

# Changes 重构指令手册

> 本文件是 Opus Agent 一次性重构所有 v1 changes 的完整操作手册。
> 读完即可执行，不需要其他上下文。

---

## 〇、你要做什么

**把 20 个臃肿 change（每个 33~148 任务）拆成 micro-change（每个 ≤ 15 任务）。**

你只生成 proposal.md 和 tasks.md。不改代码。

工作目录：仓库根 `/`
源代码根：`apps/desktop/renderer/src/`（下文简写 `SRC/`）
现有 change 目录：`openspec/changes/v1-XX-*/`

> **路径约定**: 扫描命令和 tasks.md 中统一使用完整相对路径 `apps/desktop/renderer/src/...`，不使用 `SRC/` 简写。`SRC/` 仅用于本文档行文。

---

## 一、关键度量（真实数据，已验证）

| 指标                      | 数值    | 说明                                                                                                                                                 |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| tasks.md 总任务           | ~1,300  | 20 个 change                                                                                                                                         |
| 已勾选 `[x]`              | 2       | 0.15%                                                                                                                                                |
| 硬编码 arbitrary 像素值   | **265** | `text-[13px]` 这类（注：features/settings/ 6 处实为 token 引用已扣除，features/settings-dialog/ 12 处已归入 v1-07a，components/layout/ 修正为 3 处） |
| `[var(--*)]` token 引用   | 1,315   | **合法**，不算 arbitrary                                                                                                                             |
| features/ 原生 HTML       | 2       | 几乎已清完                                                                                                                                           |
| eslint-disable 无审计标记 | 29 条   | features/ 下全裸                                                                                                                                     |
| 无 PanelHeader 的面板     | 9 个    | 应接入                                                                                                                                               |

### 字号 token 映射表（全局适用）

来自 `SRC/styles/tokens.css`：

| 硬编码        | token            | 实际值 | Tailwind v4 写法        |
| ------------- | ---------------- | ------ | ----------------------- |
| `text-[10px]` | `--text-label`   | 10px   | `text-(--text-label)`   |
| `text-[11px]` | `--text-status`  | 11px   | `text-(--text-status)`  |
| `text-[12px]` | `--text-caption` | 12px   | `text-(--text-caption)` |
| `text-[13px]` | `--text-body`    | 13px   | `text-(--text-body)`    |

> `text-(--token)` 是 Tailwind v4 的 CSS 变量简写语法。

---

## 二、任务计数规则

**1 任务 = 1 文件 × 1 操作类型。文件内的多处实例是任务的子项，不单独计数。**

### 同质任务示例（搜索替换型）

```markdown
- [ ] `AiMessageList.tsx` 全部 `text-[Npx]` → 语义 token
      实例（17 处）:
      :80 text-[13px]→text-(--text-body)
      :83 text-[12px]→text-(--text-caption)
      :86 text-[12px]→text-(--text-caption)
      ...（完整列出每行）
      验证: `grep 'text-\[[0-9]' SRC/features/ai/AiMessageList.tsx | wc -l` → 0
```

这是 **1 个任务**（含 17 个实例），不是 17 个任务。

### 异质任务示例（创建/重构型）

```markdown
- [ ] 创建 `Table.tsx` compound Primitive
      规格: Table/TableHeader/TableBody/TableRow/TableCell, 支持 variant="striped"
      验证: `pnpm typecheck && grep 'Table' SRC/components/primitives/index.ts`

- [ ] 为 `Table` 编写单元测试
      覆盖: striped variant, aria-sort, aria-selected, 空表格
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Table.test.tsx`

- [ ] 为 `Table` 创建 Story
      验证: `pnpm -C apps/desktop storybook:build`
```

这是 **3 个任务**。

### 上限

- 每个 micro-change **≤ 15 个任务**
- 超过 15 个：按子目录或操作类型继续拆

---

## 三、文件格式

### proposal.md（≤ 80 行）

```markdown
# v1-XXy: [3 字动词] + [范围]

> 属于 v1-XX-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境（3 行以内）

为什么要做、做了什么效果、不做有什么风险。

## 当前状态

- `<scan command>` → <当前值>

## 目标状态

- `<scan command>` → <目标值>

## 不做什么

- <明确排除项>

## 完成验证

1. `<command>` → <期望>
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run <相关pattern>` → all pass
```

**不需要 "Why / 威胁分析 / 用户影响" 叙事。** 父 change 的 proposal.md 里有，引用即可。

### tasks.md

```markdown
# Tasks: v1-XXy [标题]

- **父 change**: v1-XX-\*
- **状态**: 📋 待实施
- **任务数**: N

---

## 文件组 A（如 AiMessageList 相关）

- [ ] 任务描述...
      验证: ...

- [ ] 任务描述...
      验证: ...

---

## 完成验证

\`\`\`bash
<整体验证命令>
\`\`\`
```

---

## 四、目录规则

```
openspec/changes/
├── v1-18-arbitrary-value-cleanup/        ← 父 change（保留，不删）
│   ├── proposal.md                       ← 保留原 proposal 作参考
│   └── tasks.md                          ← 标记为 "已拆分，见 micro-changes"
├── v1-18a-cleanup-ai-font-sizes/         ← micro-change
│   ├── proposal.md
│   └── tasks.md
├── v1-18b-cleanup-character-font-sizes/  ← micro-change
│   ├── proposal.md
│   └── tasks.md
└── ...
```

- 父 change 的 `tasks.md` 第一行改为：`> ⚠️ 本 change 已拆分为 micro-changes: v1-XXa, v1-XXb, ...。以下为历史记录。`
- 父 change 的 `proposal.md` 不改。

---

## 五、每个 Change 的拆分指令

> 以下按 change 编号逐个给出：扫描命令、真实状态、拆分方案。
> **你执行时必须先跑扫描命令，用实际输出生成任务，不要照抄下面的数字。**

### 跳过的 Changes

| Change       | 原因                               |
| ------------ | ---------------------------------- |
| v1-00        | 主计划，不是代码 change            |
| v1-01~v1-05  | 已归档，271/271 勾选，代码验证通过 |
| v1-26, v1-27 | 目录不存在，未规划                 |

---

### v1-06 AI 面板整修 [~85% done, 88 tasks → 拆]

**扫描**:

```bash
wc -l SRC/features/ai/AiMessageList.tsx  # 484 行，需拆
wc -l SRC/features/ai/SkillPicker.tsx    # 339 行，边缘
grep -rn 'hover.*glow\|focus.*ring' SRC/features/ai/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
```

**拆分方案**:
| micro-change | 范围 | 扫描 |
|-------------|------|------|
| `v1-06a-aimessagelist-split` | AiMessageList 484→2~3 个子组件 | `wc -l` 每个子组件 ≤ 250 |
| `v1-06b-ai-hover-focus` | AI 面板组件的 hover/focus 动效补齐 | 目视逐文件检查 |

**已完成的部分**: 读父 tasks.md，逐条用 grep/代码检查标记 `[x]`。未完成的归入上述 micro-change。

---

### v1-07 Settings 精修 [~75% done, 56 tasks → 拆]

**扫描**:

```bash
grep -rn '\(w\|h\|p\|gap\)-\[[0-9]' SRC/features/settings/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
grep -rn 'hover\|transition' SRC/features/settings/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
```

**拆分方案**:
| micro-change | 范围 |
|-------------|------|
| `v1-07a-settings-arbitrary-cleanup` | 硬编码 px 值清理 |
| `v1-07b-settings-interaction-polish` | hover 态 / slider 刻度 / 动效 |

---

### v1-08 文件树像素精修 [~65% done, 68 tasks → 拆]

**扫描**:

```bash
grep -rn '\(w\|h\|p\|gap\)-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
grep -rn 'rotate\|spin\|animation' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
grep -rn 'IconBar\|icon-bar\|w-12\|48px' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
```

**拆分方案**:
| micro-change | 范围 |
|-------------|------|
| `v1-08a-filetree-arbitrary-cleanup` | 剩余硬编码像素值 |
| `v1-08b-filetree-animations` | 箭头旋转、展开折叠动画 |

---

### v1-09 命令面板搜索 [~70% done, 84 tasks → 拆]

**扫描**:

```bash
grep -rn 'color-accent-blue' SRC/ --include='*.tsx' | grep -v test | grep -v stories  # 已知 1 处
grep -rn '\(w\|h\|p\|gap\)-\[[0-9]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
grep -rn '\(w\|h\|p\|gap\)-\[[0-9]' SRC/components/composites/Command*.tsx | grep -v test | grep -v stories | wc -l
```

**拆分方案**:
| micro-change | 范围 |
|-------------|------|
| `v1-09a-command-token-fix` | CommandItem `--color-accent-blue` → `--color-info` + 其他 token 问题 |
| `v1-09b-search-arbitrary-cleanup` | 搜索面板硬编码像素值 |
| `v1-09c-search-interaction-polish` | 搜索结果高亮、键盘导航反馈 |

---

### v1-10 侧面板统一 [~95% done, 73 tasks → 验证为主]

**扫描**:

```bash
# 几乎全部完成，重点验证
grep -rn 'PanelHeader' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
```

**操作**: 不拆。逐条验证父 tasks.md，标 `[x]`。剩余未完成项（如有）归入 v1-16 的 micro-change。

---

### v1-11 空/加载/错误状态 [~90% done, 65 tasks → 验证为主]

**扫描**:

```bash
grep -rn 'EmptyState' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # 47
grep -rn 'LoadingState\|Skeleton' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
```

**操作**: 不拆。逐条验证，标 `[x]`。少量未完成项归入 1 个 micro-change `v1-11a-state-coverage-gaps`。

---

### v1-12 交互动效+原生 HTML [~85% done（纠偏后）, 88 tasks → 拆]

**关键纠偏**: 之前报 40%，实际 85%。

- ✅ CSS 工具类 `.transition-default/.transition-slow/.scroll-shadow-y` 已在 `SRC/styles/main.css:357-384`
- ✅ AppShell 已从 1,267 行拆到 153 行
- ✅ features/ 原生 HTML 仅剩 2 处（AiInputArea textarea，合法限制）
- 🔲 SkillManagerDialog 617 行待拆
- 🔲 transition class 仅 7 处使用，应铺到更多面板

**扫描**:

```bash
wc -l SRC/features/ai/SkillManagerDialog.tsx  # 617
grep -rn 'transition-default\|transition-slow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # 7
grep -rn 'scroll-shadow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
```

**拆分方案**:
| micro-change | 范围 | 任务数估计 |
|-------------|------|-----------|
| `v1-12a-skillmanager-split` | SkillManagerDialog 拆成 ≤300 行的子组件 | ~8 |
| `v1-12b-transition-class-rollout` | 把 transition-default/slow 铺到所有面板 | ~10 |
| `v1-12c-scroll-shadow-rollout` | 把 scroll-shadow-y 铺到可滚动容器 | ~8 |

**已完成的**: CSS 工具类、AppShell 解耦、原生 HTML 清理 — 全部标 `[x]`。

---

### v1-13 eslint-disable 审计 [审计标记 0%, 33 tasks → 拆]

**扫描**:

```bash
grep -rn 'eslint-disable' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # 29
grep -rn '審計\|审计' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # 预期 0
```

**拆分方案**:
| micro-change | 范围 |
|-------------|------|
| `v1-13a-eslint-audit-tags` | 逐条审计 features/ 的 eslint-disable，添加 `// 审计：vX-XX #NNNN KEEP/TODO` 标记 |

每个 eslint-disable 行 = 1 个实例。按文件分组为任务。

---

### v1-14 对话框系统 [~88% done, 60 tasks → 验证+小拆]

**扫描**:

```bash
grep -rn 'Dialog' SRC/components/primitives/ --include='*.tsx' -l
find SRC/ -name '*Dialog*.tsx' | grep -v test | grep -v stories | wc -l
```

**操作**: 逐条验证标 `[x]`。剩余 AC-17/18 未做项归入 `v1-14a-dialog-remaining`。

---

### v1-15 AI Overlay 组件 [~95% done, 55 tasks → 验证为主]

**操作**: 逐条验证标 `[x]`。不拆。微量剩余归入父 tasks.md 备注。

---

### v1-16 Quality + RightPanel + 杂项 [~65% done, 71 tasks → 拆]

**扫描**:

```bash
# 缺少 PanelHeader 的面板（已知 9 个）:
grep -rLn 'PanelHeader' SRC/features/*/ --include='*Panel.tsx' | grep -v test | grep -v stories
# arbitrary 像素值
grep -rn '\(w\|h\|p\|gap\)-\[[0-9]' SRC/features/quality-gates/ SRC/features/rightpanel/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
```

**拆分方案**:
| micro-change | 范围 |
|-------------|------|
| `v1-16a-panelheader-rollout` | 9 个面板接入 PanelHeader |
| `v1-16b-quality-rightpanel-cleanup` | quality-gates + rightpanel 硬编码像素清理 |

---

### v1-17 字体打包 + 视觉回归 [100% done, 54 tasks → 验证]

**操作**: 代码已全部完成。逐条验证标 `[x]`。不拆。

---

### v1-18 Arbitrary 值清理 [0% done, 61 tasks → 彻底重拆]

**这是最大的真实欠账。** 声称 100% 但实际 0%。265 个硬编码像素值分布如下：

| 目录                      | 数量 | 类型                                                                                             |
| ------------------------- | ---- | ------------------------------------------------------------------------------------------------ |
| features/ai/              | 38   | 主要 text-[Npx]                                                                                  |
| features/character/       | 30   | text-[Npx] + p-[Npx]                                                                             |
| features/version-history/ | 29   | text-[Npx]                                                                                       |
| features/quality-gates/   | 21   | text-[Npx]                                                                                       |
| features/search/          | 19   | text-[Npx]                                                                                       |
| features/diff/            | 16   | text-[Npx]                                                                                       |
| features/outline/         | 6    | text-[Npx]                                                                                       |
| features/rightpanel/      | 6    | text-[Npx]                                                                                       |
| features/settings/        | 0    | ~~6~~ 全为 `[var(--*)]` token 引用                                                               |
| features/settings-dialog/ | 12   | text-[Npx] + max-w-[Npx]（已归入 v1-07a）                                                        |
| features/projects/        | 4    | text-[Npx]                                                                                       |
| features/editor/          | 3    | text-[Npx]                                                                                       |
| features/files/           | 3    | text-[Npx]                                                                                       |
| features/dashboard/       | 1    | text-[Npx]                                                                                       |
| features/memory/          | 1    | text-[Npx]                                                                                       |
| features/kg/              | 2    | text-[Npx]                                                                                       |
| components/primitives/    | 35   | 需逐个审计合法性                                                                                 |
| components/composites/    | 8    | text-[Npx]                                                                                       |
| components/patterns/      | 4    | text-[Npx]                                                                                       |
| components/layout/        | 3    | ~~33~~ 实际仅 3 处硬编码（text-[11px]、text-[13px]、text-[9px]），其余为 `[var(--*)]` token 引用 |
| components/features/      | 2    | text-[Npx]                                                                                       |

**扫描命令（Agent 必须跑，用实际行号生成任务）**:

```bash
# 对每个目标目录执行
grep -rn '\(text\|w\|h\|p\|m\|gap\|rounded\)-\[[0-9]' SRC/features/<dir>/ --include='*.tsx' | grep -v test | grep -v stories | grep -v __tests__
```

**拆分方案（按目录，每个 ≤ 15 任务 = ≤ 15 文件）**:
| micro-change | 目录 | 任务数 = 文件数 |
|-------------|------|---------------|
| `v1-18a-cleanup-ai-font-sizes` | features/ai/ | ~7 文件 |
| `v1-18b-cleanup-character-font-sizes` | features/character/ | ~5 文件 |
| `v1-18c-cleanup-vhistory-diff` | features/version-history/ + features/diff/ | ~8 文件 |
| `v1-18d-cleanup-quality-search` | features/quality-gates/ + features/search/ | ~6 文件 |
| `v1-18e-cleanup-remaining-features` | outline/rightpanel/settings/projects/editor/files/dashboard/memory/kg | ~10 文件 |
| `v1-18f-cleanup-components` | components/composites/ + patterns/ + layout/ + features/ | ~8 文件 |
| `v1-18g-audit-primitives` | components/primitives/（逐个判定：Primitive 内部用硬编码可能合法） | ~10 文件 |

**重要区分**:

- `text-[13px]` → `text-(--text-body)` ← **要改**（硬编码像素）
- `text-[var(--color-fg-muted)]` ← **不改**（token 引用，合法）
- `rounded-[var(--radius-lg)]` ← **不改**（token 引用，合法）
- `rounded-[10px]` → `rounded-[var(--radius-lg)]` 或对应 token ← **要改**

Golden Case 见 `openspec/changes/v1-18a-cleanup-ai-font-sizes/`。

---

### v1-19 无障碍键盘 [~60% done, 38 tasks → 小拆]

**扫描**:

```bash
grep -rn 'aria-label' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # 70
grep -rn 'role=' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # 70
# axe CI gate 是否存在
find apps/desktop -name '*axe*' -o -name '*a11y*' | head -10
```

**拆分方案**:
| micro-change | 范围 |
|-------------|------|
| `v1-19a-aria-gaps` | 缺少 aria-label/role 的交互元素补齐 |
| `v1-19b-keyboard-nav` | 键盘导航增强（Tab 序、焦点管理） |

---

### v1-20 Storybook 卓越 [~65% done, 5 tasks → 不拆]

**操作**: 只有 5 个任务。逐条验证，标 `[x]`。不拆。

---

### v1-21 性能微交互 [~75% done, 无 tasks → 需创建]

**扫描**:

```bash
grep -rn 'useVirtualizer\|react-virtual' SRC/ --include='*.tsx' | grep -v test | wc -l  # 10
grep -rn 'Suspense\|lazy(' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # 17
```

**操作**: 读 proposal.md，根据 AC 验证哪些已完成。为剩余项创建 1 个 micro-change `v1-21a-progressive-loading`。

---

### v1-22 品牌标识 [~80% done, 无 tasks → 需创建]

**操作**: 读 proposal.md，根据 AC 验证哪些已完成。为剩余项创建 1 个 micro-change `v1-22a-onboarding-animations`。

---

### v1-23 色彩系统 [~95% done, 52 tasks → 验证为主]

**操作**: 逐条验证标 `[x]`。不拆。

---

### v1-24 组件库扩展 [0% done, 148 tasks → 彻底重拆]

**扫描**:

```bash
# 确认哪些组件已存在
find SRC/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' | sort
```

**拆分方案（按组件，每组件 3 任务：实现+测试+Story）**:
| micro-change | 范围 | 任务数 |
|-------------|------|-------|
| `v1-24a-table-primitive` | Table compound component | ~5 |
| `v1-24b-separator-primitive` | Separator 组件 | ~4 |
| `v1-24c-alert-primitive` | Alert 组件 | ~5 |
| `v1-24d-segmented-control` | SegmentedControl 组件 | ~5 |
| `v1-24e-progress-primitive` | Progress 组件 | ~4 |
| `v1-24f-input-prefix-suffix` | Input 扩展 prefix/suffix | ~4 |
| `v1-24g-integration-export` | 全部导出到 index.ts + 集成验证 | ~5 |

---

### v1-25 密度系统 [0% done, 57 tasks → 拆]

**拆分方案**:
| micro-change | 范围 | 任务数 |
|-------------|------|-------|
| `v1-25a-component-tokens` | tokens.css 新增 component token 层 | ~5 |
| `v1-25b-density-provider` | DensityProvider + useDensity hook | ~6 |
| `v1-25c-primitive-token-migration` | 现有 Primitive 迁移到 component token | ~8 |
| `v1-25d-density-stories` | 密度对比 Story + 回归验证 | ~4 |

---

## 六、执行规程

### 步骤 1：逐 change 扫描

对第五节中每个 change，执行其扫描命令，记录实际数值。

### 步骤 2：验证已完成任务

对标"验证为主"的 change（v1-10/11/15/17/20/23），读其 tasks.md 逐条用 grep/代码验证。
已完成的 → 改 `- [ ]` 为 `- [x]`。

### 步骤 3：标记父 change

对需要拆分的 change，在其 tasks.md 第一行插入：

```markdown
> ⚠️ 本 change 已拆分为 micro-changes: v1-XXa, v1-XXb, ...。以下为历史记录。
```

### 步骤 4：创建 micro-change 目录

对每个 micro-change：

1. `mkdir -p openspec/changes/<micro-change-name>/`
2. 写 `proposal.md`（≤ 80 行，格式见第三节）
3. 写 `tasks.md`（≤ 15 任务，格式见第二节）
4. 任务中的行号**必须来自扫描命令的实际输出**

### 步骤 5：不做的事

- ❌ 不修改任何源代码
- ❌ 不删除父 change 目录
- ❌ 不修改父 change 的 proposal.md
- ❌ 不修改 EXECUTION_ORDER.md（那是另一个任务）

---

## 七、Golden Case

见 `openspec/changes/v1-18a-cleanup-ai-font-sizes/` 的 proposal.md 和 tasks.md。

那是一个完整示范：7 个任务（7 个文件），每个任务列出实例和验证命令。所有其他 micro-change 照此格式生成。

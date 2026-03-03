# Active Changes Execution Order

更新时间：2026-03-03 15:20

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **6**（`fe-accessibility-aria-live`、`fe-command-palette-search-uplift`、`fe-deterministic-now-injection`、`fe-reduced-motion-respect`、`fe-token-escape-sweep`、`fe-visual-noise-reduction`）。
- 执行模式：**4 批次渐进推进**（第一批核心体验 → 第二批功能补全 → 第三批设计系统回归 → 第四批独立 Issue 收口）。
- 规则：
  - 任一 change 开始 Red 前，必须完成该 change 的依赖同步检查（Dependency Sync Check）。
  - 同批次内并行度由文件级冲突决定，无共享文件的 change 可并行。
  - 各批次最大并行度见对应批次表头。
  - 有 Owner 决策阻塞（D1/D2/D3）的 change 必须等决策落盘后才能进入 Red。

## 执行顺序

### 第一批：核心体验修复

最大并行度：2 lane（AiPanel 簇与 Layout 簇无文件交叉）。

| Lane | 顺序 | Change | 文件冲突簇 | 依赖 | 状态 |
|------|------|--------|-----------|------|------|
| 1 | 1-1 | `fe-rightpanel-ai-tabbar-layout` | AiPanel 簇 | — | 已完成并归档（PR #801） |
| 1 | 1-2 | `fe-rightpanel-ai-guidance-and-style` | AiPanel 簇 | `fe-rightpanel-ai-tabbar-layout` | 已完成并归档（PR #809） |
| 1 | 1-3 | `fe-cleanup-proxysection-and-mocks` | AiPanel 簇 | — | 已完成并归档（PR #817） |
| 2 | 2-1 | `fe-spec-drift-iconbar-rightpanel-alignment` | Layout 簇 | D1/D2/D3 已决策 | 已完成并归档（PR #799） |
| 2 | 2-2 | `fe-leftpanel-dialog-migration` | Layout 簇 | `fe-spec-drift-iconbar-rightpanel-alignment`, D1/D2 已决策 | 已完成并归档（PR #808） |
| 2 | 2-3 | `fe-ai-panel-toggle-button` | Layout 簇 | — | 已完成并归档（PR #818） |
| — | 收尾 | `fe-dashboard-welcome-merge-and-ghost-actions` | AppShell 簇 | `fe-cleanup-proxysection-and-mocks`, `fe-ui-open-folder-entrypoints`(第二批), 且与 leftpanel/toggle 共享 AppShell.tsx 需等其完成 | 已完成并归档（PR #830） |

#### 第一批文件冲突矩阵

并行规则基于以下文件级冲突分析。共享源文件的 change 不可并行。

| | cleanup | tabbar | guidance | iconbar | leftpanel | toggle | dashboard |
|---|---|---|---|---|---|---|---|
| cleanup | — | AiPanel.tsx | AiPanel.tsx | ✅ | ✅ | ✅ | ✅ |
| tabbar | AiPanel.tsx | — | AiPanel.tsx | ✅ | ✅ | ✅ | ✅ |
| guidance | AiPanel.tsx | AiPanel.tsx | — | ✅ | ✅ | ✅ | ✅ |
| iconbar | ✅ | ✅ | ✅ | — | IconBar + layoutStore | layoutStore | ✅ |
| leftpanel | ✅ | ✅ | ✅ | IconBar + layoutStore | — | AppShell + layoutStore | AppShell |
| toggle | ✅ | ✅ | ✅ | layoutStore | AppShell + layoutStore | — | AppShell |
| dashboard | ✅ | ✅ | ✅ | ✅ | AppShell | AppShell | — |

✅ = 无共享文件，可并行。单元格内容 = 冲突文件，不可并行。

### 第二批：功能补全

最大并行度：4 lane（开局）；`fe-ui-open-folder-entrypoints` 与 `fe-skeleton-loading-states` 因 `DashboardPage.tsx` 互斥。

| Lane | 顺序 | Change | 文件冲突簇 | 依赖 | 状态 |
|------|------|--------|-----------|------|------|
| A | 2-1 | `fe-ipc-open-folder-contract` | Main/Preload IPC 簇 | — | 已完成并归档（PR #830） |
| A | 2-2 | `fe-ui-open-folder-entrypoints` | main/index + Dashboard/Onboarding 簇 | `fe-ipc-open-folder-contract`；且与 `fe-skeleton-loading-states` 互斥（`DashboardPage.tsx`） | 已完成并归档（PR #830） |
| B | 2-1 | `fe-project-image-cropper` | ProjectDialog/ImageCropper 簇 | — | 已完成并归档（PR #840） |
| C | 2-1 | `fe-error-boundary-partitioning` | AppShell/ErrorBoundary 启动簇 | — | 已完成并归档（PR #841） |
| D | 2-1 | `fe-skeleton-loading-states` | Dashboard loading 簇 | 与 `fe-ui-open-folder-entrypoints` 互斥（`DashboardPage.tsx`） | 已完成并归档（PR #842） |
| E | 2-1 | `fe-onboarding-flow-refresh` | OnboardingPage 簇 | `fe-ui-open-folder-entrypoints`, `fe-i18n-language-switcher-foundation` | 已完成并归档（PR #843） |

#### 第二批文件冲突矩阵

| | ipc-open-folder | ui-open-folder | image-cropper | onboarding | error-boundary | skeleton |
|---|---|---|---|---|---|---|
| ipc-open-folder | — | main/index.ts | ✅ | ✅ | ✅ | ✅ |
| ui-open-folder | main/index.ts | — | ✅ | OnboardingPage.tsx | ✅ | DashboardPage.tsx |
| image-cropper | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| onboarding | ✅ | OnboardingPage.tsx | ✅ | — | ✅ | ✅ |
| error-boundary | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| skeleton | ✅ | DashboardPage.tsx | ✅ | ✅ | ✅ | — |

✅ = 无共享文件，可并行。单元格内容 = 冲突文件，不可并行。

### 第三批：设计系统回归

最大并行度：Wave 3a = 3 lane，Wave 3b = 2 lane，Wave 3c = 1 lane（串行）。

| Lane | 顺序 | Change | 文件冲突簇 | 依赖 | 状态 |
|------|------|--------|-----------|------|------|
| A | 3a-1 | `fe-searchpanel-tokenized-rewrite` | SearchPanel + `main.css` 簇 | 前置 hotfix 已归档 | 已完成并归档（PR #898） |
| B | 3a-1 | `fe-zenmode-token-escape-cleanup` | ZenMode + `tokens.css` 簇 | — | 已完成并归档（PR #899） |
| C | 3a-1 | `fe-dashboard-herocard-responsive-layout` | DashboardPage 簇 | — | 已完成并归档（PR #900） |
| A | 3b-1 | `fe-lucide-icon-unification` | icon import 广撒网簇 | Wave 3a 完成后（分别与 searchpanel/zenmode/herocard 共享文件） | 已完成并归档（PR #909） |
| B | 3b-1 | `fe-theme-switch-smoothing` | `main.css` + `tokens.css` 簇 | Wave 3a 完成后（与 searchpanel/zenmode 共享样式文件） | 已完成并归档（PR #910） |
| A | 3c-1 | `fe-feature-focus-visible-coverage` | AiPanel/SearchPanel/Dashboard + `main.css` + `tokens.css` 簇 | Wave 3b 完成后 | 已完成并归档（PR #928） |
| A | 3c-2 | `fe-visual-noise-reduction` | AiPanel/Dashboard + `tokens.css` 簇 | `fe-feature-focus-visible-coverage`；且需 `fe-rightpanel-ai-tabbar-layout`, `fe-rightpanel-ai-guidance-and-style`, `fe-leftpanel-dialog-migration` | 待执行 |
| A | 3c-3 | `fe-reduced-motion-respect` | AiPanel/SearchPanel + `main.css` + `tokens.css` 簇 | `fe-visual-noise-reduction` | 待执行 |

#### 第三批文件冲突矩阵

| | searchpanel | lucide | focus-visible | visual-noise | reduced-motion | zenmode | herocard | theme-switch |
|---|---|---|---|---|---|---|---|---|
| searchpanel | — | SearchPanel.tsx | SearchPanel.tsx + main.css | ✅ | SearchPanel.tsx + main.css | ✅ | ✅ | main.css |
| lucide | SearchPanel.tsx | — | AiPanel.tsx + SearchPanel.tsx + DashboardPage.tsx + 多文件 | AiPanel.tsx + ChatHistory.tsx + DashboardPage.tsx | AiPanel.tsx + SearchPanel.tsx | ZenMode.tsx | DashboardPage.tsx | ✅ |
| focus-visible | SearchPanel.tsx + main.css | 多文件 | — | AiPanel.tsx + DashboardPage.tsx + tokens.css | AiPanel.tsx + SearchPanel.tsx + main.css + tokens.css | tokens.css | DashboardPage.tsx | main.css + tokens.css |
| visual-noise | ✅ | AiPanel.tsx + DashboardPage.tsx + 多文件 | AiPanel.tsx + DashboardPage.tsx + tokens.css | — | AiPanel.tsx + tokens.css | tokens.css | DashboardPage.tsx | tokens.css |
| reduced-motion | SearchPanel.tsx + main.css | AiPanel.tsx + SearchPanel.tsx | AiPanel.tsx + SearchPanel.tsx + main.css + tokens.css | AiPanel.tsx + tokens.css | — | tokens.css | ✅ | main.css + tokens.css |
| zenmode | ✅ | ZenMode.tsx | tokens.css | tokens.css | tokens.css | — | ✅ | tokens.css |
| herocard | ✅ | DashboardPage.tsx | DashboardPage.tsx | DashboardPage.tsx | ✅ | ✅ | — | ✅ |
| theme-switch | main.css | ✅ | main.css + tokens.css | tokens.css | main.css + tokens.css | tokens.css | ✅ | — |

✅ = 无共享文件，可并行。单元格内容 = 冲突文件，不可并行。

### 第四批：独立 Issue（冲突簇波次制）

最大并行度：独立 lane = 2；渲染层 Wave 4a = 4 lane，Wave 4b = 5 lane，Wave 4c = 3 lane，Wave 4d = 1 lane，Wave 4e = 1 lane。

| Lane | 顺序 | Change | 文件冲突簇 | 依赖 | 状态 |
|------|------|--------|-----------|------|------|
| N1 | 4-0 | `fe-desktop-native-binding-packaging` | 主进程独立簇 | — | 已完成并归档（PR #911） |
| N2 | 4-0 | `fe-desktop-window-lifecycle-uplift` | 主进程独立簇 | — | 已完成并归档（PR #912） |
| A | 4a-1 | `fe-i18n-language-switcher-foundation` | i18n/Onboarding/SettingsGeneral 簇 | — | 已完成并归档（PR #843） |
| B | 4a-1 | `fe-composites-p0-panel-and-command-items` | SearchPanel/AiPanel/CommandPalette/FileTree 簇 | — | 已完成并归档（PR #919） |
| C | 4a-1 | `fe-editor-tokenization-selection-and-spacing` | `tokens.css` + `main.css` + typography 簇 | — | 已完成并归档（PR #917） |
| D | 4a-1 | `fe-editor-advanced-interactions` | EditorPane 簇 | — | 已完成并归档（PR #918） |
| A | 4b-1 | `fe-i18n-core-pages-keying` | SearchPanel/AiPanel/CommandPalette/Dashboard/Onboarding 簇 | `fe-i18n-language-switcher-foundation` | 已完成并归档（PR #937） |
| B | 4b-1 | `fe-composites-p1-search-and-forms` | SettingsGeneral + Forms 簇 | `fe-composites-p0-panel-and-command-items` | 已完成并归档（PR #929） |
| C | 4b-1 | `fe-composites-p2-empties-and-confirms` | FileTreePanel + Empty/Confirm 簇 | `fe-composites-p0-panel-and-command-items` | 已完成并归档（PR #930） |
| D | 4b-1 | `fe-editor-inline-diff-decoration-integration` | VersionHistoryContainer + `tokens.css` 簇 | — | 已完成并归档（PR #938） |
| E | 4b-1 | `fe-hotkeys-shortcuts-unification` | EditorPane 簇 | `fe-editor-advanced-interactions` 完成后（共享 `EditorPane.tsx`） | 已完成并归档（PR #931） |
| A | 4c-1 | `fe-accessibility-aria-live` | AiPanel/SearchPanel/ChatHistory 簇 | `fe-composites-p0-panel-and-command-items`, `fe-i18n-core-pages-keying`（已归档）完成后（共享 `AiPanel.tsx`/`SearchPanel.tsx`） | 待执行 |
| B | 4c-1 | `fe-command-palette-search-uplift` | CommandPalette 簇 | `fe-composites-p0-panel-and-command-items`, `fe-i18n-core-pages-keying`（已归档）完成后（共享 `CommandPalette.tsx`） | 待执行 |
| C | 4c-1 | `fe-editor-context-menu-and-tooltips` | EditorPane + Tooltip 簇 | `fe-editor-advanced-interactions`, `fe-hotkeys-shortcuts-unification`（已归档）完成后（共享 `EditorPane.tsx`） | 已完成并归档（PR #939） |
| A | 4d-1 | `fe-deterministic-now-injection` | SearchPanel/Dashboard/ChatHistory/VersionHistory 簇 | `fe-accessibility-aria-live`, `fe-i18n-core-pages-keying`（已归档）, `fe-editor-inline-diff-decoration-integration`（已归档）完成后 | 待执行 |
| A | 4e-1 | `fe-token-escape-sweep` | SearchPanel + `tokens.css` + ZenMode 簇 | `fe-deterministic-now-injection`, `fe-accessibility-aria-live`, `fe-i18n-core-pages-keying`（已归档）, `fe-composites-p0-panel-and-command-items`, `fe-editor-tokenization-selection-and-spacing`, `fe-editor-inline-diff-decoration-integration`（已归档）完成后 | 待执行 |

#### 第四批文件冲突矩阵

| | i18n-switcher | i18n-keying | token-sweep | comp-p0 | comp-p1 | comp-p2 | a11y | deterministic | native-binding | window-lifecycle | cmd-palette | editor-token | editor-diff | editor-advanced | editor-ctx-menu | hotkeys |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| i18n-switcher | — | OnboardingPage.tsx | ✅ | ✅ | SettingsGeneral.tsx | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| i18n-keying | OnboardingPage.tsx | — | SearchPanel.tsx | AiPanel.tsx + CommandPalette.tsx + SearchPanel.tsx | ✅ | ✅ | AiPanel.tsx + SearchPanel.tsx | SearchPanel.tsx + DashboardPage.tsx | ✅ | ✅ | CommandPalette.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| token-sweep | ✅ | SearchPanel.tsx | — | SearchPanel.tsx | ✅ | ✅ | SearchPanel.tsx | SearchPanel.tsx | ✅ | ✅ | ✅ | tokens.css | tokens.css | ✅ | ✅ | ✅ |
| comp-p0 | ✅ | AiPanel.tsx + CommandPalette.tsx + SearchPanel.tsx | SearchPanel.tsx | — | ✅ | FileTreePanel.tsx | AiPanel.tsx + SearchPanel.tsx | SearchPanel.tsx | ✅ | ✅ | CommandPalette.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| comp-p1 | SettingsGeneral.tsx | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| comp-p2 | ✅ | ✅ | ✅ | FileTreePanel.tsx | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| a11y | ✅ | AiPanel.tsx + SearchPanel.tsx | SearchPanel.tsx | AiPanel.tsx + SearchPanel.tsx | ✅ | ✅ | — | ChatHistory.tsx + SearchPanel.tsx | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| deterministic | ✅ | SearchPanel.tsx + DashboardPage.tsx | SearchPanel.tsx | SearchPanel.tsx | ✅ | ✅ | ChatHistory.tsx + SearchPanel.tsx | — | ✅ | ✅ | ✅ | ✅ | VersionHistoryContainer.tsx | ✅ | ✅ | ✅ |
| native-binding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| window-lifecycle | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cmd-palette | ✅ | CommandPalette.tsx | ✅ | CommandPalette.tsx | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| editor-token | ✅ | ✅ | tokens.css | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | tokens.css | ✅ | ✅ | ✅ |
| editor-diff | ✅ | ✅ | tokens.css | ✅ | ✅ | ✅ | ✅ | VersionHistoryContainer.tsx | ✅ | ✅ | ✅ | tokens.css | — | ✅ | ✅ | ✅ |
| editor-advanced | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | EditorPane.tsx | EditorPane.tsx |
| editor-ctx-menu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | EditorPane.tsx | — | EditorPane.tsx |
| hotkeys | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | EditorPane.tsx | EditorPane.tsx | — |

✅ = 无共享文件，可并行。单元格内容 = 冲突文件，不可并行。

## 依赖说明

- 依赖语义：`A -> B` 表示 B 进入 Red 前，A 必须完成 Green 且证据落盘（至少包含 RUN_LOG 记录与 preflight 通过）；若 B 同时带 Owner 决策阻塞，则执行门禁为“前置完成 + 决策落盘”双条件。
- 并行/互斥规则：同批次仅当“无共享文件 + 无前置依赖 + 无决策阻塞”同时成立时可并行；冲突矩阵中非 `✅` 的共享文件关系一律互斥，按 lane 顺序串行推进。
- Owner 决策门：凡标记 D1/D2/D3 的 change，在决策结论写入本文件并同步相关 spec 前不得进入 Red；若决策结论变化，先更新本节与“Owner 决策阻塞项”后再继续执行。
- 第一批两条 lane 依赖边界：
  - Lane 1（AiPanel 簇）在 `AiPanel.tsx` 范围内串行推进，不阻塞 Lane 2。
  - Lane 2（Layout 簇）在 `IconBar.tsx`/`layoutStore.tsx`/`AppShell.tsx` 范围内串行推进，不反向阻塞 Lane 1。
  - 跨 lane 的唯一硬依赖在收尾：`fe-dashboard-welcome-merge-and-ghost-actions` 需等待 Lane 1 的 `fe-cleanup-proxysection-and-mocks`、Lane 2 的 `fe-ai-panel-toggle-button`，并额外等待第二批 `fe-ui-open-folder-entrypoints`。

## 依赖拓扑

```
第一批（2 lane 并行 + 收尾）
  Lane 1 (AiPanel 簇，串行，共享 AiPanel.tsx):
    fe-rightpanel-ai-tabbar-layout
      ──→ fe-rightpanel-ai-guidance-and-style
      ──→ fe-cleanup-proxysection-and-mocks

  Lane 2 (Layout 簇，串行，共享 layoutStore.tsx):
    fe-spec-drift-iconbar-rightpanel-alignment
      ──→ fe-leftpanel-dialog-migration          (共享 IconBar.tsx + layoutStore.tsx)
      ──→ fe-ai-panel-toggle-button              (共享 AppShell.tsx + layoutStore.tsx)

  收尾 (等 Lane 1 cleanup + Lane 2 toggle + 第二批 open-folder):
    fe-dashboard-welcome-merge-and-ghost-actions  (共享 AppShell.tsx)

第二批（开局 4 lane，后续收敛）
  fe-ipc-open-folder-contract ──→ fe-ui-open-folder-entrypoints ──→ fe-onboarding-flow-refresh
                                                                ──→ fe-dashboard-welcome-merge-and-ghost-actions (第一批)
  fe-skeleton-loading-states 与 fe-ui-open-folder-entrypoints 互斥（共享 DashboardPage.tsx，不可并行）
  fe-i18n-language-switcher-foundation (第四批) ──→ fe-onboarding-flow-refresh

第三批（3 波推进）
  Wave 3a: fe-searchpanel-tokenized-rewrite ∥ fe-zenmode-token-escape-cleanup ∥ fe-dashboard-herocard-responsive-layout（已完成并归档，PR #898/#899/#900）
  Wave 3b: fe-lucide-icon-unification ∥ fe-theme-switch-smoothing（已完成并归档，PR #909/#910）
  Wave 3c: fe-feature-focus-visible-coverage（已完成并归档，PR #928）──→ fe-visual-noise-reduction ──→ fe-reduced-motion-respect

第四批（独立 lane + 冲突簇波次）
  独立 lane: fe-desktop-native-binding-packaging ∥ fe-desktop-window-lifecycle-uplift（已完成并归档，PR #911/#912）

  Wave 4a:
    fe-i18n-language-switcher-foundation
    fe-composites-p0-panel-and-command-items
    fe-editor-tokenization-selection-and-spacing
    fe-editor-advanced-interactions

  Wave 4b:
    fe-i18n-language-switcher-foundation ──→ fe-i18n-core-pages-keying（已完成并归档，PR #937）
    fe-composites-p0-panel-and-command-items ──→ fe-composites-p1-search-and-forms（已完成并归档，PR #929）
                                          ──→ fe-composites-p2-empties-and-confirms（已完成并归档，PR #930）
    fe-editor-advanced-interactions ──→ fe-hotkeys-shortcuts-unification（已完成并归档，PR #931）
    fe-editor-inline-diff-decoration-integration（已完成并归档，PR #938）

  Wave 4c:
    fe-accessibility-aria-live              （comp-p0 + i18n-keying 前置已满足，待执行）
    fe-command-palette-search-uplift        （comp-p0 + i18n-keying 前置已满足，待执行）
    fe-editor-context-menu-and-tooltips     （已完成并归档，PR #939）

  Wave 4d:
    fe-deterministic-now-injection          (待 a11y + i18n-keying + editor-diff 完成)

  Wave 4e:
    fe-token-escape-sweep                   (待 deterministic + a11y + i18n-keying + comp-p0 + editor-token + editor-diff 完成)
```

已归档前置：
- `fe-rightpanel-ai-tabbar-layout`：已归档到 `openspec/changes/archive/fe-rightpanel-ai-tabbar-layout`（merge commit `ec6d70c9`，PR #801）。
- `fe-spec-drift-iconbar-rightpanel-alignment`：已归档到 `openspec/changes/archive/fe-spec-drift-iconbar-rightpanel-alignment`（merge commit `b2a85696`，PR #799）。
- `fe-hotfix-searchpanel-backdrop-close`：已归档到 `openspec/changes/archive/fe-hotfix-searchpanel-backdrop-close`（commit `c56a1eea`，PR #790）。
- `fe-leftpanel-dialog-migration`：已归档到 `openspec/changes/archive/fe-leftpanel-dialog-migration`（merge commit `7d30ad03`，PR #808）。
- `fe-cleanup-proxysection-and-mocks`：已归档到 `openspec/changes/archive/fe-cleanup-proxysection-and-mocks`（merge commit `51ba5c14`，PR #817）。
- `fe-ai-panel-toggle-button`：已归档到 `openspec/changes/archive/fe-ai-panel-toggle-button`（merge commit `b875b865`，PR #818）。
- `fe-rightpanel-ai-guidance-and-style`：已归档到 `openspec/changes/archive/fe-rightpanel-ai-guidance-and-style`（merge commit `c8d4ba35`，PR #809）。
- `fe-ipc-open-folder-contract`：已归档到 `openspec/changes/archive/fe-ipc-open-folder-contract`（merge commit `91e56f28`，PR #830）。
- `fe-ui-open-folder-entrypoints`：已归档到 `openspec/changes/archive/fe-ui-open-folder-entrypoints`（merge commit `91e56f28`，PR #830）。
- `fe-dashboard-welcome-merge-and-ghost-actions`：已归档到 `openspec/changes/archive/fe-dashboard-welcome-merge-and-ghost-actions`（merge commit `91e56f28`，PR #830）。
- `fe-composites-p0-panel-and-command-items`：已归档到 `openspec/changes/archive/fe-composites-p0-panel-and-command-items`（merge commit `f798c553`，PR #919）。
- `fe-editor-tokenization-selection-and-spacing`：已归档到 `openspec/changes/archive/fe-editor-tokenization-selection-and-spacing`（merge commit `704f0bce`，PR #917）。
- `fe-editor-advanced-interactions`：已归档到 `openspec/changes/archive/fe-editor-advanced-interactions`（merge commit `70bdeee8`，PR #918）。
- `fe-feature-focus-visible-coverage`：已归档到 `openspec/changes/archive/fe-feature-focus-visible-coverage`（merge commit `f7425a94`，PR #928）。
- `fe-composites-p1-search-and-forms`：已归档到 `openspec/changes/archive/fe-composites-p1-search-and-forms`（merge commit `d623ad6e`，PR #929）。
- `fe-composites-p2-empties-and-confirms`：已归档到 `openspec/changes/archive/fe-composites-p2-empties-and-confirms`（merge commit `5365e45a`，PR #930）。
- `fe-hotkeys-shortcuts-unification`：已归档到 `openspec/changes/archive/fe-hotkeys-shortcuts-unification`（merge commit `fd110ee1`，PR #931）。
- `fe-i18n-core-pages-keying`：已归档到 `openspec/changes/archive/fe-i18n-core-pages-keying`（merge commit `c1cf1879`，PR #937）。
- `fe-editor-inline-diff-decoration-integration`：已归档到 `openspec/changes/archive/fe-editor-inline-diff-decoration-integration`（merge commit `4eaadebc`，PR #938）。
- `fe-editor-context-menu-and-tooltips`：已归档到 `openspec/changes/archive/fe-editor-context-menu-and-tooltips`（merge commit `87512187`，PR #939）。

## 本次同步说明（Round 4 串行合并收口）

- 当前子任务：Round 4 closeout（`PR #937/#938/#939` 串行合并后归档与 EO 同步）。
- 依赖关系：`fe-i18n-core-pages-keying`、`fe-editor-inline-diff-decoration-integration`、`fe-editor-context-menu-and-tooltips` 均已完成实现、审计整改与门禁通过。
- 同步结论：以上三项已归档到 `openspec/changes/archive/`，EO 活跃集合已收敛为 6 项；后续按 Wave 4c→4e 继续推进剩余变更。

## Owner 决策阻塞项

| # | 决策项 | 阻塞 change | 状态 | 结论 |
|---|--------|------------|------|------|
| D1 | IconBar `media` 面板处置（补全/删除） | `fe-spec-drift-iconbar-rightpanel-alignment`, `fe-leftpanel-dialog-migration` | 已决策 | 保留但标注 `[FUTURE]` |
| D2 | `graph` vs `knowledgeGraph` 命名统一 | `fe-spec-drift-iconbar-rightpanel-alignment`, `fe-leftpanel-dialog-migration` | 已决策 | 统一到 `knowledgeGraph`（仅改 spec，代码零改动） |
| D3 | RightPanel `Quality` tab 保留/移除 | `fe-spec-drift-iconbar-rightpanel-alignment` | 已决策 | 保留，更新 Spec 为三 tab（AI / Info / Quality） |

## 历史归档

- 审计整改 Wave 1–3（C1–C15）：全部完成并归档。PR #661–#704。
- Workbench lane（ISSUE-606 phase 1–4）：已归档。
- Backend lane（ISSUE-617 × 7 changes）：已归档。
- `fe-hotfix-searchpanel-backdrop-close`：已完成并归档。PR #790。

## 维护规则

- 新增活跃 change 时，必须同步更新本文件中的执行模式、顺序、依赖与进度快照。
- 任一活跃 change 的范围、依赖、状态变化时，必须同步更新本文件。
- 未同步本文件时，不得宣称多变更执行顺序已确认。

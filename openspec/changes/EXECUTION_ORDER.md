# Active Changes Execution Order

更新时间：2026-02-28 21:00

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **38**（前端整改拆分，基于 `docs/frontend-overhaul-plan.md` §七）。
- 执行模式：**5 批次渐进推进**（第零批 Hotfix → 第一批核心体验 → 第二批功能补全 → 第三批设计系统 → 第四批独立 Issue）。
- 规则：
  - 任一 change 开始 Red 前，必须完成该 change 的依赖同步检查（Dependency Sync Check）。
  - 同批次内无依赖关系的 change 可并行（≤3 lane）。
  - 有 Owner 决策阻塞（D1/D2/D3）的 change 必须等决策落盘后才能进入 Red。

## 执行顺序

### 第零批：Hotfix（立即执行）

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `fe-hotfix-searchpanel-backdrop-close` | — | 待执行 |

### 第一批：核心体验修复

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `fe-cleanup-proxysection-and-mocks` | — | 待执行 |
| B | `fe-rightpanel-ai-tabbar-layout` | — | 待执行 |
| A | `fe-rightpanel-ai-guidance-and-style` | `fe-rightpanel-ai-tabbar-layout` | 待执行 |
| C | `fe-spec-drift-iconbar-rightpanel-alignment` | D1/D2/D3 已决策 | 待执行 |
| B | `fe-leftpanel-dialog-migration` | `fe-hotfix-searchpanel-backdrop-close`, D1/D2 已决策 | 待执行 |
| D | `fe-ai-panel-toggle-button` | — | 待执行 |
| A | `fe-dashboard-welcome-merge-and-ghost-actions` | `fe-cleanup-proxysection-and-mocks`, `fe-ui-open-folder-entrypoints` | 待执行 |

### 第二批：功能补全

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `fe-ipc-open-folder-contract` | — | 待执行 |
| A | `fe-ui-open-folder-entrypoints` | `fe-ipc-open-folder-contract` | 待执行 |
| B | `fe-project-image-cropper` | — | 待执行 |
| C | `fe-onboarding-flow-refresh` | `fe-ui-open-folder-entrypoints`, `fe-i18n-language-switcher-foundation` | 待执行 |
| D | `fe-error-boundary-partitioning` | — | 待执行 |
| E | `fe-skeleton-loading-states` | — | 待执行 |

### 第三批：设计系统回归

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `fe-searchpanel-tokenized-rewrite` | `fe-hotfix-searchpanel-backdrop-close` | 待执行 |
| B | `fe-lucide-icon-unification` | — | 待执行 |
| C | `fe-feature-focus-visible-coverage` | — | 待执行 |
| D | `fe-visual-noise-reduction` | `fe-rightpanel-ai-tabbar-layout`, `fe-rightpanel-ai-guidance-and-style`, `fe-leftpanel-dialog-migration` | 待执行 |
| E | `fe-reduced-motion-respect` | — | 待执行 |
| F | `fe-zenmode-token-escape-cleanup` | — | 待执行 |
| G | `fe-dashboard-herocard-responsive-layout` | — | 待执行 |
| H | `fe-theme-switch-smoothing` | — | 待执行 |

### 第四批：独立 Issue（可并行，无严格顺序）

#### 4A. i18n 系列

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `fe-i18n-language-switcher-foundation` | — | 待执行 |
| A | `fe-i18n-core-pages-keying` | `fe-i18n-language-switcher-foundation` | 待执行 |

#### 4B. Token 逃逸清扫

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| B | `fe-token-escape-sweep` | — | 待执行 |

#### 4C. Composites 封装（分 3 期）

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| C | `fe-composites-p0-panel-and-command-items` | — | 待执行 |
| C | `fe-composites-p1-search-and-forms` | `fe-composites-p0-panel-and-command-items` | 待执行 |
| C | `fe-composites-p2-empties-and-confirms` | `fe-composites-p0-panel-and-command-items` | 待执行 |

#### 4D. 无障碍 + 确定性

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| D | `fe-accessibility-aria-live` | — | 待执行 |
| E | `fe-deterministic-now-injection` | — | 待执行 |

#### 4E. 桌面体验 + 编辑器

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| F | `fe-desktop-native-binding-packaging` | — | 待执行 |
| G | `fe-desktop-window-lifecycle-uplift` | — | 待执行 |
| H | `fe-command-palette-search-uplift` | — | 待执行 |
| I | `fe-editor-tokenization-selection-and-spacing` | — | 待执行 |
| J | `fe-editor-inline-diff-decoration-integration` | — | 待执行 |
| K | `fe-editor-advanced-interactions` | — | 待执行 |
| L | `fe-editor-context-menu-and-tooltips` | — | 待执行 |
| M | `fe-hotkeys-shortcuts-unification` | — | 待执行 |

## 依赖拓扑

```
第零批
  fe-hotfix-searchpanel-backdrop-close ──→ fe-leftpanel-dialog-migration (第一批)
                                       ──→ fe-searchpanel-tokenized-rewrite (第三批)

第一批
  fe-cleanup-proxysection-and-mocks ──→ fe-dashboard-welcome-merge-and-ghost-actions
  fe-rightpanel-ai-tabbar-layout ──→ fe-rightpanel-ai-guidance-and-style
                                 ──→ fe-visual-noise-reduction (第三批)
  fe-spec-drift-iconbar-rightpanel-alignment ──→ fe-leftpanel-dialog-migration
  [D1/D2/D3 Owner 决策] ──→ fe-spec-drift-iconbar-rightpanel-alignment  ✅ 已决策
                         ──→ fe-leftpanel-dialog-migration               ✅ 已决策

第二批
  fe-ipc-open-folder-contract ──→ fe-ui-open-folder-entrypoints ──→ fe-onboarding-flow-refresh
                                                                ──→ fe-dashboard-welcome-merge-and-ghost-actions (第一批)
  fe-i18n-language-switcher-foundation (第四批) ──→ fe-onboarding-flow-refresh

第四批
  fe-i18n-language-switcher-foundation ──→ fe-i18n-core-pages-keying
  fe-composites-p0-panel-and-command-items ──→ fe-composites-p1-search-and-forms
                                          ──→ fe-composites-p2-empties-and-confirms
```

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

## 维护规则

- 新增活跃 change 时，必须同步更新本文件中的执行模式、顺序、依赖与进度快照。
- 任一活跃 change 的范围、依赖、状态变化时，必须同步更新本文件。
- 未同步本文件时，不得宣称多变更执行顺序已确认。

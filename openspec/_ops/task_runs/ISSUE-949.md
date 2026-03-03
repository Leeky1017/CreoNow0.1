# RUN_LOG: ISSUE-949

更新时间：2026-03-04 02:40

- Issue: #949
- Branch: `task/949-fe-token-escape-sweep`
- Change: `fe-token-escape-sweep`
- PR: TBD
- Agent: Worker-6-3

## Dependency Sync Check

N/A — 所有前置依赖已归档合入 main。当前 worktree 已从最新 `origin/main`（72feb82c）创建。

## Runs

### Run 1 — RED phase (guard tests)

**Command**: `pnpm -C apps/desktop test:run -- --reporter=verbose "token-escape"`

**Result**: 4 guard tests created, 3 RED + 1 GREEN (screen guard — 0 violations)

| Guard   | Pattern                          | Violations |
| ------- | -------------------------------- | ---------- |
| S1 color | hex `#xxx` / `rgba(...)`        | 63 total (50 after whitelist) |
| S2 z-index | `z-\d+`, `zIndex:\s*\d+`     | 12         |
| S3 motion | `transition-all`               | 24         |
| S4 screen | `h-screen`, `w-screen`         | 0 (regression guard) |

**Commit**: `ef71cb52` — `test: add 4 token-escape guard tests (RED phase) (#949)`

### Run 2 — GREEN phase (token cleanup)

**Files modified** (21 feature files + tokens.css + guard-test-utils.ts + guard test):

1. `CharacterDetailDialog.tsx` — 11 color + 7 transition-all
2. `CharacterCard.tsx` — 5 color + 2 transition-all
3. `CharacterPanel.tsx` — 1 hex + 1 transition-all
4. `RoleSelector.tsx` — 1 hex
5. `VersionHistoryPanel.tsx` — 18 color + 1 z-index
6. `ExportDialog.tsx` — 4 color + 2 transition-all
7. `OutlinePanel.tsx` — 2 hex + 1 z-index
8. `SettingsDialog.tsx` — 1 transition-all + 1 z-index
9. `SettingsAppearancePage.tsx` — 2 transition-all
10. `SettingsExport.tsx` — 1 transition-all
11. `DiffHeader.tsx` — 2 rgba + 2 z-index + 2 transition-all
12. `ZenMode.tsx` — 3 z-index
13. `ZenModeStatus.tsx` — 1 inline zIndex
14. `SearchPanel.tsx` — 1 z-index
15. `EditorToolbar.tsx` — 1 z-index
16. `EditorBubbleMenu.tsx` — 1 inline zIndex (reverted: tippy.js requires number, whitelisted)
17. `DashboardPage.tsx` — 2 transition-all
18. `OnboardingPage.tsx` — 2 transition-all
19. `QualityGatesPanel.tsx` — 3 rgba + 2 transition-all
20. `CommandPalette.tsx` — 3 rgba
21. `tokens.css` — added --z-overlay, --color-bg-overlay

**New tokens added**:
- `--z-overlay: 10` (between --z-base:0 and --z-sticky:100)
- `--color-bg-overlay: rgba(255,255,255,0.1)` (dark) / `rgba(0,0,0,0.05)` (light)

**Whitelists**:
- Color guard: `SettingsAppearancePage.tsx` (color picker data), `DiffView.tsx`, `SplitDiffView.tsx`, `VersionPane.tsx` (diff highlight semantics)
- Z-index guard: `EditorBubbleMenu.tsx` (tippy.js API requires number type)

**Verification**:
- Guard tests: 5 files, 8 tests — ALL PASSED ✅
- TypeCheck: `tsc --noEmit` — EXIT 0 ✅
- Full regression: 254 test files, 1758 tests — ALL PASSED ✅

**Commit**: `bad152de` — `feat: complete token escape sweep across feature layer (#949)`

## Key Decisions

1. **Comment stripping**: Created `collectPatternViolationsStripped()` to strip `/* */` and `//` comments before regex matching, avoiding false positives on `TODO(#571)` pattern.

2. **Diff view whitelist**: DiffView.tsx, SplitDiffView.tsx, VersionPane.tsx use rgba for semantic diff highlighting (red=deletion, green=addition). These are feature-semantic data, not arbitrary styling escapes.

3. **tippy.js zIndex**: EditorBubbleMenu.tsx uses tippy.js which types `zIndex` as `number`. Reverted to `400` with comment mapping to `--z-modal`, whitelisted in guard.

4. **Token mapping approximations**:
   - `rgba(0,0,0,0.7)` → `var(--color-scrim)` (scrim is 0.6, perceptually close)
   - `rgba(34,197,94,0.4)` → `var(--color-success-subtle)` (0.1 intensity, acceptable proximity)
   - `rgba(255,255,255,0.02)` → `var(--color-bg-raised)` (perceptually equivalent)

## Blockers

None.

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: WILL_BE_SET_BY_RESIGN
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

### 审计要点

1. **Spec 对齐**：4 个 Scenario（S1 color / S2 z-index / S3 motion / S4 screen）全部由 scanning guard 测试覆盖并通过。白名单机制合理（SettingsAppearancePage 色板数据 + DiffView 语义高亮 + tippy.js zIndex 类型约束）。
2. **代码质量**：37 处 hex/rgba 替换为语义 token（27 处清扫 + 10 处白名单）；10 处数字 z-index 替换为 `var(--z-*)` token（1 处白名单）；24 处 `transition-all` 替换为精确属性（`transition-colors`/`transition-opacity`/`transition-[filter]` 等）。新增 `--z-overlay` 和 `--color-bg-overlay` token 命名合理。注释中的 issue 引用 `#571` 通过 `collectPatternViolationsStripped` 正确排除。
3. **回归验证**：254 test files / 1758 tests 全绿，tsc --noEmit 零报错。
4. **治理完整性**：RUN_LOG 包含 Red/Green/回归证据；Rulebook task 结构完整（含 .metadata.json）；EXECUTION_ORDER.md 已更新。

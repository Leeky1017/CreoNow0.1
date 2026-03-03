# Tasks: fe-token-escape-sweep
更新时间：2026-03-04 02:40

## Specification

Replace all hardcoded design escapes in `features/**/*.tsx` with design tokens.

| Scenario | Pattern                          | Token Target                     |
| -------- | -------------------------------- | -------------------------------- |
| S1       | `#xxx` / `rgba(...)` in classes  | `var(--color-*)` tokens          |
| S2       | `z-\d+` / `zIndex:\s*\d+`       | `var(--z-*)` tokens              |
| S3       | `transition-all`                 | Specific transition properties   |
| S4       | `h-screen` / `w-screen`          | Regression guard (already clean) |

## TDD Mapping

| Scenario | Guard Test File                            | Status |
| -------- | ------------------------------------------ | ------ |
| S1       | `token-escape-color.guard.test.ts`         | GREEN  |
| S2       | `token-escape-z.guard.test.ts`             | GREEN  |
| S3       | `token-escape-motion.guard.test.ts`        | GREEN  |
| S4       | `token-escape-screen.guard.test.ts`        | GREEN  |

## Red

Guard tests created and confirmed RED (S1: 50 violations, S2: 12, S3: 24).
S4 passed immediately with 0 violations (regression guard).

**Commit**: `ef71cb52`

## Green

All violations fixed across 21 feature files. New tokens added to `tokens.css`.

Whitelists documented:
- Color: 4 files (color picker data, diff highlight semantics)
- Z-index: 1 file (tippy.js API requires number)

**Commit**: `bad152de`

## Refactor

No structural refactoring needed. Guard tests serve as ongoing governance.

## Evidence

- Guard tests: 5 files, 8 tests — ALL PASSED
- TypeCheck: `tsc --noEmit` — EXIT 0
- Full regression: 254 test files, 1758 tests — ALL PASSED
- RUN_LOG: `openspec/_ops/task_runs/ISSUE-949.md`

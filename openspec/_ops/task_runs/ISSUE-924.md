# ISSUE-924: fe-feature-focus-visible-coverage

| 字段        | 值                                            |
| ----------- | --------------------------------------------- |
| Issue       | #924                                          |
| Branch      | task/924-fe-focus-visible-coverage             |
| Change      | fe-feature-focus-visible-coverage              |
| PR          | 待回填                                        |

## Dependency Sync Check
- 上游 Wave 3b：lucide #909 ✓, theme-switch #910 ✓ — 均已合并 main，无漂移

## Runs

### Red

```
Test Files  1 failed (1)
     Tests  3 failed (3)

× S1: Found 93 raw <button> without focus-visible treatment
  (features/ai/AiPanel.tsx, SkillManagerDialog.tsx, SkillPicker.tsx,
   character/*, dashboard/*, editor/*, files/*, version-history/*,
   onboarding/*, projects/*, settings-dialog/*, zen-mode/*, etc.)
× S2: tokens.css does not contain --color-focus-ring
× S3: main.css does not contain .focus-ring utility
```

### Green
（待填充）

### Full Regression
（待填充）

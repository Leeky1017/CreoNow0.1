# ISSUE-934 RUN_LOG

- Issue: #934
- Branch: task/934-fe-i18n-core-pages-keying
- PR: https://github.com/Leeky1017/CreoNow/pull/937
- Change: fe-i18n-core-pages-keying
- Worktree: .worktrees/issue-934-fe-i18n-core-pages-keying

## Plan

1. 编写 5 个 guard 测试（Dashboard/Search/AI/Onboarding i18n + date-format-locale）
2. 逐页面迁移硬编码字符串为 `t()` key（~90 处）
3. 将 `formatDate`/`formatRelativeTime` 的 `en-US` 硬编码改为 `i18n.language`
4. 补齐 `zh-CN.json` + `en.json` 翻译（136 个新 key）
5. 初始化测试环境 i18n（vitest.setup.ts）
6. 全量回归 + TypeScript 检查

## Dependency Sync Check

- `fe-i18n-language-switcher-foundation`: ✅ 已归档（PR #843 merged） — i18n 基础设施（i18next init, locale files, language switcher）均已就绪。

## Runs

### Red Phase — Guard Tests (all expected to fail)

#### S1: Dashboard.i18n-guard
```
$ pnpm -C apps/desktop test:run Dashboard.i18n-guard
FAIL  renderer/src/features/dashboard/Dashboard.i18n-guard.test.ts
  - has no hardcoded Chinese characters: FAIL (9 chinese chars: 大纲/初稿/修改/定稿/项目/开始创建…)
  - has no hardcoded English visible strings: FAIL (14 patterns: Untitled Project, Search across, Open, Rename, etc.)
Test Files  1 failed (1) | Tests  2 failed (2)
```

#### S2: SearchPanel.i18n-guard
```
$ pnpm -C apps/desktop test:run SearchPanel.i18n-guard
FAIL  renderer/src/features/search/SearchPanel.i18n-guard.test.ts
  - has no hardcoded Chinese characters: FAIL (正在重建索引/搜索失败/未找到匹配结果/建议 etc.)
  - has no hardcoded English visible strings: FAIL (6 patterns: Search documents, Semantic Search, etc.)
Test Files  1 failed (1) | Tests  2 failed (2)
```

#### S3: AiPanel.i18n-guard
```
$ pnpm -C apps/desktop test:run AiPanel.i18n-guard
FAIL  renderer/src/features/ai/AiPanel.i18n-guard.test.ts
  - has no hardcoded Chinese characters: FAIL (方案/已选择/全部不满意/质量校验通过/部分校验已跳过/输出/本会话累计/费用估算)
  - has no hardcoded English visible strings: PASS
Test Files  1 failed (1) | Tests  1 failed | 1 passed (2)
```

#### S4: date-format-locale.guard
```
$ pnpm -C apps/desktop test:run date-format-locale.guard
FAIL  renderer/src/features/__tests__/date-format-locale.guard.test.ts
  - no .tsx source file hardcodes 'en-US': FAIL (dashboard/DashboardPage.tsx)
Test Files  1 failed (1) | Tests  1 failed (1)
```

### Green Phase

#### All guard tests pass
```
$ pnpm -C apps/desktop test:run --reporter=verbose 'i18n-guard' 'date-format-locale'
✓ OnboardingPage.i18n-guard.test.ts (2 tests)
✓ Dashboard.i18n-guard.test.ts (2 tests)
✓ SearchPanel.i18n-guard.test.ts (2 tests)
✓ AiPanel.i18n-guard.test.ts (2 tests)
✓ date-format-locale.guard.test.ts (1 test)
Test Files  5 passed (5) | Tests  9 passed (9)
```

#### Full regression
```
$ pnpm -C apps/desktop test:run
Test Files  240 passed (240) | Tests  1720 passed (1720)
Duration  46.72s
```

#### TypeScript
```
$ pnpm typecheck
tsc --noEmit  ✓  (zero errors)
```

#### Commit & Push
```
$ git commit  →  a659b5c5
$ git push origin task/934-fe-i18n-core-pages-keying  →  remote created
```

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 0bdf01d9c7c634ccc00dfb0505b62085a81981ce
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

### 审查摘要

1. Diff 审查：4 页面（Dashboard/Search/AI/Onboarding）硬编码完全迁移到 `t()` key
2. formatDate/formatRelativeTime locale 参数化正确
3. 136 个 locale key 中英文对称（locale-parity guard 通过）
4. 5 个 guard 测试覆盖中文硬编码、英文硬编码、日期 locale 三类回归
5. 测试回归 240/240 文件、1720/1720 test 全绿
6. TypeScript 0 errors
7. zh-CN 英文残留已修复（onboarding.selectLanguageHint）

# ISSUE-927: fe-hotkeys-shortcuts-unification

- Issue: #927
- Branch: task/927-fe-hotkeys-unification
- Change: fe-hotkeys-shortcuts-unification
- PR: https://github.com/Leeky1017/CreoNow/pull/931

## Plan
- 建立统一 HotkeyManager（scope + 优先级 + 传播控制），迁移散装 keydown listener，新增快捷键参考面板。


- 上游 `fe-editor-advanced-interactions`: PR #918 已合并 main ✓，无漂移

## Runs

### Red
HotkeyManager.test.ts w/ stub implementation → **6 failed, 2 passed (8)**
- routes keydown events by scope and priority: FAIL
- blocks editor scope when dialog scope is active: PASS (trivially)
- unregister removes handler: PASS (trivially)
- calls editor-scoped handler when editor scope is active: FAIL
- matches key combo with modifiers correctly: FAIL
- global scope handlers fire regardless of active scope: FAIL
- passes the keyboard event to the handler: FAIL
- modKey matches either ctrlKey or metaKey: FAIL

Guard test (pre-migration baseline): **2 failed**
- no raw addEventListener keydown in features: FAIL (scattered listeners present)
- no raw addEventListener keydown in components: FAIL

### Green
All 3 core test suites pass:
```
HotkeyManager.test.ts: 8 passed
ShortcutsPanel.test.tsx: 3 passed
hotkey-listener-guard.test.ts: 2 passed
Total: 13 passed (13)
```

### Full Regression
```
Test Files  228 passed (228)
Tests       1687 passed (1687)
Duration    42.73s
```
Zero regressions.


## Main Session Audit
- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 14a48e30144a20de0f750ef73df3aceb7fb71594
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
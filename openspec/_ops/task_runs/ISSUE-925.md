# ISSUE-925: fe-composites-p1-search-and-forms

- Issue: #925
- Branch: task/925-fe-composites-p1
- Change: fe-composites-p1-search-and-forms
- PR: https://github.com/Leeky1017/CreoNow/pull/929

## Plan
- 新增 P1 级 Composite 组件（SearchInput / FormField / ToolbarGroup），替换 Feature 层内联实现。


- 上游 `fe-composites-p0`: PR #919 已合并 main ✓（commit `f798c553`），无漂移

## Runs

### Red

```
$ vitest run --reporter=verbose SearchInput.test.tsx FormField.test.tsx ToolbarGroup.test.tsx

 FAIL  renderer/src/components/composites/FormField.test.tsx
Error: Failed to resolve import "./FormField" from "renderer/src/components/composites/FormField.test.tsx". Does the file exist?

 FAIL  renderer/src/components/composites/SearchInput.test.tsx
Error: Failed to resolve import "./SearchInput" from "renderer/src/components/composites/SearchInput.test.tsx". Does the file exist?

 FAIL  renderer/src/components/composites/ToolbarGroup.test.tsx
Error: Failed to resolve import "./ToolbarGroup" from "renderer/src/components/composites/ToolbarGroup.test.tsx". Does the file exist?

 Test Files  3 failed (3)
      Tests  no tests
   Duration  618ms
```

红灯确认：3 个测试文件全部因模块不存在而失败 ✓

### Green

```
$ pnpm -C apps/desktop test:run -- --reporter=verbose components/composites/SearchInput
 ✓ renderer/src/components/composites/SearchInput.test.tsx (3 tests) 274ms
 ✓ renderer/src/components/composites/FormField.test.tsx (2 tests) 293ms
 ✓ renderer/src/components/composites/ToolbarGroup.test.tsx (1 test) 37ms

 Test Files  228 passed (228)
      Tests  1680 passed (1680)
   Duration  45.36s
```

6/6 Composite 测试全部绿灯 ✓

### Full Regression

```
$ pnpm -C apps/desktop test:run 2>&1 | tail -5
 Test Files  228 passed (228)
      Tests  1680 passed (1680)
   Duration  44.54s
```

全量回归通过，无新增失败 ✓


## Main Session Audit
- Audit-Owner: main-session
- Reviewed-HEAD-SHA: e39a8fa14fb49c7a291ea8021db05c36fb21e5c5
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
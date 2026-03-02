# RUN_LOG: ISSUE-897 — Dashboard HeroCard responsive layout

更新时间：2026-03-02 11:20

## Meta

| 字段 | 值 |
|------|-----|
| Issue | #897 |
| Branch | `task/897-herocard-responsive-layout` |
| Change | `fe-dashboard-herocard-responsive-layout` |
| PR | https://github.com/Leeky1017/CreoNow/pull/900 |

## Dependency Sync Check

- 上游：`openspec/specs/project-management/spec.md` — 无变更，无漂移 ✅
- 结论：N/A，无上游 change 依赖

## Runs

### Red 阶段

```
pnpm -C apps/desktop test:run features/dashboard/HeroCard.responsive.guard

 FAIL  HeroCard.responsive.guard.test.ts (3 tests | 2 failed)
   ✓ HeroCard decoration area has max-width constraint (PM-FE-HERO-S1)
     — 匹配到文字区已有的 max-w-[500px]，Red 阶段即通过
   × HeroCard decoration area is hidden on narrow screens (PM-FE-HERO-S2)
     — expected … to match /hidden\s+\w+:block/
   × HeroCard container does not use fixed min-h-[280px] (PM-FE-HERO-S3)
     — expected [ Array(1) ] to be null
```

注：S1 在 Red 阶段即通过是因为正则匹配到了段落元素已有的 `max-w-[500px]`。实现后装饰区新增 `max-w-[280px]` 满足设计意图。

### Green 阶段

```
pnpm -C apps/desktop test:run features/dashboard/HeroCard.responsive.guard

 ✓ HeroCard.responsive.guard.test.ts (3 tests)
   ✓ HeroCard decoration area has max-width constraint (PM-FE-HERO-S1)
   ✓ HeroCard decoration area is hidden on narrow screens (PM-FE-HERO-S2)
   ✓ HeroCard container does not use fixed min-h-[280px] (PM-FE-HERO-S3)
```

### 全量回归

```
pnpm -C apps/desktop test:run

 Test Files  214 passed (214)
      Tests  1630 passed (1630)
```

### Typecheck

```
pnpm -C apps/desktop typecheck
> tsc -p tsconfig.json --noEmit
(exit 0)
```

## 变更文件

| 文件 | 操作 |
|------|------|
| `apps/desktop/renderer/src/features/dashboard/HeroCard.responsive.guard.test.ts` | 新建 — 3 条 guard 测试 |
| `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx` | 修改 — 3 处 className 调整 |

## Main Session Audit

待独立审计完成后补充。

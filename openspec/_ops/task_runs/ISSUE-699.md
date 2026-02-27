# ISSUE-699

更新时间：2026-02-27 21:00

## Links

- Issue: #699
- Branch: `task/699-audit-legacy-adapter-retirement`
- PR: TBD

## Plan

- [x] kgStore 移除 toLegacyEntity/toLegacyRelation，统一 IPC 原生字段
- [x] normalizeEntityType 移除 "other"→"faction" 硬编码映射
- [x] UI 类型列表移除 "other"，改为 faction
- [x] 历史数据迁移 0023_kg_type_other_to_faction.sql 落地
- [x] memoryStore 下线 bootstrapForProject，保留 bootstrapForContext
- [x] 新增审计测试 S1-S6，修复快照漂移

## Runs

### 2026-02-27 验证全绿

- pnpm typecheck: 通过
- pnpm lint: 通过 (0 errors, 67 warnings)
- pnpm -C apps/desktop test:run: 通过 (182 files, 1537 tests)
- pnpm test:unit: 通过 (vitest 7 files, 24 tests)

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 50881d6423d72ab5d5c231f8c6452dc2483a2b58
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

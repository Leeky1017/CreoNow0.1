# Tasks: issue-663-audit-fatal-error-visibility-guardrails

更新时间：2026-02-27 11:12

## 1. Implementation

- [x] 1.1 `index.ts:466` 添加 `process.stderr.write()` fallback（AUD-C2-S1, S2）
- [x] 1.2 `CreateProjectDialog.tsx:456` 添加用户可见错误提示（AUD-C2-S3, S4）

## 2. Testing

- [x] 2.1 `index.app-ready-catch.test.ts` — stderr fallback 测试
- [x] 2.2 `CreateProjectDialog.test.tsx` — 项目创建失败错误展示测试

## 3. Verification

- [x] 3.1 typecheck 通过
- [x] 3.2 lint 通过（0 errors）
- [x] 3.3 1517 renderer 测试通过
- [x] 3.4 21 unit/integration 测试通过

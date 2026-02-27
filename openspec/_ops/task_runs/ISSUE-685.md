# ISSUE-685

更新时间：2026-02-27 18:15

## Links

- Issue: #685
- Branch: `task/685-audit-proxy-settings-normalization`
- PR: TBD

## Plan

- [x] 在 `aiProxySettingsService.ts` 增加 `normalizeProxySettings()`，将 legacy flat/oldest 字段统一归一为 canonical nested 结构
- [x] 重构 `getRaw()` 仅读取归一化结果，移除方法体内 legacy fallback 逻辑
- [x] 重构 `update()` 仅写 canonical provider 字段，移除 `encryptedLegacyKey` 写入路径
- [x] 收敛 `providerResolver.ts`：删除 legacy flat 类型字段与三级 fallback 读取链
- [x] 新增并修正 C7 相关测试（AUD-C7-S1/S3/S4/S5/S6），同步修复受 `ProxySettings` 类型收敛影响的单测样例
- [x] 完成 `typecheck/lint/test:run/test:unit` 全绿验证

## Runs

### 2026-02-27 验证全绿

- pnpm typecheck: 通过
- pnpm lint: 通过 (0 errors, 67 warnings)
- pnpm -C apps/desktop test:run: 通过 (177 files, 1526 tests)
- pnpm test:unit: 通过 (tsx=241 files, vitest=7 files; vitest=24 tests)

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: b41d4a4a305ec8b9029640d6f53f89b2991c23bf
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

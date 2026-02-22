# Proposal: issue-622-ci-gate-windows-export-hardening

## Why
当前 required check `ci` 存在可被绕过的门禁漏洞：当 `needs` 中任一 job 失败时，gate job `ci` 会被标记为 `SKIPPED`，而 GitHub 仍将其视为满足 required check，从而允许带失败 CI 的 PR 合并。这违反 `docs/delivery-skill.md` 的“门禁全绿”契约，并会掩盖真实回归。

同时，Windows E2E `export-markdown` 失败（等待 `export-success` 超时）表明 export 写盘链路在 Windows 上存在兼容性回归，需要修复并用测试锁定。

## What Changes
- CI：调整 `.github/workflows/ci.yml` 的 gate job `ci`，使其在 `needs` 失败时仍执行（非 SKIPPED），并在任一 required job 的 `result != success` 时显式失败。
- Windows export：修复导致 `windows-e2e` 的 export-markdown 流程失败的根因（倾向于原子写落盘阶段的目录同步/平台差异），并补齐回归测试。

## Impact
- Affected specs: none (workflow + internal IO helper)
- Affected code: `.github/workflows/ci.yml`, `apps/desktop/main/src/services/documents/atomicWrite.ts`, relevant tests
- Breaking change: NO
- User benefit: 门禁严格可信（失败必失败、不可 SKIPPED 绕过），Windows export 更稳定

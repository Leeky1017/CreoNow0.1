## 1. Specification

- [ ] 1.1 确认 required checks 契约（`ci` / `openspec-log-guard` / `merge-serial`）与当前 `.github/workflows/ci.yml` 的实际行为
- [ ] 1.2 定位 Windows E2E `export-markdown` 失败根因（主进程 export 写盘/原子写/平台差异）

## 2. TDD Mapping

- [ ] 2.1 将“目录同步失败不应导致 export 失败”的场景映射为可确定回归测试
- [ ] 2.2 若需 mock 平台/FS 行为，选择可复现且不依赖网络/真实时间的方式

## 3. Red

- [ ] 3.1 新增失败测试：在目录 fsync/open 失败时，`atomicWrite` 仍应视为成功提交（rename 已完成）
- [ ] 3.2 确认 Windows export 回归在测试层可被捕获（至少一个用例在修复前失败）

## 4. Green

- [ ] 4.1 修复 `.github/workflows/ci.yml`：`ci` gate job 不可被 SKIPPED 绕过，且在任一 required job 失败时必须失败
- [ ] 4.2 修复 export/atomicWrite：Windows 平台目录同步失败不应回滚已成功 rename 的提交写入
- [ ] 4.3 修复后确认新增测试转绿，并保持现有测试全绿

## 5. Refactor

- [ ] 5.1 最小化改动范围，避免引入新行为漂移

## 6. Evidence

- [ ] 6.1 RUN_LOG 记录关键命令与输出（包含失败→修复证据）
- [ ] 6.2 `python3 scripts/agent_pr_preflight.py` PASS
- [ ] 6.3 PR 启用 auto-merge，required checks 全绿并合并到 `main`

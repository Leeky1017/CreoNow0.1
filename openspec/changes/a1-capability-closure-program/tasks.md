# Tasks: A1 能力收口总控计划

- **GitHub Issue**: #1122
- **分支**: `task/1122-capability-closure-change-planning`
- **Delta Spec**: N/A（总控与排程）

---

## 当前 PR 范围（仅文档）

- [x] 建立 umbrella change
- [x] 建立 15 个子 change 目录与基础文档
- [x] 更新 `openspec/changes/EXECUTION_ORDER.md`
- [x] 为 15 个子 change 分别创建 child issue
- [ ] 逐条按 TDD 进入工程实施
- [ ] 完成后分批归档到 `openspec/changes/archive/`

---

## Wave 1：先补用户可见入口与可信度

- [ ] `a1-01-chat-history-persistence`
- [ ] `a1-02-settings-surface-completion`
- [ ] `a1-03-backup-service-closure`
- [ ] `a1-12-provider-preflight-validation`
- [ ] `a1-04-release-observability-and-keyboard-compat`
- [ ] `a1-06-version-restore-activation`
- [ ] `a1-07-editor-link-and-bubblemenu-closure`
- [ ] `a1-15-inline-diff-activation`

## Wave 2：再补“能用但不够真”的中层能力

- [ ] `a1-05-search-completion-and-cjk`
- [ ] `a1-08-judge-advanced-evaluation`
- [ ] `a1-09-skill-output-validation-expansion`
- [ ] `a1-14-skill-routing-and-discoverability`
- [ ] `a1-10-kg-recognition-and-character-navigation`
- [ ] `a1-13-kg-scale-and-query-safety`

## Wave 3：最后补语义底座

- [ ] `a1-11-memory-semantic-and-conflict-upgrade`

---

## Done 定义（总控层）

- [ ] 每个 child change 均已有 issue / branch / PR 对应关系
- [ ] 每个 child change 均按 spec-first + TDD 落地
- [ ] EO 与活跃 change 状态始终同步
- [ ] 所有已合并 child change 均按规则归档

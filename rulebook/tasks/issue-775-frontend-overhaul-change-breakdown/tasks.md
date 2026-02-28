## 1. Implementation（Spec-only）

- [ ] 1.1 交付 `docs/frontend-overhaul-plan.md` 到控制面 `main`（作为拆分 SSOT）
- [ ] 1.2 从文档提取条目全集并建立 coverage map（S1–S7 / F1–F4 / A1–A17 / R1–R3 / D1–D3 / B1–B45）
- [ ] 1.3 为每个可执行条目创建 OpenSpec change：
  - [ ] proposal（Why/What/Scope/Out-of-scope/Dependencies）
  - [ ] delta spec（Requirement/Scenario，可验证语句）
  - [ ] tasks（TDD Mapping + Evidence 骨架）
- [ ] 1.4 更新 `openspec/changes/EXECUTION_ORDER.md`：
  - [ ] 执行策略（串/并行、lane 限制）
  - [ ] 顺序与依赖（含阻塞决策 D1–D3）
  - [ ] 进度快照与维护规则

## 2. Testing（文档一致性）

- [ ] 2.1 结构校验：每个新增 change 目录必须包含 `proposal.md`、`tasks.md`、至少 1 个 `specs/<module>/spec.md`
- [ ] 2.2 覆盖校验：`docs/frontend-overhaul-plan.md` 中的条目必须能在 change proposal 中找到归属，或明确标注“已完成/不做”
- [ ] 2.3 约束校验：新写 delta spec 不得直接修改主 spec；不得出现 `TBD`/占位链接

## 3. Documentation（Evidence）

- [ ] 3.1 更新 RUN_LOG：`openspec/_ops/task_runs/ISSUE-775.md`
  - [ ] 关键命令输入/输出
  - [ ] 生成的 changes 数量与名单
  - [ ] PR 链接回填真实值


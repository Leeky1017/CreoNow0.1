# 文档审计 Playbook

> 适用条件：变更层 WHERE=`docs`（`docs/**`、`openspec/**`、`*.md` 非代码目录）
> 审计层级：通常 Tier L，涉及 spec / 交付规则变更时升至 Tier S

---

## 必查项（Tier L）

### 1. 链接有效性
- [ ] 文档内的相对链接是否指向存在的文件？
- [ ] 跨文档引用（如 `见 docs/delivery-skill.md §八`）是否准确？

### 2. 术语一致性
- [ ] 是否使用了已废止的治理术语（如旧版 Rulebook / RUN_LOG / Main Session Audit）？（禁止）
- [ ] 技术术语是否与 `AGENTS.md`、`openspec/project.md` 中的定义一致？

### 3. 格式规范
- [ ] Markdown 格式是否正确（标题层级、表格对齐、代码块语法）？
- [ ] 是否有 CRLF / LF 混用？

---

## 追加项（涉及 spec / 交付规则时，升至 Tier S）

### 4. Spec 变更影响
- [ ] `openspec/specs/<module>/spec.md` 的变更是否与现有实现一致？
- [ ] 删除 / 修改 scenario 是否需要同步更新对应测试？
- [ ] 新增 scenario 是否需要实现跟进（如需，应有对应 Issue）？

### 5. 交付规则变更
- [ ] `docs/delivery-skill.md` 的变更是否需要同步更新：
  - `AGENTS.md`？
  - `CLAUDE.md`？
  - `.github/copilot-instructions.md`？
  - `scripts/README.md`？
- [ ] 规则变更是否与 CI workflow 的 required checks 一致？
- [ ] 是否有向后不兼容的规则变更需要明确过渡期？

### 6. 审计文档变更
- [ ] 审计 Playbook 或审计协议的变更是否需要同步更新：
  - `.github/agents/creonow-audit.agent.md`？
  - `scripts/review-audit.sh`？

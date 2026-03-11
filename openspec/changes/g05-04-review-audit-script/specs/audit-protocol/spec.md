# Delta Spec: audit-protocol — 审计一键脚本入口

- **Parent Change**: `g05-04-review-audit-script`
- **Base Spec**: N/A（审计协议增量规则）
- **GitHub Issue**: 待创建

---

## 变更摘要

审计协议新增一键入口 `scripts/review-audit.sh`。脚本必须覆盖 `AGENTS.md` §6.4 全部 6 条命令，并可作为审计 agent 的标准入口被引用。

---

## Scenarios

### Scenario S-G05-04-01: 一键脚本覆盖全部必跑命令

```
GIVEN  `scripts/review-audit.sh`
WHEN   执行脚本
THEN   它依次运行 `AGENTS.md` §6.4 中定义的全部 6 条命令
```

### Scenario S-G05-04-02: 审计 agent 可引用统一入口

```
GIVEN  `.github/agents/creonow-audit.agent.md`
WHEN   查看审计执行步骤
THEN   其中引用 `scripts/review-audit.sh`
```
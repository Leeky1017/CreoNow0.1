# 审计 Playbook（Audit Playbooks）

> 「兵无常势，水无常形。」——《孙子兵法》
> 不同任务类型需要不同的审计视角，Playbook 即是因地制宜的审计兵法。

本目录包含按任务类型分类的审计检查清单。审计 Agent 根据变更分类引擎（Change Classifier）的结果，加载对应 Playbook 执行专项检查。

## Playbook 索引

| 文件 | 适用场景 | 加载条件 |
|------|---------|---------|
| `backend-service.md` | 后端 Service / 主进程逻辑 | WHERE=`backend` |
| `frontend-component.md` | 前端组件 / 渲染进程 | WHERE=`frontend` |
| `ipc-channel.md` | IPC 通道 / Preload 层 | WHERE=`preload` 或变更涉及 IPC |
| `ci-infra.md` | CI / 脚本 / 基础设施 | WHERE=`infra` |
| `docs-only.md` | 纯文档变更 | WHERE=`docs` |
| `security-electron.md` | Electron 安全审计 | Tier D 追加，涉及安全场景 |
| `performance.md` | 性能审计 | Tier D 追加，涉及性能场景 |
| `functional-verification.md` | 功能性验证 | 所有行为变更 PR（Tier S+ 必做，Tier L 非 docs/style 时推荐） |

## 使用方式

1. 审计 Agent 运行变更分类（见 `docs/delivery-skill.md` §8.0）
2. 根据 WHERE 标签加载对应 Playbook
3. 逐条执行检查项，在 PR 评论中标注 ✅ / ❌ / N/A
4. 多层变更时，加载所有涉及层的 Playbook

## 与 CI 的边界

Playbook 检查的是 **CI 不能覆盖** 的领域——语义正确性、spec 对齐、架构合理性、安全性、测试质量、以及功能性验证（功能是否真的生效）。

CI 已覆盖的内容（typecheck、lint、unit-test、coverage-gate、storybook-build、quality gates）无需在 Playbook 中重复，但审计 Agent 应确认 CI 结果为绿。

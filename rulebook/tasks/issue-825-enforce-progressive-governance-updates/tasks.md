更新时间：2026-03-01 20:45

## 1. Governance

- [x] 1.1 绑定 OPEN Issue `#825` 与任务分支 `task/825-enforce-progressive-governance-updates`
- [x] 1.2 明确目标：禁止末尾一次性回填，改为过程化记录硬门禁
- [x] 1.3 Rulebook task 创建并 validate 通过

## 2. Implementation

- [x] 2.1 preflight 增加“过程记录时序”校验函数
- [x] 2.2 将新校验接入 fast/full preflight 主流程
- [x] 2.3 docs/delivery-skill.md 新增边做边记强约束与异常规则
- [x] 2.4 scripts/README.md 更新 preflight 校验说明

## 3. Evidence & Delivery

- [x] 3.1 RUN_LOG 已落盘：`openspec/_ops/task_runs/ISSUE-825.md`
- [ ] 3.2 独立审计记录已落盘：`openspec/_ops/reviews/ISSUE-825.md`
- [ ] 3.3 preflight + required checks 全绿并合并到 `main`

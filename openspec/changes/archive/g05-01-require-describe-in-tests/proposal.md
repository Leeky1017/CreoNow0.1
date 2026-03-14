# G0.5-01 测试结构规范自动化拦截

- **GitHub Issue**: 待创建
- **所属任务簇**: W0.5-GATE（审计补丁 — 制度门禁补齐）
- **涉及模块**: testing, lint-policy
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 现状

仓库已经在测试规范中明确要求使用 `describe/it` 结构，但新增测试仍可继续使用裸块或 `async function main()` 形式而不被任何门禁拦截。规范写在文档里，CI 却不认识它，这使得测试结构退化成为一种低成本回流。

### 2. 根因

- 测试结构规范只存在于 `docs/references/testing/` 文档中
- `.eslintrc` 没有对应规则去阻断新违规
- 存量测试文件数量较大，导致团队对“先豁免、后收紧”的迁移路径没有统一机制

### 3. 不做的后果

- T-MIG 的迁移成果无法被机器锁住
- 新 PR 可以继续引入脚本式测试，规范与实现长期分裂
- 审计发现的 GAP-8 会在 Wave 1 之后反复回潮

### 4. 证据来源

| 文档                                                         | 章节     | 内容                                |
| ------------------------------------------------------------ | -------- | ----------------------------------- |
| `docs/references/testing-excellence-roadmap.md`              | GAP-8    | 测试结构规范缺少自动化拦截          |
| `docs/references/testing/01-philosophy-and-anti-patterns.md` | 全文     | 推荐统一使用 `describe/it` 组织测试 |
| `openspec/changes/EXECUTION_ORDER.md`                        | Wave 0.5 | 将该问题列为制度补丁优先项          |

---

## What：做什么

1. 新增 ESLint 规则 `local/require-describe-in-tests`
2. 对新测试文件默认 `error`，对存量目录临时 `warn`
3. 将规则与 T-MIG 迁移批次联动，目录迁完即移除 override
4. 同步测试治理文档，明确规则是机器门禁而非建议

---

## Non-Goals：不做什么

1. 不在本 change 内完成 286 个存量测试文件迁移
2. 不重写现有测试行为断言，只处理结构门禁
3. 不引入新的测试框架或 runner

---

## 依赖与影响

- **上游依赖**: 无
- **下游受益**: T-MIG-01 ~ T-MIG-05
- **关联任务**: T-MIG 总控 change 用它作为棘轮起点

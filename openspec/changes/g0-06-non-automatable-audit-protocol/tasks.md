# Tasks: G0-06 非自动化问题全覆盖审计协议

- **GitHub Issue**: #1034
- **分支**: `task/1034-non-automatable-audit-protocol`
- **Delta Spec**: `specs/audit-protocol/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0-GATE: 门禁基础设施

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `.github/pull_request_template.md` 包含"非自动化检查"章节 | S-REVIEW-01, S-REVIEW-02 |
| AC-2 | `docs/delivery-skill.md` §8 增加"产品行为验证"步骤 | S-AUDIT-01, S-AUDIT-02 |
| AC-3 | `docs/references/font-verification-checklist.md` 已创建且内容可执行 | S-FONT-01 |
| AC-4 | `openspec/specs/ai-service/rate-limiting-rfc.md` 已创建且格式完整 | S-RATE-01 |
| AC-5 | AGENTS.md §六 与更新后的审计协议一致 | S-AUDIT-01, S-AUDIT-02, S-REVIEW-01 |

---

## Phase 1: 模板与协议起草

### Task 1.1: 更新 PR Template

**映射验收标准**: AC-1

- [ ] 在 `.github/pull_request_template.md` 末尾增加"非自动化检查"章节
- [ ] 包含 4 个 checkbox：字体渲染、品牌调性、无障碍、CJK 场景
- [ ] 标注"涉及 UI 改动时必填，后端独占 PR 可标 N/A"

### Task 1.2: 更新审计协议

**映射验收标准**: AC-2

- [ ] 在 `docs/delivery-skill.md` §8 PRE-AUDIT 步骤中增加：
  - "检查是否包含至少 1 条产品行为验证"
  - "前端 PR 必须有用户场景验证（截图或命令输出）"
- [ ] 在 FINAL-VERDICT 步骤中增加：
  - "必须回答：作为用户，修改后行为是否符合 spec.md 定义？"
- [ ] 同步更新 AGENTS.md §六相关条款

### Task 1.3: 创建字体验收清单

**映射验收标准**: AC-3

- [ ] 创建 `docs/references/font-verification-checklist.md`
- [ ] 内容包含：
  - Electron 环境字体加载验证步骤
  - CJK 代表字符验证（中日韩各取 5 个）
  - Fallback 字体链验证方法
  - Storybook 字体预览 story 要求

### Task 1.4: 创建速率限制 RFC

**映射验收标准**: AC-4

- [ ] 创建 `openspec/specs/ai-service/rate-limiting-rfc.md`
- [ ] 内容包含：
  - 当前 API 调用链路（aiService → provider → external API）
  - 需限流端点清单
  - 候选限流策略（token bucket、sliding window）
  - RFC 状态标记：DRAFT

---

## Phase 2: 验证与同步

> 特殊说明：本 change 仅涉及文档/协议更新，无代码实现，故仅含 Phase 1-2，无 Phase 3（Refactor）。

### Task 2.1: 文档一致性检查

**映射验收标准**: AC-5

- [ ] 确认 AGENTS.md §六 与 delivery-skill.md §8 的审计条款一致
- [ ] 确认 PR template 的检查项与 delivery-skill.md 的验收要求一致
- [ ] 确认 font checklist 与 `design/system/01-tokens.css` 中的字体 token 一致

---

## TDD 规范引用

> 本任务为协议/文档类，不涉及代码实现。验收方式为文档审查 + 审计协议验证。
> 所有产出的 checklist 和协议条款必须可由审计 Agent 逐条验证。

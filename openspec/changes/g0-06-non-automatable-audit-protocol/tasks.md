# Tasks: G0-06 非自动化问题全覆盖审计协议

- **GitHub Issue**: #1034
- **分支**: `task/1034-non-automatable-audit-protocol`
- **Delta Spec**: `specs/audit-protocol/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0-GATE: 门禁基础设施

## 三层执行模型归属

**Tier 3: 协议强制 + 审计必查** —— 不可自动化的 4 类问题通过 PR template 必填项 + 审计 Agent 协议硬绑定强制覆盖。审计 Agent 缺任何一项 = REJECT。覆盖 Pattern #21, #24, #25, #27。

公共约定见 `EXECUTION_ORDER.md` §二·五。

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
- [ ] checkbox 措辞必须可执行（不要"确认 XX"，要"验证 XX 并附截图/命令输出"）
- [ ] 增加简短说明：什么情况下标 N/A 是合理的（仅改 `main/src/` 或 `scripts/` 或 `openspec/`）

### Task 1.2: 更新审计协议

**映射验收标准**: AC-2

- [ ] 在 `docs/delivery-skill.md` §8 PRE-AUDIT 步骤中增加：
  - "检查是否包含至少 1 条产品行为验证"
  - "前端 PR 必须有用户场景验证（截图或命令输出）"
  - 明确"纯 diff review 不计入产品行为验证"
- [ ] 在 FINAL-VERDICT 步骤中增加：
  - "必须回答：作为用户，修改后行为是否符合 spec.md 定义？"
  - "列举至少 1 个用户场景的预期行为与实际行为对照"
- [ ] 同步更新 AGENTS.md §六相关条款（§6.1 #10 已声明 Tier 3 检查，此处补充具体执行细节）

### Task 1.3: 创建字体验收清单

**映射验收标准**: AC-3

- [ ] 创建 `docs/references/font-verification-checklist.md`
- [ ] 必须包含以下章节（每节均需具体可执行步骤，不能只写标题）：
  - **§1 Electron 环境字体加载验证**：如何启动开发环境 → DevTools → 检查 `document.fonts.check()` → 截图
  - **§2 CJK 代表字符验证**：中文 5 字（含繁体）、日文 5 字（含片假名/平假名）、韩文 5 字 → 每字标注预期字体 family
  - **§3 Fallback 字体链验证**：`design/system/01-tokens.css` 中字体 token → 逐级禁用验证 fallback 是否生效
  - **§4 Storybook 字体预览**：要求新建 `Typography.stories.tsx`，含中英文混排、纯 CJK、长文本段落 3 个 story

### Task 1.4: 创建速率限制 RFC

**映射验收标准**: AC-4

- [ ] 创建 `openspec/specs/ai-service/rate-limiting-rfc.md`
- [ ] 必须包含以下章节：
  - **§1 现状**：当前 API 调用链路图（`aiService → provider → external API`），标注无限流点
  - **§2 需限流端点清单**：列出所有外发 API 调用点（provider 层 + embedding 层 + 第三方服务），标注当前调用频率估计
  - **§3 候选限流策略**：Token Bucket / Sliding Window / Leaky Bucket 各自优劣对比表
  - **§4 推荐方案**：基于 CreoNow 使用模式推荐策略 + 实现层级（中间件 / Service 层 / Provider 层）
  - **§5 RFC 状态**：标记 `DRAFT`，注明评审会议待定日期

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

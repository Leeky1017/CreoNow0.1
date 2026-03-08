# G0-05 Spec-Test 映射与测试质量门禁

- **GitHub Issue**: #1024（Asuka spec→test映射门禁缺失）
- **所属任务簇**: W0-GATE（门禁基础设施）
- **涉及模块**: ci-gates, testing
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 现状

AMP 审计在 5 轮审查中最深层的发现：**CreoNow 有 spec，有测试，但 spec 与测试之间没有映射关系**。这导致：

| 问题 | AMP 命中 | 存量规模 | 当前门禁 |
|------|---------|---------|----------|
| Spec 场景无对应测试 | 4 轮 | spec 中 Scenario 数量 vs 测试覆盖率差距未知 | 无（#1024 已提出但无 change） |
| 假 UI 无否定测试 | 3 轮 | 13+ 假 UI 组件无"不能 xxx"测试 | 无 |
| Export 声称支持但未测试 | 2 轮 | PDF/DOCX 声称支持但无验证 | 无 |
| CJK 搜索质量无测试 | 2 轮 | 无中文搜索测试用例 | 无 |
| Memory 忽略拒绝信号 | 2 轮 | 无测试覆盖拒绝路径 | 无 |
| Guard 测试只测 happy path | 2 轮 | 现有 guard test 缺乏失败场景 | 无 |

### 2. 根因

- **Spec-Test 断裂**：OpenSpec 的 `spec.md` 定义了 Scenario（GIVEN/WHEN/THEN），`tasks.md` 定义了测试任务映射到 Scenario，但没有自动化机制验证"所有 Scenario 都有测试"。开发者可以写完实现、跳过部分测试而 CI 全绿。
- **否定测试缺失**：假 UI 组件（如只读禅模式、假搜索）被 AMP 标记后，没有测试断言"这个组件不提供编辑功能"——只要不测试"不能做什么"，假 UI 就可以无限期存在而不被发现。
- **能力声明未验证**：Export 模块声称支持 PDF/DOCX，但实际只有纯文本——没有测试验证声明与实现的一致性。
- **Guard 测试浅层化**：现有 gate/guard 测试主要覆盖 happy path（PASS 场景），缺乏 FAIL 场景测试——如果 gate 本身有 bug 导致某些违规不被检出，无人发现。

### 3. 不做的后果

- 24 个 A0 change 每个都定义了 Scenario 和测试映射，但完成后如果没有门禁验证映射完整性，spec 会逐渐与实现脱节
- AMP 审计继续依赖人工逐条对照 spec.md ↔ test files，效率极低
- 假 UI 被修复后（A0-15），新功能如果只做了 UI 但没做实现，又会产生新的假 UI——缺乏否定测试模式的推广

### 4. 证据来源

| 文档 | 章节 | 内容 |
|------|------|------|
| GitHub Issue #1024 | 全文 | "spec→test 映射门禁缺失" |
| `docs/audit/amp/03-spec-gaps.md` | §一 | "Spec 有 Scenario 但与测试未映射" |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §二 | "13 处假 UI 无否定测试" |
| `docs/audit/amp/01-master-roadmap.md` | §3.4 | "测试必须覆盖否定场景" |

---

## What：做什么

### Guard 1: `spec-test-mapping-gate.ts`

**新建 Guard 脚本**，验证 spec.md 中的 Scenario 与测试文件的映射完整性：

- 扫描 `openspec/specs/*/spec.md` 和 `openspec/changes/*/specs/*/spec.md`，提取所有 `Scenario` 标识符
- 扫描对应模块的测试文件，提取测试中引用的 Scenario 标识符（通过注释 `// Scenario: S-XXX-NN` 或测试名称中的 Scenario ID）
- 输出：未映射的 Scenario 列表、映射覆盖率
- baseline ratchet 机制：初始记录未映射数 → 只允许减少

### 测试质量 Checklist: `test-quality-checklist.md`

**新建文档**，定义 PR review 时的测试质量检查项：

- [ ] 所有 spec.md Scenario 有对应测试
- [ ] 假 UI / 未实现功能有否定测试（"不能做 XXX"断言）
- [ ] 能力声明有真实性验证测试（"声称支持 X 则必须有 X 的功能测试"）
- [ ] CJK / 多语言场景有测试覆盖
- [ ] Guard/gate 测试包含 PASS 和 FAIL 两种场景
- [ ] 异步操作拒绝/错误路径有测试覆盖

### 测试模式推广: 否定测试约定

**建立约定**（写入 `docs/references/testing/README.md`）：

- 每个被标记为"假 UI"或"未实现"的功能，必须有 `describe('should NOT ...')` 测试块
- 能力声明与实现不一致时，测试标题格式：`it('export declares PDF support — verify implementation')`
- Guard 测试必须包含：至少 1 个 PASS fixture + 至少 1 个 FAIL fixture

---

## Non-Goals：不做什么

1. **不给所有现有测试补 Scenario ID**——仅建门禁，存量逐步补映射
2. **不强制所有 spec 必须有测试**——某些 spec（如决策类、声明类）不需要测试
3. **不修改现有 guard 测试**——仅要求新增 guard 包含 FAIL 场景
4. **不做代码覆盖率关联**——Spec-Test 映射是语义级，不是行覆盖率

---

## 依赖与影响

- **上游依赖**: 无
- **下游受益**: 所有 A0 change——每个 change 的 tasks.md 已定义 Scenario 映射，门禁确保映射完整
- **与 GitHub Issue #1024 的关系**: 本 change 直接回应 #1024 的诉求

---

## 28-Pattern 覆盖声明

| Pattern # | 名称 | 门禁类型 | 级别 |
|-----------|------|---------|------|
| #15 | 假 UI 无否定测试 | 测试约定 + review checklist | Process |
| #16 | Export 虚假声称无测试 | 测试约定 + review checklist | Process |
| #17 | CJK 搜索质量无测试 | 测试约定 + review checklist | Process |
| #18 | Memory 忽略拒绝信号 | 测试约定 + review checklist | Process |
| #22 | Spec→Test 映射缺失 | Guard `spec-test-mapping-gate` | baseline ratchet |
| #23 | Guard 测试浅层化 | 测试约定 + review checklist | Process |

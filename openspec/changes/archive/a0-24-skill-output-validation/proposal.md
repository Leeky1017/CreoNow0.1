# A0-24 Skill 输出校验扩展

- **GitHub Issue**: #985
- **所属任务簇**: P0-6（基础输入输出防线）
- **涉及模块**: skill-system
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 用户现象

用户触发「润色」「改写」「续写」「扩写」等核心创作技能后，LLM 返回的异常输出（空字符串、纯 Markdown 代码块、HTML 标签、远超输入长度的膨胀文本、与输入完全无关的离题内容）会被原封不动地注入正文。用户接受了看似正常的 diff，定稿后才发现正文中嵌入了 ```python 代码块或一堆 `<div>` 标签——创作内容遭到不可逆污染。

### 2. 根因

`skillExecutor.ts` 的 `validateSkillRunOutput()` 函数（L314-L324）对 synopsis 以外的全部 skill 直接返回 `{ ok: true, data: true }`：

```typescript
function validateSkillRunOutput(args) {
  if (leafSkillId(args.skillId) !== "synopsis") {
    return { ok: true, data: true }; // ← 所有非 synopsis skill 无条件放行
  }
  // ... synopsis 专属校验逻辑
}
```

Synopsis 的输出校验（长度范围、段落结构）在 A0 之前已实现且经测试验证，但系统中频率最高的四个创作 skill——`polish`、`rewrite`、`continue`、`expand`——的输出完全裸奔。

### 3. v0.1 威胁

- **内容污染**：LLM 的幻觉输出直接变成用户正文，撤销栈有限，超过栈深则不可逆
- **信任崩塌**：创作者发现 AI 改写后正文中出现代码块或 HTML 标签，会彻底丧失对 AI 辅助功能的信任
- **质量底线失守**：v0.1 号称「AI 驱动的创作 IDE」，但 AI 输出无最低质量保障

### 4. 证据来源

| 文档                                                     | 章节      | 内容                                                      |
| -------------------------------------------------------- | --------- | --------------------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`                    | §4.2      | v0.1 必修项：输入输出防线                                 |
| `docs/audit/amp/08-backend-module-health-audit.md`       | §三       | skill-system 模块：output validation 仅 synopsis 有       |
| `apps/desktop/main/src/services/skills/skillExecutor.ts` | L314-L324 | `validateSkillRunOutput()` 对非 synopsis skill 无条件放行 |

---

## What Changes：具体做什么

1. **扩展 `validateSkillRunOutput()` 函数**：为 `polish`、`rewrite`、`continue`、`expand` 四个高频 skill 增加基础输出校验规则
2. **定义通用输出校验规则**：
   - 空输出检测：输出文本 trim 后长度为 0 → 拒绝
   - 格式污染检测：输出包含 Markdown 代码块（` ``` `）、HTML 标签（`<div>`、`<script>` 等）→ 拒绝
   - 膨胀检测：输出字符数超过输入字符数的 10 倍（对 `polish`、`rewrite`）或 20 倍（对 `continue`、`expand`）→ 拒绝
3. **定义错误码 `SKILL_OUTPUT_INVALID`**：校验失败时返回结构化错误，包含失败原因
4. **保留 synopsis 已有校验逻辑不变**：synopsis 的校验规则（长度范围、段落结构）由其专属函数处理，本任务不修改

---

## Scope：涉及范围

- **涉及的 openspec 主规范**: `openspec/specs/skill-system/spec.md`
- **涉及的源码文件**:
  - `apps/desktop/main/src/services/skills/skillExecutor.ts`（`validateSkillRunOutput()` 函数）
  - `apps/desktop/main/src/ipc/contract/ipc-contract.ts`（错误码注册）
- **所属任务簇**: P0-6（基础输入输出防线）
- **前置依赖**: 无
- **下游影响**: 未来新增 skill 的输出校验可复用本任务建立的通用规则框架

---

## Non-Goals：明确不做什么

1. **不引入语义相关性判断**——不对比输出与输入的语义相似度（如 embedding cosine similarity），仅做结构级和格式级校验
2. **不修改 synopsis 已有的输出校验逻辑**——synopsis 的 `validateSynopsisOutput()` 保持原样，不排入本任务的改动范围
3. **不为 `condense`、`style-transfer`、`translate`、`summarize` 增加校验**——本任务只覆盖四个高频 skill，其余 skill 的校验由后续任务负责
4. **不实施输出自动修复（auto-fix）**——检测到异常输出后拒绝并提示，不尝试自动剥离代码块或 HTML 标签再返回
5. **不修改前端 AI 面板的错误展示逻辑**——输出校验失败走已有的 `skill:stream:done` 错误路径，前端已有错误展示能力

---

## 依赖与影响

- **上游依赖**: 无
- **被依赖于**: 无直接下游依赖；本任务为输出校验基础设施，后续可扩展到更多 skill

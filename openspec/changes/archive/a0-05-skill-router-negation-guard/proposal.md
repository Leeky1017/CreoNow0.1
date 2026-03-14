# A0-05 Skill Router 否定语境守卫

- **GitHub Issue**: #987
- **所属任务簇**: P0-6（基础输入输出防线）
- **涉及模块**: skill-system
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 用户现象

用户在 AI 面板中输入"不要续写"或"别帮我扩写"，系统仍然触发 `builtin:continue` 或 `builtin:expand`。用户明确表达拒绝意图，系统却执行了被拒绝的操作。对创作者而言，这等于"我说了不要，你偏要"——信任一次破裂，修复需要十次。

### 2. 根因

`skillRouter.ts` 的 `inferSkillFromInput` 使用纯 `input.includes(keyword)` 进行子串匹配。该逻辑无法区分正向意图（"帮我续写"）与否定意图（"不要续写"）。只要输入中包含 `"续写"` 二字，无论前缀是 `"请"` 还是 `"不要"`，都会命中 `builtin:continue`。

当前路由代码（`skillRouter.ts` L81-84）：

```typescript
for (const rule of KEYWORD_RULES) {
  if (rule.keywords.some((kw) => input.includes(kw))) {
    return rule.skillId;
  }
}
```

没有任何否定语境检测。问题同样影响 `REWRITE_KEYWORDS` 的 `includes()` 匹配路径。

### 3. v0.1 威胁

- **操作违背用户意图**：这不是"功能不够好"，而是"系统执行了用户明确拒绝的操作"。在创作场景中，错误续写可能直接污染正文，造成不可逆的创作破坏
- **信任链断裂**：AI 写作助手的核心价值是"理解创作者意图"。连否定都听不懂，用户会质疑所有 AI 功能的可靠性
- **错误级联**：误触发的技能会经过完整执行流水线（Context Engine → LLM 调用 → 流式输出 → Inline Diff），浪费 token 预算，产生干扰内容

### 4. 证据来源

| 文档                                               | 章节              | 内容                                                                                                           |
| -------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`              | §4.2 可信度必修项 | "Skill Router 关键词路由脆弱——'不要续写'也可能触发续写——只做正向子串匹配，没有否定语境判断——增加语义/规则守卫" |
| `docs/audit/amp/08-backend-module-health-audit.md` | §三 AI 服务族     | "否定语境守卫缺失——`skillRouter.ts`：纯 `includes()` 匹配，'不要续写'也会触发续写"                             |
| `docs/audit/amp/01-master-roadmap.md`              | Phase 0 验收矩阵  | "AI 路由——否定表达不触发明显反向动作"                                                                          |

---

## What：做什么

1. **实现否定语境检测函数 `isNegated`**：在关键词匹配前，检查关键词在输入中的前缀上下文是否包含否定模式（中文：不要、别、不想、不用、不需要、停止、取消、禁止；英文：don't、do not、stop、no、never、cancel）。若关键词被否定修饰，该条关键词规则不命中
2. **修改 `inferSkillFromInput` 的关键词匹配逻辑**：将 `input.includes(kw)` 替换为"包含关键词且未被否定"的组合判断。同时适用于 `KEYWORD_RULES` 和 `REWRITE_KEYWORDS` 两条匹配路径
3. **处理双重否定**：识别"不是不想续写"等双重否定模式，恢复为正向意图（即正常匹配对应技能）
4. **被否定关键词 fallback**：当所有命中的关键词均被否定时，路由到 `builtin:chat`，由对话技能理解用户真实需求

---

## Non-Goals：不做什么

1. **不引入 NLP / LLM 进行意图分类**——v0.1 的否定守卫基于规则模式匹配，不引入额外的模型推理开销。语义级意图理解属于 v0.2+ 路线
2. **不修改关键词表本身**——本变更只增加否定守卫，不新增、删除或修改现有 `KEYWORD_RULES` 和 `REWRITE_KEYWORDS` 中的关键词条目
3. **不处理隐含否定或反讽表达**——如"续写？算了吧"、"我才不要续写呢"等复杂语义否定，超出规则引擎能力范围，留给未来的语义路由
4. **不修改显式技能覆盖（`explicitSkillId`）路径**——用户手动选择的技能不受否定守卫影响，保持最高优先级
5. **不修改技能执行流水线或 Context Engine**——变更范围严格限定在 `inferSkillFromInput` 函数及其辅助逻辑内

---

## 依赖与影响

- **无上游依赖**：可独立实施，不依赖其他 A0 变更
- **被依赖于**：无直接下游依赖；但路由准确性是整个技能系统可信度的基石
- **影响范围**：仅修改 `apps/desktop/main/src/services/skills/skillRouter.ts`，纯后端逻辑变更，无前端影响

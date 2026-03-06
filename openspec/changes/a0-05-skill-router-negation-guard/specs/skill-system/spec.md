# Skill System Specification Delta

## Change: a0-05-skill-router-negation-guard

### Requirement: 意图路由函数 [MODIFIED]

技能系统**必须**提供 `inferSkillFromInput` 函数，根据用户输入文本和上下文推断目标技能 ID。

函数签名：

```typescript
function inferSkillFromInput(args: {
  input: string;
  hasSelection: boolean;
  explicitSkillId?: string;
}): string;
```

路由优先级：

1. 显式技能覆盖（`explicitSkillId` 非空时直接返回）
2. 选中文本上下文启发式（有选中 + 无输入 → `builtin:polish`；有选中 + 短改写指令 → `builtin:rewrite`）
3. 关键词匹配规则
4. 默认 → `builtin:chat`

关键词匹配与启发式必须满足以下约束：

- 正向关键词仍按既有规则路由
- 当关键词出现在常见否定表达中时，不得触发对应技能
- rewrite 的短改写指令启发式同样需要绕开否定表达
- 被否定的命中被抑制后，应继续尝试后续规则；若最终无匹配，则回退到 `builtin:chat`

#### Scenario: S8 negated continue intent does not route to builtin:continue [ADDED]

- **假设** `args = { input: "不要续写", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值不等于 `"builtin:continue"`
- **并且** 在无其他匹配时回退到 `"builtin:chat"`

#### Scenario: S9 negated continue phrase does not route to builtin:continue [ADDED]

- **假设** `args = { input: "别写下去", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值不等于 `"builtin:continue"`

#### Scenario: S10 negated rewrite intent does not route to builtin:rewrite [ADDED]

- **假设** `args = { input: "不要改写", hasSelection: true }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值不等于 `"builtin:rewrite"`
- **并且** 在无其他匹配时回退到 `"builtin:chat"`

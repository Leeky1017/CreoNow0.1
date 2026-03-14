# Delta Spec: skill-system — Skill Router 否定语境守卫

- **Parent Change**: `a0-05-skill-router-negation-guard`
- **Base Spec**: `openspec/specs/skill-system/spec.md`
- **GitHub Issue**: #987

---

## 变更 Requirement: 意图路由函数（REQ-SKL-ROUTE）

在 `inferSkillFromInput` 的关键词匹配阶段，系统**必须**增加否定语境守卫。当关键词出现在否定上下文中时，该关键词规则**不得**触发对应技能。

### 否定模式定义

系统**必须**识别以下否定前缀模式（关键词前方的窗口范围内出现以下词语）：

| 语言 | 否定词                                                     |
| ---- | ---------------------------------------------------------- |
| 中文 | 不要、别、不想、不用、不需要、停止、取消、禁止、不必、无需 |
| 英文 | don't、do not、stop、no、never、cancel、not、without       |

否定检测窗口：关键词在输入字符串中的位置**前方** N 个字符（中文 N=6，英文 N=12），在此窗口内搜索否定词。

### 双重否定处理

系统**必须**识别双重否定模式并将其解释为正向意图：

| 语言 | 双重否定模式                             | 解释                   |
| ---- | ---------------------------------------- | ---------------------- |
| 中文 | "不是不想 + 关键词"、"并非不要 + 关键词" | 正向意图，正常匹配技能 |
| 英文 | "not that I don't want to + keyword"     | 正向意图，正常匹配技能 |

### 否定守卫辅助函数

系统**必须**提供 `isNegated(input: string, keywordIndex: number, keyword: string): boolean` 辅助函数：

- 接受完整输入字符串、关键词起始索引、关键词本身
- 在关键词前方窗口内检查否定词存在性
- 若检测到否定词，进一步检查是否为双重否定
- 双重否定返回 `false`（不视为否定）；单否定返回 `true`（视为否定）

### 路由逻辑变更

`inferSkillFromInput` 的关键词匹配阶段（`KEYWORD_RULES` 遍历和 `REWRITE_KEYWORDS` 匹配）**必须**将判断条件从：

```
input.includes(keyword)
```

变更为：

```
input.includes(keyword) && !isNegated(input, keywordIndex, keyword)
```

当所有匹配到的关键词均被否定时，路由到 `builtin:chat`。

### 不受影响的路径

以下路径**不受**否定守卫影响，行为保持不变：

- 显式技能覆盖（`explicitSkillId` 非空时直接返回）
- 有选中文本 + 无输入 → `builtin:polish`
- 默认 fallback → `builtin:chat`

---

#### Scenario: S-NEG-1 中文"不要 + 关键词"否定路由到 chat

- **假设** `args = { input: "不要续写，我想自己写", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:chat"`
- **因为** `"续写"` 出现在否定词 `"不要"` 之后，否定守卫阻止 `builtin:continue` 触发

#### Scenario: S-NEG-2 中文"别 + 关键词"否定路由到 chat

- **假设** `args = { input: "别帮我扩写这段", hasSelection: true }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:chat"`
- **因为** `"扩写"` 出现在否定词 `"别"` 之后，否定守卫阻止 `builtin:expand` 触发
- **并且** 即使 `hasSelection` 为 true，否定意图优先于选中文本启发式

#### Scenario: S-NEG-3 英文 "don't + keyword" 否定路由到 chat

- **假设** `args = { input: "don't continue writing this", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:chat"`
- **因为** `"continue writing"` 出现在否定词 `"don't"` 之后

#### Scenario: S-NEG-4 双重否定恢复正向意图

- **假设** `args = { input: "不是不想续写，请帮我续写后面的内容", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:continue"`
- **因为** `"不是不想"` 构成双重否定，系统识别为正向意图，`"续写"` 正常匹配

#### Scenario: S-NEG-5 正向关键词无否定前缀时正常匹配（回归）

- **假设** `args = { input: "帮我续写这个段落", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:continue"`
- **因为** `"续写"` 前方窗口内无否定词，保持原有正向匹配行为

#### Scenario: S-NEG-6 否定词与关键词距离超出窗口不触发守卫

- **假设** `args = { input: "我不喜欢上次的结果，这次请帮我续写得更好一些", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:continue"`
- **因为** `"不"` 与 `"续写"` 之间距离超出否定检测窗口（中文 6 字符），不视为否定修饰

#### Scenario: S-NEG-7 "不用 + 改写"否定改写技能路由到 chat

- **假设** `args = { input: "不用改写", hasSelection: true }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:chat"`
- **因为** `"改写"` 出现在否定词 `"不用"` 之后，`REWRITE_KEYWORDS` 匹配路径同样受否定守卫保护

#### Scenario: S-NEG-8 显式技能覆盖不受否定守卫影响

- **假设** `args = { input: "不要续写", hasSelection: false, explicitSkillId: "builtin:continue" }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:continue"`
- **因为** 显式技能覆盖优先级最高，否定守卫不作用于此路径

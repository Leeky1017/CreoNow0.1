# Delta Spec: skill-system — Skill 输出校验扩展

- **Parent Change**: `a0-24-skill-output-validation`
- **Base Spec**: `openspec/specs/skill-system/spec.md`
- **GitHub Issue**: #985

---

## 变更摘要

扩展 `validateSkillRunOutput()` 函数，为 `polish`、`rewrite`、`continue`、`expand` 四个高频创作 skill 增加基础输出校验规则，拒绝空输出、格式污染和膨胀输出。

---

## 变更 Requirement: 高频 Skill 输出校验（新增）

`SkillExecutor` 在 LLM 返回输出后、将结果推送到渲染进程之前，**必须**对 `polish`、`rewrite`、`continue`、`expand` 四个 skill 的输出执行基础校验。校验失败时**必须**拒绝输出并返回结构化错误，不得将异常输出注入调用链。

### 校验规则

以下规则按顺序执行，命中任一规则即判定输出无效：

| 规则 ID          | 规则名称      | 检测条件                                         | 适用 Skill           | 错误详情               |
| ---------------- | ------------- | ------------------------------------------------ | -------------------- | ---------------------- |
| V-EMPTY          | 空输出        | `outputText.trim().length === 0`                 | 全部四个             | `"LLM 返回空内容"`     |
| V-CODEBLOCK      | 代码块污染    | 输出包含 ` ``` `（三个连续反引号）               | 全部四个             | `"输出包含代码块"`     |
| V-HTML           | HTML 标签污染 | 输出匹配 `/<[a-z][a-z0-9]*[\s>]/i`（开标签模式） | 全部四个             | `"输出包含 HTML 标签"` |
| V-INFLATE-STRICT | 严格膨胀      | `outputText.length > inputText.length * 10`      | `polish`、`rewrite`  | `"输出长度异常膨胀"`   |
| V-INFLATE-LOOSE  | 宽松膨胀      | `outputText.length > inputText.length * 20`      | `continue`、`expand` | `"输出长度异常膨胀"`   |

**规则细节说明**：

1. **V-EMPTY**：`outputText` 为 `undefined`、`null` 或 trim 后为空字符串，均判定为空输出
2. **V-CODEBLOCK**：检测三个连续反引号 ` ``` ` 的存在，无论是否包含语言标识符
3. **V-HTML**：使用正则 `/<[a-z][a-z0-9]*[\s>]/i` 匹配 HTML 开标签，覆盖 `<div>`、`<script>`、`<p class="...">` 等模式；不匹配 XML 声明和注释
4. **V-INFLATE-STRICT**：`polish` 和 `rewrite` 的输出应与输入体量相近，10 倍膨胀为异常阈值
5. **V-INFLATE-LOOSE**：`continue` 和 `expand` 的输出预期比输入长，给予 20 倍的宽松阈值

### 膨胀检测的输入基准

膨胀比计算的 `inputText` 取值规则：

- 对 `polish`、`rewrite`、`expand`：`inputText` 为用户选中的文本（`run.context.selectedText` 或 `run.input`）
- 对 `continue`：`inputText` 为传入的文档上下文（`run.context.documentContent` 或等效字段），因续写无选中文本
- 若 `inputText` 为空或不可用，跳过膨胀检测规则（V-INFLATE-\*），仅执行 V-EMPTY、V-CODEBLOCK、V-HTML

### 错误码

校验失败**必须**返回以下结构化错误：

```typescript
{
  code: "SKILL_OUTPUT_INVALID",
  message: "<规则错误详情>，请重新尝试"
}
```

- `SKILL_OUTPUT_INVALID` **必须**注册到 `IpcErrorCode` 联合类型中
- 错误将通过 `skill:stream:done` 的失败路径推送到渲染进程，AI 面板展示错误提示

### 校验位置

校验**必须**在 `validateSkillRunOutput()` 函数中执行，保持与 synopsis 校验相同的调用点。具体修改：将现有的 `if (leafSkillId(args.skillId) !== "synopsis") return { ok: true }` 替换为按 skill ID 分发校验逻辑。

### 不受影响的 Skill

以下 skill 的输出校验行为保持不变：

- `synopsis`：继续使用已有的 `validateSynopsisOutput()` 函数
- `condense`、`style-transfer`、`translate`、`summarize`：暂不增加输出校验，维持当前的无条件放行（后续任务负责）
- 自定义 skill（`scope: global | project`）：暂不增加输出校验

---

### Scenario: S-OUT-1 正常输出通过校验（回归）

- **假设** 用户选中 500 字的文本，触发 `polish` 技能
- **当** LLM 返回 480 字的润色结果，不含代码块或 HTML 标签
- **则** `validateSkillRunOutput()` 校验通过，返回 `{ ok: true }`
- **并且** 润色结果正常推送到 AI 面板

### Scenario: S-OUT-2 空输出被拦截

- **假设** 用户选中文本，触发 `rewrite` 技能
- **当** LLM 返回空字符串（`""`）或仅含空白字符（`"   \n  "`）
- **则** `validateSkillRunOutput()` 命中 V-EMPTY 规则
- **并且** 返回 `{ ok: false, error: { code: "SKILL_OUTPUT_INVALID", message: "LLM 返回空内容，请重新尝试" } }`
- **并且** 不将空输出推送到渲染进程

### Scenario: S-OUT-3 代码块污染被拦截

- **假设** 用户选中一段叙事文本，触发 `polish` 技能
- **当** LLM 返回包含 ` ```python\nprint("hello")\n``` ` 的内容
- **则** `validateSkillRunOutput()` 命中 V-CODEBLOCK 规则
- **并且** 返回 `{ ok: false, error: { code: "SKILL_OUTPUT_INVALID", message: "输出包含代码块，请重新尝试" } }`

### Scenario: S-OUT-4 HTML 标签污染被拦截

- **假设** 用户选中文本，触发 `expand` 技能
- **当** LLM 返回包含 `<div class="content">扩展后的文本</div>` 的内容
- **则** `validateSkillRunOutput()` 命中 V-HTML 规则
- **并且** 返回 `{ ok: false, error: { code: "SKILL_OUTPUT_INVALID", message: "输出包含 HTML 标签，请重新尝试" } }`

### Scenario: S-OUT-5 polish 输出膨胀 10 倍被拦截

- **假设** 用户选中 200 字的文本，触发 `polish` 技能
- **当** LLM 返回 2,500 字的输出（膨胀 12.5 倍，超过 10 倍阈值）
- **则** `validateSkillRunOutput()` 命中 V-INFLATE-STRICT 规则
- **并且** 返回 `{ ok: false, error: { code: "SKILL_OUTPUT_INVALID", message: "输出长度异常膨胀，请重新尝试" } }`

### Scenario: S-OUT-6 continue 在 20 倍阈值内通过

- **假设** 用户的文档上下文为 300 字，触发 `continue` 技能
- **当** LLM 返回 4,000 字的续写内容（膨胀 13.3 倍，未超过 20 倍阈值）
- **则** `validateSkillRunOutput()` 校验通过
- **并且** 续写结果正常推送到 AI 面板

### Scenario: S-OUT-7 continue 超过 20 倍阈值被拦截

- **假设** 用户的文档上下文为 300 字，触发 `continue` 技能
- **当** LLM 返回 7,000 字的续写内容（膨胀 23.3 倍，超过 20 倍阈值）
- **则** `validateSkillRunOutput()` 命中 V-INFLATE-LOOSE 规则
- **并且** 返回 `{ ok: false, error: { code: "SKILL_OUTPUT_INVALID" } }`

### Scenario: S-OUT-8 synopsis 校验逻辑不受影响（回归）

- **假设** 用户触发 `synopsis` 技能
- **当** LLM 返回输出
- **则** `validateSkillRunOutput()` 继续调用 `validateSynopsisOutput()` 函数进行专属校验
- **并且** synopsis 的校验规则（长度范围、段落结构）与本次变更前完全一致

### Scenario: S-OUT-9 无输入基准时跳过膨胀检测

- **假设** 用户触发 `polish` 技能，但因调用链异常 `inputText` 为空
- **当** LLM 返回 5,000 字的输出
- **则** V-INFLATE-STRICT 规则因无输入基准而被跳过
- **并且** 仅执行 V-EMPTY、V-CODEBLOCK、V-HTML 校验
- **并且** 若这三项通过，输出正常放行

---

## 约束

1. 校验规则的阈值（10 倍 / 20 倍膨胀比）由本 Delta Spec 固定，实现 Agent 不可私自调整
2. 校验执行顺序为 V-EMPTY → V-CODEBLOCK → V-HTML → V-INFLATE-\*，命中即停
3. `SKILL_OUTPUT_INVALID` 必须纳入 `IpcErrorCode` 联合类型
4. 不修改 `validateSynopsisOutput()` 函数的任何逻辑
5. 不为本任务未列出的 skill（`condense`、`style-transfer`、`translate`、`summarize`、自定义 skill）增加校验

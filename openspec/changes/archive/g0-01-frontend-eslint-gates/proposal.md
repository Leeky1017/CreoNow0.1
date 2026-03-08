# G0-01 前端 ESLint 静态门禁扩展

- **GitHub Issue**: #1030
- **所属任务簇**: W0-GATE（门禁基础设施）
- **涉及模块**: ci-gates, eslint-rules
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 现状

AMP 审计在 5 轮独立审查中，反复命中同类前端坏味道。其中 2 类已有 ESLint 门禁（`i18next/no-literal-string` 阻断裸字符串、`creonow/no-raw-tailwind-tokens` 阻断原始色值），但以下 4 类高频问题至今**零门禁**：

| 问题 | AMP 命中次数 | 存量违规 | 当前门禁 |
|------|-------------|---------|----------|
| 原生 HTML 元素绕过设计系统 | 4 轮 | 94+ renderer / 17+ stories | 无 |
| IPC 错误码裸露给用户 | 3 轮 | 15+ 处 | 无 |
| Tailwind 内置阴影类未走 Token | 2 轮 | 待确认 | 待确认（可能被 `no-raw-tailwind-tokens` 部分覆盖） |
| Storybook 文件逃逸设计规范 | 2 轮 | 与 renderer 同规模 | 规则存在但 override 不覆盖 `.stories.tsx` |

这些问题的共同特征：**单文件、语法级、可用 AST 检测**——正是 ESLint 的最佳应用场景（参见 `docs/references/testing/06-guard-and-lint-policy.md`）。

### 2. 根因

- **原生 HTML 绕过**：开发者直接写 `<button>`, `<input>`, `<select>`, `<dialog>`, `<a>`, `<textarea>` 等原生元素，绕过 Radix UI 设计系统组件。导致：主题切换失效、无障碍属性缺失、样式不一致。这在 `07-ui-ux-design-audit.md` §三 中被反复标记为"Primitive 绕过"。
- **错误码裸露**：IPC 错误对象的 `code` 字段（如 `CHANNEL_NOT_REGISTERED`, `SAVE_FAILED`）直接渲染在 JSX 中或拼接进用户可见字符串。用户看到技术黑话而非人话提示。这在 `01-master-roadmap.md` §3.2 和 `07-ui-ux-design-audit.md` §四 中被反复标记。
- **阴影类逃逸**：`AGENTS.md` 第五条明令禁止 `shadow-lg`、`shadow-xl`、`shadow-2xl`，必须走 `--shadow-*` Design Token，但现有 `no-raw-tailwind-tokens` 规则的正则可能未覆盖阴影类匹配。
- **Storybook 逃逸**：`.eslintrc.cjs` 中的 `creonow/no-raw-tailwind-tokens: error` 和 `i18next/no-literal-string: error` 仅在 `apps/desktop/renderer/src/**/*.{ts,tsx}` override 中启用，排除了 `**/*.stories.*` 和 `**/*.test.*`。Storybook 文件因此可以自由使用硬编码色值和裸字符串，形成"规范孤岛"。

### 3. 不做的后果

- A0-09（i18n 存量）、A0-15（占位 UI 收口）、A0-22（错误文案修正）等实施完成后，同类问题会在后续开发中重新引入——"治好了存量，挡不住增量"
- 每轮 AMP 审计耗费 40-60 条 comment 反复标记同类问题，审计效率极低
- 审计者信任度下降——"上次说要改的，这次又出了"

### 4. 证据来源

| 文档 | 章节 | 内容 |
|------|------|------|
| `docs/audit/amp/07-ui-ux-design-audit.md` | §三 | "94 处原生 HTML 绕过 Radix 设计系统" |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §四 | "15 处错误码直接渲染给用户" |
| `docs/audit/amp/01-master-roadmap.md` | §3.2 | "错误体验必须人话化" |
| `AGENTS.md` | §五 禁令 #4 | "禁止使用 Tailwind 内置阴影类" |
| `docs/references/testing/06-guard-and-lint-policy.md` | ESLint vs Guard | "单文件语法级检查用 ESLint" |
| `.eslintrc.cjs` | renderer override | 仅覆盖生产代码，排除 stories/test |

---

## What：做什么

### 规则 1: `creonow/no-native-html-element`

**新建 ESLint 规则**，在 renderer 生产代码中禁止直接使用原生交互 HTML 元素：

- 禁止标签：`<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>`, `<a>`, `<label>`, `<checkbox>`, `<radio>`
- 检测方式：AST `JSXOpeningElement` 节点，检查 `node.name.name` 是否在禁止列表中
- 自动建议：报告消息中提示对应的 Radix/设计系统替代组件
- 豁免：`// eslint-disable-next-line creonow/no-native-html-element -- reason` 需写明原因
- 级别：以 `warn` 启动（存量 94+ 违规），通过 `lint-ratchet` 机制管理存量消减

### 规则 2: `creonow/no-raw-error-code-in-ui`

**新建 ESLint 规则**，在 renderer 生产代码中禁止将 IPC 错误码直接渲染到 UI：

- 检测模式 1：JSX 中直接引用 `error.code` / `err.code` / `*.errorCode`（`MemberExpression` in JSX context）
- 检测模式 2：模板字符串中包含 `error.code`（`TemplateLiteral` 中的 `MemberExpression`）
- 不误报：在 `catch` 块、日志、条件判断中使用 `error.code` 不报错——仅当 error.code 出现在 JSX 返回值或用户可见字符串拼接中才报
- 级别：以 `warn` 启动，通过 `lint-ratchet` 管理

### 扩展 3: `creonow/no-raw-tailwind-tokens` 阴影类覆盖

**扩展现有规则**的正则模式，增加对 Tailwind 内置阴影类的匹配：

- 新增匹配：`shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-inner`, `shadow-none`（仅匹配前缀 `shadow-` 后跟已知大小后缀的模式）
- 不误报：`--shadow-*` CSS 变量引用不匹配
- 验证：检查现有规则正则是否已覆盖，若已覆盖则本项为"确认覆盖 + 补充测试"

### 扩展 4: `.eslintrc.cjs` Storybook 覆盖

**扩展 ESLint override 作用范围**，让设计规范类规则也覆盖 `.stories.tsx` 文件：

- 新增 override 段：`apps/desktop/renderer/src/**/*.stories.{ts,tsx}` 启用 `creonow/no-raw-tailwind-tokens: warn`
- `i18next/no-literal-string` 在 Storybook 中**不启用**——Story 的 args/文案允许硬编码（非用户可见的正式文案）
- 级别：以 `warn` 启动

---

## Non-Goals：不做什么

1. **不修改已有的 `no-raw-tailwind-tokens` 规则核心逻辑**——仅验证覆盖范围并补充阴影类匹配
2. **不在 test 文件中启用这些规则**——测试文件允许使用原生元素和简化文案
3. **不直接修复存量违规**——存量修复由 A0-09、A0-15、A0-22 等对应 change 负责；本 change 只建门禁
4. **不为 preload/main 进程代码增加这些规则**——这些规则针对 renderer（UI 层）

---

## 依赖与影响

- **上游依赖**: 无——ESLint 基础设施已完备
- **下游受益**: A0-09, A0-15, A0-16, A0-22——这些 change 清存量后，门禁防止增量回流
- **与 `lint-ratchet` 的关系**: 新规则以 `warn` 启动 → 更新 `lint-baseline.json` 记录初始违规数 → 后续只允许减少不允许增加 → 存量清零后升级为 `error`

---

## 28-Pattern 覆盖声明

本 change 覆盖以下高频问题模式：

| Pattern # | 名称 | 门禁类型 | 级别 |
|-----------|------|---------|------|
| #2 | 原生 HTML 元素绕过设计系统 | ESLint `creonow/no-native-html-element` | warn → error |
| #4 | IPC 错误码裸露给用户 | ESLint `creonow/no-raw-error-code-in-ui` | warn → error |
| #12 | Storybook 文件逃逸设计规范 | ESLint override scope 扩展 | warn |
| #13 | Tailwind 内置阴影类未走 Token | ESLint `creonow/no-raw-tailwind-tokens` 扩展 | error |

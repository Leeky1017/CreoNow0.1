# Tasks: G0-01 前端 ESLint 静态门禁扩展

- **GitHub Issue**: #1030
- **分支**: `task/1030-frontend-eslint-gates`
- **Delta Spec**: `specs/eslint-frontend/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0-GATE: 门禁基础设施

## 三层执行模型归属

**Tier 1: CI 自动阻断** —— 本 Change 产出的所有 ESLint 规则纳入 CI `lint` job，新违规直接红灯，零人工干预。覆盖 Pattern #2, #4, #12, #13。

公共约定见 `EXECUTION_ORDER.md` §二·五。

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `creonow/no-native-html-element` 规则在 renderer 生产代码中报告原生交互元素使用 | S-LINT-01 |
| AC-2 | 设计系统组件、布局元素、test/stories 文件不误报 | S-LINT-02, S-LINT-03, S-LINT-12 |
| AC-3 | `creonow/no-raw-error-code-in-ui` 规则在 JSX 中报告 error.code 裸露 | S-LINT-04 |
| AC-4 | 条件判断、catch/日志中的 error.code 引用不误报 | S-LINT-05, S-LINT-06 |
| AC-5 | `no-raw-tailwind-tokens` 覆盖 Tailwind 阴影类 | S-LINT-07, S-LINT-08 |
| AC-6 | `.stories.tsx` 文件启用 `no-raw-tailwind-tokens: warn` | S-LINT-09 |
| AC-7 | `.stories.tsx` 文件不启用 `i18next/no-literal-string` | S-LINT-10 |
| AC-8 | 新规则以 `warn` 启动，`lint-baseline.json` 已更新初始违规数 | S-LINT-11 |
| AC-9 | `scripts/eslint-rules/index.cjs` 导出新规则，`.eslintrc.cjs` 启用 | 全局 |

---

## Phase 1: Red（测试先行）

### Task 1.1: `no-native-html-element` 规则测试

**映射验收标准**: AC-1, AC-2

- [ ] 测试：`<button>` 在生产 JSX 中触发违规报告
- [ ] 测试：`<input>`, `<select>`, `<textarea>` 同样触发
- [ ] 测试：`<dialog>`, `<a>`, `<label>` 同样触发
- [ ] 测试：`<Button>` (大写/组件) 不触发
- [ ] 测试：`<div>`, `<span>`, `<p>`, `<h1>` 等布局元素不触发
- [ ] 测试：`<img>`, `<video>`, `<canvas>` 等媒体元素不触发
- [ ] 测试：报告消息包含替代组件建议

**文件**: `scripts/eslint-rules/__tests__/no-native-html-element.test.cjs`（新建）

### Task 1.2: `no-raw-error-code-in-ui` 规则测试

**映射验收标准**: AC-3, AC-4

- [ ] 测试：`<p>{error.code}</p>` 触发违规报告
- [ ] 测试：`` `Error: ${err.code}` `` 在 JSX return 中触发
- [ ] 测试：`if (error.code === 'X')` 不触发
- [ ] 测试：`console.error(error.code)` 不触发
- [ ] 测试：`catch (e) { logger.warn(e.code) }` 不触发
- [ ] 测试：`switch (error.code) { case ... }` 不触发
- [ ] 测试：非 `.code` 的 member 访问（如 `error.message`）不触发

**文件**: `scripts/eslint-rules/__tests__/no-raw-error-code-in-ui.test.cjs`（新建）

### Task 1.3: 阴影类匹配测试

**映射验收标准**: AC-5

- [ ] 测试：`className="shadow-lg"` 触发 `no-raw-tailwind-tokens` 违规
- [ ] 测试：`className="shadow-xl shadow-2xl"` 触发两次违规
- [ ] 测试：`className="shadow-[var(--shadow-card)]"` 不触发

**文件**: `scripts/eslint-rules/__tests__/no-raw-tailwind-tokens.test.cjs`（已有文件，补充测试）

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `no-native-html-element` 规则

**映射验收标准**: AC-1, AC-2, AC-9

- [ ] 创建 `scripts/eslint-rules/no-native-html-element.cjs`
- [ ] 定义禁止标签列表：`button, input, select, textarea, dialog, a, label`
- [ ] 实现 `JSXOpeningElement` visitor，检查 `node.name.name` 是否在禁止列表中
- [ ] 定义替代组件映射表（`button` → `Button`, `input` → `Input` 等）
- [ ] 在 `index.cjs` 中注册导出

### Task 2.2: 实现 `no-raw-error-code-in-ui` 规则

**映射验收标准**: AC-3, AC-4, AC-9

- [ ] 创建 `scripts/eslint-rules/no-raw-error-code-in-ui.cjs`
- [ ] 实现 `MemberExpression` visitor，检测 `*.code` / `*.errorCode` 模式
- [ ] 通过 AST 上下文判断是否在 JSX return 路径中（检查祖先节点链）
- [ ] 排除 if/switch/catch/console 上下文
- [ ] 在 `index.cjs` 中注册导出

### Task 2.3: 扩展阴影类匹配

**映射验收标准**: AC-5

- [ ] 审查 `no-raw-tailwind-tokens.cjs` 中的正则表达式
- [ ] 如未覆盖，增加 `shadow-(sm|md|lg|xl|2xl|inner|none)` 匹配模式
- [ ] 排除 `shadow-[var(--*)]` 的 CSS 变量引用

### Task 2.4: 配置 ESLint overrides

**映射验收标准**: AC-6, AC-7, AC-8

- [ ] `.eslintrc.cjs` 新增 renderer override 段启用 `creonow/no-native-html-element: warn`
- [ ] `.eslintrc.cjs` 新增 renderer override 段启用 `creonow/no-raw-error-code-in-ui: warn`
- [ ] `.eslintrc.cjs` 新增 `.stories.tsx` override 段启用 `creonow/no-raw-tailwind-tokens: warn`
- [ ] 运行 `pnpm lint:warning-budget:update` 更新 baseline
- [ ] 验证 `pnpm lint:warning-budget` 通过

---

## Phase 3: Refactor（收口）

### Task 3.1: 文档更新

- [ ] 更新 `scripts/README.md` 记录新规则
- [ ] 更新 `docs/references/coding-standards.md` 记录新门禁
- [ ] 确认 `AGENTS.md` 禁令与新规则一致

---

## TDD 规范引用

> 本 Change 的所有测试必须遵循 `docs/references/testing/` 中的规范。开始写测试前，先阅读以下文档。

**必读文档**：
- 测试哲学与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策树：`docs/references/testing/02-test-type-decision-guide.md`
- Guard 与 Lint 策略：`docs/references/testing/06-guard-and-lint-policy.md`
- 命令与 CI 映射：`docs/references/testing/07-test-command-and-ci-map.md`

**本地验证命令**：
```bash
pnpm -C apps/desktop vitest run <test-file-pattern>   # ESLint 规则测试
pnpm lint                                              # 验证新规则生效
pnpm typecheck                                         # 类型检查
```

**五大反模式（Red Line）**：
1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为

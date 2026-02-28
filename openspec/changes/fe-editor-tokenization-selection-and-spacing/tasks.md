## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：为编辑器补齐 `--color-selection`、`--color-caret`、`--text-editor-paragraph-spacing` Token，使选区/光标/段间距可被主题系统治理。不调整 TipTap 扩展体系。
- [ ] 1.2 审阅并确认错误路径与边界路径：亮/暗主题下 Token 值需分别定义；CJK locale 下段间距可能需要不同值（可选）。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：选区颜色来自 `--color-selection`，光标颜色来自 `--color-caret`，段间距来自 `--text-editor-paragraph-spacing`，三者在亮/暗主题下均可读且无违和。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/styles/tokens.css`
  - 新增 Token（亮/暗两套值）：
    - `--color-selection`（亮：`rgba(59, 130, 246, 0.3)` 类蓝色半透明；暗：`rgba(96, 165, 250, 0.3)`）
    - `--color-caret`（亮：`var(--color-fg-default)`；暗：同）
    - `--text-editor-paragraph-spacing`（建议 `0.75em`，与现有 `--text-editor-line-height: 1.8` 配合）
- `apps/desktop/renderer/src/styles/main.css`
  - 新增 ProseMirror 编辑区样式规则：
    - `.ProseMirror ::selection { background: var(--color-selection); }`
    - `.ProseMirror { caret-color: var(--color-caret); }`
    - `.ProseMirror p + p { margin-top: var(--text-editor-paragraph-spacing); }`
  - 当前 L118 有 `letter-spacing: 0.01em`（已存在，不改）
- `apps/desktop/renderer/src/features/editor/typography.ts`
  - 已有 `--text-editor-size`/`--text-editor-line-height`/`--text-editor-line-height-cjk`，新 Token 与之平行，无需改此文件（除非需要 CJK 段间距变体）

**为什么是这些触点**：tokens.css 是 Token SSOT，main.css 是 ProseMirror 全局样式注入点，typography.ts 是编辑器排版工具（本次不改）。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `ED-FE-TOK-S1` | `apps/desktop/renderer/src/features/editor/__tests__/editor-selection-token.guard.test.ts` | `it('tokens.css defines --color-selection for light and dark themes')` | 读取 tokens.css，断言包含 `--color-selection` 在 `:root` 和 `.dark`/`[data-theme="dark"]` 中 | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/editor/__tests__/editor-selection-token.guard` |
| `ED-FE-TOK-S2` | 同上 | `it('tokens.css defines --color-caret')` | 断言包含 `--color-caret` | `fs.readFileSync` | 同上 |
| `ED-FE-TOK-S3` | 同上 | `it('tokens.css defines --text-editor-paragraph-spacing')` | 断言包含 `--text-editor-paragraph-spacing` | `fs.readFileSync` | 同上 |
| `ED-FE-TOK-S4` | 同上 | `it('main.css applies selection token to ProseMirror')` | 读取 main.css，断言包含 `.ProseMirror` 的 `::selection` 规则引用 `--color-selection` | `fs.readFileSync` | 同上 |
| `ED-FE-TOK-S5` | 同上 | `it('main.css applies caret token to ProseMirror')` | 断言包含 `caret-color: var(--color-caret)` | `fs.readFileSync` | 同上 |

### 可复用测试范本

- Editor typography contract：`apps/desktop/renderer/src/features/editor/editor-typography.contract.test.ts`

## 3. Red（先写失败测试）

- [ ] 3.1 `ED-FE-TOK-S1`：读取 `tokens.css`，断言包含 `--color-selection` 在亮/暗两套主题中。
  - 期望红灯原因：当前 tokens.css 未定义 `--color-selection`。
- [ ] 3.2 `ED-FE-TOK-S2`：断言包含 `--color-caret`。
  - 期望红灯原因：未定义。
- [ ] 3.3 `ED-FE-TOK-S3`：断言包含 `--text-editor-paragraph-spacing`。
  - 期望红灯原因：未定义。
- [ ] 3.4 `ED-FE-TOK-S4`：读取 `main.css`，断言 `.ProseMirror` 区域有 `::selection` 规则引用 `--color-selection`。
  - 期望红灯原因：当前无此规则，选区使用浏览器默认蓝色。
- [ ] 3.5 `ED-FE-TOK-S5`：断言 `.ProseMirror` 有 `caret-color: var(--color-caret)`。
  - 期望红灯原因：当前无此规则。
- 运行：`pnpm -C apps/desktop test:run features/editor/__tests__/editor-selection-token.guard`

## 4. Green（最小实现通过）

- [ ] 4.1 `tokens.css`：在 `:root`（亮）和 `.dark`（暗）中新增：
  - `--color-selection: rgba(59, 130, 246, 0.3)` / 暗：`rgba(96, 165, 250, 0.3)`
  - `--color-caret: var(--color-fg-default)` / 暗：同
  - `--text-editor-paragraph-spacing: 0.75em`
  → S1 + S2 + S3 转绿
- [ ] 4.2 `main.css`：新增 ProseMirror 样式规则：
  - `.ProseMirror ::selection { background: var(--color-selection); }`
  - `.ProseMirror { caret-color: var(--color-caret); }`
  - `.ProseMirror p + p { margin-top: var(--text-editor-paragraph-spacing); }`
  → S4 + S5 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认新 Token 命名与现有 `--text-editor-*` 系列一致（`--text-editor-paragraph-spacing` 而非 `--editor-paragraph-spacing`）
- [ ] 5.2 若需要 CJK 段间距变体，可新增 `--text-editor-paragraph-spacing-cjk`（可选，不阻塞本 change）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 5 个 guard 测试全部失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段 5 个测试全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）

## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：系统性清扫 Feature 层 Token 逃逸（hex/rgba、数字 z-index、transition-all、h/w-screen），建立 guard 防回潮。不引入新功能，不重写特定页面（SearchPanel 重写见独立 change）。
- [ ] 1.2 审阅并确认错误路径与边界路径：允许极少数例外（第三方组件、系统色），需建立白名单。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：Feature 层 guard 测试全绿（hex/rgba=0、数字 z-index=0、transition-all=0，白名单除外）。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- 当前基线（Feature 层，排除 test/stories）：
  - hex/rgba 硬编码：144 处
  - 数字 z-index（`z-\d+`）：9 处
  - `transition-all`：28 处（应改为精确 `transition-colors`/`transition-opacity` 等）
  - `h-screen`/`w-screen`：0 处（已清零）
- `apps/desktop/renderer/src/styles/tokens.css`：
  - 可能需要补齐缺失 Token（如 `--z-*`、`--shadow-*`、`--spacing-*`）
- 高密度文件（按 hex/rgba 数量排序）：
  - `features/search/SearchPanel.tsx`（72 处）→ 由 `fe-searchpanel-tokenized-rewrite` 处理
  - `features/zen-mode/ZenMode.tsx`（21 处）→ 由 `fe-zenmode-token-escape-cleanup` 处理
  - 其余分散在 ai/character/editor/dashboard/settings 等目录
- 清扫策略：
  - hex/rgba → `var(--color-*)` Token
  - `z-10`/`z-20`/`z-50` → 语义 z-index Token（`var(--z-dropdown)`/`var(--z-modal)` 等）
  - `transition-all` → 精确属性（`transition-colors`/`transition-opacity`/`transition-transform`）

**为什么是这些触点**：144+9+28=181 处逃逸分布在 Feature 层各目录，guard 测试覆盖全量。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-TOKEN-S1` | `apps/desktop/renderer/src/features/__tests__/token-escape-color.guard.test.ts` | `it('feature layer has no raw hex or rgba')` | 扫描 features/**/*.tsx（排除 test/stories），断言不含 `#[0-9a-f]{3,8}` 或 `rgba(`（白名单除外） | `fs`/`glob` | `pnpm -C apps/desktop test:run features/__tests__/token-escape-color.guard` |
| `WB-FE-TOKEN-S2` | `apps/desktop/renderer/src/features/__tests__/token-escape-z.guard.test.ts` | `it('feature layer has no numeric z-index classes')` | 断言不含 `z-\d+` class | `fs`/`glob` | `pnpm -C apps/desktop test:run features/__tests__/token-escape-z.guard` |
| `WB-FE-TOKEN-S3` | `apps/desktop/renderer/src/features/__tests__/token-escape-motion.guard.test.ts` | `it('feature layer has no transition-all')` | 断言不含 `transition-all` | `fs`/`glob` | `pnpm -C apps/desktop test:run features/__tests__/token-escape-motion.guard` |
| `WB-FE-TOKEN-S4` | `apps/desktop/renderer/src/features/__tests__/token-escape-screen.guard.test.ts` | `it('feature layer has no h-screen or w-screen')` | 断言不含 `h-screen`/`w-screen` | `fs`/`glob` | `pnpm -C apps/desktop test:run features/__tests__/token-escape-screen.guard` |

### 可复用测试范本

- 源码 guard 范本：已有多个 guard 测试模式

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-TOKEN-S1`：扫描 features/**/*.tsx，断言不含 hex/rgba（白名单除外）。
  - 期望红灯原因：当前 144 处 hex/rgba 硬编码。
- [ ] 3.2 `WB-FE-TOKEN-S2`：断言不含数字 z-index class。
  - 期望红灯原因：当前 9 处 `z-\d+`。
- [ ] 3.3 `WB-FE-TOKEN-S3`：断言不含 `transition-all`。
  - 期望红灯原因：当前 28 处 transition-all。
- [ ] 3.4 `WB-FE-TOKEN-S4`：断言不含 `h-screen`/`w-screen`。
  - 期望绿灯：当前已为 0（此 guard 防回潮）。
- 运行：`pnpm -C apps/desktop test:run features/__tests__/token-escape-`

## 4. Green（最小实现通过）

- [ ] 4.1 `tokens.css`：补齐缺失 Token（`--z-dropdown`/`--z-modal`/`--z-overlay` 等语义 z-index）
- [ ] 4.2 hex/rgba 清扫：逐文件替换为 `var(--color-*)` Token（排除 SearchPanel/ZenMode 由独立 change 处理） → S1 逐步转绿
- [ ] 4.3 z-index 清扫：`z-10`/`z-20`/`z-50` → 语义 Token class → S2 转绿
- [ ] 4.4 transition-all 清扫：替换为精确属性（`transition-colors`/`transition-opacity`/`transition-transform`） → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认白名单机制合理（第三方组件、SVG fill 等必要例外）
- [ ] 5.2 确认新增 Token 命名与现有 Token 体系一致

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 grep 基线计数（144/9/28/0）
- [ ] 6.2 记录 RUN_LOG：Green 阶段清扫后计数 + guard 通过输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）

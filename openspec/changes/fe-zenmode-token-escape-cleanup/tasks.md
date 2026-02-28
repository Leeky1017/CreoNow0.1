## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：清扫 ZenMode 残余 Token 逃逸（hover rgba、魔法间距字号、状态栏背景、内联 style），不改变 ZenMode 功能与信息架构。
- [ ] 1.2 审阅并确认错误路径与边界路径：无新增错误路径，纯样式替换。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：ZenMode.tsx 和 ZenModeStatus.tsx 中不得残留 `rgba(...)`、数字 `px-[...]`/`text-[...]` 魔法值、裸 `style={{}}` 中的硬编码颜色。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/zen-mode/ZenMode.tsx`
  - L51：`w-[2px] h-[1.2em]` → 光标尺寸可保留（em 相对值），但 `style={{ backgroundColor }}` 应改为 class
  - L126/173：`text-[11px] tracking-wide opacity-60/40` → `--zen-label-size` Token
  - L142：`rgba(255, 255, 255, 0.05)` → 新增 `--color-zen-hover` Token
  - L197：`max-w-[720px] px-[80px] py-[120px]` → `--zen-content-max-width` / `--zen-content-padding-x` / `--zen-content-padding-y`
  - L200：`text-[48px]` → `--zen-title-size`
  - L211：`text-[18px] leading-[1.8]` → `--zen-body-size` / `--zen-body-line-height`
  - L99/108/119/135/184/201/212：多处 `style={{}}` → 尽量收敛为 Tailwind Token class
- `apps/desktop/renderer/src/features/zen-mode/ZenModeStatus.tsx`
  - L57：`rgba(0, 0, 0, 0.5)` → `--color-zen-statusbar-bg`
  - L58：`backdropFilter: "blur(8px)"` → Tailwind `backdrop-blur-sm` 或 Token
  - L22/65/79/93/108：`style={{}}` 内联 → 收敛为 Token class
- `apps/desktop/renderer/src/styles/tokens.css`
  - 新增 Token：`--color-zen-hover`、`--color-zen-statusbar-bg`、`--zen-content-max-width`、`--zen-content-padding-x`、`--zen-content-padding-y`、`--zen-title-size`、`--zen-body-size`、`--zen-body-line-height`、`--zen-label-size`

**为什么是这些触点**：ZenMode.tsx + ZenModeStatus.tsx 是 ZenMode 全部渲染代码，tokens.css 是 Token SSOT。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `ED-FE-ZEN-S1` | `apps/desktop/renderer/src/features/zen-mode/__tests__/zenmode-token-escape.guard.test.ts` | `it('ZenMode.tsx contains no raw rgba values')` | 读取源码，正则断言不含 `rgba(` 字面量 | `fs.readFileSync` 读源码 | `pnpm -C apps/desktop test:run features/zen-mode/__tests__/zenmode-token-escape.guard` |
| `ED-FE-ZEN-S2` | 同上 | `it('ZenMode.tsx contains no magic pixel values in className')` | 正则断言不含 `text-[\\d+px]`、`px-[\\d+px]`、`py-[\\d+px]`、`max-w-[\\d+px]` | 同上 | 同上 |
| `ED-FE-ZEN-S3` | 同上 | `it('ZenModeStatus.tsx contains no raw rgba values')` | 读取 ZenModeStatus.tsx 源码，断言不含 `rgba(` | 同上 | 同上 |
| `ED-FE-ZEN-S4` | `apps/desktop/renderer/src/features/zen-mode/__tests__/zenmode-tokens-exist.test.ts` | `it('tokens.css defines all required zen-mode tokens')` | 读取 tokens.css，断言包含 `--color-zen-hover`、`--color-zen-statusbar-bg`、`--zen-title-size` 等 | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/zen-mode/__tests__/zenmode-tokens-exist` |

### 可复用测试范本

- 源码 guard 范本：`apps/desktop/renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx`（静态断言模式）

## 3. Red（先写失败测试）

- [ ] 3.1 `ED-FE-ZEN-S1`：新建 guard 测试，读取 `ZenMode.tsx` 源码，断言不含 `rgba(`。
  - 期望红灯原因：L142 存在 `rgba(255, 255, 255, 0.05)`。
- [ ] 3.2 `ED-FE-ZEN-S2`：断言 `ZenMode.tsx` 不含 `text-[48px]`、`text-[18px]`、`text-[11px]`、`px-[80px]`、`py-[120px]`、`max-w-[720px]`。
  - 期望红灯原因：L126/173/197/200/211 均存在魔法值。
- [ ] 3.3 `ED-FE-ZEN-S3`：读取 `ZenModeStatus.tsx` 源码，断言不含 `rgba(`。
  - 期望红灯原因：L57 存在 `rgba(0, 0, 0, 0.5)`。
- [ ] 3.4 `ED-FE-ZEN-S4`：读取 `tokens.css`，断言包含 `--color-zen-hover`、`--color-zen-statusbar-bg`、`--zen-title-size`、`--zen-body-size`、`--zen-content-max-width`。
  - 期望红灯原因：当前 tokens.css 未定义这些 Token。
- 运行：`pnpm -C apps/desktop test:run features/zen-mode/__tests__/zenmode-token-escape`

## 4. Green（最小实现通过）

- [ ] 4.1 `tokens.css`：新增 ZenMode 专用 Token 定义（亮/暗两套值）：
  - `--color-zen-hover`、`--color-zen-statusbar-bg`
  - `--zen-content-max-width: 720px`、`--zen-content-padding-x: 80px`、`--zen-content-padding-y: 120px`
  - `--zen-title-size: 48px`、`--zen-body-size: 18px`、`--zen-body-line-height: 1.8`、`--zen-label-size: 11px`
  → S4 转绿
- [ ] 4.2 `ZenMode.tsx`：
  - L142 `rgba(255,255,255,0.05)` → `var(--color-zen-hover)` → S1 转绿
  - L197 `max-w-[720px] px-[80px] py-[120px]` → `max-w-[var(--zen-content-max-width)] px-[var(--zen-content-padding-x)] py-[var(--zen-content-padding-y)]`
  - L200 `text-[48px]` → `text-[var(--zen-title-size)]`
  - L211 `text-[18px] leading-[1.8]` → `text-[var(--zen-body-size)] leading-[var(--zen-body-line-height)]`
  - L126/173 `text-[11px]` → `text-[var(--zen-label-size)]`
  → S2 转绿
- [ ] 4.3 `ZenModeStatus.tsx`：
  - L57 `rgba(0,0,0,0.5)` → `var(--color-zen-statusbar-bg)` → S3 转绿
  - L58 `backdropFilter: "blur(8px)"` → Tailwind `backdrop-blur-sm` 或 Token class

## 5. Refactor（保持绿灯）

- [ ] 5.1 将 ZenMode.tsx 中剩余 `style={{}}` 尽量收敛为 Tailwind Token class（如 `color: var(--color-zen-text)` → `text-[var(--color-zen-text)]`）
- [ ] 5.2 确认 ZenMode 已有 Token（`--color-zen-bg`/`--color-zen-glow`/`--color-zen-text`）与新增 Token 命名一致

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 4 个 guard 测试全部失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段 4 个测试全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）

# G0-03 前端架构守护门禁

- **GitHub Issue**: #1032
- **所属任务簇**: W0-GATE（门禁基础设施）
- **涉及模块**: ci-gates, workbench
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 现状

AMP 审计在前端架构层面反复发现 5 类结构性问题，它们不是单点 bug 而是**架构级缺陷**——在单个文件的 lint 中难以发现，需要跨文件/全局视角的 Guard 脚本来检测：

| 问题 | AMP 命中 | 存量 | 当前门禁 |
|------|---------|------|----------|
| 渲染进程缺少全局错误兜底 | 3 轮 | 1 个缺口（App 根级） | 无 |
| Provider 嵌套层级过深 | 2 轮 | 13 层 | 无 |
| Settings 面板固定尺寸溢出 | 2 轮 | 多处 `h-[Npx]` | 无 |
| ARIA-live 区域覆盖不足 | 2 轮 | 动态内容未通知屏幕阅读器 | 无 |
| Service 类/组件文件膨胀 | 3 轮 | 多个文件超 500 行 | 部分（`max-lines-per-function: 300` 仅管函数） |

### 2. 根因

- **ErrorBoundary 缺失**：`App.tsx` 的路由级组件渲染链中没有 `ErrorBoundary` 包裹，任何未捕获的 React 错误会导致整个应用白屏。A0-03 计划修复存量，但修复后如果新路由/新组件不包裹 ErrorBoundary，问题会复发。
- **Provider 嵌套**：`App.tsx` 中 `ThemeProvider > I18nProvider > StoreProvider > TooltipProvider > DialogProvider > ...` 层层嵌套到 13 层。每增加一个 Provider 就增加一层 React 树深度、增加调试难度。缺乏自动化限制。
- **固定尺寸**：开发者使用 `h-[600px]`、`w-[400px]` 等 Tailwind 任意值固定组件尺寸，在不同屏幕/内容量下溢出。这是一个 ESLint 可检测的模式。
- **ARIA-live**：动态内容区（Toast、状态变更、异步结果）缺少 `aria-live` 属性声明，屏幕阅读器无法感知变化。需要 Guard 扫描动态内容区确认 ARIA 标记。
- **文件膨胀**：现有 `max-lines-per-function: 300` 限制函数长度，但一个 1000 行的文件如果每个函数不超 300 行就不会报错。需要文件级行数限制。

### 3. 不做的后果

- A0-03（渲染进程全局错误兜底）修复后，新增路由组件若无 ErrorBoundary，白屏问题会再次出现
- 13 层 Provider 嵌套会随新功能继续增长，最终影响性能和可维护性
- 固定尺寸溢出会在每个新面板/对话框中重复出现
- 无障碍问题持续积累，影响合规性

### 4. 证据来源

| 文档 | 章节 | 内容 |
|------|------|------|
| `docs/audit/amp/07-ui-ux-design-audit.md` | §六 | "13 层 Provider 嵌套" |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §七 | "Settings 面板硬编码高度溢出" |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §八 | "ARIA-live 标记缺失" |
| `docs/audit/amp/01-master-roadmap.md` | §4.1 | "渲染进程全局错误兜底" |
| `docs/audit/amp/08-backend-module-health-audit.md` | §5 | "Service 类文件过大" |

---

## What：做什么

### ESLint 规则: `creonow/no-hardcoded-dimension`

**新建 ESLint 规则**，检测 Tailwind 任意值中的固定像素尺寸：

- 检测模式：`h-[Npx]`, `w-[Npx]`, `min-h-[Npx]`, `min-w-[Npx]`, `max-h-[Npx]`, `max-w-[Npx]` 中 N > 阈值（如 48px）
- 豁免：图标尺寸（`h-[16px]`, `w-[24px]` 等小尺寸）、精确控制场景（需 `eslint-disable` + 理由）
- 级别：`warn` → baseline ratchet

### Guard 1: `error-boundary-coverage-gate.ts`

**新建 Guard 脚本**，检查路由级组件是否被 ErrorBoundary 包裹：

- 扫描 `renderer/src/` 中的路由定义（React Router routes 配置）
- 检查每个路由对应的页面组件，其 parent 是否包含 `ErrorBoundary` / `Suspense` with fallback
- 也可以检查特定关键组件（编辑器、设置页、AI 面板）是否有错误边界
- baseline ratchet 机制

### Guard 2: `architecture-health-gate.ts`

**新建 Guard 脚本**，检查前端架构健康度：

- **Provider 嵌套检测**：解析 `App.tsx` 或入口组件的 JSX 树，计算 Provider 组件嵌套深度，超过阈值（如 10 层）报警
- **文件行数限制**：扫描 `renderer/src/**/*.{ts,tsx}`，报告超过 500 行的文件（不含 test/stories）
- **ARIA-live 覆盖检查**：扫描动态内容组件（Toast、Alert、状态区），检查是否含 `aria-live` 属性
- 输出综合报告：每个维度的违规列表 + pass/fail

### CI 集成

- 新增 `pnpm gate:error-boundary` 和 `pnpm gate:architecture-health` 命令
- `ci.yml` 新增对应 job

---

## Non-Goals：不做什么

1. **不重构现有 Provider 嵌套**——仅建门禁检测和报警，实际重构由后续 change 负责
2. **不修复现有固定尺寸**——仅建门禁阻断增量
3. **不全面实施 ARIA**——仅检测关键动态区域是否有标记
4. **不拆分已有大文件**——仅报告，由各模块 change 逐步收口

---

## 依赖与影响

- **上游依赖**: 无
- **下游受益**: A0-03（ErrorBoundary）、A0-14（Settings）——修复后门禁防退化
- **与现有 gate 的关系**: 新增独立 gate，不修改现有 gate

---

## 28-Pattern 覆盖声明

| Pattern # | 名称 | 门禁类型 | 级别 |
|-----------|------|---------|------|
| #8 | 渲染进程无全局错误兜底 | Guard `error-boundary-coverage-gate` | baseline ratchet |
| #11 | Settings 固定尺寸溢出 | ESLint `creonow/no-hardcoded-dimension` | warn → error |
| #20 | ARIA-live 覆盖不足 | Guard `architecture-health-gate` ARIA 维度 | baseline ratchet |
| #26 | Provider 嵌套层过深 | Guard `architecture-health-gate` nesting 维度 | threshold alert |
| #28 | Service 类/文件膨胀 | Guard `architecture-health-gate` file-size 维度 | baseline ratchet |

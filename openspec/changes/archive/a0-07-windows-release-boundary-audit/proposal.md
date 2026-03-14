# A0-07 Windows 首发边界核查

- **GitHub Issue**: #1000
- **所属任务簇**: P0-4（发布边界与数据诚实）
- **涉及模块**: workbench
- **前端验收**: 否（纯文档）

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 声称"Windows 首发"，用户的合理预期是：安装包可信（已签名、无 SmartScreen 警告）、应用可自动更新、创作内容有备份保护、崩溃后开发者能定位问题并快速修复。但实际上——"能打出安装包"和"可以作为首发产品分发"之间，横亘着签名、auto-update、备份引擎、崩溃可观测性四道未被正式核查的关口。用户不知道哪些已经就位、哪些暂不承诺，团队内部也缺乏统一口径。

### 2. 根因

`electron-builder.json` 仅定义了 `nsis` / `zip` / `x64`，但缺少 `publish` provider、自动更新通道、代码签名策略。崩溃可观测性方面，主进程有 `globalExceptionHandlers`、前端有 ErrorBoundary，但 `fireAndForget.ts` 明确标注 `TODO(C9): wire to central telemetry once available`——能告诉用户"崩了"，但不能系统性告诉开发者"为什么崩"。备份能力在 A0-08 中已确认完全缺失。这些缺口分散在代码注释、审计报告和默认假设中，从未有一份统一的状态总表。

### 3. v0.1 威胁

- **SmartScreen 拦截**：未签名的安装包在 Windows 上会触发蓝色警告屏——对首发用户而言，这等于"开发者不可信"的第一印象，"一朝被蛇咬，用户就此流失"
- **无更新通道**：首发后每次发版都需手动分发，用户停留在旧版本中积累问题
- **崩溃盲飞**：冷启动阶段用户密度低，如果崩溃无遥测，问题定位速度会远低于用户耐心消耗速度
- **承诺失真**：不知道哪些已就位就无法诚实对外传达，"可开窗不等于可入住"

### 4. 证据来源

| 文档                                                | 章节       | 内容                                                                                         |
| --------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `docs/audit/amp/06-windows-release-readiness.md`    | §三        | electron-builder 仅定义打包格式，缺 publish provider / 签名 / auto-update                    |
| `docs/audit/amp/06-windows-release-readiness.md`    | §3.2       | Auto-update 尚未成形，仓库无功能性 electron-updater 机制                                     |
| `docs/audit/amp/06-windows-release-readiness.md`    | §4.2       | 崩溃可观测性：renderer 有 TODO 待接 telemetry，主进程有 globalExceptionHandlers 但无中央遥测 |
| `docs/audit/amp/06-windows-release-readiness.md`    | §4.1       | Backup Interval UI 已先行，能力未闭环                                                        |
| `docs/audit/amp/06-windows-release-readiness.md`    | §6.2       | v0.1 前至少要讲清楚：签名、备份、auto-update、数据安全                                       |
| `docs/audit/amp/05-implementation-backlog.md`       | P0-4       | 发布边界与数据诚实任务簇                                                                     |
| `docs/audit/amp/10-phase-0-issue-execution-plan.md` | 载体分类表 | A0-07 定义为文档核查任务                                                                     |

---

## What Changes：具体做什么

1. **创建 `docs/release/v0.1-windows-boundary.md`**：Windows 首发四项就绪度核查报告
2. **逐项核查四大维度**：
   - **代码签名**：`electron-builder.json` 是否配置签名证书、CI 是否集成签名步骤、SmartScreen 处理策略
   - **自动更新**：`electron-updater` 是否已接入、`publish` provider 是否配置、更新通道是否搭建
   - **备份能力**：引用 A0-08 核查结论，确认备份链路真实状态
   - **崩溃可观测性**：`globalExceptionHandlers` 覆盖范围、renderer 未捕获异常处理、遥测管线是否存在
3. **按三级状态标注每项就绪度**：
   - **✅ 已就位**：已实现且可工作
   - **⚠️ 部分就位**：框架存在但未闭环
   - **❌ 未就位**：完全缺失或仅有占位
4. **为每项标注 v0.1 处置建议**：承诺就位 / 诚实声明暂不承诺 / 降级方案
5. **产出可供 A0-06 事实表直接引用的结论**：写入事实表「平台支持边界」章节

---

## Scope：涉及范围

- **涉及的 openspec 主规范**: `openspec/specs/workbench/spec.md`（发布治理文档，归属 Workbench 范畴）
- **涉及的源码核查范围（只读，不修改）**:
  - `electron-builder.json` — 打包与签名配置
  - `apps/desktop/main/` — globalExceptionHandlers、auto-updater 相关代码
  - `apps/desktop/renderer/src/` — ErrorBoundary、fireAndForget 相关代码
- **产出文件**: `docs/release/v0.1-windows-boundary.md`（新建）
- **所属任务簇**: P0-4（发布边界与数据诚实）
- **前置依赖**: 无硬前置；A0-08（备份核查结论）的产出可直接引用，但本任务可先基于 `06` 审计报告启动
- **下游影响**: A0-06（发布事实表）的「平台支持边界」章节引用本任务结论

---

## Non-Goals：明确不做什么

1. **不实现代码签名、auto-update 或崩溃遥测**——本任务只做状态核查和文档产出，不写实现代码
2. **不做签名证书采购或配置**——证书选型与采购是独立的运维任务，不在本核查范围
3. **不重复 A0-08 的备份核查工作**——备份维度直接引用 A0-08 的结论，不重复调研
4. **不评估 macOS / Linux 平台发布就绪度**——本任务仅针对 Windows 首发
5. **不制定 v0.2+ 的发布路线图**——仅标注 v0.1 状态和方向性建议，不承诺后续版本计划
6. **不修改 `electron-builder.json` 或任何构建配置**——核查是只读的

---

## 依赖与影响

- **上游依赖**: 无硬前置；A0-08（备份能力核查）的结论可被直接引用
- **被依赖于**: A0-06（发布事实表）——「平台支持边界」章节引用本任务结论

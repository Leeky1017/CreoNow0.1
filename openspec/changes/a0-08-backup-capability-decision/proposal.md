# A0-08 备份能力真伪核查

- **GitHub Issue**: #1035
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **涉及模块**: document-management
- **前端验收**: 否
- **载体类型**: 决策 issue（Decision）

---

## Why：为什么必须做

### 1. 用户现象

用户打开 Settings → General，看到「备份间隔」（`backupInterval`）设置项，可以选择备份频率。文案中还有"上次备份：2 分钟前 / Last backup: 2 minutes ago"的展示。用户的合理预期是：系统会按设定频率自动备份创作内容，且在需要时可以恢复。但实际上——没有调度器、没有写盘、没有恢复入口、"上次备份"是硬编码幻觉。用户以为自己的内容有备份保护，实际完全裸奔。

### 2. 根因

整条备份链路**完全不存在**：

- Settings UI 有 `backupInterval` 控件——这是用户能看到并交互的
- 搜索 `backupService` / `backup` handler 无任何结果——后端从未实现
- 没有定时调度器（`setInterval` / cron / electron scheduler）
- 没有备份写盘逻辑（不论是文件系统还是额外 SQLite 表）
- 没有备份恢复入口或 UI
- "上次备份"时间戳没有真实数据源

这不是"功能有 bug"，是"功能从未存在"——但 UI 在说它存在。

### 3. v0.1 威胁

- **最高级信任违背**：备份是用户数据安全的底线承诺。UI 展示备份设置却无实际保护，等于系统在数据安全这一最敏感维度上对用户说谎
- **决策前置**：A0-17（Backup 入口决策：实现还是隐藏）以本任务的事实核查结论为前提——没搞清真实能力就做决策，等于拍脑袋
- **连锁真实性**：事实表（A0-06）需要准确的备份能力分级——核查不做，分级只能猜

### 4. 证据来源

| 文档 | 章节 | 内容 |
|------|------|------|
| `docs/audit/amp/07-ui-ux-design-audit.md` | §二 假 UI 清单 | 备份：设置页有 `backupInterval` 选项，无后端调度/写盘/恢复实现 |
| `docs/audit/amp/08-backend-module-health-audit.md` | §四 Backup Service | 功能完全缺失：搜索 `backupService` / `backup` handler 无结果 |
| `docs/audit/amp/06-windows-release-readiness.md` | §4.1 | Backup Interval 看起来像 UI 已先行，能力未闭环 |
| `docs/audit/amp/05-implementation-backlog.md` | 依赖矩阵 | A0-08 → A0-17：Backup 的产品决策必须建立在真实能力核查之上 |

---

## What：这是一个决策任务

本任务**不做实现**，只做事实核查和决策框架输出。产出物是一份结构化的决策文档，为 A0-17（Backup 决策：实现或隐藏）提供事实依据。

### 产出物

1. **事实核查报告**：备份链路各环节的真实实现状态
2. **能力差距矩阵**：UI 文案承诺 vs 实际能力的逐项对比
3. **方案选项与对比**：v0.1 可选的处置方案及各自利弊
4. **决策建议**：基于事实推荐的 v0.1 处置方式

---

## Scope：涉及范围

- **涉及的 openspec 主规范**: `openspec/specs/document-management/spec.md`
- **核查对象（不修改，只读审计）**:
  - `apps/desktop/renderer/src/features/settings/` — 备份相关 UI 组件
  - `apps/desktop/renderer/src/locales/` — 备份相关 i18n 文案
  - `apps/desktop/main/src/services/` — 搜索备份相关 Service
  - `apps/desktop/main/src/ipc/` — 搜索备份相关 IPC handler
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **前置依赖**: 无
- **下游影响**: A0-17（Backup 决策）以本任务结论为强前置；A0-06（发布事实表）引用本任务的能力分级

---

## Non-Goals：明确不做什么

1. **不实现备份功能**——本任务只核查事实和输出决策框架，一行实现代码都不写
2. **不修改 Settings UI**——备份入口的显示/隐藏由 A0-17 基于本任务结论决定
3. **不做性能评估或方案原型**——不评估"如果要实现备份，SQLite 写入性能如何"这类预研问题
4. **不代替 Owner 做最终决策**——本任务输出决策框架和建议，最终决策权在 Owner
5. **不评估远程备份/云同步方案**——v0.1 仅讨论本地备份能力边界

---

## 依赖与影响

- **上游依赖**: 无
- **被依赖于**: A0-17（Backup 决策：实现或隐藏）——强依赖；A0-06（发布事实表）——备份分级引用

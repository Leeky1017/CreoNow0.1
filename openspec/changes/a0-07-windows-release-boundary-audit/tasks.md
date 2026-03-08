# Tasks: A0-07 Windows 首发边界核查

- **GitHub Issue**: #1000
- **分支**: `task/1000-windows-release-boundary-audit`
- **Delta Spec**: `specs/workbench/spec.md`
- **前置依赖**: 无硬前置；A0-08 结论可引用

---

## 所属任务簇

P0-4: 发布边界与数据诚实

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `docs/release/v0.1-windows-boundary.md` 文件存在且包含四个必需章节 | S-WIN-1 |
| AC-2 | 维度核查详情覆盖代码签名、自动更新、备份能力、崩溃可观测性四项 | S-WIN-1 |
| AC-3 | 每个维度包含「当前状态」「证据」「就绪度标记」「v0.1 处置建议」 | S-WIN-1 |
| AC-4 | 就绪度标记与代码现场一致——无证据支撑的维度不得标 ✅ | S-WIN-2 |
| AC-5 | 每个核查结论附代码路径引用或搜索命令输出，无空口判断 | S-WIN-2 |
| AC-6 | 备份维度引用 A0-08 正式结论，不重复核查 | S-WIN-2 |
| AC-7 | 就绪度总表可被 A0-06 事实表直接引用 | S-WIN-3 |

---

## Phase 1: 证据收集

### Task 1.1: 代码签名现场核查

**映射验收标准**: AC-2, AC-4, AC-5

- [ ] 检查 `electron-builder.json` 是否配置 `win.sign` / `win.certificateFile` / `win.certificatePassword`
  - 命令：`cat apps/desktop/electron-builder.json | grep -i "sign\|certificate\|csc"`
- [ ] 搜索 CI workflow 中是否有签名步骤
  - 命令：`grep -rn "sign\|certificate\|CSC_\|WIN_CSC" .github/workflows/`
- [ ] 搜索 `package.json` 中是否有签名相关 scripts
  - 命令：`grep -n "sign" apps/desktop/package.json`
- [ ] 记录核查结论：是否已配置签名、SmartScreen 处理状态

### Task 1.2: 自动更新现场核查

**映射验收标准**: AC-2, AC-4, AC-5

- [ ] 检查 `electron-builder.json` 是否配置 `publish` provider
  - 命令：`cat apps/desktop/electron-builder.json | grep -i "publish"`
- [ ] 搜索主进程中是否有 `autoUpdater` / `electron-updater` 的使用
  - 命令：`grep -rn "autoUpdater\|electron-updater\|update.*check\|checkForUpdate" apps/desktop/main/src/`
- [ ] 搜索是否有更新通知 UI / IPC handler
  - 命令：`grep -rn "update-available\|update-downloaded\|update.*notify" apps/desktop/`
- [ ] 检查 `package.json` 中是否有 `electron-updater` 依赖
  - 命令：`grep "electron-updater" apps/desktop/package.json`
- [ ] 记录核查结论：自动更新管线各环节的真实状态

### Task 1.3: 备份能力状态引用

**映射验收标准**: AC-2, AC-6

- [ ] 确认 A0-08 核查结论是否已产出
  - 若已产出：直接引用 A0-08 的能力差距矩阵和结论
  - 若未产出：引用 `06` §4.1 的初步判断，标注"待 A0-08 正式结论更新"
- [ ] 引用 `06` §4.1 中关于 Backup Interval "UI 已先行，能力未闭环"的审计结论
- [ ] 记录备份维度就绪度标记和证据来源

### Task 1.4: 崩溃可观测性现场核查

**映射验收标准**: AC-2, AC-4, AC-5

- [ ] 搜索主进程全局异常处理
  - 命令：`grep -rn "globalExceptionHandler\|uncaughtException\|unhandledRejection" apps/desktop/main/src/`
- [ ] 搜索 renderer 全局异常处理
  - 命令：`grep -rn "unhandledrejection\|onerror\|ErrorBoundary" apps/desktop/renderer/src/`
- [ ] 核查 `fireAndForget.ts` 的 TODO 状态
  - 命令：`grep -n "TODO\|telemetry\|observe" apps/desktop/renderer/src/**/fireAndForget*`
- [ ] 搜索是否有崩溃日志写盘或上报机制
  - 命令：`grep -rn "crash.*log\|crash.*report\|sentry\|bugsnag\|crashReporter" apps/desktop/`
- [ ] 记录核查结论：已覆盖范围 vs 盲区

---

## Phase 2: 文档编写

### Task 2.1: 创建文档骨架

**映射验收标准**: AC-1

- [ ] 创建 `docs/release/v0.1-windows-boundary.md`
- [ ] 写入四个章节标题：核查概述、维度核查详情、就绪度总表、结论与建议
- [ ] 在核查概述中填入核查目标、核查日期、核查方法说明

### Task 2.2: 编写维度核查详情

**映射验收标准**: AC-2, AC-3, AC-5

- [ ] **代码签名**维度：填写当前状态、证据（Phase 1 收集的命令输出摘要）、就绪度标记、v0.1 处置建议
- [ ] **自动更新**维度：填写当前状态、证据、就绪度标记、v0.1 处置建议
- [ ] **备份能力**维度：引用 A0-08 结论或 `06` §4.1 审计结论，标注就绪度、处置建议
- [ ] **崩溃可观测性**维度：填写当前状态、证据、就绪度标记、v0.1 处置建议
- [ ] 每个维度的证据必须包含代码路径或搜索命令输出

### Task 2.3: 编写就绪度总表

**映射验收标准**: AC-4, AC-7

- [ ] 制作一览表，四行四列：维度、就绪度标记、关键证据、v0.1 处置
- [ ] 确认标记与 Phase 2.2 详情一致
- [ ] 确认总表格式可被 A0-06 事实表直接引用

### Task 2.4: 编写结论与建议

- [ ] 总结哪些维度可在 v0.1 对外承诺
- [ ] 总结哪些维度需在发布文档中诚实声明"暂不承诺"
- [ ] 标注方向性建议（如 v0.2 补 auto-update），但不承诺具体计划

---

## Phase 3: 校验与收尾

### Task 3.1: 交叉验证

**映射验收标准**: AC-4, AC-5, AC-6

- [ ] 逐维度核对：就绪度标记是否与证据一致（搜索无结果却标 ✅ 为违规）
- [ ] 确认无"据观察"/"据推测"式空口结论
- [ ] 确认备份维度证据来源标注清晰（A0-08 结论 or `06` §4.1）
- [ ] 确认文档未修改任何代码或配置文件

### Task 3.2: 事实表可消费性确认

**映射验收标准**: AC-7

- [ ] 模拟 A0-06 执行 Agent 视角：凭本文档可直接填写事实表「平台支持边界」章节
- [ ] 确认就绪度总表无歧义、处置建议可操作

---

## 验收标准 → 任务映射

| 验收标准 | 对应任务 | 验证方式 | 状态 |
|----------|---------|---------|------|
| AC-1: 文档存在且含四章节 | Task 2.1 | 文件存在 + 结构审查 | [ ] |
| AC-2: 四维度覆盖 | Task 1.1-1.4, 2.2 | 文档审查 | [ ] |
| AC-3: 每维度含四子项 | Task 2.2 | 文档审查 | [ ] |
| AC-4: 标记与代码一致 | Task 3.1 | 交叉验证 | [ ] |
| AC-5: 证据无空口 | Task 3.1 | 搜索"据观察"/"据推测" | [ ] |
| AC-6: 备份引用 A0-08 | Task 1.3, 3.1 | 引用链审查 | [ ] |
| AC-7: 可被事实表引用 | Task 3.2 | A0-06 视角模拟 | [ ] |

---

## TDD 规范引用

> 本任务为文档/决策类，不涉及代码实现。验收方式为输出物审查，而非自动化测试。
> 若决策结论导致后续实现任务，该实现任务必须遵循 `docs/references/testing/` 中的完整 TDD 规范。

# Tasks: A0-08 备份能力真伪核查

- **GitHub Issue**: #1035
- **分支**: `task/1035-backup-capability-decision`
- **Delta Spec**: `specs/document-management/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

P0-3: 能力诚实分级与假功能处置

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | Q1-Q10 必答问题全部已回答，每个答案附代码证据 | S-BACKUP-Q |
| AC-2 | 无"待确认"或"需进一步调查"等未闭项 | S-BACKUP-Q |
| AC-3 | 三个方案（隐藏 / 最小闭环 / Coming Soon）全部列出 | S-BACKUP-CMP |
| AC-4 | 每个方案包含五维度评估（用户影响、实现成本、风险、可逆性、对 A0-06 影响） | S-BACKUP-CMP |
| AC-5 | 有基于事实的推荐方案及理由 | S-BACKUP-CMP |
| AC-6 | 决策门槛四项全部满足 | S-BACKUP-THR |
| AC-7 | 产出物可被 A0-17 直接消费——A0-17 执行 Agent 无需额外调研 | S-BACKUP-THR |

---

## Phase 1: 事实核查（Q1-Q10）

### Task 1.1: UI 层核查（Q1, Q2, Q8, Q9）

- [ ] **Q1**: 搜索 `backupInterval` 在 `renderer/` 下的全部引用，确认 UI 控件是否存在且可交互
  - 命令：`grep -rn "backupInterval" apps/desktop/renderer/src/`
- [ ] **Q2**: 追踪 `backupInterval` 值的数据流——用户选择后是否写入 store / preferences / localStorage
  - 检查 `SettingsDialog.tsx`、`SettingsGeneral.tsx`、`preferences.ts`
- [ ] **Q8**: 搜索"上次备份"/"Last backup"文案的数据源——是真实时间戳还是硬编码
  - 命令：`grep -rn "last.*backup\|上次备份" apps/desktop/renderer/src/`
- [ ] **Q9**: 统计 locale 文件中备份相关 i18n key 的数量和内容
  - 命令：`grep -rn "backup" apps/desktop/renderer/src/locales/`

### Task 1.2: 后端核查（Q3, Q4, Q5, Q6, Q7）

- [ ] **Q3**: 搜索任何名称包含 `backup` 的 Service 类
  - 命令：`grep -rn "backupService\|BackupService\|backup.*Service" apps/desktop/main/src/`
- [ ] **Q4**: 搜索备份相关 IPC handler
  - 命令：`grep -rn "backup" apps/desktop/main/src/ipc/`
- [ ] **Q5**: 搜索备份相关定时调度逻辑
  - 命令：`grep -rn "setInterval.*backup\|backup.*schedule\|backup.*cron" apps/desktop/main/src/`
- [ ] **Q6**: 搜索备份写盘逻辑——文件系统操作或 SQLite 附加表
  - 命令：`grep -rn "backup.*write\|backup.*save\|backup.*path\|backup.*dir" apps/desktop/main/src/`
- [ ] **Q7**: 搜索备份恢复 UI 或 IPC handler
  - 命令：`grep -rn "backup.*restore\|restore.*backup" apps/desktop/`

### Task 1.3: Spec 核查（Q10）

- [ ] **Q10**: 阅读 `openspec/specs/document-management/spec.md`，搜索是否定义了备份行为
  - 命令：`grep -n "backup\|备份" openspec/specs/document-management/spec.md`
- [ ] 如果 spec 中有定义，记录具体定义内容和位置；如果没有，明确记录"spec 未定义备份行为"

---

## Phase 2: 差距矩阵编写

### Task 2.1: 能力差距矩阵

**映射验收标准**: AC-1, AC-2

- [ ] 制作表格：逐行列出备份链路各环节
  - 行：UI 设置入口、值持久化、定时调度、写盘服务、恢复入口、备份时间展示
  - 列：UI 文案承诺、Spec 定义、代码实现状态、差距结论
- [ ] 每行填写 Phase 1 核查的具体证据
- [ ] 标记每行的差距级别：✅ 已闭环 / ⚠️ 部分实现 / ❌ 完全缺失

---

## Phase 3: 方案对比与决策建议

### Task 3.1: 方案对比

**映射验收标准**: AC-3, AC-4

- [ ] 按 Delta Spec 定义的结构，编写三个方案的五维度对比
- [ ] 方案 A（隐藏入口）：评估实现成本（隐藏哪些组件、移除哪些 i18n key）
- [ ] 方案 B（最小闭环）：评估需要新增的模块数量和预估工作量等级（S/M/L/XL）
- [ ] 方案 C（标注 Coming Soon）：评估与 A0-15 占位 UI 策略的一致性

### Task 3.2: 决策建议

**映射验收标准**: AC-5

- [ ] 基于事实核查结论和方案对比，给出推荐方案
- [ ] 推荐理由必须引用具体证据（Q 编号 + 核查结论），不做空口建议
- [ ] 明确标注：最终决策权在 Owner

### Task 3.3: 决策门槛自检

**映射验收标准**: AC-6, AC-7

- [ ] 自检 Q1-Q10 是否全部有明确结论和证据
- [ ] 自检三方案对比是否五维度完整
- [ ] 自检与 A0-15 策略一致性是否已确认
- [ ] 自检 A0-17 可消费性——模拟 A0-17 执行 Agent 视角，确认凭本文档可直接行动

---

## 验收标准 → 任务映射

| 验收标准 | 对应任务 | 验证方式 | 状态 |
|----------|---------|---------|------|
| AC-1: Q1-Q10 全部已回答 | Task 1.1, 1.2, 1.3 | 文档审查 | [ ] |
| AC-2: 无未闭项 | Task 1.1, 1.2, 1.3 | 搜索"待确认"/"TBD" | [ ] |
| AC-3: 三方案列出 | Task 3.1 | 文档结构审查 | [ ] |
| AC-4: 五维度完整 | Task 3.1 | 表格完整性 | [ ] |
| AC-5: 推荐方案有据 | Task 3.2 | 引用 Q 编号验证 | [ ] |
| AC-6: 决策门槛四项满足 | Task 3.3 | 自检清单 | [ ] |
| AC-7: A0-17 可消费 | Task 3.3 | A0-17 视角模拟 | [ ] |

---

## Done 定义

- [ ] Q1-Q10 全部有代码证据支撑的明确回答
- [ ] 能力差距矩阵完成，无空白行
- [ ] 三方案五维度对比完成
- [ ] 推荐方案引用具体证据
- [ ] 决策门槛四项自检通过
- [ ] PR body 包含 `Closes #<N>`（Issue 创建后补充）
- [ ] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）

---

## TDD 规范引用

> 本任务为文档/决策类，不涉及代码实现。验收方式为输出物审查，而非自动化测试。
> 若决策结论导致后续实现任务，该实现任务必须遵循 `docs/references/testing/` 中的完整 TDD 规范。

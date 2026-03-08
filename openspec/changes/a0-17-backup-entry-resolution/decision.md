# A0-17 备份入口决策 — 决策文档

> **Issue**: #996
> **决策日期**: 2026-03-09
> **前置依赖**: A0-08（#1035）备份能力真伪核查
> **最终决策**: **S1 — 隐藏备份入口**

---

## 一、决策输入验证（DI-1 ~ DI-5）

消费 A0-08 决策文档 `openspec/changes/a0-08-backup-capability-decision/decision.md`，逐项验证完整性。

| 决策输入 | 内容 | 来源 | 状态 |
|----------|------|------|------|
| DI-1: 备份 UI 控件完整清单 | `SettingsGeneral.tsx` L22 接口字段、L66-70 选项数组、L190-195 FormField+Select 控件、L252 默认值；i18n key `backupInterval` + `backupIntervalHelp`（en.json/zh-CN.json L851-852） | A0-08 Q1, Q2, Q9 | ✅ 完整 |
| DI-2: 后端备份能力真实状态 | 零实现——无 BackupService、无 IPC handler、无定时调度、无写盘逻辑、无恢复入口 | A0-08 Q3-Q7 | ✅ 完整 |
| DI-3: "上次备份"时间戳来源 | 硬编码假数据：en `"Last backup: 2 minutes ago"` / zh-CN `"上次备份：2 分钟前"`，无真实数据源 | A0-08 Q8 | ✅ 完整 |
| DI-4: Spec 中备份行为定义 | `document-management/spec.md` 无任何备份/恢复相关定义 | A0-08 Q10 | ✅ 完整 |
| DI-5: A0-15 占位 UI 统一策略 | A0-15 尚未产出 decision.md，但 tasks.md 已明确两种处置模式：(a) Coming Soon 标注（disabled + tooltip）用于有后续计划的功能，(b) 隐藏入口用于无后续计划的功能 | A0-15 tasks.md | ⚠️ A0-15 未最终关闭，但策略框架已明确 |

**DI-1 到 DI-4 完备，DI-5 策略框架可用。** 决策输入充分，可以继续。

---

## 二、三方案五维度对比

### S1: 隐藏备份入口（Remove）

移除 `SettingsGeneral.tsx` 中备份间隔 Select 及全部相关代码和 i18n key。

| 维度 | 评估 |
|------|------|
| **用户感知** | ✅ 用户不再看到备份设置，消除误导。无功能丧失——从未有过功能。界面更干净。 |
| **开发成本** | ✅ **S 级**。移除 ~10 行 JSX + 1 个接口字段 + 1 个默认值 + 4 个 i18n key + 1 个测试 mock 字段。纯减法，无新增。 |
| **风险** | ✅ 极低。移除的全部是死代码/假数据，无任何后端依赖需解耦。 |
| **可逆性** | ✅ 高。`git revert` 一步恢复。 |
| **Phase 0 对齐** | ✅ 高度对齐。P0「能力诚实」原则的直接体现——不展示不存在的功能。 |

### S2: 最小闭环实现（Implement MVP）

实现定时 JSON 导出到本地目录的最小备份功能。

| 维度 | 评估 |
|------|------|
| **用户感知** | ✅ 用户得到真实备份。但 P0 阶段无用户需求信号。 |
| **开发成本** | ❌ **L-XL 级**（预估 3-5 天）。需新增：BackupService、IPC channel、Preload 桥接、Spec 定义、完整 TDD 测试、恢复 UI。 |
| **风险** | ❌ 中-高。引入文件系统操作——并发写入、磁盘空间、大文件性能、跨平台路径兼容。 |
| **可逆性** | ❌ 低。发布后若有用户依赖备份数据，回退导致数据丢失。 |
| **Phase 0 对齐** | ❌ 不对齐。P0 修复破窗，不新增功能。投入 L-XL 资源实现无需求信号功能，严重偏离优先级。 |

### S3: Coming Soon 标注（Label）

保留入口但 disabled + tooltip 提示「即将推出」。

| 维度 | 评估 |
|------|------|
| **用户感知** | ⚠️ 消除欺骗，保留期望。但 disabled 控件 + 假时间戳（必须同步移除）的组合让设置页略显残缺。 |
| **开发成本** | ✅ **S 级**。添加 `disabled`、tooltip、`aria-disabled`。但仍须移除假时间戳文案，实际改动量与 S1 相当。 |
| **风险** | ⚠️ 低。但 Coming Soon 的承诺缺乏支撑——备份功能无 Spec（Q10）、无路线图 Issue、无用户需求信号。标注 Coming Soon 本质上是在承诺一个没有计划兑现的功能，与「能力诚实」目标矛盾。 |
| **可逆性** | ✅ 高。属性和样式变更，`git revert` 即可。 |
| **Phase 0 对齐** | ⚠️ 部分对齐。消除了欺骗，但保留了无 Spec、无后端、无路线图的 UI 入口。与 A0-15 的 Coming Soon 适用条件不符——A0-15 的 Coming Soon 项（如 Account 系统）均有明确的后续 Issue 计划，备份没有。 |

### 汇总

| 维度 | S1 隐藏 | S2 最小闭环 | S3 Coming Soon |
|------|---------|-----------|---------------|
| 用户感知 | ✅ 干净 | ✅ 最优 | ⚠️ 可接受但有残留 |
| 开发成本 | ✅ S 级 | ❌ L-XL 级 | ✅ S 级 |
| 风险 | ✅ 极低 | ❌ 中-高 | ⚠️ 低（但承诺落空风险） |
| 可逆性 | ✅ 高 | ❌ 低 | ✅ 高 |
| Phase 0 对齐 | ✅ 高度对齐 | ❌ 不对齐 | ⚠️ 部分对齐 |

---

## 三、最终决策

### 选定方案: S1 — 隐藏备份入口

### 决策理由

1. **100% 假功能无需保留入口**（A0-08 Q1-Q10）：备份链路从 UI 到后端完全为空。这不是「部分实现」，而是「完全虚假」。保留入口无论以何种形式都缺乏语义基础。

2. **硬编码欺骗必须消除**（A0-08 Q8）：「上次备份：2 分钟前」为永恒不变的假时间戳，对用户构成数据安全层面的误导。无论选哪个方案，此文案都必须移除。

3. **Coming Soon 不适用**（A0-08 Q10 + A0-15 策略分析）：A0-15 的 Coming Soon 模式适用于「有后续计划但当前未实现」的功能。备份功能无 Spec 定义、无路线图 Issue、无用户需求信号——标注 Coming Soon 等于空头支票。

4. **最小成本最大诚实**：S1 是纯减法，开发成本 S 级，风险极低，可逆性高。以最小代价实现 P0「能力诚实」目标。

5. **A0-15 一致性**：S1 与 A0-15 的「隐藏入口」处置模式一致——用于无后续计划的占位功能。A0-15 的「Coming Soon」模式保留给有明确路线图的功能。分类依据清晰，策略统一。

> **Owner 决策权保留**：若产品方向在近期计划实现备份，可改选 S3 作过渡——但须同时移除硬编码假时间戳、补建 Spec、创建路线图 Issue。

---

## 四、执行清单

### 4.1 代码修改

| # | 文件 | 行号 | 操作 | 具体内容 |
|---|------|------|------|---------|
| 1 | `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx` | L22 | 移除 | `GeneralSettings` 接口中的 `backupInterval: string;` 字段 |
| 2 | 同上 | L66-70 | 移除 | `backupIntervalOptions` 常量数组（含注释） |
| 3 | 同上 | L190-195 | 移除 | `<FormField>` + `<Select>` 备份间隔控件整块 |
| 4 | 同上 | L252 | 移除 | `defaultGeneralSettings` 中的 `backupInterval: "5min",` |

### 4.2 i18n Key 变更

| # | 文件 | 行号 | 操作 | Key |
|---|------|------|------|-----|
| 5 | `apps/desktop/renderer/src/i18n/locales/en.json` | L851 | 移除 | `"backupInterval": "Backup Interval"` |
| 6 | 同上 | L852 | 移除 | `"backupIntervalHelp": "Last backup: 2 minutes ago"` |
| 7 | `apps/desktop/renderer/src/i18n/locales/zh-CN.json` | L851 | 移除 | `"backupInterval": "备份间隔"` |
| 8 | 同上 | L852 | 移除 | `"backupIntervalHelp": "上次备份：2 分钟前"` |

**i18n 变更摘要**: 移除 2 个 key（`settings.general.backupInterval`、`settings.general.backupIntervalHelp`），双语各 2 行。无新增 key。

### 4.3 测试更新

| # | 文件 | 行号 | 操作 | 具体内容 |
|---|------|------|------|---------|
| 9 | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.test.tsx` | L14 | 移除 | mock `defaultGeneralSettings` 中的 `backupInterval: "5min"` |

### 4.4 Spec 更新

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 10 | `openspec/specs/document-management/spec.md` | 不变 | Spec 中本就无备份行为定义，无需更新 |

### 4.5 A0-06 影响声明

备份功能在发布事实表（A0-06）中应标记为：

> **备份（Backup）**: 未实现。v0.1 不提供自动备份功能。设置页中不展示备份相关入口。如需数据保护，请使用「导出」功能手动保存文件副本。

---

## 五、A0-15 一致性确认

| 确认项 | 结论 |
|--------|------|
| 处置模式选择依据 | ✅ A0-15 定义两种模式：Coming Soon（有后续计划）和隐藏（无后续计划）。备份无 Spec、无路线图、无需求信号，归入「隐藏」。 |
| 实施手段 | ✅ A0-15 隐藏模式要求「条件渲染移除，不用 CSS 隐藏」。S1 直接删除代码，比条件渲染更彻底，符合且超越要求。 |
| 统一 i18n key | ✅ S1 不新增 i18n key，无需复用 `common.comingSoon`。如未来改用 S3，则应使用 `t('common.comingSoon')` 统一 key。 |

---

## 六、决策门槛自检

| 门槛项 | 状态 | 说明 |
|--------|------|------|
| DI-1 到 DI-5 决策输入完整性 | ✅ | DI-1~DI-4 完备，DI-5 策略框架可用 |
| 三方案五维度对比全部完成 | ✅ | S1/S2/S3 × 5 维度 + 汇总表 |
| 决策结论含方案编号 | ✅ | S1 |
| 文件修改清单精确到行号 | ✅ | 9 项修改，含文件路径、行号、操作 |
| i18n key 变更清单 | ✅ | 移除 2 key × 2 语言 = 4 行 |
| Spec 更新声明 | ✅ | 无需更新（本就无定义） |
| A0-06 影响声明 | ✅ | 已撰写标记内容 |
| A0-15 一致性确认 | ✅ | 三项确认全部通过 |

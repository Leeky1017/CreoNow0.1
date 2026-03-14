# A0-08 备份能力真伪核查 — 决策文档

> **Issue**: #1035
> **核查日期**: 2026-03-12（第二轮复核；首次核查 2026-03-08）
> **核查结论**: 备份功能为 **100% 假功能（Phantom Feature）**——仅有 UI 壳，零后端实现。
> **HEAD**: 基于 `main` HEAD `c915d165`

---

## 一、事实核查（Q1 — Q10）

### Q1: Settings UI 中 `backupInterval` 控件是否已渲染？用户能否交互？

**结论**: ✅ 有，但仅为视觉展示。

**证据**:

- `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx` L188-195：
  在「Data & Storage」分区下渲染了一个 `<Select>` 下拉框，标签为「备份间隔」（Backup Interval），提供三个选项：
  ```tsx
  const backupIntervalOptions = [
    { value: "5min", label: "Every 5 minutes" },
    { value: "15min", label: "Every 15 minutes" },
    { value: "1hour", label: "Every hour" },
  ];
  ```
- 该 Select 位于 `SettingsGeneral.tsx` L190-195，嵌套在 `FormField` 中，带有帮助文本 `backupIntervalHelp`。

---

### Q2: `backupInterval` 用户选择的值是否被持久化？存储在哪里？

**结论**: ❌ 没有被持久化，值只停留在对话框本地状态中。

**证据**:

- `SettingsGeneral.tsx` L194：`onValueChange={(value) => updateSetting("backupInterval", value)}`
- `updateSetting` 定义于 L110-113：仅调用 `onSettingsChange({ ...settings, [key]: value })`
- `SettingsDialog.tsx` L181：`setGeneralSettings(settings)` — 通过 `handleSettingsChange` 回调，本质就是 React `useState` 的 setter
- `SettingsDialog.tsx` L171-172：`const [generalSettings, setGeneralSettings] = React.useState<GeneralSettings>(defaultGeneralSettings)`
- **数据流终点**：值仅存于组件本地状态，对话框关闭即丢失。无 PreferenceStore 写入、无 localStorage 持久化、无 IPC 保存链路。
- `packages/shared/` 和 `apps/desktop/preload/` 中均无 "backup" 相关代码。

---

### Q3: 是否存在 `backupService` 或任何名称包含 `backup` 的 Service 类？

**结论**: ❌ 完全没有。

**证据**:

- `apps/desktop/main/src/services/` 下搜索 `backupService|BackupService|backup.*Service` 无命中。
- 后端 `main/src/services/ai/` 中出现的 "backup" 全部指代 **AI Provider 故障转移机制**（备用 AI 服务商），与文档备份功能完全无关。

---

### Q4: 是否存在备份相关的 IPC handler（如 `backup:start`、`backup:restore`）？

**结论**: ❌ 完全没有。

**证据**:

- `apps/desktop/main/src/ipc/` 目录下无任何文件包含 "backup" 字符串（搜索结果为空）。
- `packages/shared/` 中无 backup 相关 IPC channel 定义。
- `apps/desktop/preload/` 中无 backup 相关 bridge 暴露。

---

### Q5: 是否存在定时调度逻辑（`setInterval`、`cron`、`electron-scheduler`）执行备份？

**结论**: ❌ 完全没有。

**证据**:

- `apps/desktop/main/src/` 中搜索 `setInterval.*backup|backup.*schedule|backup.*cron|backup.*timer` 无命中。
- 无任何调度器、定时任务或后台轮询与备份相关。

---

### Q6: 备份数据写入何处？文件系统独立目录？SQLite 附加表？

**结论**: ❌ 未定义，无任何写盘逻辑。

**证据**:

- `apps/desktop/main/src/` 中搜索 `backup.*write|backup.*save|backup.*path|backup.*dir` 无命中（排除 AI failover 测试文件后）。
- 无任何代码创建备份目录、生成备份文件或写入 SQLite 备份表。

---

### Q7: 是否存在备份恢复入口（UI 按钮或 IPC handler）？

**结论**: ❌ 完全没有。

**证据**:

- 搜索 `backup.*restore|restore.*backup`：在源码中无任何命中。
- 无恢复 UI，无恢复 IPC handler。

---

### Q8: "上次备份：X 分钟前"的时间戳数据源是什么？是真实计算还是硬编码？

**结论**: ❌ 为硬编码假数据，不是真实时间戳。

**证据**:

- 帮助文案 `backupIntervalHelp` 为**硬编码假数据**：
  - en: `"Last backup: 2 minutes ago"` (`en.json` L852)
  - zh-CN: `"上次备份：2 分钟前"` (`zh-CN.json` L852)
  - 该文案不绑定任何时间戳数据源，永远显示「2 分钟前」。

---

### Q9: i18n 文案中有多少条备份相关的 key？内容是否暗示备份已在工作？

**结论**: ⚠️ 共 2 条备份相关 key，且内容暗示备份已在正常运行。

**证据**:

- `en.json:851`：`"backupInterval": "Backup Interval"` — 暗示用户可配置备份间隔
- `en.json:852`：`"backupIntervalHelp": "Last backup: 2 minutes ago"` — 暗示备份正在运行，且有真实时间戳
- `zh-CN.json:851`：`"backupInterval": "备份间隔"`
- `zh-CN.json:852`：`"backupIntervalHelp": "上次备份：2 分钟前"`
- 搜索命令：`grep -rn -i 'backup' apps/desktop/renderer/src/i18n/locales/`
- **结论**：2 条 key（`backupInterval` + `backupIntervalHelp`），en/zh-CN 各 2 条，共 4 条翻译条目。帮助文案以"上次备份：2 分钟前"暗示备份已在工作，实为硬编码假数据（同 Q8 结论）。

---

### Q10: document-management spec 中是否定义了备份行为？如果有，定义了什么？

**结论**: ❌ Spec 未定义备份行为。

**证据**:

- `openspec/specs/document-management/spec.md` 中搜索 `backup`、`备份`、`restore`、`恢复` 均无命中。
- 备份功能既无 Spec 定义，也无 Scenario 覆盖。

---

## 二、能力差距矩阵

| 环节         | UI 文案承诺                               | Spec 定义 | 代码实现状态                    | 差距                     |
| ------------ | ----------------------------------------- | --------- | ------------------------------- | ------------------------ |
| UI 设置入口  | 「备份间隔」下拉框，可选 5min/15min/1hour | ❌ 无     | ✅ Select 组件存在且可交互      | ⚠️ UI 存在但承诺无法兑现 |
| 值持久化     | 暗示值会被保存并生效                      | ❌ 无     | ❌ 仅 React useState，关闭即丢  | ❌ 完全缺失              |
| 定时调度     | 暗示按选定间隔执行备份                    | ❌ 无     | ❌ 无任何定时逻辑               | ❌ 完全缺失              |
| 写盘服务     | 暗示数据被安全备份                        | ❌ 无     | ❌ 无 BackupService、无文件操作 | ❌ 完全缺失              |
| 恢复入口     | 无                                        | ❌ 无     | ❌ 无                           | ❌ 完全缺失              |
| 备份时间展示 | 「上次备份：2 分钟前」                    | ❌ 无     | ❌ 硬编码假数据，非真实时间戳   | ❌ **欺骗性展示**        |
| IPC 通道     | —                                         | ❌ 无     | ❌ 无 backup 相关 channel       | ❌ 完全缺失              |
| Preload 桥接 | —                                         | ❌ 无     | ❌ 无                           | ❌ 完全缺失              |

**总结**: 从 UI 到后端的完整备份链路中，仅有 UI 壳（Select 组件 + i18n 文案）存在。后端实现为 **零**。帮助文案「上次备份：2 分钟前」为硬编码假数据，对用户构成欺骗。

---

## 三、方案对比

### S1: 隐藏备份入口（Remove）

**描述**: 移除 `SettingsGeneral.tsx` 中备份间隔 Select 及相关 i18n key。

| 维度             | 评估                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| **用户感知**     | 用户不再看到备份设置，消除误导。无功能丧失（因本就无功能）。                                             |
| **开发成本**     | **极低（S 级）**。移除 ~10 行 JSX + 2-4 个 i18n key + `GeneralSettings` 接口中的 `backupInterval` 字段。 |
| **风险**         | 极低。移除的是纯展示代码，无后端依赖需处理。                                                             |
| **可逆性**       | 高。通过 git revert 可完整恢复。                                                                         |
| **Phase 0 对齐** | ✅ 高度对齐。P0 的核心目标之一是「能力诚实」— 不展示不存在的功能。隐藏假功能正是此目标的直接体现。       |

---

### S2: 最小闭环实现（Implement MVP）

**描述**: 实现一个最小备份功能——定时将当前文档导出为 JSON 文件到本地目录。

| 维度             | 评估                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **用户感知**     | 用户得到真实的备份功能。但 P0 阶段用户对此无明确需求信号。                                                                                                  |
| **开发成本**     | **高（L-XL 级）**。需新增：BackupService（定时调度 + 文件写入）、IPC channel 定义、Preload 桥接、Spec 定义、完整 TDD 测试、备份恢复 UI。估计 3-5 天工作量。 |
| **风险**         | 中-高。引入新的文件系统操作，需考虑：并发写入、磁盘空间、大文件性能、跨平台路径兼容。                                                                       |
| **可逆性**       | 低。一旦发布并有用户依赖备份数据，回退将导致数据丢失。                                                                                                      |
| **Phase 0 对齐** | ❌ **不对齐**。P0 目标是修复破窗和能力诚实，不是新增功能。投入 L-XL 级工作量实现一个无用户需求信号的功能，偏离 P0 优先级。                                  |

---

### S3: Coming Soon 标注（Label）

**描述**: 保留备份入口但禁用交互，附加「Coming Soon」/「即将推出」提示。

| 维度             | 评估                                                                                                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **用户感知**     | 用户知道备份是计划功能而非已有功能。消除欺骗，保留期望。                                                                                                                                                                    |
| **开发成本**     | **低（S 级）**。在 Select 上添加 `disabled`、tooltip、aria-disabled。参考 `SettingsAccount.tsx` L175 的现有 Coming Soon 模式。                                                                                              |
| **风险**         | 低。但需注意：硬编码的「上次备份：2 分钟前」必须同步移除，否则 disabled Select + 假时间戳组合更加混乱。                                                                                                                     |
| **可逆性**       | 高。CSS/属性变更，git revert 即可。                                                                                                                                                                                         |
| **Phase 0 对齐** | ⚠️ 部分对齐。消除了欺骗，但保留了一个无 Spec、无后端、无路线图的 UI 入口。与 A0-15 的 Coming Soon 模式形式一致，但 A0-15 的 Coming Soon 项均有明确的后续计划（如 Account 系统 #571），而备份功能无任何后续 Issue 或路线图。 |

---

### 五维度汇总对比

| 维度         | S1 隐藏     | S2 最小闭环 | S3 Coming Soon            |
| ------------ | ----------- | ----------- | ------------------------- |
| 用户感知     | ✅ 干净     | ✅ 最优     | ⚠️ 可接受但有残留         |
| 开发成本     | ✅ S 级     | ❌ L-XL 级  | ✅ S 级                   |
| 风险         | ✅ 极低     | ❌ 中-高    | ✅ 低（但需处理假时间戳） |
| 可逆性       | ✅ 高       | ❌ 低       | ✅ 高                     |
| Phase 0 对齐 | ✅ 高度对齐 | ❌ 不对齐   | ⚠️ 部分对齐               |

---

## 四、推荐方案

### 推荐: S1（隐藏备份入口）

**理由**:

1. **事实基础**（Q1-Q10）：备份功能从 UI 到后端 100% 为空实现，帮助文案「上次备份：2 分钟前」为硬编码欺骗。这不是「部分实现」的功能，而是「完全虚假」的功能。

2. **P0 原则对齐**：Phase 0 的「能力诚实」原则要求——如果功能不存在，就不应展示入口。S1 是最彻底的诚实方案。

3. **S3 的问题**：标注 Coming Soon 需要有后续实现计划作支撑。当前无备份 Spec（Q10）、无备份路线图、无用户需求信号。标注 Coming Soon 本质上是在承诺一个没有计划兑现的功能——这与「能力诚实」目标矛盾。

4. **成本-收益比**：S1 开发成本为 S 级（移除约 10 行 JSX + 4 个 i18n key），风险极低，可逆性高。

5. **可消费性**：A0-17 执行 Agent 可直接根据本文档执行——移除 `SettingsGeneral.tsx` 中 L66-70 的 `backupIntervalOptions`、L190-195 的 FormField/Select 代码块、`GeneralSettings` 接口中的 `backupInterval` 字段、`defaultGeneralSettings` 中的 `backupInterval` 默认值、`en.json`/`zh-CN.json` L851-852 的 i18n key。

> **注**: 最终决策权在 Owner。如果产品方向计划在近期迭代中实现备份功能，可改选 S3 作为过渡方案；但须同时移除硬编码的假时间戳文案。

---

## 五、决策门槛自检

| 门槛项                          | 状态 | 说明                                                             |
| ------------------------------- | ---- | ---------------------------------------------------------------- |
| Q1-Q10 全部有明确结论和代码证据 | ✅   | 10 个问题均有文件路径 + 行号级证据                               |
| 三方案对比五维度完整            | ✅   | S1/S2/S3 × 5 维度全部填写                                        |
| 与 A0-15 策略一致性已确认       | ✅   | 分析了 A0-15 Coming Soon 模式的适用条件差异                      |
| A0-17 可消费性                  | ✅   | 推荐方案包含具体文件/行号/字段修改清单，A0-17 Agent 无需额外调研 |

---

## 六、A0-17 执行清单（如选择 S1）

| 序号 | 文件                                                                         | 操作 | 具体内容                                                        |
| ---- | ---------------------------------------------------------------------------- | ---- | --------------------------------------------------------------- |
| 1    | `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`     | 移除 | L22: 从 `GeneralSettings` 接口移除 `backupInterval: string`     |
| 2    | 同上                                                                         | 移除 | L66-70: 移除 `backupIntervalOptions` 数组                       |
| 3    | 同上                                                                         | 移除 | L190-195: 移除 FormField + Select（备份间隔控件）               |
| 4    | 同上                                                                         | 移除 | L252: 从 `defaultGeneralSettings` 移除 `backupInterval: "5min"` |
| 5    | `apps/desktop/renderer/src/i18n/locales/en.json`                             | 移除 | L851-852: 移除 `backupInterval` 和 `backupIntervalHelp`         |
| 6    | `apps/desktop/renderer/src/i18n/locales/zh-CN.json`                          | 移除 | L851-852: 移除 `backupInterval` 和 `backupIntervalHelp`         |
| 7    | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.test.tsx` | 更新 | L15: 从 mock `defaultGeneralSettings` 移除 `backupInterval`     |
| 8    | `openspec/specs/document-management/spec.md`                                 | 不变 | Spec 中本就无备份定义，无需更新                                 |

---

## 七、复核记录

**复核日期**: 2026-03-12
**复核基线**: `main` HEAD `c915d165`

### 复核验证命令及结果

```bash
# Q1/Q2: UI 层引用——行号全部吻合
grep -rn "backupInterval" apps/desktop/renderer/src/
# → SettingsGeneral.tsx:22,66,190,192,193,194,252  SettingsDialog.test.tsx:15  en.json:851-852  zh-CN.json:851-852

# Q3: 后端 BackupService——仍无命中
grep -rn "backupService\|BackupService\|backup.*Service" apps/desktop/main/src/
# → (empty)

# Q4: IPC handler——仍无命中
grep -rn "backup" apps/desktop/main/src/ipc/
# → (empty)

# Q5: 定时调度——仍无命中
grep -rn "setInterval.*backup\|backup.*schedule\|backup.*cron\|backup.*timer" apps/desktop/main/src/
# → (empty)

# Q6: 备份写盘——仍无命中
grep -rn "backup.*write\|backup.*save\|backup.*path\|backup.*dir" apps/desktop/main/src/
# → (empty, excluding AI failover)

# Q7: 恢复入口——仍无命中
grep -rn "backup.*restore\|restore.*backup" apps/desktop/
# → (empty)

# Q10: Spec 定义——仍无命中
grep -n "backup\|备份" openspec/specs/document-management/spec.md
# → (empty)
```

**复核结论**: 所有 Q1-Q10 代码证据与 2026-03-08 首次核查一致。行号已更新到当前 HEAD。决策文档有效，无需变更方案建议。

# A0-15 占位 UI 收口

- **GitHub Issue**: #995
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **涉及模块**: workbench
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户在多处 UI 上看到"看起来可以交互"的控件，点击后却毫无反应——Settings → Account 页的按钮全部 disabled 但无任何说明、Search 面板的"View More"/"Search All Projects"链接无 onClick、RightPanel ChatHistory 的交互只剩 console.info、版本恢复的 Restore 按钮处于 disabled 状态。用户的合理预期是"既然展示了，就能用"，实际却处处碰壁。正所谓"画饼充饥，望梅止渴"——UI 承诺了功能，却没有后端兑现。

### 2. 根因

这些控件属于**占位组件**——设计阶段已渲染到界面，但对应的后端功能从未实现。具体表现：

- **Settings Account 按钮全 disabled**：`SettingsAccount.tsx` 中所有操作按钮（登录/注册/修改密码等）设置了 `disabled` 属性，但无 tooltip 或文案解释原因
- **Search "View More" / "Search All Projects"**：渲染了可点击外观的链接，但未绑定 `onClick` handler，点击无反应
- **RightPanel ChatHistory**：聊天历史条目渲染了交互外观，但点击回调仅执行 `console.info("TODO")`，实际不做任何操作
- **版本恢复 Restore 按钮**：按钮虽然渲染，但始终 disabled，版本恢复功能未接通

### 3. v0.1 威胁

- **信任瓦解**：用户反复遇到"看起来能用但不能用"的 UI，会对整个产品的可靠性产生怀疑——"举一反三，处处生疑"
- **体验碎片化**：不同占位组件的处理方式不统一——有的 disabled 无说明、有的无 onClick、有的 console.info——产品显得粗糙且缺乏设计意图
- **支持成本**：用户可能就"按钮点不动"提交 bug 报告，实际是设计意图未传达

### 4. 证据来源

| 文档                                                | 章节           | 内容                                                                                                             |
| --------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/07-ui-ux-design-audit.md`           | §二 假 UI 清单 | 列举 Settings Account disabled 按钮、Search 无 onClick 链接、ChatHistory console.info、版本恢复 Restore disabled |
| `docs/audit/amp/10-phase-0-issue-execution-plan.md` | P0-3           | A0-15 占位 UI 收口归属能力诚实分级任务簇                                                                         |

---

## What：做什么

1. **盘点全部占位 UI**：在代码中搜索并确认所有符合"渲染了但无功能"特征的占位组件，形成完整清单
2. **统一处置策略**：每个占位组件二选一——
   - **标注 "Coming Soon"**：保留入口但 disabled + 添加 tooltip / badge 说明"功能开发中"
   - **隐藏入口**：在 v0.1 中不渲染该组件
3. **实施处置**：按策略逐一修改代码
4. **补充 i18n key**：所有"Coming Soon"标注文案走 `t()` 国际化

---

## Scope

- **主规范**: `openspec/specs/workbench/spec.md`
- **涉及源码**:
  - `renderer/src/features/settings-dialog/SettingsAccount.tsx` — Account 页按钮
  - `renderer/src/features/search/` — Search 面板的 "View More" / "Search All Projects"
  - `renderer/src/features/rightpanel/` — ChatHistory 交互
  - `renderer/src/features/version-history/VersionHistoryPanel.tsx` — 版本恢复 Restore 按钮
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **前置依赖**: 无
- **下游影响**: A0-17（Backup 决策）的"标注 Coming Soon"方案需与本任务策略一致

---

## Non-Goals：不做什么

1. **不实现任何占位功能的后端逻辑**——本任务只做 UI 层的诚实标注或隐藏，不写 Service / IPC handler
2. **不修改已实现功能的 UI**——只处理确认为"无后端"的占位组件，已有完整链路的功能不碰
3. **不重新设计 Settings Account 页的交互流程**——Account 相关功能（登录/注册等）的设计属于 v0.2+ 范畴
4. **不修改 ChatHistory 的数据结构或存储逻辑**——仅处置交互回调，不涉及聊天记录的持久化方案
5. **不为占位组件添加 analytics 或埋点**——不做"Coming Soon"点击统计

---

## 依赖与影响

- **上游依赖**: 无——本任务可独立实施
- **被依赖于**: A0-17（Backup 决策）——Backup 入口若选择"Coming Soon"方案，需复用本任务建立的占位 UI 统一策略
- **协调关系**: A0-06（发布事实表）——各占位功能的处置结论可纳入发布事实表

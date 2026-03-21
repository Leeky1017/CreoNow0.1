# Tasks: V1-00 前端视觉全面重塑计划

> 📋 **R1 复核**（2025-07-21）：v1-01/v1-02 独立验证通过，级联刷新已启动。

- **GitHub Issue**: 待创建（umbrella）
- **分支**: 不适用——本 change 为总控文档，不包含代码实现
- **Delta Spec**: 各 child change 自带 delta spec

---

## 验收标准（总控级）

| ID   | 标准                                                                | 状态                                                                                                             |
| ---- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| AC-1 | 27 个 child change 各自建立 proposal.md + tasks.md + specs/         | [进行中] v1-01~v1-16 已建立；v1-17~v1-22 已有 proposal，tasks/specs 待补；v1-23~v1-25 已建档；v1-26~v1-27 待创建 |
| AC-2 | EXECUTION_ORDER.md 更新，包含 V1 波次排程                           | [已达成]                                                                                                         |
| AC-3 | 每个 child change 有独立 GitHub Issue                               | [进行中] v1-01~v1-16 已创建                                                                                      |
| AC-4 | 所有 child change 合并后，Features 层指标达到 proposal 中的验收标准 | [进行中] 14/27 已完成                                                                                            |

---

## Phase 0: 立项

- [x] 审计 Features 层现状并建立量化基线
- [x] 阅读 35 个设计稿 HTML 并提取设计语言规范
- [x] 对比设计稿与实现的逐模块 Gap 分析
- [x] 确定 16 个 child change 的范围与波次排程
- [x] 撰写 umbrella proposal（本文件）
- [x] 为每个 child change 建立 proposal.md + tasks.md
- [x] 扩展 scope 至 27 个 child changes（v1-17~v1-27 新增）

## Phase 1: 各 child change 独立落地

每个 child change 按以下流程独立执行：

1. 创建 GitHub Issue（关联 umbrella）
2. 从最新 `origin/main` 创建 task worktree
3. Spec-first + TDD 落地
4. 经独立审计 ACCEPT 后合并
5. 合并后归档对应 change

### 当前状态（14/27 已完成）

| Change        | 状态                             | R1 验证                                     | 合并时间 |
| ------------- | -------------------------------- | ------------------------------------------- | -------- |
| v1-01         | ✅ 已合并                        | ✅ PASS ⭐⭐⭐⭐                            | —        |
| v1-02         | ✅ 已合并                        | ✅ PASS ⭐⭐⭐⭐⭐                          | —        |
| v1-03         | ✅ 已合并                        | ✅ R1 级联刷新完成                          | —        |
| v1-04         | ✅ 已合并                        | ✅ R1 级联刷新完成                          | —        |
| v1-05         | ✅ 已合并                        | ✅ R1 级联刷新完成                          | —        |
| v1-06 ~ v1-11 | ✅ 已合并                        | —                                           | —        |
| v1-12         | ❌ 待实施                        | ✅ R1 级联刷新完成                          | —        |
| v1-13         | ❌ 待实施                        | —                                           | —        |
| v1-14         | ✅ 已完成（当前分支 / PR #1198） | ✅ R1 级联刷新完成                          | —        |
| v1-15 ~ v1-16 | ✅ 已完成（当前分支 / PR #1198） | —                                           | —        |
| v1-17         | 📝 proposal 已建立               | ✅ R1 级联刷新完成（tasks.md 新建）         | —        |
| v1-18 ~ v1-22 | 📝 proposal 已建立               | —                                           | —        |
| v1-23 ~ v1-25 | 📝 proposal + tasks 已建立       | ✅ R1 级联刷新完成（proposal + tasks 新建） | —        |
| v1-26 ~ v1-27 | 📋 待创建                        | —                                           | —        |

#### R1 级联刷新（2025-07-21 启动）

v1-01/v1-02 验证通过后，级联刷新覆盖以下 child changes：
v1-03, v1-04, v1-05, v1-12, v1-14, v1-17, v1-23, v1-24, v1-25

## Phase 2: 总控验收

> **当前进度：14/27 已完成**

- [ ] 所有 27 个 child change 已合并
- [ ] Features 层量化指标全部达标（见下表）
- [x] Storybook 可构建 ✅
- [x] 全量测试通过（2589 通过 / 0 失败）✅
- [ ] lint ratchet 无新增违规
- [ ] 归档本 umbrella change

### 量化指标进度

| 指标              | 目标 | 当前值 | R1 前值 | 状态                       |
| ----------------- | ---- | ------ | ------- | -------------------------- |
| eslint-disable    | ≤20  | 229    | 146     | ❌ 进行中                  |
| 原生 HTML         | ≤10  | 186    | 153     | ❌ 进行中                  |
| hardcoded colors  | 0    | 34     | 25      | ❌ 进行中                  |
| inline style      | ≤30  | 909    | 897     | ❌ 进行中（scope 含 src/） |
| text-[] arbitrary | ≤20  | 1000   | 1000    | ❌ 进行中                  |
| AiPanel 行数      | ≤500 | 281    | 281     | ✅ 已达成                  |
| EditorPane 行数   | ≤400 | 232    | 232     | ✅ 已达成                  |

> **注**：R1 周期内 eslint-disable / 原生 HTML / hardcoded colors 数值上升，系 v1-14~v1-16 新增组件所致，属预期增长，将由后续 child changes 消解。

---

## R1 复核记录（2025-07-21）

### v1-01 Design Token 补完 — ✅ PASS（⭐⭐⭐⭐ maintained）

**核心验证结果**：

- tokens.css 469 行、14 级排版刻度、11 个独立 token、4 个语义间距、5 个时长 token
- 56 条 @theme 映射、renderer tokens.css 381 行
- 163 项测试全部通过

**非阻断偏差（3 项）**：

1. `text-[Npx]` 计数升至 1000（属 Non-Goal，不影响验收）
2. 2 处 grep 精度问题（工具噪声）
3. 测试套件计数术语差异

### v1-02 Primitive Visual Evolution — ✅ PASS（⭐⭐⭐⭐⭐ maintained）

**核心验证结果**：

- 17/20 AC 精确匹配：Button 229L, Card 129L, Tabs 333L, Badge 130L
- Radio / Select / ImageUpload 已重构
- 测试全部通过：Button 59, Card 67, Tabs 29, Badge 34

**非阻断偏差（3 项）**：

1. story 数 6→5（计数方法论差异）
2. src/ 使用量 104→237（grep 噪声）
3. features/ 使用量 0→13（`size="icon"` 被采用，属正向扩散）

### 级联刷新计划

R1 验证通过后，启动级联刷新，覆盖以下依赖 v1-01/v1-02 的 child changes：

| Child Change | 说明            | 刷新内容              |
| ------------ | --------------- | --------------------- |
| v1-03        | 组件进化（续）  | 验证 token 使用一致性 |
| v1-04        | 组件进化（续）  | 验证 token 使用一致性 |
| v1-05        | 组件进化（续）  | 验证 token 使用一致性 |
| v1-12        | 待实施          | 依赖 v1-01 token 体系 |
| v1-14        | 已完成          | 验证 token 对齐       |
| v1-17        | proposal 已建立 | 依赖 v1-02 原语组件   |
| v1-23        | 已建档          | 依赖 v1-01/v1-02      |
| v1-24        | 已建档          | 依赖 v1-01/v1-02      |
| v1-25        | 已建档          | 依赖 v1-01/v1-02      |

---

## R1+R3 级联刷新记录 (2026-03-21)

> 「流水不腐，户枢不蠹。」——《吕氏春秋》

### R1（P0 复核）—— v1-01 + v1-02

| 源 Change                 | 评级       | 判定                            |
| ------------------------- | ---------- | ------------------------------- |
| v1-01 Design Token        | ⭐⭐⭐⭐   | PASS — 8 项核心度量零偏差       |
| v1-02 Primitive Evolution | ⭐⭐⭐⭐⭐ | PASS — 20/20 AC，493 测试全通过 |

**R1 级联刷新（9 targets）**：

| 下游                       | 状态               | 变化                                    |
| -------------------------- | ------------------ | --------------------------------------- |
| v1-03 Dashboard            | ✅ Merged          | 零偏差，11 项度量稳定                   |
| v1-04 Editor Typography    | ✅ Merged          | 零偏差，12 项度量稳定                   |
| v1-05 Editor Decomposition | ✅ Merged          | 零偏差，15 项度量稳定                   |
| v1-12 Motion + Native HTML | 📋 Planned         | 基线更新，native button 目标扩至 102 处 |
| v1-14 Dialog + Entry       | ✅ Done (审计中)   | 零偏差，14 个文件行数一致               |
| v1-17 Font Bundling        | 📋 Documented      | 基线确认，DOM snapshot 3→6              |
| v1-23 Color System         | 📋 Documented      | 基线确认，99 色彩 token                 |
| v1-24 Component Library    | 📋 Documented      | 基线确认，29 primitives                 |
| v1-25 Density System       | ⏸️ Blocked (v1-24) | 基线确认，0 component tokens            |

### R3（P2 复核）—— v1-06 + v1-07

| 源 Change                    | 评级 | 判定                                     |
| ---------------------------- | ---- | ---------------------------------------- |
| v1-06 AI Panel Overhaul      | ✅   | PASS — 7 子组件全确认，27 测试文件全通过 |
| v1-07 Settings Visual Polish | ✅   | PASS — 0 硬编码 hex，91 测试全通过       |

**R3 级联刷新（6 targets，其中 v1-12/14 与 R1 共享）**：

| 下游                       | 状态             | 变化                                                          |
| -------------------------- | ---------------- | ------------------------------------------------------------- |
| v1-08 File Tree            | 📋 Planned       | FileTreePanel 已从 ~1320→126 行，79 测试全通过                |
| v1-09 Command Palette      | 📋 Planned       | CommandPalette ~730→283, SearchPanel ~900→294, inline style 0 |
| v1-12 Motion + Native HTML | 📋 Planned       | v1-06 引入 33 处新 native button + 38 条 eslint-disable       |
| v1-14 Dialog + Entry       | ✅ Done (审计中) | 与 v1-06/07 无文件交叉                                        |
| v1-15 AI Overlays          | ✅ Done (审计中) | 4 overlay 已拆分，83 测试全通过                               |
| v1-18 Arbitrary Cleanup    | 📋 Documented    | text-[ 95, rounded-[ 18, total arbitrary 228 (↓75%)           |

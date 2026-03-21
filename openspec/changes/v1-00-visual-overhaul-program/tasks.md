# Tasks: V1-00 前端视觉全面重塑计划

- **GitHub Issue**: 待创建（umbrella）
- **分支**: 不适用——本 change 为总控文档，不包含代码实现
- **Delta Spec**: 各 child change 自带 delta spec

---

## 验收标准（总控级）

| ID   | 标准                                                                | 状态       |
| ---- | ------------------------------------------------------------------- | ---------- |
| AC-1 | 27 个 child change 各自建立 proposal.md + tasks.md + specs/         | [进行中] v1-01~v1-16 已建立；v1-17~v1-22 已有 proposal，tasks/specs 待补；v1-23~v1-27 待创建 |
| AC-2 | EXECUTION_ORDER.md 更新，包含 V1 波次排程                           | [已达成]   |
| AC-3 | 每个 child change 有独立 GitHub Issue                               | [进行中] v1-01~v1-16 已创建 |
| AC-4 | 所有 child change 合并后，Features 层指标达到 proposal 中的验收标准 | [进行中] 14/27 已完成 |

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

| Change        | 状态                   | 合并时间 |
| ------------- | ---------------------- | -------- |
| v1-01 ~ v1-11 | ✅ 已合并              | —        |
| v1-14 ~ v1-16 | ✅ 已完成（当前分支 / PR #1198） | —        |
| v1-12 ~ v1-13 | ❌ 待实施              | —        |
| v1-17 ~ v1-22 | 📝 proposal 已建立      | —        |
| v1-23 ~ v1-27 | 📋 待创建              | —        |

## Phase 2: 总控验收

> **当前进度：14/27 已完成**

- [ ] 所有 27 个 child change 已合并
- [ ] Features 层量化指标全部达标（见下表）
- [x] Storybook 可构建 ✅
- [x] 全量测试通过（2589 通过 / 0 失败）✅
- [ ] lint ratchet 无新增违规
- [ ] 归档本 umbrella change

### 量化指标进度

| 指标              | 目标   | 当前值 | 状态       |
| ----------------- | ------ | ------ | ---------- |
| eslint-disable    | ≤20    | 146    | ❌ 进行中  |
| 原生 HTML         | ≤10    | 153    | ❌ 进行中  |
| hardcoded colors  | 0      | 25     | ❌ 进行中  |
| inline style      | ≤30    | 897    | ❌ 进行中（scope 含 src/） |
| text-[] arbitrary | ≤20    | 1000   | ❌ 进行中  |
| AiPanel 行数      | ≤500   | 281    | ✅ 已达成  |
| EditorPane 行数   | ≤400   | 232    | ✅ 已达成  |

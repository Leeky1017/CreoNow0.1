# Tasks: V1-00 前端视觉全面重塑计划

- **GitHub Issue**: 待创建（umbrella）
- **分支**: 不适用——本 change 为总控文档，不包含代码实现
- **Delta Spec**: 各 child change 自带 delta spec

---

## 验收标准（总控级）

| ID | 标准 |
| --- | --- |
| AC-1 | 13 个 child change 各自建立 proposal.md + tasks.md + specs/ |
| AC-2 | EXECUTION_ORDER.md 更新，包含 V1 波次排程 |
| AC-3 | 每个 child change 有独立 GitHub Issue |
| AC-4 | 所有 child change 合并后，Features 层指标达到 proposal 中的验收标准 |

---

## Phase 0: 立项

- [x] 审计 Features 层现状并建立量化基线
- [x] 阅读 35 个设计稿 HTML 并提取设计语言规范
- [x] 对比设计稿与实现的逐模块 Gap 分析
- [x] 确定 13 个 child change 的范围与波次排程
- [x] 撰写 umbrella proposal（本文件）
- [ ] 为每个 child change 建立 proposal.md + tasks.md

## Phase 1: 各 child change 独立落地

每个 child change 按以下流程独立执行：

1. 创建 GitHub Issue（关联 umbrella）
2. 从最新 `origin/main` 创建 task worktree
3. Spec-first + TDD 落地
4. 经独立审计 ACCEPT 后合并
5. 合并后归档对应 change

## Phase 2: 总控验收

- [ ] 所有 13 个 child change 已合并
- [ ] Features 层量化指标全部达标
- [ ] Storybook 可构建
- [ ] 全量测试通过
- [ ] lint ratchet 无新增违规
- [ ] 归档本 umbrella change

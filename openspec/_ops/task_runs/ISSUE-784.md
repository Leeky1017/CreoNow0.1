# ISSUE-784

更新时间：2026-02-28 21:00

- Issue: #784
- Branch: task/784-d1d2d3-owner-decisions
- PR: #785

## Plan

落盘 D1/D2/D3 Owner 决策到 workbench spec，解除 `fe-spec-drift-iconbar-rightpanel-alignment` 和 `fe-leftpanel-dialog-migration` 的决策阻塞。零代码改动。

## Runs

### Owner 决策落盘

- D1: IconBar `media` 面板 → 保留但标注 `[FUTURE]`
- D2: `graph` vs `knowledgeGraph` → 统一到 `knowledgeGraph`（仅改 spec 3 处，代码零改动）
- D3: RightPanel Quality tab → 保留，更新 Spec 为三 tab（AI / Info / Quality）

### 修改文件

- `openspec/specs/workbench/spec.md`：D1 media `[FUTURE]`；D2 `graph` → `knowledgeGraph`（表格+scenario）；D3 右侧面板三 tab
- `openspec/changes/EXECUTION_ORDER.md`：决策表标记已决策；阻塞解除；拓扑图标注 ✅
- `openspec/changes/fe-spec-drift-iconbar-rightpanel-alignment/tasks.md`：D1/D2/D3 checkbox 勾选
- `openspec/changes/fe-leftpanel-dialog-migration/tasks.md`：D1/D2 checkbox 勾选

零代码改动，无需 typecheck/test。

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: c804a27fa9135d7087fa4cdfaf940cb40c433970
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

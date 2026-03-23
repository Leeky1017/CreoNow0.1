# v1-16a: 接入 + PanelHeader 推广

> 属于 v1-16-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

v1-10 已将 5 个侧面板统一接入 PanelHeader。当前仍有 9 个 `*Panel.tsx` 文件未采纳 PanelHeader 组件，导致面板头部风格不一致。

## 当前状态

- `grep -rL 'PanelHeader' SRC/features/*/ --include='*Panel.tsx' | grep -v test | grep -v stories | wc -l` → 9

## 目标状态

- `grep -rL 'PanelHeader' SRC/features/*/ --include='*Panel.tsx' | grep -v test | grep -v stories | wc -l` → 0

## 不做什么

- 不重构面板内部逻辑或拆分文件
- 不修改 PanelHeader 组件本身
- 不处理非 `*Panel.tsx` 命名的面板文件

## 完成验证

1. `grep -rL 'PanelHeader' SRC/features/*/ --include='*Panel.tsx' | grep -v test | grep -v stories | wc -l` → 0
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run Panel` → all pass

# v1-13a: 审计 eslint-disable 标记

> 属于 v1-13-eslint-disable-audit（父 change），详细设计见父 change 的 proposal.md。

## 语境

features/ 生产文件共 29 处 eslint-disable，其中 23 处已有 `审计：v1-13 #N KEEP` 标记，6 处缺失。需补齐全部审计标记。

## 当前状态

- `grep -rn '审计' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 23
- `grep -rn 'eslint-disable' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 29

## 目标状态

- `grep -rn '审计' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 29
- 每条 eslint-disable 均有 `// 审计：v1-13 #NNN KEEP` 标记

## 不做什么

- 不删除或修改任何 eslint-disable（本轮仅添加审计标记）
- 不改组件逻辑或 props
- 不新增/删除测试

## 完成验证

1. `grep -rn '审计' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 29
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run` → all pass

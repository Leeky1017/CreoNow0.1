# v1-25a: 新增 Component Token 层

> 属于 v1-25-*（父 change），详细设计见父 change 的 proposal.md。

## 语境
在 `design/system/01-tokens.css` 的三层 token 架构（global → semantic → component）
中新增 component token 层，覆盖 Button/Input/Card/Badge/ListItem/Dialog/Tabs/Toast。

## 当前状态
- `grep -cE '\-\-(button|input|card|badge|listitem|dialog|tab|toast)-' design/system/01-tokens.css` → 0

## 目标状态
- `grep -cE '\-\-(button|input|card|badge|listitem|dialog|tab|toast)-' design/system/01-tokens.css` → ≥ 22

## 不做什么
- 不添加 `[data-density]` preset（v1-25b 负责）
- 不修改任何组件 .tsx 文件（v1-25c 负责）
- 不新增 global/semantic token

## 完成验证
1. `grep -cE '\-\-(button|input|card|badge|listitem|dialog|tab|toast)-' design/system/01-tokens.css` → ≥ 22
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run` → all pass（回归）

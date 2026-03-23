# v1-24a: 创建 Table 组件

> 属于 v1-24-*（父 change），详细设计见父 change 的 proposal.md。

## 语境
Table 是数据展示的核心组件，支持 striped、sortable、selectable 等交互模式。
采用 compound component 模式（Table/TableHeader/TableBody/TableRow/TableCell/TableHeaderCell）。

## 当前状态
- `find SRC/components/primitives -name 'Table*' | wc -l` → 0
- `grep -c 'Table' SRC/components/primitives/index.ts` → 0

## 目标状态
- `find SRC/components/primitives -name 'Table*' | wc -l` → 3（.tsx + .test.tsx + .stories.tsx）
- `grep -c 'Table' SRC/components/primitives/index.ts` → ≥ 1

## 不做什么
- 不实现虚拟滚动
- 不实现列拖拽排序
- 不修改其他 Primitive 组件

## 完成验证
1. `find SRC/components/primitives -name 'Table*' | wc -l` → 3
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Table` → all pass
4. `pnpm -C apps/desktop storybook:build` → success

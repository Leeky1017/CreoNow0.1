# Tasks: v1-24a Table Primitive

- **父 change**: v1-24-*
- **状态**: 📋 待实施
- **任务数**: 4

---

## Table Compound Component

- [ ] 创建 `Table.tsx`
      规格: compound component（Table/TableHeader/TableBody/TableRow/TableCell/TableHeaderCell）。
      — `TableVariant`: `"default" | "striped"`
      — `Table` Root：`<table>` wrapper + variant context provider
      — `TableHeader`：`<thead>` + 底部粗分割线
      — `TableBody`：`<tbody>` + 行间细分割线
      — `TableRow`：`<tr>` + hover 背景 + `selected` prop + `aria-selected`
      — `TableHeaderCell`：`<th>` + `sortable`/`sortDirection`/`onSort` + `aria-sort`
      — `TableCell`：`<td>` + 标准 padding
      — striped variant：CSS `even:bg-[var(--color-bg-subtle)]` 交替背景
      — 从 `primitives/index.ts` 导出所有子组件
      验证: `pnpm typecheck && grep 'Table' SRC/components/primitives/index.ts`

- [ ] 为 `Table` 编写单元测试
      覆盖:
      — `<Table>` 渲染 `<table>` 元素
      — `<TableHeader>` → `<thead>`，`<TableBody>` → `<tbody>`
      — `<TableRow>` → `<tr>`，`<TableCell>` → `<td>`，`<TableHeaderCell>` → `<th>`
      — `variant="striped"` 奇偶行 className 不同
      — `variant="default"` 无交替背景
      — `<TableHeaderCell sortable sortDirection="asc">` → `aria-sort="ascending"`
      — `<TableHeaderCell sortable sortDirection="desc">` → `aria-sort="descending"`
      — `<TableRow selected>` → `aria-selected="true"` + 选中背景色
      — `<TableRow hover>` → hover 背景色 className
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Table.test.tsx`

- [ ] 创建 `Table.stories.tsx`
      覆盖: Default（3列×5行）、Striped、Sortable、Selectable、Empty
      验证: `pnpm -C apps/desktop storybook:build`

- [ ] 在 `primitives/index.ts` 中导出 Table 全部子组件和类型
      验证: `grep -c 'Table' SRC/components/primitives/index.ts` ≥ 1

---

## 整体验证

```bash
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Table && \
pnpm -C apps/desktop storybook:build
```

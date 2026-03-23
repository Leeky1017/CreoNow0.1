# Tasks: v1-21a 补齐渐进加载与微交互

- **父 change**: v1-21-\*
- **状态**: 📋 待实施
- **任务数**: 8

---

## 文件组 1：面板 lazy 化

- [ ] `Sidebar.tsx` 将 FileTreePanel/OutlinePanelContainer 改为 lazy import
      实例（2 处）:
      :1 `import { FileTreePanel }` → `const FileTreePanel = lazy(() => import(...))`
      :2 `import { OutlinePanelContainer }` → `const OutlinePanelContainer = lazy(() => import(...))`
      :外包 `<Suspense fallback={<FileTreeSkeleton />}>` / `<OutlinePanelSkeleton />`
      验证: `grep 'lazy(' SRC/components/layout/Sidebar.tsx | wc -l` → 2

- [ ] `RightPanel.tsx` 将 AiPanel 改为 lazy import
      实例（1 处）:
      :8 `import { AiPanel }` → `const AiPanel = lazy(() => import(...))`
      :外包 `<Suspense fallback={<AiPanelSkeleton />}>`
      验证: `grep 'lazy(' SRC/components/layout/RightPanel.tsx | wc -l` → ≥ 2

- [ ] `AppShellOverlays.tsx` 将 SearchPanel 改为 lazy import
      实例（1 处）:
      :11 `import { SearchPanel }` → `const SearchPanel = lazy(() => import(...))`
      :外包 `<Suspense fallback={<SearchPanelSkeleton />}>`
      验证: `grep 'lazy(' SRC/components/layout/AppShellOverlays.tsx | wc -l` → ≥ 5

## 文件组 2：Dashboard 渐进加载

- [ ] `DashboardPage.tsx` 实现分步加载
      实例（1 处）:
      :项目卡片列表 lazy import，先渲染 hero + nav + stat skeleton
      验证: `grep 'lazy\|Suspense' SRC/features/dashboard/DashboardPage.tsx | wc -l` → ≥ 2

## 文件组 3：折叠/展开动效

- [ ] `main.css` 添加折叠/展开过渡 CSS
      实例（1 处）:
      :新增 `.collapsible` class：`grid-template-rows: 0fr → 1fr` + `opacity` 过渡（0.2s）
      :尊重 prefers-reduced-motion
      验证: `grep 'grid-template-rows' SRC/styles/main.css | wc -l` → ≥ 1

## 文件组 4：数值动效

- [ ] `useCountUp.ts` 创建数值动画 hook
      实例（新文件）:
      :新建 `hooks/useCountUp.ts`
      :0 → 目标值 CountUp 动画（0.3s ease-out，requestAnimationFrame）
      :尊重 prefers-reduced-motion（直接显示目标值）
      验证: `test hooks/useCountUp.test.ts` → all pass（使用 fake timer）

- [ ] `DashboardInternals.tsx` 集成 useCountUp
      实例（1 处）:
      :Dashboard 统计数字使用 useCountUp
      验证: `grep 'useCountUp' SRC/features/dashboard/DashboardInternals.tsx | wc -l` → 1

## 文件组 5：拖拽视觉反馈

- [ ] `main.css` + `FileTreePanel.tsx` 添加拖拽反馈样式
      实例（2 处）:
      :main.css 新增 `.drag-ghost`（opacity: 0.7 + scale(1.02) + shadow token）
      :main.css 新增 `.drop-indicator`（border-top: 2px solid var(--color-accent)）
      :FileTreePanel.tsx 拖拽时应用对应 class
      验证: `grep 'drag-ghost\|drop-indicator' SRC/styles/main.css | wc -l` → ≥ 2

---

## 整体验证

```bash
grep -rn 'lazy(' SRC/ --include='*.tsx' | grep -v test | wc -l  # → ≥ 9
grep -rn 'useCountUp' SRC/ --include='*.ts' | wc -l  # → ≥ 2
grep 'grid-template-rows' SRC/styles/main.css | wc -l  # → ≥ 1
pnpm typecheck  # → 0 errors
pnpm -C apps/desktop exec vitest run countUp lazy  # → all pass
```

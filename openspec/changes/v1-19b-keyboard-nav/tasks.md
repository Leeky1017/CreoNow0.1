# Tasks: v1-19b 增强键盘导航

- **父 change**: v1-19-*
- **状态**: 📋 待实施
- **任务数**: 10

---

## 文件组 1：树形键盘导航

- [ ] `useTreeKeyboardNav.ts` 创建树形键盘导航 hook
      实例（新文件）:
        :实现 ↑↓ 移动焦点、→ 展开、← 折叠/跳父、Enter 选中、Home/End 跳转
      验证: `test hooks/useTreeKeyboardNav.test.ts` → all pass

- [ ] `FileTreePanel.tsx` 集成 useTreeKeyboardNav
      实例（1 处）:
        :现有 onKeyDown 处理需替换为 hook 集成，支持 F2 重命名、Delete 删除
      验证: `test features/files/FileTreePanel.keyboard.test.tsx` → all pass

- [ ] `OutlinePanel.tsx` 集成 useTreeKeyboardNav
      实例（1 处）:
        :OutlineNodeItem 现有 onKeyDown 需集成 hook，Enter 跳转文档位置
      验证: `test features/outline/OutlinePanel.keyboard.test.tsx` → all pass

## 文件组 2：网格与工具栏导航

- [ ] `DashboardProjectGrid.tsx` 实现方向键网格导航
      实例（1 处）:
        :128 已有 role="button"，需实现 roving tabindex（←→↑↓ 移焦 + Enter 打开）
      验证: `test features/dashboard/DashboardProjectGrid.keyboard.test.tsx` → all pass

- [ ] `EditorToolbar.tsx` 实现 roving tabindex
      实例（1 处）:
        :工具栏按钮需 ←→ 移焦、Enter/Space 激活、Tab 离开 toolbar
      验证: `test features/editor/EditorToolbar.keyboard.test.tsx` → all pass

## 文件组 3：AI 面板与 Modal

- [ ] `AiPanel` 区域键盘行为验证
      实例（1 处）:
        :确认 Tab 切换 tab、Enter 发送、Esc 关闭的键盘流程完整
      验证: `test features/ai/AiPanel.keyboard.test.tsx` → all pass

- [ ] 自定义 Modal focus trap 审计
      实例（多处）:
        :SkillManagerDialog、MemorySettingsDialog、MemoryCreateDialog 等
        :验证 focus trap + Esc 关闭 + 焦点恢复；如非 Radix Dialog 则创建 useFocusTrap
      验证: `test` 每个 Modal 的 focus trap 行为 → all pass

## 文件组 4：屏幕阅读器辅助组件

- [ ] `SkipLink.tsx` 创建跳转主内容区链接
      实例（新文件）:
        :新建 `components/a11y/SkipLink.tsx`，Tab 聚焦时可见，Enter 跳转 main
        :在 AppShell 顶部引入
      验证: `test components/a11y/SkipLink.test.tsx` → all pass

- [ ] `LiveRegion.tsx` 创建全局状态通知组件
      实例（新文件）:
        :新建 `components/a11y/LiveRegion.tsx`，aria-live="polite"
        :集成到保存成功、AI 回复完成、导出完成等操作点
      验证: `test components/a11y/LiveRegion.test.tsx` → all pass

## 文件组 5：axe-core CI 集成

- [ ] axe-core 测试基础设施搭建
      实例（多文件）:
        :安装 `vitest-axe` 或 `jest-axe`
        :创建 `test-utils/axe-helper.ts` 提供 `expectNoAxeViolations`
        :为核心组件（FileTree、Outline、AI、Dashboard、Settings、Toolbar）添加 axe 测试
      验证: `pnpm -C apps/desktop exec vitest run axe` → all pass

---

## 整体验证

```bash
grep -rn 'useTreeKeyboardNav' SRC/ --include='*.ts' | wc -l  # → ≥ 3
grep -rn 'SkipLink' SRC/ --include='*.tsx' | wc -l  # → ≥ 2
pnpm typecheck  # → 0 errors
pnpm -C apps/desktop exec vitest run keyboard a11y axe  # → all pass
```

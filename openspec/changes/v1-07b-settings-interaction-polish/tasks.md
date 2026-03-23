# Tasks: v1-07b 补齐 Settings 交互动效

- **父 change**: v1-07-settings-visual-polish
- **状态**: 📋 待实施
- **任务数**: 7

---

## 文件组

- [ ] `SettingsAppearancePage.tsx` 审视 section header 样式（AC-4）
      当前状态: sectionLabelStyles 已含 uppercase + tracking，需确认底部分割线
      验证: 目视确认 section header 有 uppercase + letter-spacing + 1px 分割线

- [ ] `SettingsAppearancePage.tsx` 审视 theme 选中态（AC-5）
      当前状态: :159 有 `hover:border-hover` + `hover:bg-hover`，需确认选中态 filled 样式
      验证: 目视确认选中 theme 有背景色填充 + box-shadow

- [ ] `SettingsAppearancePage.tsx` 审视色板 hover 效果（AC-7）
      当前状态: :194 已有 `transition-[box-shadow,transform]`; :197 已有 `hover:scale-110`
      验证: 目视确认色板 hover 有 scale + glow shadow

- [ ] `SettingsAppearancePage.tsx` 审视 font-size slider 刻度（AC-6）
      当前状态: Slider 组件传入 `showLabels` + `formatLabel`，需确认刻度标记渲染
      验证: 目视确认 slider 下方有 12px–24px 刻度标记

- [ ] `SettingsNavigation.tsx` 审视 nav active indicator（AC-8）
      当前状态: :93 有 `hover:bg-surface`，需确认 active 项有 glow 或背景指示器
      验证: 目视确认 active nav 项有视觉指示器

- [ ] `Toggle.tsx` 审视过渡动效（AC-9）
      当前状态: :44 和 :68 已有 `transition-all`，需确认持续时间 ≥0.15s
      路径: `SRC/components/primitives/Toggle.tsx`
      验证: `grep 'transition\|duration' SRC/components/primitives/Toggle.tsx`

- [ ] 回归验证
      操作：运行全量 Settings 测试 + typecheck
      验证: `pnpm -C apps/desktop exec vitest run settings` → all pass; `pnpm typecheck` → 0 errors

---

## 整体验证

```bash
pnpm typecheck                                     # → 0 errors
pnpm -C apps/desktop exec vitest run settings      # → all pass
pnpm -C apps/desktop storybook:build               # → success
```

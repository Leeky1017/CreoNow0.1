# Tasks: v1-06b 补齐 AI 面板 hover/focus 动效

- **父 change**: v1-06-ai-panel-overhaul
- **状态**: 📋 待实施
- **任务数**: 8

---

## 文件组

- [ ] `AiMessageList.tsx` 审视并补齐 hover/focus 动效
      当前状态: hover=3, transition=3
      实例（3 处可交互元素）:
      :99 copy 按钮 — 已有 `focus-ring` + `hover:bg` + `transition-default` ✅
      :111 apply 按钮 — 已有 `focus-ring` + `hover:bg` + `transition-default` ✅
      :349 history replay 按钮 — 已有 `focus-ring` + `transition-colors`，需确认 hover 态覆盖
      验证: 目视确认所有可交互元素有 hover + transition + focus-ring

- [ ] `SkillPicker.tsx` 审视并补齐 hover/focus 动效
      当前状态: hover=7, transition=2
      实例（5 处按钮缺 transition）:
      :158 技能操作按钮 — 有 `hover:text` 但缺 `transition`
      :232 技能操作按钮 — 有 `hover:text` 但缺 `transition`
      :244 技能操作按钮 — 有 `hover:text` 但缺 `transition`
      :299 技能操作按钮 — 有 `hover:text` 但缺 `transition`
      :311 技能操作按钮 — 有 `hover:text` 但缺 `transition`
      验证: `grep -c 'transition' SRC/features/ai/SkillPicker.tsx` → ≥7

- [ ] `CodeBlock.tsx` 审视并补齐 hover/focus 动效
      当前状态: hover=2, transition=2
      实例（2 处）:
      :36 copy 按钮 — 已有 `focus-ring` + `hover:bg` + `transition-colors` ✅
      :44 apply 按钮 — 已有 `focus-ring` + `hover:bg` + `transition-colors` ✅
      验证: 目视确认覆盖完整

- [ ] `AiInputArea.tsx` 审视并补齐 hover/focus 动效
      当前状态: hover=3, transition=2
      实例（3 处可交互元素）:
      :53 action 按钮 — 已有 `focus-ring` + `hover:bg` + `transition-colors` ✅
      :84 mode picker — 已有 `focus-ring`，需确认 hover 态
      :170 附件按钮 — 已有 `hover:bg`，需确认 transition
      验证: 目视确认覆盖完整

- [ ] `AiPanelTabBar.tsx` 审视并补齐 hover/focus 动效
      当前状态: hover=1, transition=1
      实例（1 处）:
      :41 tab 按钮 — 已有 `focus-ring` + `transition-colors` ✅
      验证: 目视确认覆盖完整

- [ ] `ModelPicker.tsx` 审视并补齐 hover/focus 动效
      当前状态: 需检查所有可交互元素
      验证: 目视确认 picker 有 hover 态 + transition

- [ ] `AiChatSessionList.tsx` 审视并补齐 hover/focus 动效
      当前状态: 需检查列表项 hover 态
      验证: 目视确认列表项有 hover + transition

- [ ] 回归验证
      操作：运行全量 AI 测试 + typecheck
      验证: `pnpm -C apps/desktop exec vitest run ai` → all pass; `pnpm typecheck` → 0 errors

---

## 整体验证

```bash
pnpm typecheck                                    # → 0 errors
pnpm -C apps/desktop exec vitest run ai           # → all pass
pnpm -C apps/desktop storybook:build              # → success
```

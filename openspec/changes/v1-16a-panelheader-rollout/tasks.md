# Tasks: v1-16a PanelHeader 推广

- **父 change**: v1-16-*
- **状态**: 📋 待实施
- **任务数**: 9

---

## 文件组

- [ ] `QualityGatesPanel.tsx` 接入 PanelHeader（AC-2）
      实例（1 处）:
        :70 `<h2 className="text-[15px] ...">` 替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/quality-gates/QualityGatesPanel.tsx` → ≥1

- [ ] `QualityPanel.tsx` 接入 PanelHeader（AC-5）
      实例（1 处）:
        :158 `<Heading level="h3" className="font-bold text-[15px]">` 替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/rightpanel/QualityPanel.tsx` → ≥1

- [ ] `DiffViewPanel.tsx` 接入 PanelHeader（AC-9）
      实例（1 处）:
        面板顶部标题区替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/diff/DiffViewPanel.tsx` → ≥1

- [ ] `AiPanel.tsx` 接入 PanelHeader
      实例（1 处）:
        面板顶部标题区替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/ai/AiPanel.tsx` → ≥1

- [ ] `FileTreePanel.tsx` 接入 PanelHeader
      实例（1 处）:
        面板顶部标题区替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/files/FileTreePanel.tsx` → ≥1

- [ ] `SearchPanel.tsx` 接入 PanelHeader
      实例（1 处）:
        面板顶部标题区替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/search/SearchPanel.tsx` → ≥1

- [ ] `ShortcutsPanel.tsx` 接入 PanelHeader（AC-13 相关）
      实例（1 处）:
        面板顶部标题区替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/shortcuts/ShortcutsPanel.tsx` → ≥1

- [ ] `EntityCompletionPanel.tsx` 接入 PanelHeader
      实例（1 处）:
        面板顶部标题区替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/editor/EntityCompletionPanel.tsx` → ≥1

- [ ] `SlashCommandPanel.tsx` 接入 PanelHeader
      实例（1 处）:
        面板顶部标题区替换为 PanelHeader
      验证: `grep -c PanelHeader SRC/features/editor/SlashCommandPanel.tsx` → ≥1

---

## 整体验证

```bash
grep -rL 'PanelHeader' SRC/features/*/ --include='*Panel.tsx' | grep -v test | grep -v stories | wc -l  # → 0
pnpm typecheck && pnpm -C apps/desktop exec vitest run Panel
```

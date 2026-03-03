# Proposal: fe-hotkeys-shortcuts-unification

## 引用

详见 `openspec/changes/fe-hotkeys-shortcuts-unification/proposal.md`

## Why

多处散装 window.addEventListener("keydown") 监听导致快捷键冲突、scope 不隔离、优先级不可控。统一 HotkeyManager 解决传播混乱，同时提供快捷键参考面板提升用户发现性。

## 摘要

建立统一 HotkeyManager（scope + 优先级 + 传播控制），迁移散装 keydown listener，新增快捷键参考面板。

- 新增 `HotkeyManager` 类（单一 keydown 入口）
- 新增 `useHotkey` React hook
- 新增 `ShortcutsPanel` 组件
- 迁移 6 处散装 `addEventListener("keydown")` 到 useHotkey
- 新增 guard 测试防退化

# 提案：fe-hotkeys-shortcuts-unification

更新时间：2026-02-28 19:20

## Why（问题与目标）

快捷键定义集中在 `config/shortcuts.ts`，但注册分散在 4+ 处 `window.addEventListener("keydown")`：EditorPane/AppShell/EntityCompletion 等各自为政，缺少优先级与传播控制。

后果：

- Dialog 打开时仍可能触发编辑器快捷键
- 维护成本高，冲突难排
- 虽有 `getAllShortcuts()` 数据源，但无快捷键参考面板消费它

本 change 目标：建立统一 HotkeyManager，并提供用户可见的快捷键参考面板。

## What（交付内容）

- 新增 HotkeyManager：
  - 统一注册入口
  - 支持 scope（global/editor/dialog）与优先级
  - 支持 stopPropagation/preventDefault 规则
- 新增 Shortcuts 参考面板：
  - 入口：Command Palette 命令或 Settings
  - 数据源：`getAllShortcuts()`

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-hotkeys-shortcuts-unification/specs/workbench/spec.md`
  - `openspec/changes/fe-hotkeys-shortcuts-unification/specs/editor/spec.md`

## Out of Scope（不做什么）

- 不在本 change 内新增大量新快捷键（先收敛管理与参考面板）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`、`openspec/specs/editor/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`

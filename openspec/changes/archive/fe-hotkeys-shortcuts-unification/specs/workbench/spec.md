# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-hotkeys-shortcuts-unification

### Requirement: 快捷键必须由 HotkeyManager 统一管理 [ADDED]

#### Scenario: Dialog 打开时快捷键必须按 scope 正确拦截 [ADDED]

- **假设** 用户打开一个 Dialog（具备焦点陷阱）
- **当** 用户按下任意快捷键
- **则** 快捷键必须按 scope 与优先级路由
- **并且** 不得出现 Dialog 内按键触发编辑器全局动作的情况

### Requirement: 系统必须提供快捷键参考面板 [ADDED]

#### Scenario: 用户可在面板中查看全部快捷键与平台映射 [ADDED]

- **假设** 用户打开 Shortcuts 参考面板
- **当** 面板渲染
- **则** 系统必须展示全部快捷键清单
- **并且** 显示必须对齐当前平台（Windows/Mac）的修饰键映射

## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：建立统一 HotkeyManager（scope + 优先级 + 传播控制），迁移散装 keydown listener，新增快捷键参考面板。不新增大量快捷键。
- [ ] 1.2 审阅并确认错误路径与边界路径：Dialog 打开时 editor scope 快捷键不触发；无注册快捷键时 HotkeyManager 静默。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：Feature 层不得再散写 `addEventListener("keydown")`；快捷键参考面板消费 `getAllShortcuts()` SSOT。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/config/shortcuts.ts`
  - L136：`getAllShortcuts()` 已存在，作为参考面板数据源
- 新增 `apps/desktop/renderer/src/lib/hotkeys/HotkeyManager.ts`：
  - `register(shortcut: ShortcutDef, scope: Scope, priority: number, handler: () => void)`
  - `unregister(id: string)`
  - Scope：`global` / `editor` / `dialog`
  - 内部：单一 `window.addEventListener("keydown")` 入口，按 scope + priority 分发
  - Dialog 打开时自动屏蔽 editor scope
- 新增 `apps/desktop/renderer/src/lib/hotkeys/useHotkey.ts`：
  - React hook 封装：`useHotkey(shortcutId, handler, scope?)`
- 新增 `apps/desktop/renderer/src/features/shortcuts/ShortcutsPanel.tsx`：
  - 消费 `getAllShortcuts()`，按分类渲染快捷键列表
  - 入口：Command Palette 命令 或 Settings
- 散装 listener 迁移点（至少 2 处示范）：
  - `features/editor/EditorPane.tsx` L748/L877 → `useHotkey`
  - `components/layout/NavigationController.tsx` L108 → `useHotkey`
  - 其余 4 处（SearchPanel/ZenMode/KnowledgeGraph）后续逐步迁移

**为什么是这些触点**：HotkeyManager 统一入口替代 6 处散装 listener，ShortcutsPanel 消费已有 SSOT。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-HK-S1` | `apps/desktop/renderer/src/lib/hotkeys/HotkeyManager.test.ts` | `it('routes keydown events by scope and priority')` | 注册同 key 不同 scope，触发 keydown，断言正确 handler 被调用 | 无 | `pnpm -C apps/desktop test:run lib/hotkeys/HotkeyManager` |
| `WB-FE-HK-S1b` | 同上 | `it('blocks editor scope when dialog scope is active')` | 激活 dialog scope，触发 editor 快捷键，断言 editor handler 不被调用 | 无 | 同上 |
| `WB-FE-HK-S1c` | 同上 | `it('unregister removes handler')` | 注册后 unregister，触发 keydown，断言 handler 不被调用 | 无 | 同上 |
| `WB-FE-HK-S2` | `apps/desktop/renderer/src/features/shortcuts/ShortcutsPanel.test.tsx` | `it('renders all shortcuts from getAllShortcuts')` | 渲染 ShortcutsPanel，断言 `getAllShortcuts()` 返回的每个快捷键均出现 | mock shortcuts | `pnpm -C apps/desktop test:run features/shortcuts/ShortcutsPanel` |
| `WB-FE-HK-S3` | `apps/desktop/renderer/src/features/__tests__/hotkey-listener-guard.test.ts` | `it('no raw addEventListener keydown in features')` | 扫描 features/**/*.tsx，断言无 `addEventListener.*keydown`（应使用 useHotkey） | `fs`/`glob` | `pnpm -C apps/desktop test:run features/__tests__/hotkey-listener-guard` |

### 可复用测试范本

- shortcuts config：`apps/desktop/renderer/src/config/shortcuts.ts`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-HK-S1`：注册同 key 不同 scope 的 handler，触发 keydown，断言正确 scope 的 handler 被调用。
  - 期望红灯原因：`lib/hotkeys/HotkeyManager.ts` 不存在。
- [ ] 3.2 `WB-FE-HK-S1b`：激活 dialog scope，触发 editor 快捷键，断言 editor handler 不被调用。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-HK-S1c`：注册后 unregister，触发 keydown，断言 handler 不被调用。
  - 期望红灯原因：同上。
- [ ] 3.4 `WB-FE-HK-S2`：渲染 ShortcutsPanel，断言所有快捷键均渲染。
  - 期望红灯原因：`features/shortcuts/ShortcutsPanel.tsx` 不存在。
- [ ] 3.5 `WB-FE-HK-S3`：扫描 features/**/*.tsx，断言无 `addEventListener.*keydown`。
  - 期望红灯原因：当前 6 处散装 listener。
- 运行：`pnpm -C apps/desktop test:run lib/hotkeys/HotkeyManager` / `features/shortcuts/ShortcutsPanel` / `features/__tests__/hotkey-listener-guard`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `HotkeyManager.ts`：单一 keydown 入口，scope + priority 分发，dialog 屏蔽 editor → S1/S1b/S1c 转绿
- [ ] 4.2 新增 `useHotkey.ts`：React hook 封装 register/unregister lifecycle
- [ ] 4.3 新增 `ShortcutsPanel.tsx`：消费 `getAllShortcuts()`，按分类渲染 → S2 转绿
- [ ] 4.4 迁移至少 EditorPane + NavigationController 的 keydown listener → `useHotkey`
- [ ] 4.5 逐步迁移 SearchPanel/ZenMode/KnowledgeGraph → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 HotkeyManager 在组件卸载时正确 cleanup（useHotkey 的 useEffect return）
- [ ] 5.2 确认 ShortcutsPanel 入口已注册到 Command Palette 命令列表

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）

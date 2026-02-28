## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：为编辑区提供自定义 Context Menu（复用 Radix Primitive），统一 Tooltip 到 Radix Tooltip 淘汰原生 `title`。不做文件树右键菜单扩展。
- [ ] 1.2 审阅并确认错误路径与边界路径：无选区时格式/AI 动作禁用；只读模式下编辑动作隐藏。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：编辑区右键弹出自定义菜单（非浏览器默认）；Feature 层不得残留原生 `title` 作为主 Tooltip（白名单除外）。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：建议先行 `fe-reduced-motion-respect`（Tooltip 动画需 reduced motion）

### 1.5 预期实现触点

- 新增 `apps/desktop/renderer/src/features/editor/EditorContextMenu.tsx`：
  - 基于 Radix ContextMenu Primitive
  - 基础动作：复制/粘贴/撤销/重做
  - 格式动作：加粗/斜体/下划线（复用 EditorToolbar 逻辑）
  - AI 动作：润色/改写（复用 BubbleMenu 入口）
  - 无选区时格式/AI 动作 disabled
- `apps/desktop/renderer/src/features/editor/EditorPane.tsx`：
  - 编辑区容器包裹 `<ContextMenu.Root>` + `<ContextMenu.Trigger>`
- Tooltip 迁移（36 处原生 `title=`）：
  - 策略：将 `title="xxx"` 替换为 `<Tooltip content="xxx">` 包裹
  - 高密度文件：按 `title=` 数量排序逐文件处理
  - 可能需要新增 `components/primitives/Tooltip.tsx` 封装（若尚无统一封装）

**为什么是这些触点**：EditorPane 是编辑区入口，EditorContextMenu 独立组件便于测试，36 处 title 是 Tooltip 迁移的全量范围。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `ED-FE-CM-S1` | `apps/desktop/renderer/src/features/editor/EditorContextMenu.test.tsx` | `it('renders custom context menu with basic actions')` | 渲染 EditorContextMenu，断言复制/粘贴/撤销/重做菜单项出现 | mock editor | `pnpm -C apps/desktop test:run features/editor/EditorContextMenu` |
| `ED-FE-CM-S1b` | 同上 | `it('disables format actions when no selection')` | 无选区时断言格式动作 disabled | mock editor | 同上 |
| `WB-FE-TT-S1` | `apps/desktop/renderer/src/features/__tests__/tooltip-title-guard.test.ts` | `it('feature layer has no raw title attribute')` | 扫描 features/**/*.tsx，断言无 ` title=` 属性（白名单除外） | `fs`/`glob` | `pnpm -C apps/desktop test:run features/__tests__/tooltip-title-guard` |

### 可复用测试范本

- EditorBubbleMenu 测试：`apps/desktop/renderer/src/features/editor/EditorBubbleMenu.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `ED-FE-CM-S1`：渲染 EditorContextMenu，断言复制/粘贴/撤销/重做菜单项出现。
  - 期望红灯原因：`EditorContextMenu.tsx` 不存在。
- [ ] 3.2 `ED-FE-CM-S1b`：无选区时断言格式动作 disabled。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-TT-S1`：扫描 features/**/*.tsx，断言无原生 ` title=` 属性。
  - 期望红灯原因：当前 36 处原生 title 属性。
- 运行：`pnpm -C apps/desktop test:run features/editor/EditorContextMenu` / `features/__tests__/tooltip-title-guard`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `EditorContextMenu.tsx`：基于 Radix ContextMenu，基础动作 + 格式动作 + AI 动作 → S1 转绿
- [ ] 4.2 `EditorContextMenu.tsx`：无选区时格式/AI 动作 disabled → S1b 转绿
- [ ] 4.3 `EditorPane.tsx`：编辑区容器包裹 ContextMenu.Root + Trigger
- [ ] 4.4 逐文件将 `title="xxx"` 替换为 `<Tooltip content="xxx">` 包裹（36 处） → S1（TT） 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 Tooltip 封装统一（若无 `primitives/Tooltip.tsx` 则新增）
- [ ] 5.2 确认 ContextMenu 动画遵循 reduced motion 设置
- [ ] 5.3 建立 title 属性白名单（如 `<img alt>` 等语义用途）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出（含 title 迁移清单）
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-reduced-motion-respect` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）

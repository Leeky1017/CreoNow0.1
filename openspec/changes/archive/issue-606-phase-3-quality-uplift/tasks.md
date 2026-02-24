更新时间：2026-02-24 09:58

## 1. Specification

- [x] 1.1 确认 Phase 3 “提质”范围：微交互/动画、ScrollArea、Typography token、a11y、测试策略
- [x] 1.2 审阅并确认边界：仅质量与一致性提升，不新增业务功能
- [x] 1.3 审阅并确认验收契约：`transition-all` 收敛、token 统一、reduced motion、focus/keyboard、视觉回归门禁
- [x] 1.4 完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”结论

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID    | 测试类型     | 建议测试位置                                                                    | 验证要点                                               |
| -------------- | ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `WB-SCROLL-01` | 组件测试     | `apps/desktop/renderer/src/components/layout/Sidebar.test.tsx`                  | 侧栏溢出区由 ScrollArea 承载，header/footer 不跟随滚动 |
| `WB-SCROLL-02` | 组件测试     | `apps/desktop/renderer/src/components/layout/RightPanel.test.tsx`               | 右栏内容滚动与 Tab/标题区解耦                          |
| `WB-MOTION-01` | 约束测试     | `apps/desktop/renderer/src/components/layout/workbench-motion.contract.test.ts` | 关键交互组件不再使用 `transition-all`                  |
| `WB-MOTION-02` | 组件测试     | `apps/desktop/renderer/src/components/layout/workbench-motion.contract.test.ts` | 过渡时长与缓动仅引用 `duration/ease` token             |
| `WB-A11Y-01`   | 可访问性测试 | `apps/desktop/renderer/src/components/layout/workbench-motion.contract.test.ts` | `prefers-reduced-motion` 下非必要动画降级为 0ms        |
| `WB-A11Y-02`   | 可访问性测试 | `apps/desktop/renderer/src/components/layout/IconBar.test.tsx`                  | 键盘导航与 focus-visible 指示一致可见                  |
| `WB-TEST-01`   | 视觉回归     | `apps/desktop/renderer/src/components/layout/workbench.stories.snapshot.test.ts` | 默认/hover/focus/reduced-motion/暗色差异可审查        |
| `ED-TYPO-01`   | 组件测试     | `apps/desktop/renderer/src/features/editor/editor-typography.contract.test.ts`  | 编辑器排版使用 token，并补全 CJK 行高 token            |
| `ED-TYPO-02`   | 组件测试     | `apps/desktop/renderer/src/features/editor/editor-typography.contract.test.ts`  | 系统字体缩放 125%/150% 下排版层级稳定、无截断重叠      |
| `ED-SCROLL-01` | 集成测试     | `apps/desktop/renderer/src/features/outline/OutlinePanel.test.tsx`              | 长内容通过 ScrollArea 滚动且工具栏保持可达             |
| `ED-SCROLL-02` | 集成测试     | `apps/desktop/renderer/src/features/diff/DiffView.test.tsx`                     | Diff 长列表滚动不影响操作条可达性                      |
| `ED-MOTION-01` | 组件测试     | `apps/desktop/renderer/src/features/editor/editor-motion.contract.test.ts`      | BubbleMenu/工具栏过渡不使用 `transition-all`           |
| `ED-MOTION-02` | 可访问性测试 | `apps/desktop/renderer/src/features/editor/editor-motion.contract.test.ts`      | reduced motion 下关闭非必要 transform/opacity 动画     |
| `ED-A11Y-01`   | 组件测试     | `apps/desktop/renderer/src/features/editor/EditorToolbar.test.tsx`              | `aria-label`/`aria-pressed`/键盘操作路径完整           |
| `ED-TEST-01`   | 视觉回归     | `apps/desktop/renderer/src/features/editor/editor.stories.snapshot.test.ts`     | 编辑器关键状态视觉基线与 a11y 基线联动校验             |

## 3. Red（先写失败测试）

- [x] 3.1 先添加 `transition-all` 与 token 约束测试并确认失败（包含 Workbench + Editor）
- [x] 3.2 先添加 ScrollArea 结构与键盘可达性测试并确认失败
- [x] 3.3 先添加 reduced motion 行为测试并确认失败
- [x] 3.4 先添加视觉回归基线对比并确认存在预期外差异时会失败

## 4. Green（最小实现通过）

- [x] 4.1 最小改动收敛 `transition-all` 到属性级 transition
- [x] 4.2 最小改动统一 `duration/ease` token 引用
- [x] 4.3 最小改动将目标滚动区域迁移到 ScrollArea 抽象
- [x] 4.4 最小改动补全 Typography token（含 CJK 行高）与相关样式引用
- [x] 4.5 最小改动补齐 reduced motion 与 focus/keyboard 路径，保证测试转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 提炼共享 motion/scroll/a11y 样式工具，去重重复 class 与内联样式
- [x] 5.2 清理历史硬编码时长/缓动/排版值，避免新旧规范并存
- [x] 5.3 回归检查 Storybook 资产命名与测试入口，避免门禁漂移

## 6. Evidence

- [x] 6.1 记录 RUN_LOG（Red 失败证据、Green 通过证据、关键命令输出）
- [x] 6.2 记录依赖同步检查（Dependency Sync Check）的输入、结论与后续动作
- [x] 6.3 记录视觉回归 diff 审核结论（预期内 vs 预期外）与处理结果
- [x] 6.4 记录 Main Session Audit（`Reviewed-HEAD-SHA = 签字提交 HEAD^` 等硬约束）并确认签字提交仅变更当前任务 RUN_LOG

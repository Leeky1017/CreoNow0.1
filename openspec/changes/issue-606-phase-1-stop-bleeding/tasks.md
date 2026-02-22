更新时间：2026-02-22 15:08

## 1. Specification

- [x] 1.1 审阅并确认需求边界（仅 Phase 1 止血：Token 清扫 + 原生元素替换 + Z-index 统一）
- [x] 1.2 审阅并确认错误路径与边界路径（raw color/raw z-index/魔法阴影/散写原生元素的阻断与例外）
- [x] 1.3 审阅并确认验收阈值与不可变契约（Feature 层禁止新增 raw color、数字 z-index、魔法阴影、散写原生 `button/input`）
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划）                                                                   | 测试名称（计划）                                                   | 断言要点                                                  |
| ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| `WB-P1-S1`  | `apps/desktop/renderer/src/features/__tests__/token-color-guard.test.ts`           | `rejects raw tailwind colors and hex/rgba styles in feature layer` | 出现 raw color 即失败，仅允许 `--color-*`                 |
| `WB-P1-S2`  | `apps/desktop/renderer/src/features/__tests__/z-index-token-guard.test.ts`         | `rejects numeric z-index classes in workbench features`            | 出现 `z-10/z-20/z-30/z-50` 即失败                         |
| `WB-P1-S3`  | `apps/desktop/renderer/src/features/__tests__/overlay-layering.test.ts`            | `keeps overlay stacking order with tokenized z-index + portal`     | 弹层按 `--z-*` 顺序渲染，无穿透                           |
| `WB-P1-S4`  | `apps/desktop/renderer/src/features/__tests__/shadow-token-guard.test.ts`          | `rejects magic shadow values and enforces --shadow-* tokens`       | 出现 `shadow-[0_...]` 即失败                              |
| `WB-P1-S5`  | `apps/desktop/renderer/src/features/__tests__/primitive-replacement-guard.test.ts` | `disallows non-exempt direct button/input usage in feature layer`  | 非例外场景必须走 Primitives，受限场景需受控封装并记录例外 |

## 3. Red（先写失败测试）

- [x] 3.1 为 `WB-P1-S1` 与 `WB-P1-S2` 新增失败测试，先验证当前代码库存在违例样本
- [x] 3.2 为 `WB-P1-S4` 与 `WB-P1-S5` 新增失败测试，先验证魔法阴影与原生元素绕过问题
- [x] 3.3 为 `WB-P1-S3` 新增叠层场景失败测试，先复现 token 漂移导致的 Z 轴风险

## 4. Green（最小实现通过）

- [x] 4.1 仅实现使 `WB-P1-S1/S2` 转绿所需的最小替换（raw color/z-index → token）
- [x] 4.2 仅实现使 `WB-P1-S4` 转绿所需的最小替换（魔法阴影 → `--shadow-*`）
- [x] 4.3 仅实现使 `WB-P1-S5` 转绿所需的最小替换（散写原生元素 → Primitives）
- [x] 4.4 逐条验证 `WB-P1-S3` 叠层顺序通过，不引入 Phase 2/3 非目标改动

## 5. Refactor（保持绿灯）

- [ ] 5.1 去重 token 替换规则，收敛重复样式片段，保持测试全绿
- [ ] 5.2 清理替换过程中的临时适配代码，不改变已通过的外部行为契约
- [ ] 5.3 对齐 lint/test 命名与目录结构，确保 Scenario 可追溯性不回退

## 6. Evidence

- [x] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [x] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG

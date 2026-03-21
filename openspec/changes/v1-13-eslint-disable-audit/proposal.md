# V1-13 eslint-disable 审计清扫

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 4 面板 + 收口
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: 全 Features 层（审计）、docs（流程建立）
- **前端验收**: 需要（eslint 全绿 + 保留 disable 有充分注释 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

176 处 `eslint-disable` 注释如同战场上被遗忘的哨位——规则树立了，执行却靠人工豁免。「律令虽明，悬而不行，如刃未开。」

经 v1-12 大面积替换原生 HTML 后，预计 `eslint-disable` 总数将从 176 降至 40-50。本 change 的职责是对剩余的每一条 `eslint-disable` 逐条审计：

- 不合理的 → 修复并移除 disable
- 合理的 → 补充详细技术理由注释
- 建立后续新增 `eslint-disable` 的审批流程

**当前分布（v1-12 前）**：

- ~153 处 `no-native-html-element`——v1-12 预计清理 130+，剩余 ~20
- ~25 处 `no-hardcoded-dimension`——部分确有合理场景（SVG viewBox、canvas 尺寸等）
- 其余分布在 `max-lines-per-function`、`no-raw-tailwind-tokens`、`no-inline-style` 等

### 2. 根因

ESLint 规则在 Wave 0 从 warn 提升到 error 后，历史代码通过批量添加 `eslint-disable` 保持 CI 通过，但未逐条评估合理性。Wave 1-3 的各 change 聚焦模块级重塑，减少了部分 disable 但未做系统性审计。

### 3. 威胁

- **规则失效**：大量 disable 使 ESLint 规则沦为摆设——开发者看到"反正都 disable 了"便不再严格遵守
- **问题隐藏**：合理的 disable 混在不合理的 disable 中，真正的技术债被噪音淹没
- **审计信心**：每次审计都要重新判断哪些 disable 是合理的，浪费审计资源

### 4. 证据来源

| 数据点                            | 值       | 来源                               |
| --------------------------------- | -------- | ---------------------------------- |
| `eslint-disable` 总数（v1-12 前） | 176 处   | `grep -r eslint-disable features/` |
| `no-native-html-element`          | ~153 处  | grep 细分                          |
| `no-hardcoded-dimension`          | ~25 处   | grep 细分                          |
| 其余规则 disable                  | ~10 处   | grep 细分                          |
| v1-12 预计清理                    | 130+ 处  | v1-12 proposal 估算                |
| v1-13 审计范围                    | 40-50 处 | 剩余量                             |

---

## What：做什么

### 1. 逐条审计

对 v1-12 完成后剩余的每一条 `eslint-disable`，逐条执行以下判定：

**判定矩阵**：

| 场景                                 | 判定   | 动作                                  |
| ------------------------------------ | ------ | ------------------------------------- |
| 可用现有 Primitive 直接替换          | 不合理 | 替换 + 移除 disable                   |
| 需要新建 Primitive 或变体            | 上报   | 创建 Issue 跟踪 + 保留 disable + 注释 |
| 技术限制（`<input type="file">` 等） | 合理   | 保留 disable + 补充详细注释           |
| SVG / Canvas 固有尺寸                | 合理   | 保留 disable + 补充详细注释           |
| 函数超长但已有拆分计划               | 过渡期 | 保留 disable + 注释引用拆分 Issue     |
| 内联样式用于动态属性                 | 合理   | 保留 disable + 注释说明动态需求       |

### 2. 注释规范

所有保留的 `eslint-disable` 必须遵循统一注释格式：

```typescript
// eslint-disable-next-line creonow/no-native-html-element --
// 技术原因：<input type="file"> 无对应 Primitive，浏览器原生文件选择器无法通过自定义组件复现
// 审计：v1-13 #<审计编号> KEEP
```

### 3. 审计清单文档

在 `docs/references/` 下建立 `eslint-disable-audit.md`，记录每条 disable 的审计结论：

```markdown
| 编号 | 文件               | 行号 | 规则                   | 判定   | 理由                    |
| ---- | ------------------ | ---- | ---------------------- | ------ | ----------------------- |
| 001  | CharacterPanel.tsx | L42  | no-native-html-element | KEEP   | <input type="file"> ... |
| 002  | MemoryPanel.tsx    | L128 | no-hardcoded-dimension | REMOVE | 可用 token 替代         |
```

### 4. 后续审批流程

在 `docs/references/coding-standards.md` 中补充 eslint-disable 审批规则：

- 新增 `eslint-disable` 必须在 PR 中说明理由
- 审计 Agent 必须逐条检查新增 disable
- 每季度进行全局 eslint-disable 审计

### 5. 降至目标

最终 `eslint-disable` 总数降至 ≤20，每一条均有充分的技术理由注释。

---

## Non-Goals：不做什么

1. **不新建 Primitives 组件**——如果审计发现需要新 Primitive 才能替换某个 disable，创建 Issue 跟踪但不在本 change 实现
2. **不修改 ESLint 规则本身**——不降级规则严重性、不添加新规则
3. **不做代码重构**——只审计 disable 注释，不重构被 disable 的代码段的架构
4. **不做 lint-baseline.json 清零**——baseline 由 CI ratchet 机制管理，本 change 只处理显式的 `eslint-disable`

---

## 依赖与影响

- **上游依赖**: v1-12（交互动效与原生 HTML 收口）—— v1-12 完成后剩余的 disable 才是本 change 的审计范围
- **被依赖于**: 无——本 change 为 V1 视觉重塑计划的终端清扫任务
- **执行顺序**: 必须在 v1-12 之后执行
- **并行安全**: 本 change 涉及全 Features 层的注释修改，与其他活跃 change 可能有文件冲突，建议在 Wave 4 其他 change 都合并后再执行
- **风险**: 审计过程中可能发现 v1-12 遗漏的替换机会，需与 v1-12 协调（或直接在本 change 中补做替换）

---

## R5 Cascade Refresh（级联刷新）

**触发**：R5 P4 复核（v1-11 / v1-10 / v1-16 全部 PASS）
**日期**：2026-03-22

### 上游复核结论

| 上游 change | R5 结论 | 关键指标                                         |
| ----------- | ------- | ------------------------------------------------ |
| v1-11       | PASS ✅ | 64 tests 全绿，零回归                            |
| v1-10       | PASS ✅ | eslint-disable: 30（与 R4 一致），169 tests 全绿 |
| v1-16       | PASS ✅ | Quality 32 tests + Diff 59 tests 全绿，零回归    |

三项上游复核均 PASS，无阻断项传递至 v1-13。

### v1-13 当前基线（R5 实测）

```
eslint-disable 总数：229 处
```

按规则分布：

| 规则                                                                                                                                                                    | 数量 | 占比  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----- |
| `creonow/no-native-html-element`                                                                                                                                        | 186  | 81.2% |
| `creonow/no-hardcoded-dimension`                                                                                                                                        | 22   | 9.6%  |
| `creonow/no-raw-error-code-in-ui`                                                                                                                                       | 5    | 2.2%  |
| 其他（`i18next/no-literal-string`、`max-lines-per-function`、`react-hooks/refs`、`@typescript-eslint/no-require-imports`、`react-hooks/exhaustive-deps`、`no-console`） | 16   | 7.0%  |

### 与 R4 基线对比

v1-13 此前无 R4 级联刷新记录，本次为首次级联刷新。

对比 proposal 原始基线（v1-12 前）：176 → 229（+53）。增长原因：v1-12 尚未启动，新增功能模块（character、version-history、settings-dialog 等）持续引入 `eslint-disable`。`no-native-html-element` 从 ~153 增至 186，`no-hardcoded-dimension` 从 ~25 降至 22。

### 对 v1-13 scope 的影响

**scope 无需调整**。v1-13 完全依赖 v1-12 先行完成（大面积替换原生 HTML），审计范围仍为「v1-12 完成后的剩余 disable」。当前基线增长不改变 v1-13 的审计策略——仅需在 v1-12 合并后重新采集基线。AC 目标（≤20）不变。

### 结论

上游三项 PASS，v1-13 scope 与 AC 不受影响；待 v1-12 合并后重新采集基线即可启动审计。

---

## R6 级联刷新记录（2026-03-21）

### 刷新触发

v1-12 已合并（PR #1213）。v1-13 硬依赖 v1-12 完成后重新采集基线。

### R6 基线重采集

| 度量                        | R5 基线 | R6 实际 | Delta       | 说明                        |
| --------------------------- | ------- | ------- | ----------- | --------------------------- |
| eslint-disable 总数（prod） | 229     | 59      | -170 (-74%) | v1-12 大规模原生 HTML 替换  |
| `no-native-html-element`    | 186     | 27      | -159 (-85%) | 几乎全部收口                |
| `no-hardcoded-dimension`    | 22      | ~10     | -12 (-55%)  | 部分 Primitive 替换顺带清理 |
| 其他规则                    | 21      | ~22     | +1          | 基本持平                    |

### 27 处 `no-native-html-element` 分类

| 类别               | 数量 | 说明                                                                    |
| ------------------ | ---- | ----------------------------------------------------------------------- |
| Primitive 内部包装 | 14   | Button/Input/Textarea/Label/Checkbox/Radio/etc. 封装原生元素，by design |
| Layout 组件        | 7    | RightPanel/IconBar/AppShellMainArea 等，含 aria-pressed 等语义需求      |
| Composite 组件     | 4    | FormField/InfoBar/SearchInput，justified                                |
| Pattern 组件       | 2    | ErrorState dismiss/link，justified                                      |

**全部 27 处均为合理保留**——Primitive/Layout/Composite/Pattern 层封装原生元素是架构设计，不应消除。

### AC 目标调整

| AC #        | 原目标              | R6 调整后目标                       | 理由                                                      |
| ----------- | ------------------- | ----------------------------------- | --------------------------------------------------------- |
| AC-1        | eslint-disable ≤ 20 | eslint-disable（non-primitive）≤ 20 | 27 处 Primitive 包装层 disable 为合理保留，不计入审计目标 |
| AC-2～AC-11 | 不变                | 不变                                | 审计策略不受影响                                          |

### 对 v1-13 scope 的影响

**scope 大幅缩减**。v1-12 消灭了 170 处 eslint-disable（-74%），剩余 59 处中 27 处为合理 Primitive 包装。v1-13 的实际审计目标缩窄为剩余 32 处 non-primitive disable 的逐条审查和清理。

### 结论

v1-12 合并后，v1-13 从「229 处大规模审计」变为「32 处精准审计」。「大鹏已飞，余羽自清。」AC-1 目标从绝对值调整为排除 Primitive 层后的计数。v1-13 现已解除阻断，可启动。

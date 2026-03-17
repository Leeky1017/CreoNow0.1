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

# Tasks: V1-13 eslint-disable 审计清扫

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-eslint-disable-audit`
- **Delta Spec**: `openspec/changes/v1-13-eslint-disable-audit/specs/`

---

## 验收标准

| ID    | 标准                                                                                    | 验证方式                                    |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| AC-1  | `eslint-disable` 总数（全 Features 层）≤ 20 处                                          | `grep -r eslint-disable features/ \| wc -l` |
| AC-2  | 每一条保留的 `eslint-disable` 都有 `-- 技术原因：...` 格式的详细注释                    | 人工审查 + grep `eslint-disable.*--`        |
| AC-3  | 每一条保留的 `eslint-disable` 注释末尾有 `审计：v1-13 #<编号> KEEP` 标记                | grep 验证                                   |
| AC-4  | `docs/references/eslint-disable-audit.md` 审计清单文档存在，记录每条 disable 的审计结论 | 文件存在 + 内容格式                         |
| AC-5  | `docs/references/coding-standards.md` 中包含 eslint-disable 审批流程章节                | grep 验证                                   |
| AC-6  | 审计中识别的可替换 disable 已全部修复（替换为 Primitive 或调整代码）                    | diff 审查                                   |
| AC-7  | 审计中识别的需要新 Primitive 的 disable 已创建对应 Issue                                | Issue 链接                                  |
| AC-8  | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                       | CI 命令                                     |
| AC-9  | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                              | CI 命令                                     |
| AC-10 | TypeScript 类型检查通过（`pnpm typecheck`）                                             | CI 命令                                     |
| AC-11 | lint 无新增违规（`pnpm lint`）                                                          | CI 命令                                     |

---

## 审计清单模板

每条 `eslint-disable` 需填写以下审计条目：

````markdown
### #<编号>

- **文件**: `<文件路径>`
- **行号**: L<行号>
- **规则**: `<eslint 规则名>`
- **当前注释**: `<现有注释内容>`
- **上下文代码**:
  ```tsx
  // 3 行上下文
  ```
````

- **判定**: `REMOVE` | `KEEP` | `TRACK`
- **理由**: <详细技术理由>
- **动作**:
  - REMOVE → 替换方案：<具体替换代码>
  - KEEP → 保留原因：<技术限制说明>
  - TRACK → 创建 Issue：<Issue 标题 + 预期解决路径>

````

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 确认 v1-12 已合并（本 change 的输入是 v1-12 完成后的代码状态）
- [ ] 统计 v1-12 后的 `eslint-disable` 基线：
  ```bash
  # 总数
  grep -rn 'eslint-disable' --include='*.tsx' --include='*.ts' renderer/src/features/ | wc -l
  # 按规则分布
  grep -rn 'eslint-disable' --include='*.tsx' --include='*.ts' renderer/src/features/ | \
    grep -oP 'creonow/[a-z-]+' | sort | uniq -c | sort -rn
  # 导出完整清单
  grep -rn 'eslint-disable' --include='*.tsx' --include='*.ts' renderer/src/features/ > /tmp/eslint-disable-inventory.txt
````

- [ ] 阅读 `docs/references/coding-standards.md`，确认当前是否有 eslint-disable 相关规范
- [ ] 确认 Primitives 层可用组件清单，评估替换可行性

---

## Phase 1: 逐条审计

### Task 1.1: `no-native-html-element` 剩余审计

**映射验收标准**: AC-1, AC-2, AC-3, AC-4, AC-6

对 v1-12 后剩余的 `no-native-html-element` disable（预计 ~20 处）逐条审计：

- [ ] 逐条读取代码上下文（±5 行）
- [ ] 按判定矩阵判定 REMOVE / KEEP / TRACK：
  - `<input type="file">` → KEEP（原生文件选择器不可替代）
  - `<input type="color">` → KEEP（原生拾色器不可替代）
  - `<input type="range">` → KEEP / TRACK（可能有自定义 slider 需求）
  - `<canvas>` → KEEP（Canvas API 必须原生）
  - `<video>` / `<audio>` → KEEP（媒体元素必须原生）
  - 其他 → 评估是否可用 Primitive 替换
- [ ] REMOVE 判定的立即替换
- [ ] KEEP 判定的补充详细注释
- [ ] TRACK 判定的创建 Issue

### Task 1.2: `no-hardcoded-dimension` 审计

**映射验收标准**: AC-1, AC-2, AC-3, AC-4, AC-6

对所有 `no-hardcoded-dimension` disable（预计 ~25 处）逐条审计：

- [ ] SVG `viewBox` / `width` / `height` 属性 → KEEP（SVG 固有尺寸必须硬编码）
- [ ] Canvas `width` / `height` → KEEP（Canvas 渲染尺寸必须硬编码）
- [ ] 可用 token 替代的固定尺寸 → REMOVE（替换为 `var(--space-*)` 或等效 token）
- [ ] 组件 API 要求的固定数值（如 `ResizablePanel minSize={200}`）→ KEEP + 注释

### Task 1.3: 其他规则审计

**映射验收标准**: AC-1, AC-2, AC-3, AC-4

对剩余规则 disable（`max-lines-per-function`、`no-raw-tailwind-tokens`、`no-inline-style` 等）逐条审计：

- [ ] `max-lines-per-function`：确认函数是否真的无法拆分 → KEEP + 注释 / TRACK（创建拆分 Issue）
- [ ] `no-raw-tailwind-tokens`：确认是否可用 semantic token 替代 → REMOVE / KEEP
- [ ] `no-inline-style`：确认是否为动态样式（运行时计算值）→ KEEP + 注释 / REMOVE
- [ ] 其他规则逐条判定

---

## Phase 2: 文档建设

### Task 2.1: 审计清单文档

**映射验收标准**: AC-4

- [ ] 创建 `docs/references/eslint-disable-audit.md`
- [ ] 文档结构：

  ```markdown
  # eslint-disable 审计清单

  > 最后审计时间：<日期>
  > 审计版本：v1-13
  > 审计前总数：<N> 处
  > 审计后总数：≤20 处

  ## 总览

  | 规则 | 审计前 | REMOVE | KEEP | TRACK | 审计后 |
  | ---- | ------ | ------ | ---- | ----- | ------ |

  ## 逐条审计记录

  ### #001 ...

  ### #002 ...
  ```

- [ ] 填写所有审计条目（使用上方模板）

### Task 2.2: 审批流程建立

**映射验收标准**: AC-5

- [ ] 在 `docs/references/coding-standards.md` 中追加章节：

  ```markdown
  ## eslint-disable 使用规范

  ### 何时可以使用 eslint-disable

  1. 浏览器原生 API 必须使用原生 HTML 元素（`<input type="file">`、`<canvas>` 等）
  2. SVG / Canvas 固有尺寸必须硬编码
  3. 动态样式必须使用 inline style（运行时计算值）
  4. 第三方库要求特定 HTML 元素

  ### 使用要求

  1. 必须使用 `eslint-disable-next-line`（禁止 `eslint-disable` 块级禁用）
  2. 必须附带 `-- 技术原因：<详细说明>` 注释
  3. PR 中必须在描述中列出所有新增 disable
  4. 审计 Agent 必须逐条检查新增 disable

  ### 定期审计

  每季度运行一次全局 eslint-disable 审计，更新审计清单文档。
  ```

### Task 2.3: 注释回填

**映射验收标准**: AC-2, AC-3

- [ ] 对所有 KEEP 判定的 disable，统一注释格式：
  ```typescript
  // eslint-disable-next-line creonow/no-native-html-element --
  // 技术原因：<input type="file"> 浏览器原生文件对话框不可替代，无对应 Primitive
  // 审计：v1-13 #001 KEEP
  ```
- [ ] 确认所有保留 disable 的注释完整

---

## Phase 3: Verification（验证）

- [ ] 统计 `eslint-disable` 最终总数，确认 ≤20
- [ ] 逐条检查保留的 disable 都有完整注释（`-- 技术原因` + `审计：v1-13 #N KEEP`）
- [ ] 确认 `docs/references/eslint-disable-audit.md` 内容完整
- [ ] 确认 `docs/references/coding-standards.md` 包含 eslint-disable 章节
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 确认 TRACK 判定的 Issue 均已创建（列出 Issue 链接）

---

## R5 Cascade Refresh（级联刷新）

**触发**：R5 P4 复核（v1-11 / v1-10 / v1-16 全部 PASS）
**日期**：2026-03-22

### 受影响的 Task 条目

| Task                              | 影响           | 说明                                                                                                                          |
| --------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 基线采集                  | 基线数据更新   | 当前 eslint-disable 总数 229（原 proposal 记录 176）。v1-12 未启动，基线自然增长。Phase 0 的基线采集须在 v1-12 合并后重新执行 |
| Task 1.1 `no-native-html-element` | 预估审计量上调 | 当前 186 处（原 ~153），v1-12 清理后预计仍剩 ~20-30，审计工作量不变                                                           |
| Task 1.2 `no-hardcoded-dimension` | 无变化         | 当前 22 处（原 ~25），略有下降                                                                                                |
| Task 1.3 其他规则                 | 新增规则类型   | 新增 `no-raw-error-code-in-ui`（5 处）及 `no-console`（5 处），需纳入审计范围                                                 |
| Phase 1-3 所有 Task               | 未勾选（正确） | v1-13 全部 AC 待实现，符合「v1-12 完成后才启动」的执行顺序                                                                    |

### 结论

上游三项 R5 复核全部 PASS，无阻断项。v1-13 所有 task 保持待执行状态——符合预期（v1-12 为硬依赖）。基线增长（176→229）不影响 scope 和 AC；待 v1-12 合并后重新采集基线即可启动。

---

## R6 级联刷新记录（2026-03-21）

**v1-12 已合并（PR #1213）。v1-13 现已解除阻断，可启动。**

R6 基线重采集结果：eslint-disable 总数从 229 降至 59（-74%），其中 27 处为合理的 Primitive 包装层 disable。v1-13 实际审计范围缩窄为 32 处 non-primitive disable。AC-1 目标调整为排除 Primitive 层后 ≤ 20。

详细基线数据和 AC 调整见 `proposal.md` R6 级联刷新记录。

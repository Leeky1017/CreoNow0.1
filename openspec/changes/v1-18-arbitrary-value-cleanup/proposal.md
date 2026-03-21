# V1-18 Arbitrary 值收口与 Variant 推广

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 6 品质保障
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: 全 Features 层（130 个非测试/非 Story 的 .tsx 文件）
- **前端验收**: 需要（ESLint 门禁通过 + arbitrary 值统计归零 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

经过 v1-01 至 v1-16 的六波重塑，Design Token 体系已完备、Primitives 变体已丰富、各模块已逐页对齐设计稿。然而 Features 层仍残留大量 Tailwind arbitrary 值，如同新房装修完毕，墙角仍散落着施工时的临时钉子——「堂已成，钉未拔。」

当前残留量（实测）：

| 类型                             | 残留数     | 典型样例                                            |
| -------------------------------- | ---------- | --------------------------------------------------- |
| `text-[Npx]` 字号硬编码          | 667 处     | `text-[13px]`、`text-[11px]`、`text-[16px]`         |
| `rounded-[Npx]` 圆角硬编码       | 139 处     | `rounded-[8px]`、`rounded-[12px]`、`rounded-[24px]` |
| `w-[N]/h-[N]` 尺寸硬编码         | 96 处      | `w-[200px]`、`h-[32px]`、`w-[48px]`                 |
| `p-[N]/m-[N]/gap-[N]` 间距硬编码 | 28 处      | `p-[16px]`、`gap-[8px]`、`m-[4px]`                  |
| **合计**                         | **930 处** |                                                     |

这些 arbitrary 值意味着：

- 修改 typography scale 需要全局搜索 `text-[13px]` 而非改一个 `--text-body-size` token
- 切换主题时 token 驱动的值自动适配，但 arbitrary 值纹丝不动
- 间距和圆角无法通过设计系统统一调整

同时，v1-02 为 Primitives 新增的变体（`pill`、`bento`、`compact`、`underline`、`bordered`）在 Features 层的实际使用量为 **0**——变体已造好，但无人搬进新居。

### 2. 根因

v1-01 到 v1-16 的 Wave 策略是「先按模块逐页对齐设计稿，token 替换作为各 change 的一部分」。大部分模块已完成对齐，但 arbitrary 值的替换在以下场景被遗留：

- **Story 文件中的 mock 容器**：Story 的装饰器（wrapper div）大量使用 arbitrary 尺寸定义容器
- **跨 change 边界的文件**：某些文件（如 `SearchResultItems.tsx`、`QualityCheckItems.tsx`）在多个 change 中被部分修改，arbitrary 值在交接中遗漏
- **v1-02 变体未推广**：v1-02 只在 Primitives 层定义了新变体，Wave 1-4 的各 change 在实现时仍沿用旧模式（直接在 Feature 组件中 inline 样式），未主动采用新变体

### 3. 威胁

- **设计系统覆盖率不足**：930 处 arbitrary 值意味着 Design Token 的实际覆盖率约 60-70%——任何全局视觉调整（如整体 spacing 缩放、字号微调）都有 30% 的"盲区"
- **可维护性退化**：后续 bug 修复或新 feature 开发时，开发者看到现有代码用 arbitrary 值，会倾向于继续使用——"劣币驱逐良币"
- **变体浪费**：v1-02 花了一个 change 的工作量增加 Primitives 变体，如果 Features 层不迁移，这些变体形同虚设
- **CI 门禁虚置**：ESLint 规则 `creonow/no-arbitrary-values` 若存在，因大量既有代码而被迫设为 warn 或有豁免——新代码也可能滑过

### 4. 证据来源

| 数据点                  | 值                                                        | 来源                                                                |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| `text-[Npx]` 残留       | 667 处                                                    | `grep -r "text-\[" features/ --include="*.tsx" \| wc -l`            |
| `rounded-[Npx]` 残留    | 139 处                                                    | `grep -r "rounded-\[" features/ --include="*.tsx" \| wc -l`         |
| `w-[]/h-[]` 残留        | 96 处                                                     | `grep -r "w-\[\|h-\[" features/ --include="*.tsx" \| wc -l`         |
| `p-[]/m-[]/gap-[]` 残留 | 28 处                                                     | `grep -r "p-\[\|m-\[\|gap-\[" features/ --include="*.tsx" \| wc -l` |
| v1-02 变体使用量        | 0 处                                                      | `grep -r 'variant="pill"\|variant="bento"' features/` → 无匹配      |
| 最严重文件 text-[       | AiPanel.stories.tsx (92), CharacterPanel.stories.tsx (25) | 按文件统计 top 5                                                    |
| 最严重文件 rounded-[    | AiPanel.stories.tsx (13), AiMessageList.tsx (8)           | 按文件统计 top 5                                                    |

---

## What：做什么

### Phase 1：Token 映射表建立与 ESLint 规则强化

1. 建立 **arbitrary → token 映射表**：

   | Arbitrary 值     | 目标 Token / Utility              |
   | ---------------- | --------------------------------- |
   | `text-[10px]`    | `text-label`                      |
   | `text-[11px]`    | `text-caption`                    |
   | `text-[12px]`    | `text-caption`                    |
   | `text-[13px]`    | `text-body` / `text-tree`         |
   | `text-[14px]`    | `text-subtitle`                   |
   | `text-[16px]`    | `text-card-title` / `text-editor` |
   | `text-[24px]`    | `text-heading`                    |
   | `text-[48px]`    | `text-display`                    |
   | `rounded-[8px]`  | `rounded-md`                      |
   | `rounded-[12px]` | `rounded-lg`                      |
   | `rounded-[24px]` | `rounded-2xl`                     |
   | `p-[16px]`       | `p-4` / `p-panel`                 |
   | `gap-[8px]`      | `gap-2` / `gap-item`              |

2. 将 ESLint 规则 `creonow/no-arbitrary-values`（如已存在）提升为 `error`，或新建守卫测试阻止新增

### Phase 2：Features 层按文件批量替换

按残留密度排序，逐文件替换：

**高密度文件（≥ 10 处）**：

| 文件                                   | text-[ | rounded-[ | 其他 | 合计 |
| -------------------------------------- | ------ | --------- | ---- | ---- |
| `ai/AiPanel.stories.tsx`               | 92     | 13        | —    | 105  |
| `character/CharacterPanel.stories.tsx` | 25     | —         | —    | 25   |
| `search/SearchResultItems.tsx`         | 23     | —         | —    | 23   |
| `quality-gates/QualityCheckItems.tsx`  | 23     | —         | —    | 23   |
| `diff/DiffHeader.tsx`                  | 18     | —         | —    | 18   |
| `ai/AiMessageList.tsx`                 | 18     | 8         | —    | 26   |
| `version-history/VersionCard.tsx`      | 17     | —         | —    | 17   |
| `ai/SkillManagerDialog.tsx`            | 16     | —         | —    | 16   |
| `export/ExportPreview.tsx`             | 14     | 5         | 1    | 20   |

每个文件的替换规则：

- 先确认目标 token 在 `@theme` 中已导出为 Tailwind utility
- 逐行替换 arbitrary 值为对应 utility
- 运行 `pnpm typecheck && pnpm lint` 验证
- 视觉对比确认无回归（依赖 v1-17 的视觉回归 CI）

### Phase 3：v1-02 Variant 推广

在 Features 层中找到可替换为 v1-02 新增变体的位置，替换为标准变体引用：

- Dashboard 中的大圆角卡片 → `<Card variant="bento">`
- Dashboard 统计卡片 → `<Card variant="compact">`
- AI 面板 tab → `<Tabs variant="underline">`
- 分类标签 → `<Badge variant="pill">`
- 设置中的 pill 按钮 → `<Button variant="pill">`
- 正方形 icon 按钮 → `<Button size="icon">`

### Phase 4：尺寸硬编码清理

处理 `w-[N]` / `h-[N]` 中可替换为 Tailwind spacing scale 或 design token 的部分：

- `w-[48px]` → `w-12`（48px = 12 × 4px）
- `h-[32px]` → `h-8`（32px = 8 × 4px）
- `w-[200px]` → 保留（非标准尺寸，需语义化 token 或 CSS 变量）

**注意**：某些尺寸是组件特有的定尺寸（如 FileTree icon bar 48px、面板最小宽度 200px），这些使用 CSS 变量或 Tailwind arbitrary 值是合理的——仅清理可直接映射到 spacing scale 的值。

---

## Non-Goals：不做什么

1. **不新增 Design Token**——v1-01 已完成 token 补完，本 change 只做消费侧收口
2. **不修改 Primitives 组件**——仅在 Features 层替换 arbitrary 值和推广变体
3. **不修改 Story 装饰器中合理的容器尺寸**——Story wrapper div 的 `w-[400px]` 等容器定义是测试用途，不做替换
4. **不处理 test 文件中的 arbitrary 值**——测试文件的样式不影响产品质量
5. **不做 CSS-in-JS 迁移**——继续使用 Tailwind utility + CSS custom properties

---

## AC：验收标准

| #   | 验收条件                                                                                     | 验证方式                                              |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `grep -r "text-\[" features/ --include="*.tsx" ! --include="*.stories.tsx" \| wc -l` ≤ 20    | 命令行检查（非 Story 生产文件 ≤ 20 处残留）           |
| 2   | `grep -r "rounded-\[" features/ --include="*.tsx" ! --include="*.stories.tsx" \| wc -l` ≤ 10 | 命令行检查                                            |
| 3   | `grep -r "p-\[\|m-\[\|gap-\[" features/ --include="*.tsx" \| wc -l` = 0                      | 命令行检查（间距类应完全收口）                        |
| 4   | v1-02 变体在 Features 层使用量 ≥ 15 处                                                       | `grep -r 'variant="pill"\|variant="bento"' features/` |
| 5   | ESLint 门禁对新增 arbitrary 值报 error                                                       | CI gate 验证                                          |
| 6   | 类型检查通过 `pnpm typecheck`                                                                | CI gate                                               |
| 7   | Storybook 构建通过                                                                           | `pnpm -C apps/desktop storybook:build`                |
| 8   | 视觉回归 CI 通过（无意外像素变化）                                                           | v1-17 视觉回归 CI                                     |
| 9   | 映射表文档已归档（供后续开发参考）                                                           | 文件存在性检查                                        |

---

## 依赖与影响

- **上游依赖**: v1-01（token 定义）—— 替换目标 token 必须已定义；v1-02（Primitive 变体）—— 推广的变体必须已实现；v1-17（shadow xs/2xl + 视觉回归 CI）—— 确保替换不引入视觉回归
- **被依赖于**: 无直接下游依赖；但本 change 完成后，Design Token 实际覆盖率将从 ~65% 提升至 ≥ 95%
- **并行安全**: 大量文件修改，不适合与其他修改同一文件的 change 并行——建议在 v1-16 完成后串行执行
- **风险**:
  - 批量替换可能引入视觉微差（`text-[13px]` 和 `text-body` 可能因 line-height 差异导致布局偏移）——需逐文件视觉验证
  - Story 文件中的 arbitrary 值数量巨大（仅 `AiPanel.stories.tsx` 就有 105 处），替换工作量集中在 Story
- **预估工作量**: 约 v1-02 的 **0.8 倍**——无需设计决策，但机械性替换量大（930 处），需要逐文件验证确保无视觉回归。Phase 1 建表 + ESLint 约 0.5d，Phase 2 批量替换约 2-3d，Phase 3 变体推广约 0.5d，Phase 4 尺寸清理约 0.5d

---

## R2 级联刷新记录（2026-03-21）

### 刷新触发

R2 P1 复核 v1-03/04/05 → 级联刷新下游。v1-18 尚未启动，此次为基线重采集。

### R2 基线重采集

| 度量                           | 原始提案基线 | R2 实际 | Delta | 说明                                         |
| ------------------------------ | ------------ | ------- | ----- | -------------------------------------------- |
| `text-[`（features prod）      | 667          | 501     | -166  | v1-03/04/06/07 等已部分清理                  |
| `text-[`（features stories）   | —            | 166     | —     | 首次采集；stories 单独统计                   |
| `rounded-[`（features prod）   | 139          | 119     | -20   | 部分已替换为 `rounded-md/lg/2xl`             |
| `w-[]/h-[]`（features prod）   | 96           | 55      | -41   | 部分已替换为间距 scale                       |
| `p-[]/m-[]/gap-[]`（features） | 28           | 27      | -1    | 几乎未变化                                   |
| 总 arbitrary（features prod）  | 930          | 653     | -277  | 整体下降 30%                                 |
| v1-02 variant 采用量           | 0            | 0       | 0     | 仍为零——亟需推动 pill/bento/compact 采用     |

### Top 10 高密度文件（R2）

| 排名 | 文件                          | `text-[` 数 |
| ---- | ----------------------------- | ----------- |
| 1    | SearchResultItems.tsx         | 23          |
| 2    | QualityCheckItems.tsx         | 23          |
| 3    | DiffHeader.tsx                | 18          |
| 4    | AiMessageList.tsx             | 18          |
| 5    | VersionCard.tsx               | 17          |
| 6    | SkillManagerDialog.tsx        | 16          |
| 7    | ExportPreview.tsx             | 14          |
| 8    | VersionBadges.tsx             | 13          |
| 9    | BranchMergeSection.tsx        | 13          |
| 10   | ExportFormatTab.tsx           | 10          |

### AC 目标调整

- **`text-[` prod 目标维持 ≤20**：当前 501（较 667 下降 25%），仍需清理 ~481 处
- **`rounded-[` prod 目标维持 ≤10**：当前 119，需清理 ~109 处
- **`p-[]/m-[]/gap-[]` 目标维持 0**：当前 27，全部需清理
- **v1-02 variant 采用目标维持 ≥15**：当前 0，全部需推动

### 结论

v1-18 基线已刷新。总 arbitrary values 从 930 降至 653（-30%），上游 changes 已消化部分工作量。核心任务：`text-[` 501→≤20、`rounded-[` 119→≤10、variant 采用 0→≥15。tasks.md 尚未创建。

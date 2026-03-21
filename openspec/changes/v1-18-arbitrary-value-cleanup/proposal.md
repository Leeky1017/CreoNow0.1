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

| 度量                           | 原始提案基线 | R2 实际 | Delta | 说明                                     |
| ------------------------------ | ------------ | ------- | ----- | ---------------------------------------- |
| `text-[`（features prod）      | 667          | 501     | -166  | v1-03/04/06/07 等已部分清理              |
| `text-[`（features stories）   | —            | 166     | —     | 首次采集；stories 单独统计               |
| `rounded-[`（features prod）   | 139          | 119     | -20   | 部分已替换为 `rounded-md/lg/2xl`         |
| `w-[]/h-[]`（features prod）   | 96           | 55      | -41   | 部分已替换为间距 scale                   |
| `p-[]/m-[]/gap-[]`（features） | 28           | 27      | -1    | 几乎未变化                               |
| 总 arbitrary（features prod）  | 930          | 653     | -277  | 整体下降 30%                             |
| v1-02 variant 采用量           | 0            | 0       | 0     | 仍为零——亟需推动 pill/bento/compact 采用 |

### Top 10 高密度文件（R2）

| 排名 | 文件                   | `text-[` 数 |
| ---- | ---------------------- | ----------- |
| 1    | SearchResultItems.tsx  | 23          |
| 2    | QualityCheckItems.tsx  | 23          |
| 3    | DiffHeader.tsx         | 18          |
| 4    | AiMessageList.tsx      | 18          |
| 5    | VersionCard.tsx        | 17          |
| 6    | SkillManagerDialog.tsx | 16          |
| 7    | ExportPreview.tsx      | 14          |
| 8    | VersionBadges.tsx      | 13          |
| 9    | BranchMergeSection.tsx | 13          |
| 10   | ExportFormatTab.tsx    | 10          |

### AC 目标调整

- **`text-[` prod 目标维持 ≤20**：当前 501（较 667 下降 25%），仍需清理 ~481 处
- **`rounded-[` prod 目标维持 ≤10**：当前 119，需清理 ~109 处
- **`p-[]/m-[]/gap-[]` 目标维持 0**：当前 27，全部需清理
- **v1-02 variant 采用目标维持 ≥15**：当前 0，全部需推动

### 结论

v1-18 基线已刷新。总 arbitrary values 从 930 降至 653（-30%），上游 changes 已消化部分工作量。核心任务：`text-[` 501→≤20、`rounded-[` 119→≤10、variant 采用 0→≥15。tasks.md 尚未创建。

---

## R3 级联刷新记录（2026-03-21）

### 刷新触发

R3 全面复核。上游 v1-01（Design Token）、v1-02（Primitive Evolution）、v1-06（AI Panel Overhaul）、v1-07（Settings Polish）全部 PASS。v1-18 作为所有前序 visual overhaul 的汇聚清理点，需重新采集全面基线。

### 上游依赖状态

| 上游 Change               | 状态               | 关键成果                                           |
| ------------------------- | ------------------ | -------------------------------------------------- |
| v1-01 Design Token        | ✅ PASS ⭐⭐⭐⭐   | tokens.css 469行, 14档 typography, 完整 token 系统 |
| v1-02 Primitive Evolution | ✅ PASS ⭐⭐⭐⭐⭐ | 7 组件变体完成, 130 处使用, 493 测试全通过         |
| v1-06 AI Panel Overhaul   | ✅ PASS            | AiPanel 拆分完成(7 子组件), 27 测试文件全通过      |
| v1-07 Settings Polish     | ✅ PASS            | 0 硬编码 hex, 组件拆分完成, 91 测试全通过          |

### R3 基线重采集

#### Features 层（与 R2 可比口径）

| 度量                                | 原始提案 | R2  | R3  | R2→R3 Delta | 趋势         |
| ----------------------------------- | -------- | --- | --- | ----------- | ------------ |
| `text-[`（features prod）           | 667      | 501 | 95  | **-406**    | ⬇⬇⬇ 大幅下降 |
| `text-[`（features stories）        | —        | 166 | 34  | **-132**    | ⬇⬇           |
| `rounded-[`（features prod）        | 139      | 119 | 18  | **-101**    | ⬇⬇⬇          |
| `w-[]/h-[]`（features prod）        | 96       | 55  | 8   | **-47**     | ⬇⬇           |
| `p-[]/m-[]/gap-[]`（features prod） | 28       | 27  | 1   | **-26**     | ⬇⬇ 近乎归零  |
| 总 arbitrary（features prod）       | 930      | 653 | 228 | **-425**    | ⬇⬇⬇ -65%     |
| `shadow-[`（features prod）         | —        | —   | 7   | —           | 首次采集     |
| v1-02 variant 采用量（features）    | 0        | 0   | 0   | **0**       | ⚠ 仍为零     |

**采集命令**（features 口径）：

```bash
# text-[ features prod
grep -rn 'text-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 95

# text-[ features stories
grep -rn 'text-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep '.stories.' | wc -l
# → 34

# rounded-[ features prod
grep -rn 'rounded-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 18

# w-[]/h-[] features prod
grep -rnE '(w|h)-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 8

# p-[]/m-[]/gap-[] features prod
grep -rnE '(p|m|gap)-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 1

# total arbitrary features prod
grep -rnE '\-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 228

# shadow-[ features prod
grep -rn 'shadow-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 7

# v1-02 variant adoption (features/)
grep -rn 'variant="pill"\|variant="bento"\|variant="compact"\|variant="underline"\|variant="category"\|size="icon"' apps/desktop/renderer/src/components/features/ | wc -l
# → 0
```

#### 全 Components 层（R3 扩展口径）

v1-18 的真正影响面不限于 features/，primitives 和 patterns 层同样残留 arbitrary 值。R3 首次采集全 components/ 口径：

| 度量                    | R3 全 components/ | 其中 features/ | 其中 primitives+patterns/ |
| ----------------------- | ----------------- | -------------- | ------------------------- |
| `text-[` prod           | 279               | 95             | 184                       |
| `text-[` stories        | 47                | 34             | 13                        |
| `rounded-[` prod        | 75                | 18             | 57                        |
| `w-[]/h-[]` prod        | 43                | 8              | 35                        |
| `p-[]/m-[]/gap-[]` prod | 10                | 1              | 9                         |
| 总 arbitrary prod       | 860               | 228            | 632                       |
| `shadow-[` prod         | 48                | 7              | 41                        |

**采集命令**（全 components 口径）：

```bash
# text-[ components prod
grep -rn 'text-\[' apps/desktop/renderer/src/components/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 279

# rounded-[ components prod
grep -rn 'rounded-\[' apps/desktop/renderer/src/components/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 75

# w-[]/h-[] components prod
grep -rnE '(w|h)-\[' apps/desktop/renderer/src/components/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 43

# p-[]/m-[]/gap-[] components prod
grep -rnE '(p|m|gap)-\[' apps/desktop/renderer/src/components/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 10

# total arbitrary components prod
grep -rnE '\-\[' apps/desktop/renderer/src/components/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 860

# shadow-[ components prod
grep -rn 'shadow-\[' apps/desktop/renderer/src/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l
# → 48

# v1-02 variant adoption (features/)
grep -rn 'variant="pill"\|variant="bento"\|variant="compact"\|variant="underline"\|variant="category"\|size="icon"' apps/desktop/renderer/src/components/features/ | wc -l
# → 0
```

### Top 10 高密度文件（R3 — features 层 text-[）

| 排名 | 文件                              | `text-[` 数 | R2 对比 |
| ---- | --------------------------------- | ----------- | ------- |
| 1    | AiDialogs/SystemDialogContent.tsx | 15          | 新入榜  |
| 2    | AiDialogs/AiDiffContent.tsx       | 11          | 新入榜  |
| 3    | AiDialogs/AiDiffSummary.tsx       | 10          | 新入榜  |
| 4    | AiDialogs/AiErrorDetails.tsx      | 9           | 新入榜  |
| 5    | KnowledgeGraph/GraphToolbar.tsx   | 8           | 新入榜  |
| 6    | AiDialogs/AiDiffModal.tsx         | 7           | 新入榜  |
| 7    | KnowledgeGraph/NodeDetailCard.tsx | 6           | 新入榜  |
| 7    | AiDialogs/AiInlineConfirm.tsx     | 6           | 新入榜  |
| 9    | KnowledgeGraph/NodeEditDialog.tsx | 5           | 新入榜  |
| 9    | AiDialogs/AiInlinePreview.tsx     | 5           | 新入榜  |

**分析**：R2 榜单中的 SearchResultItems(23)、QualityCheckItems(23)、DiffHeader(18)、AiMessageList(18) 等已大幅清理或归零，说明 v1-06/07 的工作已生效。当前热点集中在 AiDialogs（v1-06 拆分产生的子组件）和 KnowledgeGraph 模块。

### AC 目标调整

features 层基线大幅下降（总量 930→228，-75%），AC 目标可更积极：

| AC # | 原目标                 | R3 调整后目标                   | 理由                                           |
| ---- | ---------------------- | ------------------------------- | ---------------------------------------------- |
| 1    | `text-[` prod ≤ 20     | `text-[` features prod ≤ 10     | 当前仅 95，热点集中在 AiDialogs/KnowledgeGraph |
| 2    | `rounded-[` prod ≤ 10  | `rounded-[` features prod ≤ 5   | 当前仅 18，可进一步压缩                        |
| 3    | `p-[]/m-[]/gap-[]` = 0 | `p-[]/m-[]/gap-[]` features = 0 | 当前仅 1，应完全归零                           |
| 4    | variant 采用 ≥ 15      | variant 采用 ≥ 15               | 维持不变，当前仍为 0                           |
| 新增 | —                      | `shadow-[` features prod ≤ 3    | 首次纳入，当前 7                               |

### 结论

上游四大 change 全部 PASS 后，features 层 arbitrary values 从 930（原始）→ 653（R2）→ 228（R3），累计下降 **75%**。「大厦将成，余钉渐稀。」

**核心工作量已大幅收窄**：

- `text-[` 95 处（集中在 AiDialogs 6文件 + KnowledgeGraph 3文件）
- `rounded-[` 18 处
- `shadow-[` 7 处
- `w-[]/h-[]` 8 处
- `p-[]/m-[]/gap-[]` 1 处（近乎归零）
- v1-02 variant 采用仍为 0——这是 v1-18 独有的推广任务

**注意**：primitives+patterns 层仍有 632 处 arbitrary（主要是 text-[ 184、rounded-[ 57、shadow-[ 41），但这些可能是 Primitive 组件内部的合理定义（如 Button/Badge/Toast 的内部样式映射），不在 v1-18 的 features 清理范围内。如需扩展范围，应另开 change。

---

## R6 级联刷新记录（2026-03-21）

### 刷新触发

v1-12 合并（PR #1213）。v1-12 大规模 Primitive 替换带来 arbitrary value 大幅下降。

### R6 基线重采集

| 度量                        | R3 基线 | R6 实际 | Delta       | 说明                                                              |
| --------------------------- | ------- | ------- | ----------- | ----------------------------------------------------------------- |
| `text-[` features prod      | 95      | 48      | -47 (-49%)  | Primitive Button/Select/Input 替换消除了大量 hardcoded text-[Npx] |
| `rounded-[` all prod        | 18      | 4       | -14 (-78%)  | Radix 组件自带 token 化圆角                                       |
| `shadow-[` all prod         | 7       | 6       | -1 (-14%)   | 基本持平                                                          |
| `p-[]/m-[]/gap-[]` all prod | 1       | 3       | +2          | 轻微增长（v1-12 新增布局组件）                                    |
| v1-02 variant adoption      | 0       | 93      | +93         | 🎉 v1-12 Primitive 替换自动引入了大量 variant 使用                |
| 总 arbitrary (features)     | 228     | ~61     | -167 (-73%) | 接近收口                                                          |

### AC 目标调整

| AC # | R3 目标                  | R6 调整后目标            | 理由                             |
| ---- | ------------------------ | ------------------------ | -------------------------------- |
| 1    | `text-[` features ≤ 10   | `text-[` features ≤ 10   | 当前 48→10 仍需清理，目标不变    |
| 2    | `rounded-[` features ≤ 5 | `rounded-[` features ≤ 3 | 当前仅 4，可更积极               |
| 3    | `p-[]/m-[]/gap-[]` = 0   | `p-[]/m-[]/gap-[]` ≤ 3   | 实际增至 3，均为布局合理值，放宽 |
| 4    | variant 采用 ≥ 15        | variant 采用 ≥ 15        | ✅ 已达成（93），但维持最低标准  |
| 新增 | `shadow-[` ≤ 3           | `shadow-[` ≤ 3           | 当前 6，仍需清理                 |

### 对 v1-18 scope 的影响

**scope 大幅缩减**。v1-12 的 Primitive 大面积替换消灭了 73% 的 arbitrary values（228→~61）。v1-02 variant 采用从 0 爆增至 93，远超 AC-4 目标（≥15），该 AC 已自动达成。

v1-18 剩余工作量：

- `text-[` 48→10：清理 ~38 处
- `rounded-[` 4→3：清理 ~1 处
- `shadow-[` 6→3：清理 ~3 处
- `p-[]/m-[]/gap-[]`：已接近目标

### 结论

「釜底抽薪，薪已去七。」v1-12 的 Primitive 替换是 arbitrary cleanup 最大的加速器。v1-18 从「228 处大面积清扫」变为「~50 处精准点杀」。AC-4（variant adoption）已自动达成。

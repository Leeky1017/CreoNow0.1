# V1-04 编辑器排版与布局

> 📋 **级联刷新 R1**（2026-03-21）：v1-01 + v1-02 完成后刷新。基线已重采集。

> ✅ **已合并** — 评级 ⭐⭐⭐⭐

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 1 P0 页面重塑
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: editor
- **前端验收**: 需要（Storybook 构建通过 + 编辑器实际排版效果验收）

---

## Why：为什么必须做

### 1. 用户现象

编辑器是 CreoNow 的心脏——创作者在这里凝视最久，书写最多。然而正文区域的排版体验与设计稿 `07-editor-simple.html` 之间存在六处显著偏差，犹如"笔墨精良而纸幅失度"：

- **正文无 max-width 约束**：设计稿明确定义 `max-width: 760px` 居中排列，当前代码 `flex-1 min-h-0` 撑满容器——宽屏用户的正文行字数过多，阅读疲劳感显著上升
- **标题 typography 不对齐**：设计稿定义标题 48px / weight 300 / letter-spacing -0.03em，当前使用 Tailwind `text-4xl`（36px）——标题层级感不足，首屏视觉重量缺失
- **正文缺少 serif 选项**：设计稿用 Lora serif 展示编辑器正文，当前只有 Inter sans-serif——对文学创作场景缺乏字体适配
- **行高不够**：设计稿编辑器正文 1.8 line-height，当前未显式设置（TipTap 默认约 1.5）——长文阅读呼吸感不足
- **Featured image 缺失**：设计稿有文档特色图片 + gradient overlay 的视觉表达，当前无任何图片支持——文档首屏缺少视觉锚点
- **编辑区域 padding 不足**：设计稿 40-48px 侧边 padding 营造沉浸式书写空间，当前可能不足——正文紧贴容器边缘，缺少留白

### 2. 根因

EditorPane.tsx 约 1,550 行，排版（typography/layout）相关代码散落在巨石组件的各个角落，与 inline AI、entity completion、slash command 等无关逻辑交织。排版样式的修改需要在 1,550 行中定位上下文——"大厦千间，改一窗需识全图。" 这导致 typography 在迭代中被忽略，逐渐偏离设计稿。

### 3. 威胁

- **创作体验**：编辑器排版直接决定创作者的书写舒适度。正文撑满全宽 + 行高不足的组合，在长时间写作时将加速视觉疲劳——"善工不可使器钝于匠手"
- **产品定位落差**：CreoNow 定位为「创作者的 Cursor」，但文学创作场景连 serif 字体选项都没有——用户期望与产品表达之间的裂隙
- **设计系统一致性**：v1-01 补完的 `--text-display-*`（48px）typography token 如果在编辑器标题中不被采用，token 体系的权威性将被质疑

### 4. 证据来源（设计稿 vs 实现对比）

| 数据点                 | 设计稿目标                   | 当前实现（R1 重采集）                                                         | 状态 |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------------- | ---- |
| EditorPane.tsx 行数    | —                            | 232 行（v1-05 拆分后）                                                        | ✅   |
| 正文 max-width         | 760px 居中                   | `max-width: var(--editor-content-max-width, 760px)` — `main.css:570`          | ✅   |
| 标题字号               | 48px / weight 300 / -0.03em  | `--text-display-size/weight/letter-spacing` — `main.css:579-581`              | ✅   |
| 正文字体               | Lora（serif）                | `--font-family-body: "Lora", "Crimson Pro", Georgia, serif` — `tokens.css:64` | ✅   |
| 正文行高               | 1.8                          | `--text-editor-line-height: 1.8` — `tokens.css:53`                            | ✅   |
| CJK 行高               | —（额外精妙支持）            | `--text-editor-line-height-cjk: 1.95` — `tokens.css:54`                       | ✅   |
| 侧边 padding           | 40-48px                      | `--space-editor-padding-x: var(--space-12)` (48px) — `tokens.css:25`          | ✅   |
| Featured image         | 有（gradient overlay）       | `EditorFeaturedImage.tsx` 49 行，组件已实现                                   | ✅   |
| Typography token 引用  | `--text-display-*`           | `main.css:47-51` 已声明并应用                                                 | ✅   |
| CJK 测试覆盖           | —                            | `EditorTypography.test.tsx` 208 行，覆盖 zh/ja/ko                             | ✅   |
| FeaturedImage 测试     | —                            | `EditorFeaturedImage.test.tsx` 85 行                                          | ✅   |
| renderer tokens.css    | —                            | 381 行（v1-01 R1: 14 typography scales + 11 独立 token + 4 语义间距）         | ✅   |
| main.css               | —                            | 595 行（含 56 @theme typography 映射）                                        | ✅   |
| text-\[Npx\] arbitrary | 0 新增                       | 全局 ~1000 处（归 v1-18 统一清理，Non-Goal）                                  | ✅   |
| 参考设计稿             | `07-editor-simple.html`      | 已对齐                                                                        | ✅   |
| DESIGN_DECISIONS.md    | §4 字体系统 / §19 编辑器交互 | 已对齐                                                                        | ✅   |

---

## What：做什么

### 1. 正文 max-width 约束 [✅ 已完成]

为 TipTap 编辑器正文区域添加 `max-width: 760px` + 水平居中，确保宽屏下正文行宽合理。使用 Design Token 或 CSS 变量定义宽度值，便于后续可配置化。

### 2. 标题 typography 对齐 [✅ 已完成]

将编辑器文档标题从 `text-4xl`（36px）调整为设计稿定义的 48px / weight 300 / letter-spacing -0.03em，使用 v1-01 补完的 `--text-display-*` typography token。

### 3. Serif 字体选项 [✅ 已完成]

引入 Lora（或等效 serif 字体）作为编辑器正文的可选字体。在编辑器样式层面支持 serif / sans-serif 切换，具体切换 UI 留给 Settings 模块（v1-07）实现。

### 4. 正文行高调整 [✅ 已完成]

将编辑器正文的 line-height 设置为 1.8，使用 v1-01 补完的 `--leading-relaxed` token。

### 5. Featured Image 支持 [✅ 已完成]

在编辑器顶部实现文档特色图片区域 + gradient overlay，对齐 `07-editor-simple.html` 设计稿。图片数据来源使用文档 metadata 中的 `coverImage` 字段（如已有则直接集成，如未有则预留接口）。

### 6. 编辑区域 padding 调整 [✅ 已完成]

将编辑器正文区域的侧边 padding 增加到 40-48px，使用语义间距 token，营造设计稿中的沉浸式书写空间。

---

## Non-Goals：不做什么

1. **不拆分 EditorPane.tsx**——组件拆分由 v1-05 负责，本 change 仅在现有结构内修改 typography/layout
2. **不改 TipTap 核心配置**——不增减 TipTap 扩展，不改编辑器功能逻辑
3. **不实现字体切换 UI**——serif 字体仅在样式层面支持，切换控件由 v1-07 Settings 实现
4. **不改 inline AI / entity completion / slash command**——这些功能不在本 change 范围内
5. **不改 autosave 逻辑**——保存行为不变
6. **不引入新字体加载方案**——使用现有字体加载基础设施

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）已合并 ✅ — `--text-display-*`、`--leading-relaxed`、`--tracking-tight` 等 typography token 已就位；tokens.css 469→381 行（renderer 同步后精简）
- **上游依赖**: v1-02（Primitive Visual Evolution）已合并 ✅ — Button 229 行（pill + icon variants）、Card 129 行（bento + compact）、Tabs 333 行（underline）；编辑器工具栏可消费 v1-02 原语
- **相关 change**: v1-05（EditorPane 拆分）已合并 ✅ — EditorPane.tsx 从 1,550 行精简至 232 行
- **下游影响**: v1-07（Settings 视觉精修）将在 Settings 中增加 serif/sans-serif 切换 UI，依赖本 change 提供的样式层面支持
- **交叉引用**: text-\[Npx\] arbitrary ~1000 处，归 v1-18 统一清理（Non-Goal）

---

## 完成总结

> 「文章千古事，得失寸心知。」——杜甫

v1-04 已合并至 main，评级 ⭐⭐⭐⭐。六项编辑器排版目标全部达成：

1. **760px 居中**：正文区域通过 `--editor-content-max-width` token 约束，宽屏下行宽合理
2. **48px 展示标题**：采用 `--text-display-*` token 体系，weight 300 + letter-spacing -0.03em
3. **Lora serif**：`--font-family-body` 已引入 Lora → Crimson Pro → Georgia 字体栈
4. **行高 1.8**：`--text-editor-line-height: 1.8`，另有 CJK 特供 `1.95`
5. **Featured Image**：`EditorFeaturedImage.tsx` 组件实现 gradient overlay + 优雅降级
6. **48px padding**：`--space-editor-padding-x` 语义间距 token，沉浸式书写空间

额外收获：CJK 排版精妙支持（zh/ja/ko 行高自适应），测试覆盖 208 行。

---

## R1 Cascade Refresh (2026-03-21)

> 上游验证完毕后的正式级联刷新。「文质彬彬，然后君子。」——《论语》

### 上游状态

| 上游 change | 评级       | 状态 |
| ----------- | ---------- | ---- |
| v1-01       | ⭐⭐⭐⭐   | PASS |
| v1-02       | ⭐⭐⭐⭐⭐ | PASS |

### 度量重采集

| 数据点                               | R2 记录 | R1 Cascade 实测 | Delta | 采集命令                                                                              |
| ------------------------------------ | ------- | --------------- | ----- | ------------------------------------------------------------------------------------- |
| EditorPane.tsx 行数                  | 232     | **232**         | 0     | `wc -l apps/desktop/renderer/src/features/editor/EditorPane.tsx`                      |
| EditorFeaturedImage.tsx 行数         | 49      | **49**          | 0     | `wc -l …/editor/EditorFeaturedImage.tsx`                                              |
| `--editor-content-max-width`（AC-1） | 760px   | **760px**       | 0     | `grep -n '760px' …/styles/main.css …/styles/tokens.css` → main.css:570, tokens.css:26 |
| `--text-display-size`（AC-2）        | 48px    | **48px**        | 0     | `grep -n 'text-display' …/styles/main.css` → :579-582                                 |
| `--font-family-body` 含 Lora（AC-3） | ✅      | **✅**          | 0     | `grep -n 'Lora' …/styles/tokens.css` → :64                                            |
| `--text-editor-line-height`（AC-4）  | 1.8     | **1.8**         | 0     | `grep -n 'editor-line-height' …/styles/tokens.css` → :53                              |
| CJK line-height（AC-4 补充）         | 1.95    | **1.95**        | 0     | `grep -n '1.95' …/styles/tokens.css` → :54                                            |
| `--space-editor-padding-x`（AC-6）   | 48px    | **48px**        | 0     | `grep -n 'editor-padding' …/styles/tokens.css` → :25                                  |
| tokens.css 行数                      | 381     | **381**         | 0     | `wc -l …/styles/tokens.css`                                                           |
| main.css 行数                        | 595     | **595**         | 0     | `wc -l …/styles/main.css`                                                             |
| EditorTypography.test.tsx 行数       | 208     | **208**         | 0     | `wc -l …/editor/__tests__/EditorTypography.test.tsx`                                  |
| EditorFeaturedImage.test.tsx 行数    | 85      | **85**          | 0     | `wc -l …/editor/__tests__/EditorFeaturedImage.test.tsx`                               |

### 结论

✅ **STABLE** — 所有度量与 R2 记录完全一致，零偏差、零退化。v1-01 ⭐⭐⭐⭐ + v1-02 ⭐⭐⭐⭐⭐ 上游确认后，v1-04 全部 11 项 AC 无变化。六项编辑器排版目标（760px 居中、48px 标题、Lora serif、行高 1.8、Featured Image、48px padding）持续生效。

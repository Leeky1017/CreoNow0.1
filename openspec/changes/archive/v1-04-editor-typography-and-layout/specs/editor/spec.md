# Delta Spec: editor — 编辑器排版与布局对齐设计稿

- **Parent Change**: `v1-04-editor-typography-and-layout`
- **Base Spec**: `openspec/specs/editor/spec.md`
- **GitHub Issue**: 待创建

---

## 变更摘要

编辑器正文区域从当前无约束全宽布局调整为 760px 居中排版，标题 typography 从 `text-4xl`（36px）提升至 `--text-display-*`（48px），新增 serif 字体可选支持和文档特色图片区域。行高和 padding 对齐设计稿规范。

---

## 变更的 Requirement: 富文本编辑器基础排版

Base Spec 中的 Requirement "富文本编辑器基础排版" 做以下变更：

### 删除的行为

无。本次变更为增量扩展，不删除现有行为。

### 新增的行为

#### 正文 max-width 约束

- 编辑器正文容器**必须**设置 `max-width: 760px` 并水平居中（`margin: 0 auto`）
- 宽度值**应当**通过 CSS 变量定义（如 `--editor-content-max-width`），便于后续可配置化
- 宽屏下正文不得撑满容器全宽

#### 标题 typography 规范

- 文档标题（H1）**必须**使用 `--text-display-size`（48px）、`--text-display-weight`（300）、`--text-display-letter-spacing`（-0.03em）、`--text-display-line-height`（1.1）
- 替代当前 Tailwind `text-4xl`（36px）的实现

#### Serif 字体支持

- 编辑器正文**必须**支持 serif 字体（Lora 或等效）作为可选字体族
- 默认字体保持 `--font-family-body`（Inter / sans-serif）不变
- 字体切换通过样式层 CSS 变量控制，切换 UI 由 Settings 模块（v1-07）实现

#### 文档特色图片

- 编辑器顶部**可以**展示文档特色图片（cover image），图片上方叠加 gradient overlay
- 图片数据来源为文档 metadata 中的 `coverImage` 字段
- 如文档无 `coverImage` 则不渲染图片区域（不影响编辑器其他功能）

#### 编辑区域 padding 规范

- 编辑器正文区域的水平 padding **必须**为 40-48px，使用语义间距 token
- 营造设计稿定义的沉浸式书写空间

### 保持不变的行为

以下行为保持 Base Spec 定义，不做修改：

- 正文字体族默认 `--font-family-body`、字号 `--text-editor-size`（16px）
- 正文行高 `--text-editor-line-height`（1.8）——Base Spec 已定义为 1.8，本 change 确保实现对齐
- 所有 inline marks（Bold/Italic/Underline/Strikethrough/Inline Code）
- 所有 block nodes（H1-H3/Lists/Blockquote/Code Block/HR）
- Undo / Redo 历史
- TipTap StarterKit base + Underline 扩展
- 粘贴内容处理（strip unsupported formatting）

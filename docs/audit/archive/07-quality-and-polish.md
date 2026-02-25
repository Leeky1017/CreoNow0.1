# 07 — 质量细节与完善度

> 对应问题：P3-16（语言不一致）、P3-17（Link 硬编码 URL）、P3-18（版本恢复占位）、P3-19（Trace 仅内存）、P3-20（搜索面板缺前端）、P3-21（导出功能缺失）

---

## 一、CN 当前状态逐条分析

### 1.1 语言不一致（P3-16）

全系统存在中英文混杂：

| 位置 | 文件 | 语言 | 内容 |
|------|------|------|------|
| OnboardingPage | `OnboardingPage.tsx` | 中文 | "欢迎使用 CreoNow"、"AI 辅助写作" |
| WelcomeScreen | `WelcomeScreen.tsx` | 英文 | "Welcome to CreoNow"、"Create a local project to start" |
| 编辑器容量警告 | `EditorPane.tsx` | 中文 | "文档已达到 1000000 字符上限" |
| 编辑器 final guard | `EditorPane.tsx` | 英文 | "This document is final. Confirm before editing." |
| 版本预览 banner | `EditorPane.tsx` | 中文 | "正在预览 X 的版本" |
| 版本恢复按钮 | `EditorPane.tsx` | 中文 | "恢复到此版本"、"返回当前版本" |
| 粘贴确认弹窗 | `EditorPane.tsx` | 中文 | "粘贴内容超过文档容量上限" |
| Bubble Menu Link | `EditorBubbleMenu.tsx` | 英文 | "Link" |
| 搜索降级提示 | `hybridRankingService.ts` | 中文 | "语义检索超时，已切换关键词检索" |

**根因**：没有统一的 i18n 策略。部分代码由不同开发者在不同阶段编写，随手用了不同语言。

### 1.2 Link 硬编码 URL（P3-17）

**文件**：`apps/desktop/renderer/src/features/editor/EditorBubbleMenu.tsx`

```typescript
const toggleLink = () => {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  editor.chain().focus().setLink({ href: "https://example.com" }).run();
};
```

点击 Link 按钮直接插入 `https://example.com`，应该弹出输入框让用户输入 URL。

### 1.3 版本恢复按钮是占位（P3-18）

**文件**：`apps/desktop/renderer/src/features/editor/EditorPane.tsx`

```typescript
<Button
  data-testid="preview-restore-placeholder"
  variant="secondary"
  size="sm"
  disabled={true}
  title="将在 version-control-p2 中接入完整恢复流程"
>
  恢复到此版本
</Button>
```

按钮永远 `disabled={true}`，标注等待 P2 阶段实现。这是一个已知的 placeholder，但用户会疑惑为什么按钮存在却不能用。

### 1.4 Generation Trace 仅内存（P3-19）

**文件**：`apps/desktop/main/src/services/memory/memoryTraceService.ts`

`createInMemoryMemoryTraceService` 用 `Map<string, GenerationTrace>` 存储。应用重启后 trace 和 feedback 全部丢失。这意味着：
- 无法回溯 AI 生成内容的来源
- 无法基于历史 feedback 优化未来生成
- 偏好学习的 feedback 链断裂

### 1.5 搜索面板缺前端（P3-20）

后端已实现完整的搜索栈：
- `ftsService.ts`：FTS5 全文搜索（含高亮、锚点、分页）
- `hybridRankingService.ts`：混合排序（FTS + Semantic）
- `semanticChunkIndexService.ts`：语义块索引

但前端没有 SearchPanel 组件。用户无法使用搜索功能。

### 1.6 导出功能缺失（P3-21）

spec 中提及文档导出能力，但代码中未找到任何导出相关的实现（无 export 按钮、无格式转换逻辑、无文件保存对话框）。

---

## 二、业界如何解决

### 2.1 i18n 策略

**Cursor/VS Code 模式**：英文为主，通过 Language Pack 扩展支持其他语言。

**Notion 模式**：根据用户系统语言自动切换，内置多语言支持。

**推荐 CN 模式**：作为中文写作工具，**默认中文**。使用 i18n 框架（如 `react-i18next`）管理所有用户可见文本。

```typescript
// 集中管理的 i18n key
const zh = {
  "editor.capacity_warning": "文档已达到 {limit} 字符上限，建议拆分文档后继续写作。",
  "editor.final_guard": "该文档已定稿。编辑将切换回草稿状态，是否继续？",
  "welcome.title": "欢迎使用 CreoNow",
  "welcome.create_project": "创建项目",
  "welcome.subtitle": "AI 驱动的文字创作 IDE",
  // ...
};
```

### 2.2 Link 编辑弹窗

TipTap 社区的标准实现方式：

```typescript
const toggleLink = () => {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  // 弹出输入框
  const url = window.prompt("输入链接地址", "https://");
  if (url === null || url.trim().length === 0) return;
  editor.chain().focus().setLink({ href: url }).run();
};
```

更好的方案是用一个 inline popover 替代 `window.prompt`，与 Bubble Menu 风格一致。

### 2.3 搜索面板 — Notion/VS Code 模式

**VS Code 搜索面板**：
- `Cmd+Shift+F` 打开全局搜索
- 实时搜索结果预览
- 文件分组展示
- 点击结果跳转到编辑器对应位置
- 支持正则、大小写、全字匹配

**Notion 搜索**：
- `Cmd+P` 打开快速搜索
- 混合搜索：页面标题 + 内容全文
- 最近访问页面优先展示
- 搜索结果高亮关键词

### 2.4 文档导出 — Sudowrite/Scrivener 模式

**Sudowrite**：
- Export as DOCX / PDF / TXT / Markdown
- 支持自定义格式化（字体、间距、页边距）
- 可选是否包含注释/批注

**Scrivener**（专业写作工具标杆）：
- Compile 功能：将多个文档按顺序合并导出
- 支持格式：DOCX / PDF / ePub / HTML / RTF / Markdown
- 编译预设：手稿格式 / 出版格式 / 投稿格式
- 前置/后置内容：自动添加标题页、目录、版权页

---

## 三、CN 应该怎么做

### 3.1 i18n 基础设施

```bash
pnpm add react-i18next i18next --filter @creonow/desktop
```

创建 `renderer/src/i18n/` 目录：
```
i18n/
├── index.ts         — i18next 初始化
├── zh.ts            — 中文翻译
└── en.ts            — 英文翻译（可选，后续添加）
```

所有用户可见的文本都通过 `t('key')` 引用，不再硬编码。

### 3.2 搜索面板基础实现

```
┌─ 搜索 ──────────────────────────┐
│  🔍 [搜索文档内容...          ] │
│                                  │
│  第一章.md (3 处匹配)            │
│    ...林默走进了**长安**城...     │
│    ...**长安**的夜色格外...       │
│    ...回到**长安**后他...         │
│                                  │
│  世界观设定.md (1 处匹配)        │
│    ...**长安**城位于帝国...       │
│                                  │
│  共 4 处匹配                     │
└──────────────────────────────────┘
```

已有 `ftsService.ts` 提供了搜索、高亮范围、锚点——只需创建前端组件消费这些数据。

### 3.3 文档导出基础实现

初期支持最常用的格式：

| 格式 | 实现方式 | 优先级 |
|------|---------|--------|
| **Markdown** | TipTap `editor.storage.markdown.getMarkdown()` 或自定义序列化 | P0 |
| **纯文本** | `editor.getText()` | P0 |
| **DOCX** | `docx` npm 包（纯 JS，无外部依赖） | P1 |
| **PDF** | `@react-pdf/renderer` 或 Electron `webContents.printToPDF` | P2 |
| **HTML** | `editor.getHTML()` + 样式模板 | P1 |

### 3.4 版本恢复

当前按钮已在 UI 中，只是 `disabled={true}`。实现路径：

1. `versionStore` 增加 `restoreVersion(snapshotId)` action
2. 调用后端 IPC 获取快照内容
3. 将快照内容设置为文档当前内容
4. 触发一次 autosave（标记为 `actor: "restore", reason: "version-restore"`）
5. 退出预览模式

---

## 四、实施优先级

| 步骤 | 内容 | 工作量 | 影响 |
|------|------|--------|------|
| 1 | i18n 基础设施 + 迁移所有硬编码文本 | 2d | 品质一致性 |
| 2 | Link 输入弹窗修复 | 0.5d | 功能修复 |
| 3 | 搜索面板前端组件 | 2d | 功能闭环 |
| 4 | Markdown/TXT 导出 | 1d | 核心需求 |
| 5 | DOCX/HTML 导出 | 1.5d | 进阶需求 |
| 6 | 版本恢复实现 | 1.5d | 功能完善 |
| 7 | Generation trace 持久化 | 1.5d | 数据不丢失 |

**总计约 10 天**。步骤 1 的 i18n 应尽早进行，因为随着代码增长问题会越来越难修。步骤 4 的导出是用户基本需求。

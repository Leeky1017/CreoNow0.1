# A0-10 基础全文搜索入口

- **GitHub Issue**: #1003
- **所属任务簇**: P0-6（基础输入输出防线）
- **涉及模块**: search-and-retrieval
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户想在项目中搜索关键词，但按下 `Cmd/Ctrl+Shift+F`（几乎所有创作/编辑类工具的全局搜索标准快捷键）后，什么都没有发生。唯一找到搜索入口的方式是从左侧 IconBar 中找到搜索图标点击——发现性极差。对于一个文字创作 IDE，「搜索找不到」本身就是伤害。更进一步，即便用户通过 IconBar 打开了 SearchPanel，点击搜索结果后也无法跳转到对应文档——搜索结果是死链。

### 2. 根因

两个断裂点：

1. **快捷键未绑定**：`shortcuts.ts` 的 `LAYOUT_SHORTCUTS` 中没有 `Cmd/Ctrl+Shift+F` 条目，`surfaceRegistry.ts` 中 `searchPanel` 的 `entryPoints` 只有 `iconBar`，缺少 `shortcut` 类型入口。设计规范 `06-shortcuts.md` 明确定义了此快捷键，主规范 `search-and-retrieval/spec.md` 也声明了此入口——但代码层从未实现。
2. **结果跳转未接线**：SearchPanel 的搜索结果点击事件未连接到文档加载与定位逻辑。主规范 Scenario「用户点击搜索结果跳转」描述的行为（加载目标文档、滚动到匹配位置、关键词闪烁高亮）在前端未实现。

### 3. v0.1 威胁

- **基础能力缺位**：搜索是文字创作工具的原始能力，快捷键缺失意味着 v0.1 的"可用性"声明不成立
- **后端浪费**：FTS 后端（SQLite FTS5 索引、`search:fts:query` IPC 通道）已实现且有完整测试，但前端入口断线导致整条链路对用户不可达
- **体验落差**：竞品（Scrivener、Ulysses、Obsidian）均支持 `Cmd+Shift+F` 全局搜索，用户迁移后第一个本能反应就是按这个快捷键

### 4. 证据来源

| 文档                                                    | 章节               | 内容                                           |
| ------------------------------------------------------- | ------------------ | ---------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`                   | §5.2               | 搜索入口 `Cmd/Ctrl+Shift+F` 列为 v0.1 必修项   |
| `docs/audit/amp/02-*`                                   | §1.2               | 前端交互断线清单：搜索快捷键未绑定             |
| `design/system/06-shortcuts.md`                         | 编辑器快捷键表     | `全局搜索 → Cmd+Shift+F / Ctrl+Shift+F` 已定义 |
| `openspec/specs/search-and-retrieval/spec.md`           | FTS 搜索入口       | 明确列出 `Cmd/Ctrl+Shift+F` 为专用搜索面板入口 |
| `apps/desktop/renderer/src/config/shortcuts.ts`         | `LAYOUT_SHORTCUTS` | 无 `globalSearch` 条目                         |
| `apps/desktop/renderer/src/surfaces/surfaceRegistry.ts` | `searchPanel`      | `entryPoints` 仅含 `iconBar`，缺少 `shortcut`  |

---

## What Changes（具体做什么）

1. **注册全局搜索快捷键**：在 `shortcuts.ts` 的 `LAYOUT_SHORTCUTS` 中新增 `globalSearch: defineShortcut("globalSearch", "Global Search", "mod+Shift+F")`
2. **绑定快捷键到 SearchPanel**：在全局键盘事件监听器中，`Cmd/Ctrl+Shift+F` 触发时切换左侧面板至 SearchPanel 并聚焦搜索输入框
3. **更新 surfaceRegistry**：在 `searchPanel` 的 `entryPoints` 中新增 `{ type: "shortcut", description: "Cmd/Ctrl+Shift+F" }`
4. **实现搜索结果点击跳转**：点击搜索结果项后，加载对应文档到编辑器，滚动到匹配位置
5. **搜索输入框自动聚焦**：通过快捷键打开 SearchPanel 后，搜索输入框自动获得焦点，用户可立即输入
6. **i18n 覆盖**：搜索相关 UI 文案（输入框 placeholder、无结果提示等）通过 `t()` 获取

---

## Scope（涉及范围）

- **主规范**: `openspec/specs/search-and-retrieval/spec.md`
- **涉及源码文件**:
  - `apps/desktop/renderer/src/config/shortcuts.ts`（修改：新增 `globalSearch` 快捷键定义）
  - `apps/desktop/renderer/src/surfaces/surfaceRegistry.ts`（修改：补充 `searchPanel` 入口）
  - `apps/desktop/renderer/src/features/search/`（修改：搜索结果点击处理、输入框聚焦）
  - 全局键盘事件监听器（修改：新增快捷键注册）
- **所属任务簇**: P0-6（基础输入输出防线）
- **前置依赖**: 无——FTS 后端与 SearchPanel UI 已存在
- **下游影响**: 为后续语义搜索入口（Scenario 已在主规范中定义）铺设可复用的快捷键与面板切换机制

---

## Non-Goals：不做什么

1. **不实现语义搜索 / 向量搜索**——本变更仅覆盖 FTS 全文检索入口，语义搜索模式切换属于独立功能
2. **不改动 FTS 后端逻辑**——SQLite FTS5 索引、`search:fts:query` IPC 通道已实现且有测试覆盖，本变更仅修前端入口断线
3. **不实现搜索替换（Find & Replace）功能**——全局搜索替换是独立特性，不在本次范围
4. **不实现搜索历史记录与收藏**——v0.1 不需要搜索历史持久化
5. **不修改 SearchPanel 的视觉样式**——现有 SearchPanel 组件样式已满足需求，本变更只做接线不做重构
6. **不实现跨项目搜索**——v0.1 搜索范围限定在当前项目内

---

## 依赖与影响

- **无上游依赖**：可独立实施
- **受益模块**: workbench（快捷键系统完整性）、editor（文档跳转链路）

# A0-02 自动保存失败可见化

- **GitHub Issue**: #992
- **所属任务簇**: P0-2（失败可见与错误人话化）
- **涉及模块**: document-management
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户在 CreoNow 中编辑文档时，自动保存在后台静默运行。一旦保存失败——磁盘写满、SQLite 锁冲突、IPC 超时——用户毫无感知。更危险的是：用户此时切换文档或关闭项目，误以为内容已安全落盘，实际上最近几分钟的创作已丢失。这是一个「信任全凭侥幸」的局面——"在流沙上写字，却以为刻在了石头上。"

### 2. 根因

`useAutosave.ts` 中两处 `void save(...)` 调用（定时触发与 cleanup flush），均未消费 `save()` 返回的 Promise 结果。`editorStore.tsx` 的 `executeSave` 虽然已在内部将 `autosaveStatus` 设为 `"error"` 并记录 `autosaveError`，但：

- **状态栏无视觉映射**：`StatusBar.tsx` 未读取 `autosaveStatus === "error"` 状态，用户看不到任何失败指示
- **无 Toast 通知**：保存失败未触发 Toast，用户无即时警告
- **无重试透出**：`retryLastAutosave()` 已在 store 中实现，但无 UI 入口可调用
- **cleanup 路径完全静默**：文档切换时的 flush save 失败后，错误被吞没——用户已离开当前文档，回来时内容已丢

### 3. v0.1 威胁

- **数据丢失**：创作者可能丢失数分钟甚至整段创作内容，v0.1 不可接受
- **信任崩塌**：一次静默丢字足以让用户转投竞品——创作工具的第一信条就是「不丢字」
- **可见性断裂**：autosave 状态已在 store 中跟踪（`"idle" | "saving" | "saved" | "error"`），但未投射到任何用户可见 UI，形成「有数据无表达」的断层

### 4. 证据来源

| 文档                                                        | 章节              | 内容                                                                                                                   |
| ----------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`                       | §4.2 可信度必修项 | "自动保存收尾是 `void save(...)`，切换文档时可能静默丢字——异步保存失败无反馈——增加失败可见性、重试、状态栏/Toast 提醒" |
| `docs/audit/amp/03-engineering-and-architecture-roadmap.md` | §二 隐性风险总表  | "自动保存收尾使用 `void save(...)`——切文档/切项目时可能静默失败——先做——必须让失败可见，加入重试与状态反馈"             |
| `docs/audit/amp/08-backend-module-health-audit.md`          | §4.5 Autosave     | "`void save(...)` 静默失败——`useAutosave.ts`：save 失败时错误仅进 console，用户无感知——先做（A0-02，已在 backlog）"    |

---

## What：做什么

1. **状态栏保存状态可视化**：在 `StatusBar` 中根据 `autosaveStatus` 显示四种状态指示（idle / saving / saved / error），error 状态以醒目色标提示并提供重试入口
2. **失败 Toast 通知**：自动保存失败时触发 `error` variant 的 Toast，告知用户保存未成功，并附带重试按钮
3. **重试机制透出**：将 `editorStore.retryLastAutosave()` 通过状态栏点击和 Toast action 两个入口暴露给用户
4. **Cleanup flush 失败可见化**：文档切换时的 flush save 若失败，在新文档上下文中追加一条 warning Toast，提示上一文档保存未完成

---

## Non-Goals：不做什么

1. **不实现离线保存队列或本地缓存兜底**——v0.1 不做离线模式；失败后提示用户重试即可，不做自动排队持久化到本地磁盘
2. **不修改自动保存的 debounce 策略（500ms）或触发时机**——本任务只做「失败后可见」，不改保存时机
3. **不实现保存冲突（乐观锁）的 UI 解决流程**——冲突解决机制属于 document-management spec 的 `DOCUMENT_SAVE_CONFLICT` 场景，本任务只处理非冲突类保存失败的可见性
4. **不修改后端 `documentCoreService` 的保存逻辑**——本任务限于渲染进程的 UI 层反馈，不涉及主进程保存链路
5. **不实现保存历史或失败日志面板**——v0.1 仅提供即时通知，不保留失败记录供回溯

---

## 依赖与影响

- **上游依赖**: A0-13（Toast 接入 App）——Toast 通知基础设施须先就绪，本任务的 Toast 通知才有通道可用
- **被依赖于**: 无直接下游依赖
- **受益于**: A0-20（错误消息人话化）——保存失败的 Toast 描述可调用 `getHumanErrorMessage()` 获取用户友好文案；但本任务可先用静态 i18n key，A0-20 完成后再替换为动态映射

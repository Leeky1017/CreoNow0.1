# AI 聊天历史持久化

- **GitHub Issue**: 待创建（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: ai-service
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

用户能看到历史入口，却在刷新后失去上下文，搜索框也无法使用。

### 2. 根因

会话列表、消息摘要和检索入口未形成本地持久化闭环，UI 入口停留在占位态。

### 3. 风险 / 威胁

AI 对话的连续性与可信度不足，用户无法把 CreoNow 当成长期协作工具。

---

## What：这条 change 要完成什么

1. 持久化会话元数据与消息历史，并按项目隔离读取
2. 让 ChatHistory 列表、搜索框、历史选择回放真正可用
3. 定义历史删除 / 新建会话 / 恢复会话的最小交互闭环

---

## Non-Goals：不做什么

1. 不在本 change 中实现云同步
2. 不在本 change 中重写 AI 面板整体布局

---

## 依赖与影响

- 依赖当前 AI store / IPC 合同保持稳定
- 与 settings / project scope 行为保持一致

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/ai/`
- `apps/desktop/main/src/ipc/`
- `apps/desktop/renderer/src/features/ai/`

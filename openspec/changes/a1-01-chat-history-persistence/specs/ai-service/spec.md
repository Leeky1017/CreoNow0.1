# Delta Spec: ai-service — AI 聊天历史持久化

## 新增 Requirement: AI 聊天历史持久化

系统**必须**补齐当前处于未实现或受限状态的 `AI 聊天历史持久化` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 持久化会话元数据与消息历史，并按项目隔离读取
- 让 ChatHistory 列表、搜索框、历史选择回放真正可用
- 定义历史删除 / 新建会话 / 恢复会话的最小交互闭环

### Scenarios

#### Scenario: 恢复历史会话

- GIVEN 用户已有历史会话；WHEN 重启应用并重新打开 AI 面板；THEN 历史列表可见且选择后恢复对应对话上下文

#### Scenario: 搜索历史会话

- GIVEN 用户已有多条历史；WHEN 在 ChatHistory 搜索框输入关键词；THEN 列表按关键词过滤且结果可点击恢复

### Non-Goals

- 不在本 change 中实现云同步
- 不在本 change 中重写 AI 面板整体布局

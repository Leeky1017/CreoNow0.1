# # CN 全库反模式审计总报告

> Source: Notion local DB page `307f5ddf-267f-80ec-8a43-f2d2efa8876e`

## 审计范围与时间

- 审计对象：`apps/` 下全部源码（重点 `.ts/.tsx/.css/.json`）

- 排除目录：`node_modules/`、`dist/`、`build/`

- 审计模式：A1-A7 七个专项子代理并行只读审计

- 审计时间（CST）：2026-02-14 00:40 - 2026-02-14 01:10

- 代码变更策略：仅产出审计文档，不修改业务代码

## 各子代理汇总统计

| 子代理 | 领域 | 扫描文件数 | 问题总数 | Critical | High | Medium | Low |

| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |

| A1 | 代码膨胀 | 666 | 10 | 0 | 4 | 4 | 2 |

| A2 | 行为偏差 | 694 | 10 | 0 | 4 | 4 | 2 |

| A3 | 质量陷阱 | 664 | 6 | 1 | 2 | 2 | 1 |

| A4 | 安全与规范 | 664 | 5 | 0 | 2 | 1 | 2 |

| A5 | 架构合规 | 661 | 8 | 1 | 3 | 2 | 2 |

| A6 | 健壮性 | 661 | 9 | 0 | 3 | 4 | 2 |

| A7 | 可维护性 | 664 | 1631 | 223 | 328 | 1076 | 4 |

| **总计** |  |  | **1679** | **225** | **346** | **1093** | **15** |

> 说明：A7 包含规则命中型统计（同文件可多命中），因此总量显著高于其余代理。

## Top 10 最紧急问题（跨子代理）

1. **A3-C-001**：空内容请求伪造 `queued` 成功响应（`kgRecognitionRuntime`）

2. **A5-C-001**：Context 装配与 fetcher 形成循环依赖闭环

3. **A4-H-002**：IPC 缺少调用方身份/来源鉴权（高权限通道可被越权调用）

4. **A4-H-001**：Electron `sandbox: false` 不安全默认

5. **A6-H-003**：KG 面板异步写入不校验结果，前后端状态可分叉

6. **A6-H-001**：窗口加载 Promise 未兜底，失败链断裂

7. **A2-H-001**：context 组装异常被静默吞掉，行为降级不可观测

8. **A2-H-002**：metadata 解析失败即清空回写，存在隐性数据丢失风险

9. **A7-C-001**：`createDocumentService` 超长高复杂度（1743 行）

10. **A7-C-002**：`createAiService` 超长高复杂度（1460 行）

## 模块维度问题热力图

统计口径：按 A1-A7 明细问题（含 A7 已列明 19 项）映射到主模块。

| 模块 | 问题数 | 热度 |

| --- | ---: | --- |

| Workbench | 15 | 🔥 高 |

| KG | 12 | 🔥 高 |

| AI Service | 12 | 🔥 高 |

| IPC | 8 | 🟠 中高 |

| Skill | 6 | 🟠 中 |

| Document | 5 | 🟠 中 |

| VC | 4 | 🟡 中低 |

| Context | 2 | 🟡 中低 |

| Search | 2 | 🟡 中低 |

| Memory | 1 | 🟢 低 |

## 建议修复 Sprint 排期（3 批次）

### 批次 1（P0，立即）

- 修复错误语义与安全边界：A3-C-001、A5-C-001、A4-H-001、A4-H-002

- 稳定关键异步链路：A6-H-001、A6-H-002、A6-H-003

- 启动核心超大函数拆分设计：A7-C-001、A7-C-002、A7-C-003

### 批次 2（P1，高优）

- 收敛 fallback/降级链：A2-H-001~A2-H-004

- 打散 God Object 与循环依赖：A5-H-001~A5-H-003

- 清理硬编码阈值与深层相对路径：A7-H-007~A7-H-012

### 批次 3（P2-P3，治理债务）

- 修复测试可信度问题：A3-M-001、A3-M-002、A3-L-001

- 收敛风格漂移与僵尸路径：A1-M/L、A4-L、A5-L

- 执行可维护性系统治理：A7-M/L + A7 模式统计项（超长函数、复杂度、import 图）

## 交付物清单

- `CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md`

- `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md`

- `CN-Code-Audit-2026-02-14/A3-质量陷阱审计.md`

- `CN-Code-Audit-2026-02-14/A4-安全与规范审计.md`

- `CN-Code-Audit-2026-02-14/A5-架构合规审计.md`

- `CN-Code-Audit-2026-02-14/A6-健壮性审计.md`

- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md`

- `CN-Code-Audit-2026-02-14/99-修复优先级排序.md`

```
# CN 修复优先级排序（P0 → P3）

## P0（立即修复）
| 序号 | 关联编号 | 修复项 | 预估工作量 |
| --- | --- | --- | --- |
| 1 | A3-C-001 | 修复空内容请求伪造 `queued` 成功响应（改为真实 no-op/错误语义） | M |
| 2 | A5-C-001 | 打断 Context 装配链路循环依赖（抽离类型与工具层） | L |
| 3 | A4-H-002 | 为 IPC 增加调用方身份与来源 ACL 鉴权 | L |
| 4 | A4-H-001 | 启用 Electron sandbox 安全默认并回归验证 | M |
| 5 | A6-H-003 | KG 面板异步写入改为结果校验 + allSettled 一致性处理 | M |
| 6 | A6-H-001 | 窗口加载 Promise 统一兜底并建立错误上报链 | S |
| 7 | A7-C-001 | 拆分 `createDocumentService`（1743 行） | XL |
| 8 | A7-C-002 | 拆分 `createAiService`（1460 行） | XL |
| 9 | A7-C-003 | 拆分 `createKnowledgeGraphService`（1378 行） | XL |
| 10 | A7-C-004 | 拆分 `registerContextIpcHandlers`（953 行） | XL |
| 11 | A7-C-005 | 拆分 `FileTreePanel`（864 行） | L |
| 12 | A7-C-006 | 拆分 `AiPanel`（1254 行） | XL |

## P1（高优先级）
| 序号 | 关联编号 | 修复项 | 预估工作量 |
| --- | --- | --- | --- |
| 1 | A2-H-001 | context 组装异常可观测化，禁用静默吞错 | M |
| 2 | A2-H-002 | metadata 解析失败禁止清空回写 | M |
| 3 | A2-H-003 | KG Panel 解析失败链路改为 fail-fast + 诊断 | M |
| 4 | A2-H-004 | skill 目录读取失败改为结构化错误返回 | S |
| 5 | A3-H-001 | skillScheduler 聚合 response/completion 并保留异常上下文 | M |
| 6 | A3-H-002 | KG metrics 拆分 succeeded/failed/completed 计数 | S |
| 7 | A5-H-001 | RightPanel/AiPanel 循环依赖拆解（抽 context） | M |
| 8 | A5-H-002 | DocumentService 按职责拆分（架构层） | XL |
| 9 | A5-H-003 | AIService 按职责拆分（架构层） | XL |
| 10 | A6-H-002 | `app.whenReady()` 顶层初始化链统一 catch | S |
| 11 | A7-H-007 | 共享契约导入改 alias，消除深层相对路径（main） | M |
| 12 | A7-H-008 | 共享契约导入改 alias，消除深层相对路径（renderer） | M |
| 13 | A7-H-009 | IPC payload 上限硬编码迁移到集中配置 | S |
| 14 | A7-H-010 | AI 超时/重试/token 预算集中配置治理 | M |
| 15 | A7-H-011 | KG 查询超时常量配置化 | S |
| 16 | A7-H-012 | RAG `maxTokens` 配置化并与预算中心对齐 | S |
| 17 | A1-H-001 | Settings 账户入口未实现逻辑下线或禁用 | S |
| 18 | A1-H-002 | VersionListItem 类型定义收敛单源 | S |
| 19 | A1-H-003 | judge:model:ensure 共享状态机实现收敛 | M |
| 20 | A1-H-004 | Version wordChange 占位值改真实计算或下线 | M |

## P2（中优先级）
| 序号 | 关联编号 | 修复项 | 预估工作量 |
| --- | --- | --- | --- |
| 1 | A1-M-001 | 移除生产组件中的 demo 控制参数（AiInlineConfirm） | S |
| 2 | A1-M-002 | 移除生产组件中的重试成功开关（AiErrorCard） | S |
| 3 | A1-M-003 | 压缩 barrel 模板注释，示例迁移 Storybook | S |
| 4 | A1-M-004 | 去除无收益一行包装函数 | S |
| 5 | A2-M-001 | Context fetcher 降级 warning 增加错误摘要 ID | S |
| 6 | A2-M-002 | executionId/runId 双字段兼容治理（弃用策略） | M |
| 7 | A2-M-003 | id/skillId 双字段兼容治理（弃用策略） | M |
| 8 | A2-M-004 | 删除 ping handler 不可达 catch | S |
| 9 | A3-M-001 | 固定 sleep 异步测试改条件等待 | M |
| 10 | A3-M-002 | story 测试增加行为断言（非存在性断言） | S |
| 11 | A4-M-001 | debug IPC 通道生产禁用/加门禁 | S |
| 12 | A5-M-001 | service 领域错误与 IPC 错误映射解耦 | M |
| 13 | A5-M-002 | 全库深层相对路径导入收敛到统一 alias | L |
| 14 | A6-M-001 | MemoryPanel 加强异常处理并闭环 UI 错误态 | S |
| 15 | A6-M-002 | kgStore 引入 requestId 防止项目切换竞态 | M |
| 16 | A6-M-003 | searchStore 引入 abort/request stamp 防竞态覆盖 | M |
| 17 | A6-M-004 | skillScheduler 完整错误传播与日志上下文 | S |
| 18 | A7-M-013 | main 入口 import 扇入治理与注册器拆分 | M |
| 19 | A7-M-014 | AppShell 扇入治理（facade 化） | M |
| 20 | A7-M-015 | integration test 去 renderer 内部依赖 | M |
| 21 | A7-M-016 | integration test 去 main 内部实现耦合 | M |

## P3（Backlog）
| 序号 | 关联编号 | 修复项 | 预估工作量 |
| --- | --- | --- | --- |
| 1 | A1-L-001 | 清理未使用占位参数 `onScrollSync` | S |
| 2 | A1-L-002 | 下线 deprecated 面板双轨样式路径 | S |
| 3 | A2-L-001 | AppShell 默认值降级路径增加可观测诊断 | S |
| 4 | A2-L-002 | contextRules 非法输入与空规则语义分离 | S |
| 5 | A3-L-001 | 测试断言从布尔判定升级为精确断言 | S |
| 6 | A4-L-001 | DocumentService 错误处理风格统一 | M |
| 7 | A4-L-002 | 技术栈文档与依赖清单治理同步 | S |
| 8 | A5-L-001 | features 命名规范统一并引入 lint 规则 | M |
| 9 | A5-L-002 | BOM 清理并强制 UTF-8 无 BOM | S |
| 10 | A6-L-001 | preload IPC listener 生命周期释放机制 | S |
| 11 | A6-L-002 | popover 关闭定时器清理 | S |
| 12 | A7-L-017 | Settings 账户流程 TODO 任务化闭环 | S |
| 13 | A7-L-018 | Version word diff TODO 闭环 | S |
| 14 | A7-L-019 | Windows 键盘事件 TODO 闭环 | M |

## 备注
- 本清单按风险和治理收益排序，优先执行 P0/P1。
- A7 的 1631 项命中包含模式统计型问题；若进入治理实施，建议先从 P0/P1 对应的架构拆分与配置集中化开始，随后批量清理 P2/P3。
```

```
# [A1代码膨胀审计员] 审计报告

## 审计摘要
- 扫描文件数：666
- 发现问题总数：10
- 严重（Critical）：0 | 高危（High）：4 | 中危（Medium）：4 | 低危（Low）：2

## 🔴 严重问题（Critical）
- 本轮未发现 Critical 级别问题。

## 🟠 高危问题（High）
### [A1-H-001] 设置账户操作入口为僵尸代码
- 文件：`apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`
- 行号/范围：L195-L203
- 问题类型：死代码/僵尸代码（空实现占位）
- 描述：账户操作回调是空函数体，仅保留 TODO，占位逻辑已进入主路径 UI。
- 代码片段：
```tsx
<SettingsAccount
  account={accountSettings}
  onUpgrade={() => {
    // TODO: Implement upgrade flow when account system is ready
  }}
  onDeleteAccount={() => {
    // TODO: Implement delete account when account system is ready
  }}
/>
```
- 风险：用户触发关键操作无效果，形成“可点击但无行为”的僵尸入口。
- 建议修复：移出主路径或显式禁用入口；未实现前返回可观测错误状态并记录。
- 优先级：P0

### [A1-H-002] Version 类型定义重复链路
- 文件：`apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx`
- 行号/范围：L17-L24
- 问题类型：重复链路/冗余逻辑（重复类型定义）
- 描述：`VersionListItem` 在容器层和 store 层重复定义，结构一致，存在漂移风险。
- 代码片段：
```ts
type VersionListItem = {
  versionId: string;
  actor: "user" | "auto" | "ai";
  reason: string;
  contentHash: string;
  wordCount: number;
  createdAt: number;
};
```
- 风险：任一侧字段变更会出现“编译可过但运行契约不一致”。
- 建议修复：收敛到单一类型源并统一引用。
- 优先级：P1

### [A1-H-003] Judge 模型确保流程双实现
- 文件：`apps/desktop/renderer/src/features/settings/JudgeSection.tsx`
- 行号/范围：L49-L70
- 问题类型：重复链路/冗余逻辑（同一业务流双实现）
- 描述：`judge:model:ensure` 的状态机（busy、防重入、downloading、error 映射）在两个模块重复实现。
- 代码片段：
```ts
if (ensureBusy) {
  return;
}
setEnsureBusy(true);
setJudgeError(null);
setJudgeState({ status: "downloading" });

try {
  const res = await invoke("judge:model:ensure", {});
```
- 风险：后续修复/增强很容易只改一处，导致 UI 行为不一致。
- 建议修复：抽成共享 hook/服务，统一错误映射与状态迁移。
- 优先级：P1

### [A1-H-004] VersionHistory 固定占位字段长期存在
- 文件：`apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx`
- 行号/范围：L154-L161
- 问题类型：死代码/僵尸逻辑（硬编码占位）
- 描述：`wordChange` 固定为 `none/0`，并带 TODO，导致字段长期无真实语义。
- 代码片段：
```ts
const entry: VersionEntry = {
  id: item.versionId,
  timestamp: formatTimestamp(item.createdAt),
  authorType: mapActorToAuthorType(item.actor),
  authorName: getAuthorName(item.actor),
  description: getDescription(item.reason),
  wordChange: { type: "none", count: 0 }, // TODO: calculate actual word diff
```
- 风险：下游 UI/分析依赖该字段时会得到系统性错误信息。
- 建议修复：实现真实 diff 或在契约层移除该字段直到可用。
- 优先级：P1

## 🟡 中危问题（Medium）
### [A1-M-001] 演示参数侵入生产组件
- 文件：`apps/desktop/renderer/src/components/features/AiDialogs/AiInlineConfirm.tsx`
- 行号/范围：L263-L274
- 问题类型：辅助函数滥用/过度抽象
- 描述：`simulateDelay`/`initialState` 等演示参数进入正式组件行为路径。
- 代码片段：
```tsx
initialState = "pending",
simulateDelay = 800,
...
await new Promise((resolve) => setTimeout(resolve, simulateDelay));
```
- 风险：生产交互被人为延迟参数污染，增加行为不确定性与测试复杂度。
- 建议修复：将 demo 控制下沉到 stories/fixtures，生产组件只保留业务参数。
- 优先级：P2

### [A1-M-002] ErrorCard 内置重试成功开关
- 文件：`apps/desktop/renderer/src/components/features/AiDialogs/AiErrorCard.tsx`
- 行号/范围：L532-L535, L616-L621
- 问题类型：辅助函数滥用/过度抽象
- 描述：`retryWillSucceed` 在生产组件内控制重试结果，属于测试/演示分支外泄。
- 代码片段：
```tsx
simulateDelay = 1500,
retryWillSucceed = true,
...
await new Promise((resolve) => setTimeout(resolve, simulateDelay));
if (retryWillSucceed) {
  setRetryState("success");
```
- 风险：真实错误处理路径被伪分支覆盖，线上行为与真实后端脱节。
- 建议修复：将结果注入改为外部回调结果，不在组件内部硬编码成功开关。
- 优先级：P2

### [A1-M-003] Barrel 文件注释模板化堆叠
- 文件：`apps/desktop/renderer/src/components/features/AiDialogs/index.ts`
- 行号/范围：L1-L41
- 问题类型：注释泛滥
- 描述：barrel 文件含大段说明与示例，信息密度低且维护成本高。
- 代码片段：
```ts
/**
 * AI Dialogs - Components for AI interaction and system feedback
 * ...
 * @example
 * ```tsx
 * import { AiInlineConfirm, AiDiffModal, AiErrorCard, SystemDialog } ...
```
- 风险：文档与真实导出漂移时误导调用方，增加审阅噪音。
- 建议修复：barrel 文件保留最小注释，示例迁移至 Storybook/独立文档。
- 优先级：P2

### [A1-M-004] 一行转发包装函数
- 文件：`apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts`
- 行号/范围：L275-L277
- 问题类型：辅助函数滥用/过度抽象
- 描述：`service()` 仅转发 `createKnowledgeGraphService(...)`，增加无收益中间层。
- 代码片段：
```ts
function service() {
  return createKnowledgeGraphService({ db: args.db, logger: args.logger });
}
```
- 风险：调用栈与阅读路径变长，后续重构易形成更多包装叠加。
- 建议修复：直接注入或缓存 service 实例，去除一次性转发函数。
- 优先级：P2

## 🔵 低危问题（Low）
### [A1-L-001] 未使用参数占位
- 文件：`apps/desktop/renderer/src/features/outline/OutlinePanel.tsx`
- 行号/范围：L602-L604
- 问题类型：死代码/僵尸代码
- 描述：`onScrollSync` 仅以 `_onScrollSync` 占位并关闭 lint，当前无实际调用。
- 代码片段：
```tsx
// onScrollSync is provided for future editor integration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
onScrollSync: _onScrollSync,
```
- 风险：接口面膨胀，调用方误以为该能力已生效。
- 建议修复：若未上线则从 props 移除；若保留需补最小可用行为与测试。
- 优先级：P3

### [A1-L-002] Deprecated 路径疑似长期双轨
- 文件：`apps/desktop/renderer/src/features/quality-gates/QualityGatesPanel.tsx`
- 行号/范围：L283-L287
- 问题类型：死代码/僵尸代码（疑似）
- 描述：标注 `@deprecated` 的 standalone 容器样式仍在主文件持续维护。
- 代码片段：
```ts
/**
 * Legacy panel styles - includes container styles for standalone use.
 * @deprecated Use QualityGatesPanelContent with layout containers instead.
 */
const panelStyles = [
```
- 风险：长期双轨实现增加维护面，容易引入样式/行为漂移。
- 建议修复：确认调用面后下线 deprecated 路径，仅保留 content 组件。
- 优先级：P3

## 模式统计
- 注释密度≥30% 的文件：39
- `TODO:` 命中：4
- `@deprecated` 命中：3
- 装饰性分隔注释（`// ===...`）命中：1047
- 生产代码中“演示控制参数”（`simulateDelay/retryWillSucceed/...`）命中：30
- 非 test/story 的重复类型命名（同名 type/interface）命中：41
- 已确认僵尸参数：1
- 已确认重复业务链路：2
```

```
# [A2行为偏差审计员] 审计报告

## 审计摘要
- 扫描文件数：694
- 发现问题总数：10
- 严重（Critical）：0 | 高危（High）：4 | 中危（Medium）：4 | 低危（Low）：2

## 🔴 严重问题（Critical）
- 本轮未发现 Critical 级别问题。

## 🟠 高危问题（High）
### [A2-H-001] Context 组装异常被静默吞掉
- 文件：`apps/desktop/main/src/services/skills/skillExecutor.ts`
- 行号/范围：L250-L261
- 问题类型：过度防御性降级/保守回退
- 描述：上下文组装异常被直接吞掉，仅注释说明 best-effort，无日志、无告警透传。
- 代码片段：
```ts
try {
  const assembled = await assembleContextPrompt(...);
  if (assembled && assembled.prompt.trim().length > 0) {
    contextPrompt = assembled.prompt;
  }
} catch {
  // Context is best-effort ...
}
```
- 风险：真实故障会被静默降级为无上下文执行，输出质量漂移且难排查。
- 建议修复：记录结构化 warning（executionId/skillId），并在 diagnostics 标记 `context_degraded`。
- 优先级：P1

### [A2-H-002] metadata 解析失败即清空回写
- 文件：`apps/desktop/renderer/src/features/kg/kgToGraph.ts`
- 行号/范围：L228-L243
- 问题类型：过度 fallback 链
- 描述：`metadataJson` 解析失败后直接 `metadata = {}` 并回写，属于失败即清空式回退。
- 代码片段：
```ts
try {
  metadata = JSON.parse(currentMetadataJson) as Record<string, unknown>;
} catch {
  metadata = {};
}
const ui = (metadata.ui as Record<string, unknown>) ?? {};
ui.position = position;
metadata.ui = ui;
return JSON.stringify(metadata);
```
- 风险：异常输入下可能覆盖原 metadata，形成隐性数据丢失。
- 建议修复：解析失败时拒绝写入并显式报错/提示，或保留原始值。
- 优先级：P1

### [A2-H-003] KG Panel 存在多层清空 fallback 链
- 文件：`apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx`
- 行号/范围：L50-L55, L63-L66
- 问题类型：过度 fallback 链
- 描述：metadata 解析失败返回 `{}`，后续直接写 timeline，形成多层“清空后再写”。
- 代码片段：
```ts
function parseMetadataJson(metadataJson: string): Record<string, unknown> {
  try { return JSON.parse(metadataJson) as Record<string, unknown>; }
  catch { return {}; }
}
const timeline = (metadata.timeline as Record<string, unknown>) ?? {};
timeline.order = order;
metadata.timeline = timeline;
```
- 风险：异常输入下持续覆盖旧 metadata，导致表面成功但数据漂移。
- 建议修复：统一 metadata 解析策略（失败即 fail-fast + 诊断）。
- 优先级：P1

### [A2-H-004] 技能目录读取失败统一返回空数组
- 文件：`apps/desktop/main/src/services/skills/skillLoader.ts`
- 行号/范围：L125-L135
- 问题类型：过度防御性降级/保守回退
- 描述：目录读取失败统一回 `[]`，无错误上下文。
- 代码片段：
```ts
function listSubdirs(dirPath: string): string[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    ...
  } catch {
    return [];
  }
}
```
- 风险：权限/路径错误表现为“没有技能”，形成幽灵故障入口。
- 建议修复：返回带错误码的结果结构，并记录 `dirPath + errno`。
- 优先级：P1

## 🟡 中危问题（Medium）
### [A2-M-001] Context fetcher 异常细节被抹平
- 文件：`apps/desktop/main/src/services/context/fetchers/settingsFetcher.ts`
- 行号/范围：L82-L87
- 问题类型：过度防御性降级/保守回退
- 描述：多处 fetcher 在异常时统一回空 chunks + warning，但不保留底层异常细节。
- 代码片段：
```ts
} catch {
  return { chunks: [], warnings: [KG_UNAVAILABLE_WARNING] };
}
```
- 风险：定位成本高，容易长期带病降级运行。
- 建议修复：warning 中加入可审计错误摘要 ID。
- 优先级：P2

### [A2-M-002] runId/executionId 双字段长期并存
- 文件：`apps/desktop/main/src/ipc/ai.ts`
- 行号/范围：L838
- 问题类型：重构回避/只增不改（疑似）
- 描述：`executionId ?? runId ?? ""` 反映补丁式兼容延续。
- 代码片段：
```ts
const executionId = (payload.executionId ?? payload.runId ?? "").trim();
```
- 风险：协议语义模糊，误用只在运行时暴露。
- 建议修复：设定迁移窗口，收敛单一字段并输出弃用告警。
- 优先级：P2

### [A2-M-003] id/skillId 双轨兼容堆叠
- 文件：`apps/desktop/main/src/ipc/skills.ts`
- 行号/范围：L129
- 问题类型：重构回避/只增不改（疑似）
- 描述：`id ?? skillId ?? ""` 同类兼容堆叠。
- 代码片段：
```ts
const id = payload.id ?? payload.skillId ?? "";
```
- 风险：接口契约长期双轨，分支和测试矩阵膨胀。
- 建议修复：统一请求 schema，兼容期打点统计旧字段使用率。
- 优先级：P2

### [A2-M-004] Ping handler 不可达 catch 分支
- 文件：`apps/desktop/main/src/index.ts`
- 行号/范围：L175-L182
- 问题类型：幽灵 Bug/边界过度处理
- 描述：`app:system:ping` 内部 `try/catch` 包裹纯常量返回，catch 分支疑似永不触发。
- 代码片段：
```ts
try {
  return { ok: true, data: {} };
} catch {
  return { ok: false, error: { code: "INTERNAL", message: "Ping failed" } };
}
```
- 风险：无效防御分支增加噪声，掩盖真实错误模型。
- 建议修复：删除不可达 catch；如需容错应包裹真实可抛错语句。
- 优先级：P2

## 🔵 低危问题（Low）
### [A2-L-001] AppShell JSON 解析失败后静默默认值
- 文件：`apps/desktop/renderer/src/components/layout/AppShell.tsx`
- 行号/范围：L72-L109
- 问题类型：过度防御性降级/保守回退
- 描述：文档 JSON 解析失败直接回 `Untitled + 空段落`，未附带可观测诊断。
- 代码片段：
```ts
try {
  const doc = JSON.parse(contentJson) ...
  ...
} catch {
  return { title: "Untitled", paragraphs: [], wordCount: 0 };
}
```
- 风险：UI 显示正常默认值掩盖数据异常，问题感知滞后。
- 建议修复：增加一次性告警并记录失败样本 ID。
- 优先级：P3

### [A2-L-002] contextRules 非法输入被吞并为空对象
- 文件：`apps/desktop/main/src/services/skills/skillService.ts`
- 行号/范围：L212-L225
- 问题类型：过度 fallback 链（疑似）
- 描述：`contextRules` JSON 非法或类型不符均回 `{}`，语义被吞并。
- 代码片段：
```ts
try {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return {};
} catch {
  return {};
}
```
- 风险：调用方误传配置时系统静默采用空规则，行为漂移难察觉。
- 建议修复：区分非法 JSON 与空规则，返回校验错误或 warning。
- 优先级：P3

## 模式统计
- 过度防御性降级/保守回退：5
- 重构回避/只增不改：2
- 幽灵 Bug/边界过度处理：1
- 过度 fallback 链：2
```

```
# [A3质量陷阱审计员] 审计报告

## 审计摘要
- 扫描文件数：664
- 发现问题总数：6
- 严重（Critical）：1 | 高危（High）：2 | 中危（Medium）：2 | 低危（Low）：1

## 🔴 严重问题（Critical）
### [A3-C-001] 空内容时伪造“已排队任务”响应
- 文件：`apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts`
- 行号/范围：L470-L478
- 问题类型：静默失败/表面正确（伪造输出）
- 描述：`contentText` 为空时直接返回 `ok: true` + 随机 `taskId` + `status: "queued"`，但实际未入队。
- 代码片段：
```ts
if (normalizedContentText.length === 0) {
  return {
    ok: true,
    data: {
      taskId: randomUUID(),
      status: "queued",
      queuePosition: 0,
    },
  };
}
```
- 风险：调用方误以为任务存在，后续取消/追踪失败，形成表面成功。
- 建议修复：返回 `status: "skipped"` 或 `ok: false` + 结构化原因；禁止生成不可追踪 taskId。
- 优先级：P0

## 🟠 高危问题（High）
### [A3-H-001] Scheduler 异步错误上下文丢失
- 文件：`apps/desktop/main/src/services/skills/skillScheduler.ts`
- 行号/范围：L260-L278
- 问题类型：静默失败/异步错误吞并
- 描述：`response` 与 `completion` 分离处理，`completion.catch(() => ...)` 丢弃错误细节。
- 代码片段：
```ts
void started.response
  .then((result) => { task.resolveResult(result); })
  .catch((error) => { task.resolveResult(ipcError(...)); });

void started.completion
  .then((terminal) => { finalizeTask(sessionKey, task, terminal); })
  .catch(() => { finalizeTask(sessionKey, task, "failed"); });
```
- 风险：排障信息丢失；响应结果与队列终态出现不一致（疑似）。
- 建议修复：聚合 `response/completion` 结果；catch 保留错误上下文并上报。
- 优先级：P1

### [A3-H-002] 失败任务被计入 completed
- 文件：`apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts`
- 行号/范围：L424-L437, L645-L660
- 问题类型：表面正确（失败也计 completed）
- 描述：`processTask` 失败后 finally 无条件 `metrics.completed += 1`（非取消即+1）。
- 代码片段：
```ts
void processTask(next)
  .catch((error) => { args.logger.error(...); })
  .finally(() => {
    running.delete(next.taskId);
    if (!metrics.canceledTaskIds.includes(next.taskId)) {
      metrics.completed += 1;
      metrics.completionOrder.push(next.taskId);
    }
    pump();
  });
```
- 风险：监控把失败当完成，健康度和容量判断失真。
- 建议修复：拆分 `succeeded/failed/completed` 计数并对外暴露失败数。
- 优先级：P1

## 🟡 中危问题（Medium）
### [A3-M-001] 固定 sleep 驱动异步测试
- 文件：`apps/desktop/tests/integration/kg/recognition-query-failure-degrade.test.ts`
- 行号/范围：L46-L48
- 问题类型：虚假测试覆盖率（Happy path + 时间等待）
- 描述：依赖固定 `setTimeout(80)` 等待异步完成，而非基于事件/条件收敛。
- 代码片段：
```ts
await new Promise((resolve) => {
  setTimeout(resolve, 80);
});
```
- 风险：对机器负载敏感，慢机/并发下偶发红绿，掩盖真实竞态。
- 建议修复：改为条件等待（事件、状态轮询、`waitFor`）。
- 优先级：P2

### [A3-M-002] Story 测试仅做存在性断言
- 文件：`apps/desktop/renderer/src/features/ai/AiPanel.stories.test.ts`
- 行号/范围：L6-L10
- 问题类型：虚假测试覆盖率（浅层断言）
- 描述：仅断言 story 导出存在，不验证渲染行为、交互或状态。
- 代码片段：
```ts
expect(stories.Default).toBeDefined();
expect(stories.EmptyState).toBeDefined();
expect(stories.GeneratingState).toBeDefined();
expect(stories.ErrorState).toBeDefined();
```
- 风险：覆盖率上升但行为回归无法被拦截。
- 建议修复：增加关键 story 的渲染/交互断言。
- 优先级：P2

## 🔵 低危问题（Low）
### [A3-L-001] 低信息密度布尔断言
- 文件：`apps/desktop/tests/unit/kg/recognition-silent-degrade.test.ts`
- 行号/范围：L40-L43
- 问题类型：虚假测试覆盖率（浅层布尔断言）
- 描述：使用 `assert.equal(errorEvents.length > 0, true)`，失败诊断弱。
- 代码片段：
```ts
const errorEvents = harness.logs.error.filter(
  (event) => event.event === "kg_recognition_unavailable",
);
assert.equal(errorEvents.length > 0, true);
```
- 风险：定位失败原因困难，边界条件易被掩盖。
- 建议修复：改为精确断言（数量和关键字段）。
- 优先级：P3

## 模式统计
- 伪造/表面成功返回：1
- 吞错或丢失错误上下文：1
- 完成统计与失败混算：1
- 固定 `setTimeout` 驱动异步测试：19（命中）
- 浅层存在性断言（`toBeDefined/toBeTruthy`）：18（命中）
- 高频 mock 测试位点（`vi.mock/jest.mock`）：161（36 个测试文件，需继续抽检）
```

```
# [A4安全与规范审计员] 审计报告

## 审计摘要
- 扫描文件数：664
- 发现问题总数：5
- 严重（Critical）：0 | 高危（High）：2 | 中危（Medium）：1 | 低危（Low）：2

## 🔴 严重问题（Critical）
- 本轮未发现 Critical 级别问题。

## 🟠 高危问题（High）
### [A4-H-001] Electron Sandbox 默认关闭
- 文件：`apps/desktop/main/src/index.ts`
- 行号/范围：L104-L108
- 问题类型：不安全默认配置
- 描述：主窗口 `webPreferences.sandbox` 显式为 `false`。
- 代码片段：
```ts
webPreferences: {
  preload,
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
},
```
- 风险：渲染层出现 XSS/依赖链污染时，主进程边界保护减弱。
- 建议修复：默认启用 `sandbox: true`，仅对必要窗口做最小例外并补充回归测试。
- 优先级：P1

### [A4-H-002] IPC 调用方身份/来源未鉴权
- 文件：`apps/desktop/main/src/ipc/runtime-validation.ts`
- 行号/范围：L403-L417
- 问题类型：权限检查缺失（IPC）
- 描述：运行时校验覆盖 schema/envelope，但未校验 `event.senderFrame.url`、`webContents.id`、会话角色等调用方权限；preload 允许全部通道透传。
- 代码片段：
```ts
return async (event, payload): Promise<IpcResponse<unknown>> => {
  ...
  const raw = await runWithTimeout(
    async () => await Promise.resolve(args.handler(event, requestPayload)),
    args.timeoutMs,
  );
```
- 风险：渲染层被注入或越权页面出现时，可能直接调用高权限 IPC 通道。
- 建议修复：增加统一调用方鉴权（来源白名单、窗口/会话标识、按通道 ACL），默认拒绝。
- 优先级：P1

## 🟡 中危问题（Medium）
### [A4-M-001] 调试通道在常规路径暴露
- 文件：`apps/desktop/main/src/index.ts`
- 行号/范围：L186-L204
- 问题类型：敏感信息泄露面
- 描述：`db:debug:tablenames` 常规注册且可被公开 IPC 通道调用。
- 代码片段：
```ts
guardedIpcMain.handle(
  "db:debug:tablenames",
  async (): Promise<IpcResponse<{ tableNames: string[] }>> => {
    ...
    const rows = deps.db.prepare("SELECT name FROM sqlite_master ...").all();
```
- 风险：泄露数据库结构元信息，便于后续针对性枚举。
- 建议修复：仅 dev/e2e 注册，或增加显式 debug 权限门禁。
- 优先级：P2

## 🔵 低危问题（Low）
### [A4-L-001] 错误处理风格混杂
- 文件：`apps/desktop/main/src/services/documents/documentService.ts`
- 行号/范围：L904-L905
- 问题类型：规范漂移
- 描述：同一服务混用 `throw new Error("NOT_FOUND")` 与 `ipcError(...)` 返回式错误。
- 代码片段：
```ts
if (!target) {
  throw new Error("NOT_FOUND");
}
...
const code =
  error instanceof Error && error.message === "NOT_FOUND"
    ? ("NOT_FOUND" as const)
    : ("DB_ERROR" as const);
return ipcError(code, ...);
```
- 风险：维护成本上升，错误码映射易漂移。
- 建议修复：统一为显式 Result/Err 返回。
- 优先级：P3

### [A4-L-002] 技术栈文档与依赖清单疑似漂移
- 文件：`apps/desktop/package.json`
- 行号/范围：L44, L46
- 问题类型：规范漂移（疑似未经批准新依赖痕迹）
- 描述：`docx`、`pdfkit` 在依赖中存在，但锁定技术栈文档未明确对应项。
- 代码片段：
```json
"docx": "^9.5.1",
"pdfkit": "^0.17.2",
```
- 风险：治理层已批准清单与实际依赖不一致，审批基线失真。
- 建议修复：补齐 RFC/批准记录并同步技术栈文档，或补充非核心允许依赖清单。
- 优先级：P3

## 模式统计
- 输入/权限校验缺失：1
- 不安全默认配置：1
- 信息泄露面：1
- 错误处理风格混杂：1
- 未经批准新依赖痕迹（疑似）：1
```

```
# [A5架构合规审计员] 审计报告

## 审计摘要
- 扫描文件数：661
- 发现问题总数：8
- 严重（Critical）：1 | 高危（High）：3 | 中危（Medium）：2 | 低危（Low）：2

## 🔴 严重问题（Critical）
### [A5-C-001] Context 装配链路循环依赖
- 文件：`apps/desktop/main/src/services/context/layerAssemblyService.ts`
- 行号/范围：L6-L8
- 问题类型：循环依赖（核心上下文链路）
- 描述：`layerAssemblyService` 依赖 fetchers；fetcher 反向依赖 `layerAssemblyService` 类型，且 `retrievedFetcher` 依赖 `rulesFetcher`，形成闭环。
- 代码片段：
```ts
import { createRetrievedFetcher } from "./fetchers/retrievedFetcher";
import { createRulesFetcher } from "./fetchers/rulesFetcher";
import { createSettingsFetcher } from "./fetchers/settingsFetcher";
```
- 风险：核心模块耦合闭环，重构易触发连锁修改和初始化顺序风险。
- 建议修复：抽离 `ContextLayerFetcher` 到独立 types；下沉 `formatEntityForContext` 到纯工具模块打断环。
- 优先级：P0

## 🟠 高危问题（High）
### [A5-H-001] 布局层与功能层循环依赖
- 文件：`apps/desktop/renderer/src/components/layout/RightPanel.tsx`
- 行号/范围：L8
- 问题类型：循环依赖（UI 分层反转）
- 描述：`RightPanel` 引入 `AiPanel`；`AiPanel` 再引入 `RightPanel` 暴露的 hook。
- 代码片段：
```ts
// RightPanel.tsx
import { AiPanel } from "../../features/ai/AiPanel";

// AiPanel.tsx
import { useOpenSettings } from "../../components/layout/RightPanel";
```
- 风险：面板/功能模块难独立测试与替换，渲染层隐式耦合加深。
- 建议修复：抽出独立 context/hook 供双方依赖。
- 优先级：P1

### [A5-H-002] DocumentService 成为 God Object
- 文件：`apps/desktop/main/src/services/documents/documentService.ts`
- 行号/范围：L300, L655, L863
- 问题类型：架构退化/单体回归
- 描述：同一服务同时承载 diff、branch/settings 持久化、文档 CRUD、版本合并。
- 代码片段：
```ts
function diffLines(oldLines: string[], newLines: string[]): DiffOp[] { ... }
function readCurrentDocumentId(db: Database.Database, projectId: string) { ... }
export function createDocumentService(args: { ... }) { ... }
```
- 风险：变更面过大，缺陷定位和回归测试成本持续上升。
- 建议修复：按能力拆分为 CRUD、版本、分支、diff 子服务。
- 优先级：P1

### [A5-H-003] AI Service 成为 God Object
- 文件：`apps/desktop/main/src/services/ai/aiService.ts`
- 行号/范围：L206, L769, L981
- 问题类型：架构退化/单体回归
- 描述：聚合 token 估算、env 解析、provider 路由、错误映射、运行时调度。
- 代码片段：
```ts
function estimateTokenCount(text: string): number { ... }
export function mapUpstreamStatusToIpcErrorCode(status: number): IpcErrorCode { ... }
export function createAiService(deps: { ... }): AiService { ... }
```
- 风险：协议、配置、运行耦合于单点，任何需求变更都可能波及核心路径。
- 建议修复：拆成 providerResolver、upstreamAdapter、sessionRuntime、errorMapper。
- 优先级：P1

## 🟡 中危问题（Medium）
### [A5-M-001] 业务服务直接耦合 IPC 契约
- 文件：`apps/desktop/main/src/services/documents/documentService.ts`
- 行号/范围：L5-L8
- 问题类型：模块边界违反
- 描述：main 业务 service 直接依赖 `ipc-generated` 的 `IpcError/IpcErrorCode`。
- 代码片段：
```ts
import type {
  IpcError,
  IpcErrorCode,
} from "../../../../../../packages/shared/types/ipc-generated";
```
- 风险：领域服务被传输协议绑死，难复用到非 IPC 场景。
- 建议修复：service 层定义领域错误，IPC 层做映射。
- 优先级：P2

### [A5-M-002] 跨层深相对路径导入泛化
- 文件：`apps/desktop/renderer/src/lib/ipcClient.ts`
- 行号/范围：L5
- 问题类型：直接依赖替代接口
- 描述：跨层共享契约通过 `../../../../../packages/shared/...` 直连，命中 77 个非测试文件。
- 代码片段：
```ts
import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
} from "../../../../../packages/shared/types/ipc-generated";
```
- 风险：目录结构微调触发大面积破坏，模块边界治理弱化。
- 建议修复：提供统一 workspace alias（如 `@creonow/shared/*`）。
- 优先级：P2

## 🔵 低危问题（Low）
### [A5-L-001] 目录命名风格漂移
- 文件：`apps/desktop/renderer/src/components/layout/AppShell.tsx`
- 行号/范围：L9, L24
- 问题类型：风格漂移/命名不一致
- 描述：同级 features 目录混用 camelCase、kebab-case 与全小写。
- 代码片段：
```ts
import { CommandPalette } from "../../features/commandPalette/CommandPalette";
import { SettingsDialog } from "../../features/settings-dialog/SettingsDialog";
import { InfoPanel, QualityPanel } from "../../features/rightpanel";
```
- 风险：定位与约定成本上升，脚手架/lint 规则难统一。
- 建议修复：统一目录命名约定并启用 lint 约束。
- 优先级：P3

### [A5-L-002] 源码 BOM 头不一致
- 文件：`apps/desktop/renderer/src/features/ai/AiPanel.tsx`
- 行号/范围：L1
- 问题类型：风格漂移（编码头不一致）
- 描述：检测到 UTF-8 BOM，命中 9 个源码文件。
- 代码片段：
```text
AiPanel.tsx  ef bb bf
aiService.ts ef bb bf
```
- 风险：可能引发首字符解析问题与跨平台 diff 噪音。
- 建议修复：统一 UTF-8 无 BOM 并在格式化器中强制。
- 优先级：P3

## 模式统计
- 循环依赖：2
- God Object / 单体回归：2
- 模块边界/分层耦合：2
- 风格漂移/命名一致性：2
```

```
# [A6健壮性审计员] 审计报告

## 审计摘要
- 扫描文件数：661
- 发现问题总数：9
- 严重（Critical）：0 | 高危（High）：3 | 中危（Medium）：4 | 低危（Low）：2

## 🔴 严重问题（Critical）
- 本轮未发现 Critical 级别问题。

## 🟠 高危问题（High）
### [A6-H-001] 窗口加载 Promise 未兜底
- 文件：`apps/desktop/main/src/index.ts`
- 行号/范围：L112-L115
- 问题类型：异步操作完整性（未处理 rejection）
- 描述：`BrowserWindow.loadURL/loadFile` 返回 Promise 被 `void` 丢弃。
- 代码片段：
```ts
if (process.env.VITE_DEV_SERVER_URL) {
  void win.loadURL(process.env.VITE_DEV_SERVER_URL);
} else {
  void win.loadFile(path.join(__dirname, "../renderer/index.html"));
}
```
- 风险：加载失败时错误链断裂，可能出现启动黑屏且无可观测日志。
- 建议修复：`await` 或 `.catch(...)` 记录错误并触发降级。
- 优先级：P1

### [A6-H-002] app.whenReady 初始化链无统一 catch
- 文件：`apps/desktop/main/src/index.ts`
- 行号/范围：L339-L378
- 问题类型：异步操作完整性（顶层 Promise 链未兜底）
- 描述：`app.whenReady().then(...)` 无 `.catch`，初始化任一点抛错会成为未处理 rejection。
- 代码片段：
```ts
void app.whenReady().then(() => {
  // init db / register ipc / create window
});
```
- 风险：主进程启动失败时无统一错误处理，进入不可观测异常状态。
- 建议修复：链尾增加 `.catch` 并执行 `app.quit()` 或改 async/try-catch。
- 优先级：P1

### [A6-H-003] KG Panel 异步写入缺少结果校验
- 文件：`apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx`
- 行号/范围：L219-L223, L325-L331, L347-L367
- 问题类型：错误传播链不完整 + 并发一致性
- 描述：多处异步调用未检查 `ServiceResult.ok`；失败后仍更新本地状态。`Promise.all` 批量更新无补偿。
- 代码片段：
```ts
await relationDelete({ relationId });
if (editing.mode === "relation" && editing.relationId === relationId) {
  setEditing({ mode: "idle" });
}

await entityUpdate({ entityId: nodeId, patch: { metadataJson: updatedMetadata } });
saveKgViewPreferences(props.projectId, { lastDraggedNodeId: nodeId });

await Promise.all(
  orderedIds.map(async (entityId, index) => {
    await entityUpdate({ entityId, patch: { metadataJson } });
  }),
);
```
- 风险：后端失败但前端显示成功，UI 与数据源分叉。
- 建议修复：统一检查返回值并中断后续动作；批量更新改 `allSettled` + 失败汇总。
- 优先级：P1

## 🟡 中危问题（Medium）
### [A6-M-001] MemoryPanel Promise.all 异常路径未包裹
- 文件：`apps/desktop/renderer/src/features/memory/MemoryPanel.tsx`
- 行号/范围：L80-L84, L103-L105
- 问题类型：异步操作完整性（疑似未处理 rejection）
- 描述：effect 中 `void loadPanelData()`，若 `invoke` 抛异常，可能出现未处理 rejection。
- 代码片段：
```ts
const [listRes, settingsRes] = await Promise.all([
  invoke("memory:semantic:list", { projectId }),
  invoke("memory:settings:get", {}),
]);

React.useEffect(() => {
  void loadPanelData();
}, [loadPanelData]);
```
- 风险：面板卡在 loading，错误上下文丢失。
- 建议修复：在 `loadPanelData` 外层加 try/catch 并统一 `setStatus("error")`。
- 优先级：P2

### [A6-M-002] 项目切换竞态覆盖旧数据
- 文件：`apps/desktop/renderer/src/stores/kgStore.ts`
- 行号/范围：L216-L235
- 问题类型：并发安全（竞态条件）
- 描述：`bootstrapForProject` 异步返回后直接 `set`，未校验当前 `projectId` 是否仍匹配发起上下文。
- 代码片段：
```ts
set({ projectId, bootstrapStatus: "loading", ... });
const res = await refreshProjectData(projectId);
...
set({ bootstrapStatus: "ready", entities: res.entities, relations: res.relations });
```
- 风险：快速切换项目时，旧请求晚到覆盖新项目状态。
- 建议修复：引入 requestId/epoch，落库前校验 `get().projectId === projectId`。
- 优先级：P2

### [A6-M-003] SearchStore 查询竞态
- 文件：`apps/desktop/renderer/src/stores/searchStore.ts`
- 行号/范围：L75-L113
- 问题类型：并发安全（查询竞态）
- 描述：请求发起和结果提交间未校验 query 是否仍最新。
- 代码片段：
```ts
const query = get().query;
const res = await deps.invoke("search:fts:query", { projectId, query, limit, offset: 0 });
set({ status: "ready", items: res.data.results, ... });
```
- 风险：后返回旧请求覆盖新查询结果。
- 建议修复：增加请求戳/AbortController，并在提交前比对 query。
- 优先级：P2

### [A6-M-004] SkillScheduler completion catch 吞错
- 文件：`apps/desktop/main/src/services/skills/skillScheduler.ts`
- 行号/范围：L272-L278
- 问题类型：错误传播链完整性
- 描述：`completion` 的 catch 丢弃 error，仅标记 failed。
- 代码片段：
```ts
void started.completion
  .then((terminal) => { finalizeTask(sessionKey, task, terminal); })
  .catch(() => { finalizeTask(sessionKey, task, "failed"); });
```
- 风险：调度异常原因不可追踪，运维与重试策略缺少依据。
- 建议修复：catch 中记录错误详情并透传任务上下文。
- 优先级：P2

## 🔵 低危问题（Low）
### [A6-L-001] Preload IPC listener 生命周期疑似泄露
- 文件：`apps/desktop/preload/src/aiStreamBridge.ts`
- 行号/范围：L128-L150
- 问题类型：资源泄露（疑似）
- 描述：`ipcRenderer.on(...)` 注册后未见 `off/removeListener` 释放路径。
- 代码片段：
```ts
ipcRenderer.on(SKILL_STREAM_CHUNK_CHANNEL, ...);
ipcRenderer.on(SKILL_STREAM_DONE_CHANNEL, ...);
ipcRenderer.on(SKILL_QUEUE_STATUS_CHANNEL, ...);
ipcRenderer.on(JUDGE_RESULT_CHANNEL, ...);
```
- 风险：热更新/异常重建时可能叠加监听器，导致重复事件和内存增长。
- 建议修复：返回 `dispose()` 并在生命周期结束时移除监听器。
- 优先级：P3

### [A6-L-002] 关闭流程定时器未清理
- 文件：`apps/desktop/renderer/src/features/character/AddRelationshipPopover.tsx`
- 行号/范围：L102, L126
- 问题类型：内存泄露模式（疑似）
- 描述：`setTimeout(handleReset, 150)` 未统一清理，组件提前卸载可能执行过期回调。
- 代码片段：
```ts
setTimeout(handleReset, 150);
...
if (!newOpen) {
  setTimeout(handleReset, 150);
}
```
- 风险：低概率触发卸载后状态写入或无效更新累积。
- 建议修复：保存 timer id 并在 cleanup 中 `clearTimeout`。
- 优先级：P3

## 模式统计
- 异步操作完整性：3
- 错误传播链完整性：3
- 并发安全：3
- 资源泄露：1
- 内存泄露模式：1
```

```
# [A7可维护性审计员] 审计报告

## 审计摘要
- 扫描文件数：664
- 发现问题总数：1631（规则命中，含同文件多项）
- 严重（Critical）：223 | 高危（High）：328 | 中危（Medium）：1076 | 低危（Low）：4

## 🔴 严重问题（Critical）
### [A7-C-001] DocumentService 超长函数与高复杂度
- 文件：`apps/desktop/main/src/services/documents/documentService.ts`
- 行号/范围：L863
- 问题类型：文件/函数规模超标、认知复杂度过高
- 描述：`createDocumentService` 长度约 1743 行，复杂度估算 236。
- 代码片段：
```ts
export function createDocumentService(args: {
```
- 风险：单函数承载过多职责，改动回归面极大。
- 建议修复：按快照、分支、合并、容量治理拆分子服务。
- 优先级：P0

### [A7-C-002] AiService 超长函数与高复杂度
- 文件：`apps/desktop/main/src/services/ai/aiService.ts`
- 行号/范围：L981
- 问题类型：文件/函数规模超标、认知复杂度过高
- 描述：`createAiService` 长度约 1460 行，复杂度估算 234。
- 代码片段：
```ts
export function createAiService(deps: {
```
- 风险：AI 请求链路耦合严重，策略改动易引发跨场景回归。
- 建议修复：拆为 provider 路由、重试/限流、会话预算、技能执行四层。
- 优先级：P0

### [A7-C-003] KGService 超长函数与高复杂度
- 文件：`apps/desktop/main/src/services/kg/kgService.ts`
- 行号/范围：L784
- 问题类型：文件/函数规模超标、认知复杂度过高
- 描述：`createKnowledgeGraphService` 长度约 1378 行，复杂度估算 269。
- 代码片段：
```ts
export function createKnowledgeGraphService(args: {
```
- 风险：图查询/写入/约束逻辑混杂，扩展与性能治理风险高。
- 建议修复：按 `query/write/validation/context-injection` 分模块下沉。
- 优先级：P0

### [A7-C-004] Context IPC 注册函数过重
- 文件：`apps/desktop/main/src/ipc/context.ts`
- 行号/范围：L138
- 问题类型：函数规模超标、分层职责聚集
- 描述：`registerContextIpcHandlers` 长度约 953 行，复杂度估算 102。
- 代码片段：
```ts
export function registerContextIpcHandlers(deps: {
```
- 风险：IPC 注册层承载业务逻辑，接口变更容易破坏契约一致性。
- 建议修复：IPC 层仅保留校验与路由，业务逻辑迁移 service。
- 优先级：P0

### [A7-C-005] FileTreePanel 上帝组件化
- 文件：`apps/desktop/renderer/src/features/files/FileTreePanel.tsx`
- 行号/范围：L280
- 问题类型：组件规模超标、认知复杂度过高
- 描述：`FileTreePanel` 长度约 864 行，复杂度估算 114。
- 代码片段：
```tsx
export function FileTreePanel(props: FileTreePanelProps): JSX.Element {
```
- 风险：状态与交互耦合，局部改动易引发链式回归。
- 建议修复：拆分节点渲染、拖拽、菜单、筛选状态子组件/Hook。
- 优先级：P0

### [A7-C-006] AiPanel 上帝组件化
- 文件：`apps/desktop/renderer/src/features/ai/AiPanel.tsx`
- 行号/范围：L343
- 问题类型：组件规模超标、认知复杂度过高
- 描述：`AiPanel` 长度约 1254 行，复杂度估算 172。
- 代码片段：
```tsx
export function AiPanel(): JSX.Element {
```
- 风险：AI 面板改动风险高，测试脆弱性上升。
- 建议修复：拆分对话流、候选管理、错误态、技能面板容器。
- 优先级：P0

## 🟠 高危问题（High）
### [A7-H-007] ProjectService 深层相对路径依赖
- 文件：`apps/desktop/main/src/services/projects/projectService.ts`
- 行号/范围：L10
- 问题类型：import 依赖图不健康（高耦合）
- 描述：存在 6 层相对路径依赖共享包。
- 代码片段：
```ts
} from "../../../../../../packages/shared/types/ipc-generated";
```
- 风险：目录调整触发大面积编译失败。
- 建议修复：引入 `tsconfig paths` 别名（如 `@shared/*`）。
- 优先级：P1

### [A7-H-008] aiStore 深层相对路径依赖
- 文件：`apps/desktop/renderer/src/stores/aiStore.ts`
- 行号/范围：L10
- 问题类型：import 依赖图不健康（高耦合）
- 描述：5 层相对路径穿透到共享包。
- 代码片段：
```ts
} from "../../../../../packages/shared/types/ipc-generated";
```
- 风险：跨层耦合显式化，维护成本高。
- 建议修复：renderer/preload/main 统一切换 alias。
- 优先级：P1

### [A7-H-009] IPC 载荷上限硬编码
- 文件：`apps/desktop/preload/src/ipcGateway.ts`
- 行号/范围：L10
- 问题类型：硬编码与魔法值（协议阈值）
- 描述：IPC 载荷上限写死 `10 * 1024 * 1024`。
- 代码片段：
```ts
export const MAX_IPC_PAYLOAD_BYTES = 10 * 1024 * 1024;
```
- 风险：不同平台/场景无法按环境调优阈值。
- 建议修复：迁移到集中配置并支持环境覆盖。
- 优先级：P1

### [A7-H-010] AI 关键阈值散落硬编码
- 文件：`apps/desktop/main/src/services/ai/aiService.ts`
- 行号/范围：L132, L136, L139
- 问题类型：硬编码与魔法值（超时/重试/token）
- 描述：多组关键阈值散落定义。
- 代码片段：
```ts
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_BACKOFF_MS = [1_000, 2_000, 4_000] as const;
const DEFAULT_SESSION_TOKEN_BUDGET = 200_000;
```
- 风险：跨模块预算口径不一致，线上调参困难。
- 建议修复：抽出 `runtime-governance-config` 单一配置源。
- 优先级：P1

### [A7-H-011] KG 查询超时硬编码
- 文件：`apps/desktop/main/src/services/kg/kgService.ts`
- 行号/范围：L49
- 问题类型：硬编码与魔法值（超时）
- 描述：查询超时常量固定为 `2_000ms`。
- 代码片段：
```ts
const DEFAULT_QUERY_TIMEOUT_MS = 2_000;
```
- 风险：大图或低配环境误报超时概率高。
- 建议修复：按项目规模/环境分层配置。
- 优先级：P1

### [A7-H-012] RAG maxTokens 写死
- 文件：`apps/desktop/main/src/ipc/rag.ts`
- 行号/范围：L37
- 问题类型：硬编码与魔法值（token 上限）
- 描述：RAG `maxTokens` 默认值写死为 `1500`。
- 代码片段：
```ts
maxTokens: 1500,
```
- 风险：与其他 token budget 口径偏移，检索截断行为不可预测。
- 建议修复：统一接入 token budget 配置中心。
- 优先级：P1

## 🟡 中危问题（Medium）
### [A7-M-013] 主入口 import 扇入偏高
- 文件：`apps/desktop/main/src/index.ts`
- 行号/范围：L1-L25, L127
- 问题类型：可维护性退化（高扇入）
- 描述：`import` 数量 30，`registerIpcHandlers` 长度 209 行。
- 代码片段：
```ts
import { registerAiIpcHandlers } from "./ipc/ai";
...
function registerIpcHandlers(deps: {
```
- 风险：主入口变更冲突率高。
- 建议修复：按域拆分 `registerIpcHandlers*` 子装配器。
- 优先级：P2

### [A7-M-014] AppShell import 扇入偏高
- 文件：`apps/desktop/renderer/src/components/layout/AppShell.tsx`
- 行号/范围：L1
- 问题类型：可维护性退化（高扇入）
- 描述：`import` 数量 31。
- 代码片段：
```tsx
import React from "react";
```
- 风险：布局层对功能模块耦合过重。
- 建议修复：引入 feature facade，减少直接依赖数量。
- 优先级：P2

### [A7-M-015] Integration Test 边界穿透 renderer store
- 文件：`apps/desktop/tests/integration/project-switch.autosave.test.ts`
- 行号/范围：L3
- 问题类型：import 依赖图不健康（测试层边界穿透）
- 描述：integration test 直接引用 renderer 内部 store。
- 代码片段：
```ts
import { createProjectStore } from "../../renderer/src/stores/projectStore";
```
- 风险：重构时测试雪崩。
- 建议修复：通过公共 test harness/公开 API 注入依赖。
- 优先级：P2

### [A7-M-016] Integration Test 边界穿透 main service
- 文件：`apps/desktop/tests/integration/ai-skill-context-integration.test.ts`
- 行号/范围：L6-L8
- 问题类型：import 依赖图不健康（测试层边界穿透）
- 描述：integration test 直接引用 main 内部服务实现。
- 代码片段：
```ts
import type { Logger } from "../../main/src/logging/logger";
import { createAiService } from "../../main/src/services/ai/aiService";
```
- 风险：测试与内部实现强绑定，降低模块替换弹性。
- 建议修复：优先走 IPC 契约层或 service factory 抽象。
- 优先级：P2

## 🔵 低危问题（Low）
### [A7-L-017] 账户流程 TODO 未闭环
- 文件：`apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`
- 行号/范围：L198, L201
- 问题类型：TODO/FIXME/HACK
- 描述：账户升级/删除流程留空。
- 代码片段：
```tsx
// TODO: Implement upgrade flow when account system is ready
// TODO: Implement delete account when account system is ready
```
- 风险：功能认知偏差与需求债务累积。
- 建议修复：关联 issue 并补充验收条件与下线计划。
- 优先级：P3

### [A7-L-018] Version 词数变化 TODO 未闭环
- 文件：`apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx`
- 行号/范围：L160
- 问题类型：TODO/FIXME/HACK
- 描述：词数变化仍为占位实现。
- 代码片段：
```ts
wordChange: { type: "none", count: 0 }, // TODO: calculate actual word diff
```
- 风险：用户侧指标不准确。
- 建议修复：补齐 diff 计算并增加回归测试。
- 优先级：P3

### [A7-L-019] Windows 键盘事件 TODO 未闭环
- 文件：`apps/desktop/tests/e2e/command-palette.spec.ts`
- 行号/范围：L272
- 问题类型：TODO/FIXME/HACK
- 描述：Windows 键盘事件时序问题未处理。
- 代码片段：
```ts
// TODO: Investigate Windows-specific keyboard event handling in Electron/Playwright
```
- 风险：跨平台 E2E 可信度下降。
- 建议修复：建立平台差异基线并收敛为可重现最小用例。
- 优先级：P3

## 模式统计
- 超长文件（>400 行）：108
- 超长函数（>60 行）：571
- 高认知复杂度（>=25）：127
- 深层相对路径 import（`../../../` 及以上）：818
- 高 import 扇入文件（>25 imports）：3
- `TODO/FIXME/HACK`：4
- 疑似硬编码阈值/预算常量：85
```

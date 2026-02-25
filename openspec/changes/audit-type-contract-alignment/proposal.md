# 提案：audit-type-contract-alignment

更新时间：2026-02-25 23:50

## 背景

生产代码中存在 17 处 `as unknown as` 类型强转（审计类别四），分布在 `preload/src/ipc.ts`、`ProxySection.tsx`、`AiSettingsSection.tsx`、`deriveOutline.ts`、`ipcAcl.ts` 等文件中，说明 IPC 响应类型与 renderer 组件期望的类型存在结构性不一致。同时，`IpcInvoke` 类型在 8 个 store 文件中重复定义（审计类别十-10.1：`kgStore.ts`、`memoryStore.ts`、`editorStore.tsx`、`fileStore.ts`、`projectStore.tsx`、`aiStore.ts`、`versionStore.tsx`、`searchStore.ts`）。不改的风险：类型强转绕过编译器检查，运行时类型不匹配将导致隐蔽 bug；重复类型定义增加漂移风险。

## 变更内容

- 统一 IPC 响应类型定义，消除 renderer 侧 `as unknown as` 强转的根因
- 抽取 `IpcInvoke` 类型到 `renderer/src/lib/ipcTypes.ts`，8 个 store 统一 import
- 对无法消除的强转建立白名单并附理由文档
- 确保 `tsc --noEmit` 全量通过

## 受影响模块

- ipc — `preload/src/ipc.ts` 桥接类型、`ipcAcl.ts` ACL 类型、8 个 store 的 IpcInvoke 共享类型

## 不做什么

- 不改变 IPC 通信协议或运行时行为
- 不涉及 Storybook mock 数据中的强转（`AnalyticsPage.stories.tsx` 属于测试代码）
- 不改变 `deriveOutline.ts` 的业务逻辑（仅修正类型契约）
- 不涉及 `reducedMotion.ts` 的动画配置（低风险，可后续处理）

## 依赖关系

- 上游依赖：
  - C7 `audit-proxy-settings-normalization`（ProxySettings 类型统一后，ProxySection/AiSettingsSection 的强转才能消除）
- 下游依赖：
  - C11 `audit-legacy-adapter-retirement`（类型契约对齐后，legacy adapter 清理更安全）

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 §四（`as unknown as` 类型强转 17 处） | IPC 响应类型与 renderer 期望不一致，需统一类型定义 | `specs/ipc/spec.md`、`tasks.md` |
| 审计报告 §十-10.1（IpcInvoke 8 store 重复） | 完全相同的 3 行类型定义出现在 8 个文件 | `specs/ipc/spec.md`、`tasks.md` |
| 拆解计划 C8 | 风险中，规模 M，依赖 C7 | `proposal.md` |

## 审阅状态

- Owner 审阅：`PENDING`

# 提案：issue-606-phase-2-shell-decomposition

更新时间：2026-02-22 12:22

## 背景

Phase 2 的目标是“拆弹”：对现有 `AppShell` 进行瘦身并建立 Workbench Shell 分层。当前渲染层仍存在三类结构性问题：

- `AppShell` 同时承担布局骨架、导航切换、面板编排与部分 IPC 协调，形成单点高耦合组件。
- Feature 组件存在视口越权（`h-screen` / `w-screen` / `absolute inset-0` 等），导致 Shell 空间分配失效与布局稳定性下降。
- Renderer 侧存在分散 IPC 调用入口，渲染层与主进程边界模糊，错误处理策略不一致。

## 变更内容

- 将 `AppShell` 职责拆分为 `LayoutShell`、`NavigationController`、`PanelOrchestrator` 三个明确边界。
- 明确 Workbench 空间分配权限：Shell 独占 viewport 分配，Feature 组件禁止接管整屏尺寸。
- 将 Renderer 侧 IPC 调用入口收敛到 Service 层，Feature 组件只调用语义化 service 方法。
- 在 workbench/ipc delta 中补齐可验证 Scenario，为后续实现提供可追踪契约。

## 受影响模块

- workbench — Shell 分层职责、布局权限边界、面板编排职责
- ipc — renderer 调用入口收敛、service 边界与错误收敛契约

## 不做什么

- 不在本 change 中交付 Phase 3/Phase 4 的动画、视觉精磨、参考对标。
- 不在本 change 中新增业务能力（仅做壳层职责重组与调用边界治理）。
- 不改变主进程业务语义，仅规范 renderer 侧 IPC 入口与调用路径。

## 依赖关系

- 上游依赖：
  - Phase 1 止血阶段产出的 Token/Primitives 规范与布局基线（作为 Phase 2 重构前提）。
  - 现有 `openspec/specs/workbench/spec.md` 与 `openspec/specs/ipc/spec.md` 的既有契约（尤其 preload 安全边界与 envelope 约束）。
- 下游依赖：
  - Phase 3（微交互/动画/滚动统一）依赖本阶段 Shell 职责边界稳定后推进。
  - Phase 4（视觉审计与交付）依赖本阶段布局稳定性和 IPC 边界收敛结果。

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/workbench/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/渲染架构与状态管理.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/组件架构（Component Architecture）.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/AI 辅助前端工作流.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/Electron 性能优化.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发.md`
- 核对项：
  - `LayoutShell` 必须只承担布局骨架，不混入业务域状态与 IPC 调用。
  - Feature 组件必须从“接管 viewport”改为“消费 Shell 注入空间”，禁止 `h-screen` / `w-screen`。
  - Renderer IPC 必须收敛为 “Feature -> Service -> Preload/Main” 路径，错误策略在 Service 层统一。
- 结论：`NO_DRIFT`

## 来源映射

| 来源                                    | 提炼结论                                                      | 落地位置                                       |
| --------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `渲染架构与状态管理.md`                 | `AppShell` 需要职责拆分并保持渲染层边界清晰                   | `specs/workbench/spec.md`、`specs/ipc/spec.md` |
| `组件架构（Component Architecture）.md` | Feature 不得越权接管 viewport，壳层负责布局分配               | `specs/workbench/spec.md`、`tasks.md`          |
| `AI 辅助前端工作流.md`                  | 渲染层调用路径需要统一为 Feature -> Service -> IPC            | `specs/ipc/spec.md`、`tasks.md`                |
| `Electron 性能优化.md`                  | 通过壳层分层与调用收敛减少冗余渲染和状态耦合                  | `specs/workbench/spec.md`、`specs/ipc/spec.md` |
| `CN 前端开发.md`                        | Phase 2 作为“拆弹阶段”承接 Phase 1，向 Phase 3/4 提供稳定基线 | `proposal.md`、`tasks.md`                      |

## 审阅状态

- Owner 审阅：`PENDING`

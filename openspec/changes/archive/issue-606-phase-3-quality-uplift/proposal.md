# 提案：issue-606-phase-3-quality-uplift

更新时间：2026-02-22 12:22

## 背景

当前前端已具备 Design Token 与 Primitives 基础，但在“提质”维度仍存在结构性缺口：

- 动效层：业务组件仍散落 `transition-all` 与硬编码时长，反馈节奏不稳定。
- 滚动层：各面板滚动容器实现不一致，出现 `overflow-*` 分散定义，行为与样式难统一。
- 排版层：Typography token 仍缺少 CJK 场景补全，系统字体缩放与国际化预埋约束不足。
- 可访问性与测试层：focus/keyboard/reduced-motion 约束未形成可执行门禁，视觉回归策略未统一。

Phase 3 以“提质”为主题，在不改业务功能范围的前提下统一交互基线与验证策略，降低后续迭代的体验漂移风险。

## 变更内容

- 统一微交互与动画编排：收敛 `transition-all`，建立属性级过渡白名单，并统一 `duration/ease` token。
- 统一滚动容器：将 Workbench/Editor 的可滚动区域约束到 `ScrollArea` 抽象，避免业务层散写滚动实现。
- 补全 Typography token：明确 CJK 场景行高与缩放约束，避免排版在字体缩放/本地化场景下失稳。
- 落地可访问性与测试策略：将 reduced motion、focus ring、键盘导航、视觉回归测试纳入可验收场景。

## 受影响模块

- workbench：布局壳层、侧栏/右栏滚动容器、全局微交互与门禁测试策略。
- editor：编辑器排版 token、编辑相关滚动容器、工具栏与浮层微交互、可访问性测试策略。

## 不做什么

- 不新增业务功能或重构业务流程（仅做质量与一致性提升）。
- 不改动主进程 IPC 协议与后端服务逻辑。
- 不在本阶段引入完整多语言翻译工程（仅补全与 i18n/l10n 相关的排版与可扩展约束）。

## 依赖关系

| 依赖项                                                   | 关系         | 说明                                                           |
| -------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| `openspec/specs/workbench/spec.md`                       | 上游契约     | Workbench 基础布局与交互行为基线。                             |
| `openspec/specs/editor/spec.md`                          | 上游契约     | Editor 基础编辑、工具栏、浮层行为基线。                        |
| `design/system/01-tokens.css`                            | 上游实现基线 | 现有 `duration/ease/focus/typography` token 的真实命名与取值。 |
| `openspec/changes/archive/workbench-p5-00-contract-sync` | 上游历史变更 | Workbench 契约同步背景，避免回退既有命名。                     |
| `openspec/changes/archive/editor-p4-a11y-hardening`      | 上游历史变更 | Editor 可访问性加固经验输入。                                  |
| `issue-606-phase-4-polish-and-delivery`                  | 下游依赖     | Phase 4 的视觉审计、交付治理与最终门禁依赖本阶段质量基线。     |

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/workbench/spec.md`
  - `openspec/specs/editor/spec.md`
  - `design/system/01-tokens.css`
  - 源材料：Motion / Accessibility / Testing / i18n-l10n 4 份文档
- 核对项：
  - `duration/ease/focus/typography` token 名称与现有 token 基线一致。
  - Scroll 统一策略不突破“页面不滚动、分区独立滚动”的既有 Workbench 架构约束。
  - reduced motion 与键盘焦点策略可映射为可测试场景，而非仅设计建议。
  - 视觉回归策略与现有 Storybook/快照测试资产兼容。
- 结论：`NO_DRIFT`
- 后续动作：若上游 token 或主 spec 在实现前发生变更，先更新本 change 的 `proposal/specs/tasks` 再进入 Red。

## 来源映射

| 来源                                         | 提炼结论                                                                | 落地位置                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `微交互与动画编排（Motion Choreography）.md` | 收敛 `transition-all`、统一 duration/ease、建立 reduced motion 降级规则 | `specs/workbench/spec.md`、`specs/editor/spec.md`             |
| `可访问性（Accessibility）.md`               | focus-visible 统一、键盘导航可达性、landmark 与 reduced motion 约束     | `specs/workbench/spec.md`、`specs/editor/spec.md`             |
| `测试策略（Testing Strategy）.md`            | 视觉回归作为高优先级门禁，补齐组件/集成/E2E 的映射策略                  | `specs/workbench/spec.md`、`specs/editor/spec.md`、`tasks.md` |
| `i18n - l10n 考量.md`                        | Typography token 补全 CJK 与缩放适配预埋                                | `specs/editor/spec.md`、`tasks.md`                            |

## 审阅状态

- Owner 审阅：`PENDING`

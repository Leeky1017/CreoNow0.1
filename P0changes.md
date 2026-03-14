> 注：Phase 0 的 24 个 A0 change 与 6 个 G0.5 change 已于 2026-03-14 全部合并并归档；当前真实状态以 `openspec/changes/EXECUTION_ORDER.md` 为准。

# 身份与任务指令：Phase 0 Changes 全量重建

## 你是谁

你是 CreoNow 项目的规范工程师（Spec Engineer），负责把 Phase 0 的全部 24 个 A0 任务转化为高质量的 OpenSpec Changes。你不写实现代码，你写的是行为规范、场景定义、任务拆解和提案文档。你的产出是后续开发 Agent 的唯一行为依据——如果你写得敷衍，后续实现就会走偏。

## 前置阅读（必须按顺序读完再动手）

1. `AGENTS.md` — Agent 宪法，核心原则 P1-P5，补充禁令
2. `openspec/project.md` — 项目架构、模块索引、约定
3. `openspec/README.md` — OpenSpec 目录结构与 Change 格式
4. `docs/audit/amp/01-master-roadmap.md` — v0.1 北极星判断、三阶段路线图、必修项全表
5. `docs/audit/amp/05-implementation-backlog.md` — 实施编排主源：Phase 0 六大任务簇（P0-1 到 P0-6）、依赖矩阵、串行关键路径、禁穿透规则
6. `docs/audit/amp/10-phase-0-issue-execution-plan.md` — 载体分类（直接 PR / OpenSpec Change / 决策 issue）、Issue 模板、执行波次
7. `docs/audit/amp/07-ui-ux-design-audit.md` — 前端假 UI 清单、i18n 遗漏、交互断线
8. `docs/audit/amp/08-backend-module-health-audit.md` — 后端模块健康度、缺口清单
9. `docs/audit/amp/09-error-ux-audit.md` — 错误体验审查：错误码暴露清单、映射表、修复方案
10. `docs/audit/amp/11-frontend-static-code-audit.md` — 前端静态代码审计
11. `docs/audit/amp/12-agent-control-plane-and-incident-reconstruction.md` — 控制面重构清单

然后阅读每个涉及模块的主规范（Source of Truth）：

- `openspec/specs/editor/spec.md`
- `openspec/specs/document-management/spec.md`
- `openspec/specs/skill-system/spec.md`
- `openspec/specs/workbench/spec.md`
- `openspec/specs/search-and-retrieval/spec.md`
- `openspec/specs/ai-service/spec.md`
- `openspec/specs/ipc/spec.md`
- `openspec/specs/version-control/spec.md`
- `openspec/specs/project-management/spec.md`
- `openspec/specs/memory-system/spec.md`
- `openspec/specs/knowledge-graph/spec.md`

## 总任务

### Step 0：清理现有 Changes

删除 `openspec/changes/` 下除 `EXECUTION_ORDER.md` 和 `archive/` 之外的所有目录：

```bash
rm -rf openspec/changes/a0-01-zen-mode-editable
rm -rf openspec/changes/a0-04-export-honest-grading
rm -rf openspec/changes/a0-05-skill-router-negation-guard
rm -rf openspec/changes/a0-10-search-mvp
rm -rf openspec/changes/a0-12-inline-ai-baseline
rm -rf openspec/changes/testing-governance-foundation
```

### Step 1：为 Phase 0 全部 24 个 A0 任务创建 Changes

为以下每一个 A0 任务创建独立的 change 目录。**不论载体类型是"直接 PR"、"OpenSpec Change"还是"决策 issue"，全部统一创建为 Change**，因为每个任务都需要清晰的行为定义、场景和验收标准才能保证执行质量。

命名规则统一为：

- `a0-xx-<slug>`
- 一个 A0 任务只对应一个 change 目录
- 不得合并多个 A0 任务到同一个 change

### Step 2：重写 `EXECUTION_ORDER.md`

在所有 Changes 创建完毕后，重写 `openspec/changes/EXECUTION_ORDER.md`，包含：

- 全部 24 个 A0 change 的执行顺序
- 依赖拓扑图（基于 `05-implementation-backlog.md` 第七节的依赖矩阵）
- 实现波次划分（Wave 1-4 + Parallel）
- 控制面任务簇（CP-1 到 CP-5）的登记

---

## Phase 0 全部 24 个 A0 任务定义

以下是每个 A0 任务的详细信息。为每个任务创建 change 时，必须结合 AMP 审计文档中的具体证据、涉及模块的主规范、以及代码现场来撰写。

字段使用规则统一如下：

- `slug`：change 目录名，必须与实际目录完全一致。
- `GitHub Issue`：当前主 issue 编号；若尚未创建，必须明确写“待创建”。
- `问题`：用户现象，不要写成内部实现备注。
- `根因`：必须能落到模块、文件、函数或链路。
- `目标`：必须写成可验证的行为变化，不得写空泛目标。
- `证据来源`：必须回指 AMP 文档和对应章节，禁止“据代码观察”式空口判断。

### P0-1：真实编辑与 AI 入口收口

#### A0-01 禅模式改为真实可编辑

- **slug**: `a0-01-zen-mode-editable`
- **GitHub Issue**: #986
- **问题**: 禅模式当前是只读展示——`ZenMode.tsx` 通过 `content.paragraphs.map()` 渲染静态 `<p>`，`BlinkingCursor` 只是视觉组件。用户进入禅模式后不能真实书写。
- **根因**: ZenMode 没有挂载 TipTap `EditorContent`，没有写回链路
- **目标**: 禅模式正文区域保持可编辑，输入写回当前文档，退出后保留所有编辑
- **涉及模块**: `openspec/specs/editor/spec.md`
- **涉及文件**: `ZenMode.tsx`, `AppShell.tsx`, `editorStore`
- **约束**: 不做 OS 全屏，不在禅模式开放 AI，保持沉浸视觉（隐藏侧栏/右栏/工具栏/主状态栏）
- **证据来源**: `01` §4.1、`07` §二（假 UI 清单）
- **前端验收**: 需要

#### A0-12 Inline AI 从 0 到 1 新建

- **slug**: `a0-12-inline-ai-baseline`
- **GitHub Issue**: #1004
- **问题**: `Cmd/Ctrl+K` 当前无绑定。AI 交互只能通过右侧面板，路径长达 10 步。用户每次调 AI 都被打断心流。
- **根因**: Inline AI 从未实现——`shortcuts.ts` 中 `Cmd/Ctrl+K` 无定义，`AiInlineConfirm.tsx` 仅是确认层不是输入层
- **目标**: 注册 `Cmd/Ctrl+K` 快捷键 → 浮动输入层 → 复用 Skill 执行管线 → 就地 diff 预览 → 接受/拒绝/重新生成。选中到应用 ≤ 4 步
- **涉及模块**: `openspec/specs/editor/spec.md`
- **涉及文件**: `shortcuts.ts`, `EditorPane.tsx`, AI store, 新组件
- **约束**: 无选中文本时 Cmd+K 不触发；禅模式下不可用；复用 Skill 管线不走独立 LLM 通道
- **前置依赖**: A0-01（没有真实编辑现场，Inline AI 只能建在幻觉上）
- **证据来源**: `01` §4.1、`02` §二、`07`
- **前端验收**: 需要

### P0-2：失败可见与错误人话化

#### A0-13 Toast 接入 App

- **slug**: `a0-13-toast-app-integration`
- **GitHub Issue**: #981
- **问题**: `Toast.tsx` 完整实现了 Radix Toast，但 `App.tsx` 未挂载 `ToastProvider` / `ToastViewport`。全应用无即时反馈能力。
- **根因**: Provider 未挂载
- **目标**: 在 `App.tsx` 挂载 Toast Provider 和 Viewport；梳理关键场景（保存成功/失败、导出完成、AI 错误、设置保存）接入 Toast
- **涉及模块**: `openspec/specs/workbench/spec.md`
- **涉及文件**: `App.tsx`, `Toast.tsx`, `AppProviders.tsx`
- **证据来源**: `07` §二（假 UI 清单第 1 项）、`01` §4.1
- **前端验收**: 需要

#### A0-02 自动保存失败可见化

- **slug**: `a0-02-autosave-visible-failure`
- **GitHub Issue**: #992
- **问题**: 当前自动保存使用 `void save(...)`，失败时静默——用户可能在切换文档时丢字。
- **根因**: 异步保存失败无反馈、无重试
- **目标**: 增加失败可见性（状态栏/Toast 提醒）、基本重试策略、保存状态追踪
- **涉及模块**: `openspec/specs/document-management/spec.md`
- **涉及文件**: autosave 链路相关文件
- **受益于**: A0-13（Toast 基础设施）
- **证据来源**: `01` §4.2、`03` §二
- **前端验收**: 需要

#### A0-03 渲染进程全局错误兜底

- **slug**: `a0-03-renderer-global-error-fallback`
- **GitHub Issue**: #993
- **问题**: 渲染进程无 `unhandledrejection` / `onerror` 全局捕获，async 异常只进控制台，用户看不到。
- **根因**: 缺全局错误兜底
- **目标**: 增加 renderer 全局错误兜底（`window.addEventListener('unhandledrejection', ...)`）与日志落盘
- **涉及模块**: `openspec/specs/workbench/spec.md`
- **涉及文件**: `App.tsx` 或入口文件, `ErrorBoundary`
- **证据来源**: `01` §4.2、`03` §二
- **前端验收**: 可选

#### A0-20 错误消息统一人话化

- **slug**: `a0-20-error-message-humanization`
- **GitHub Issue**: #983（执行主入口；#982 保留历史，不继续推进）
- **问题**: 系统共 88 个错误码，`errorMessages.ts` 仅覆盖 6 个（覆盖率 6.8%）。15+ 处组件直接渲染 `{error.code}: {error.message}`。
- **根因**: 缺统一错误展示层与完整映射表
- **目标**: 建立全量错误码→人话映射表；提供统一 `getHumanErrorMessage(error)` 函数；确保无技术码暴露给用户
- **涉及模块**: `openspec/specs/ipc/spec.md`, `openspec/specs/workbench/spec.md`
- **涉及文件**: `errorMessages.ts`, 各组件错误渲染点见 `09` §三清单
- **证据来源**: `09` §二-§八（全量清单与映射表）
- **前端验收**: 否（基础设施层）
- **重要**: **此任务是 A0-21 和 A0-22 的前置依赖。没有映射表，不得先改错误展示表面。**

#### A0-21 错误展示组件收口

- **slug**: `a0-21-error-surface-closure`
- **GitHub Issue**: #988
- **问题**: 错误码直接暴露——ExportDialog、QualityPanel、VersionPreviewDialog、InfoPanel、MemoryPanel、AnalyticsPage、CreateProjectDialog、KnowledgeGraphPanel、VersionHistoryContainer 等 15+ 处组件直接渲染技术错误
- **根因**: 组件直接使用 `{error.code}: {error.message}` 而非调用统一映射
- **目标**: 所有用户可见的错误组件统一调用 A0-20 建立的映射函数，不再直接展示技术码
- **涉及模块**: `openspec/specs/workbench/spec.md`
- **前置依赖**: A0-20
- **证据来源**: `09` §三（泄露清单，含文件路径与行号）
- **前端验收**: 需要

#### A0-22 i18n 错误文案修正

- **slug**: `a0-22-i18n-error-copy-cleanup`
- **GitHub Issue**: #989
- **问题**: i18n locale 文件中仍含技术错误码拼接模式（如 `error (${state.error.code})`）
- **根因**: 错误文案去技术化未完成
- **目标**: i18n 错误相关文案全部改为人话，不暴露内部 code/message
- **涉及模块**: `openspec/specs/workbench/spec.md`
- **前置依赖**: A0-20
- **证据来源**: `09` §五
- **前端验收**: 需要

### P0-3：能力诚实分级与假功能处置

#### A0-04 导出能力诚实分级

- **slug**: `a0-04-export-honest-grading`
- **GitHub Issue**: #1002
- **问题**: Spec 声称 PDF/DOCX 支持格式化导出（粗体、斜体、标题、图片），但实现仅导出纯文本
- **根因**: spec 承诺与实现不一致
- **目标**: 修正 document-management spec，明确 PDF/DOCX = 纯文本导出（v0.1）；UI 加 "Plain text only" 或 "Beta" 标注
- **涉及模块**: `openspec/specs/document-management/spec.md`
- **涉及文件**: `ExportDialog.tsx`, i18n locale
- **证据来源**: `01` §4.2、`08` §四
- **前端验收**: 需要

#### A0-06 发布事实表

- **slug**: `a0-06-release-fact-sheet`
- **GitHub Issue**: #999
- **问题**: v0.1 缺少诚实的发布事实表——哪些能力真实存在、哪些是 Beta、哪些暂不承诺
- **目标**: 创建 `docs/release/v0.1-fact-sheet.md`，涵盖每个面向用户功能的真实能力分级
- **证据来源**: `01` §5.2、`06`、`08` §七

#### A0-15 占位 UI 收口

- **slug**: `a0-15-placeholder-ui-closure`
- **GitHub Issue**: #995
- **问题**: 多处 UI 看起来有功能但无后端——Settings Account（Edit Profile/Upgrade/Delete Account 全 disabled）、Search "View More"/"Search All Projects" 无 onClick、RightPanel ChatHistory 仅 console.info、版本恢复 Restore 按钮 disabled
- **根因**: 占位组件已渲染，但功能未实现
- **目标**: 统一处置：要么明确标注 "Coming soon"，要么隐藏入口，不让空壳误导用户
- **涉及模块**: `openspec/specs/workbench/spec.md`
- **证据来源**: `07` §二（假 UI 清单）
- **前端验收**: 需要

#### A0-19 Export 纯文本诚实标注

- **slug**: `a0-19-export-plain-text-labeling`
- **GitHub Issue**: #998
- **问题**: ExportDialog 中 PDF/DOCX 选项无说明，用户预期会保留格式，实际得到纯文本
- **目标**: 在 ExportDialog 的 PDF/DOCX 选项旁添加明确的 "纯文本导出" 标注
- **前置依赖**: A0-04（需以导出分级结论为依据）
- **涉及模块**: `openspec/specs/document-management/spec.md`
- **证据来源**: `01` §4.2
- **前端验收**: 需要

#### A0-08 备份能力真伪核查

- **slug**: `a0-08-backup-capability-decision`
- **GitHub Issue**: 待创建
- **问题**: 设置页有 `backupInterval` 选项，但后端无调度、无写盘、无恢复实现
- **目标**: 决策 issue——核查真实能力与文案承诺的差距，为 A0-17 提供事实依据
- **约束**: 先查事实，不做实现承诺
- **证据来源**: `07` §二、`08` §四

#### A0-17 Backup 决策：实现或隐藏

- **slug**: `a0-17-backup-entry-resolution`
- **GitHub Issue**: #996
- **问题**: Backup 入口存在但后端无闭环
- **目标**: 基于 A0-08 的事实核查，决定 v0.1 是实现最小闭环还是隐藏入口
- **前置依赖**: A0-08
- **证据来源**: `08` §四

#### A0-18 Judge 决策：接入或降级

- **slug**: `a0-18-judge-capability-resolution`
- **GitHub Issue**: #997
- **问题**: QualityPanel 点质量检查后，`ensure()` 永远返回 `MODEL_NOT_READY`，用户只会得到失败
- **目标**: 决策——接入远程 LLM 让 Judge 可用，或诚实降级为"基础规则检查"，或隐藏入口
- **证据来源**: `08` §三（Judge模块）

### P0-4：发布边界与数据诚实

#### A0-07 Windows 首发边界核查

- **slug**: `a0-07-windows-release-boundary-audit`
- **GitHub Issue**: #1000
- **问题**: "可打包"不等于"可首发"——签名、auto-update、备份、崩溃可观测性都缺位
- **目标**: 文档核查——Windows 首发四项（签名/更新/备份/崩溃定位）哪些已完成、哪些暂不承诺
- **证据来源**: `06` 全文

#### A0-11 数据安全边界声明

- **slug**: `a0-11-data-safety-boundary-statement`
- **GitHub Issue**: #1001
- **问题**: 创作内容、KG、Memory 均明文本地存储，用户不知道数据保护边界
- **目标**: 在发布文档中诚实声明数据安全边界（明文存储、无远程同步、无加密）
- **证据来源**: `06` §五、`08`

### P0-5：文案与 i18n 存量止血

#### A0-09 i18n 存量 key 核查

- **slug**: `a0-09-i18n-inventory-audit`
- **GitHub Issue**: #990
- **问题**: 大量组件硬编码英文字符串，切换语言后露底。`07` §三列出了编辑器区域、版本历史、slash menu 等多处裸字符串。
- **根因**: 存量文案未走 `t()` 的残留
- **目标**: 全面核查 renderer 中未走 i18n 的用户可见文案，建立清理清单
- **涉及模块**: 所有前端模块
- **证据来源**: `07` §三、`11`
- **前端验收**: 需要

#### A0-16 编辑器/版本/Slash i18n 核查

- **slug**: `a0-16-editor-version-slash-i18n`
- **GitHub Issue**: #991
- **问题**: 编辑器区域（`EditorPane.tsx` 硬编码 "Entity suggestions unavailable."、confirm 对话框），版本历史，slash menu 都有 i18n 缺口
- **目标**: 清理 A0-09 核查结果中编辑器/版本/slash 相关的裸字符串
- **前置依赖**: A0-09（先清存量，再做定向补漏）
- **涉及模块**: `openspec/specs/editor/spec.md`, `openspec/specs/version-control/spec.md`
- **证据来源**: `07` §三
- **前端验收**: 需要

### P0-6：基础输入输出防线

#### A0-05 Skill Router 否定语境守卫

- **slug**: `a0-05-skill-router-negation-guard`
- **GitHub Issue**: #987
- **问题**: Skill Router 只做 `input.includes()` 关键词匹配，"不要续写"也命中 `builtin:continue`
- **根因**: 只有正向子串匹配，无否定语境判断
- **目标**: 增加否定上下文守卫——如果关键词出现在否定短语中，不触发对应 skill，fallback 到 `builtin:chat`
- **涉及模块**: `openspec/specs/skill-system/spec.md`
- **涉及文件**: `skillRouter.ts`
- **证据来源**: `01` §4.2、`08` §三
- **前端验收**: 否

#### A0-10 基础全文搜索入口

- **slug**: `a0-10-search-mvp`
- **GitHub Issue**: #1003
- **问题**: FTS 后端与 SearchPanel UI 已存在，但 `Cmd/Ctrl+Shift+F` 未注册。用户只能通过 IconBar 找到搜索——发现性极差。
- **根因**: 键盘快捷键未绑定
- **目标**: 注册 `Cmd/Ctrl+Shift+F` 打开 SearchPanel；搜索结果点击跳转到对应文档
- **涉及模块**: `openspec/specs/search-and-retrieval/spec.md`
- **涉及文件**: `shortcuts.ts`, `surfaceRegistry.ts`
- **证据来源**: `01` §5.2、`02` §1.2
- **前端验收**: 需要

#### A0-14 Settings General 持久化

- **slug**: `a0-14-settings-general-persistence`
- **GitHub Issue**: #994
- **问题**: Settings → General 页的选项（语言、写作体验、数据存储、编辑器默认值）仅在组件内 state 管理，刷新即丢
- **根因**: 组件 state 仅本地，未写入 preferences store
- **目标**: 接入 preferences store，确保设置修改持久化
- **涉及模块**: `openspec/specs/workbench/spec.md`
- **证据来源**: `07` §二
- **前端验收**: 需要

#### A0-23 文档 5MB 限制实施

- **slug**: `a0-23-document-size-limit-enforcement`
- **GitHub Issue**: #984
- **问题**: Spec 定义了文档大小边界（5MB），但保存链路未做 size check，超大文档可被直接保存
- **根因**: `save` 链路未实施大小校验
- **目标**: 在保存链路实施 5MB 上限，超限时给出明确用户提示
- **涉及模块**: `openspec/specs/document-management/spec.md`
- **涉及文件**: 保存链路相关文件
- **证据来源**: `01` §4.2、`03` §二
- **前端验收**: 否

#### A0-24 Skill 输出校验扩展

- **slug**: `a0-24-skill-output-validation`
- **GitHub Issue**: #985
- **问题**: 除 synopsis 外，其他 Skill 的输出无校验。LLM 异常输出可直接污染正文。
- **根因**: output validation 缺失
- **目标**: 为高频 Skill（polish、rewrite、continue、expand）增加基础输出校验与兜底提示
- **涉及模块**: `openspec/specs/skill-system/spec.md`
- **涉及文件**: Skill 执行链路
- **证据来源**: `01` §4.2、`08` §三
- **前端验收**: 否

---

## 每个 Change 的目录结构

每个 change 目录必须包含以下 3 个文件：

```text
openspec/changes/a0-xx-<slug>/
├── proposal.md
├── specs/
│   └── <module>/
│       └── spec.md
└── tasks.md
```

对应职责如下：

- `proposal.md`：动机、变更范围、非目标。
- `specs/<module>/spec.md`：Delta Spec，即行为规范增量。
- `tasks.md`：实施任务拆解、测试映射与完成定义。

若一个 A0 任务同时触及多个模块，仍然保持一个 change 目录，但可在 `specs/` 下建立多个模块子目录，例如：

```text
openspec/changes/a0-xx-example/
├── proposal.md
├── specs/
│   ├── workbench/
│   │   └── spec.md
│   └── ipc/
│       └── spec.md
└── tasks.md
```

前提是：这些模块都服务于同一个 A0 任务，而不是借机合并多个任务。

---

## 文件质量标准

以下标准不是建议，而是最低交付线。任何一项未满足，都视为该 change 不可交付。

### proposal.md 质量要求

```markdown
# Proposal: a0-xx-<slug>

## Why（为什么必须做）

不是一句话概括。要求：

1. 用户看到什么现象（用户视角，不是开发视角）
2. 根因是什么（定位到具体文件/函数/行为）
3. 对 v0.1 发布可信度的威胁是什么
4. 证据来源（引用 AMP 审计文档编号与章节）

## What Changes（具体做什么）

逐条列出行为变更，每一条必须是可验证的行为描述，不是模糊的"优化"或"改进"。

## Scope（涉及范围）

- 涉及的 openspec 主规范
- 涉及的源码文件/目录（具体到文件级别）
- 所属任务簇（P0-1 到 P0-6）
- 前置依赖（若有）
- GitHub Issue 编号

## Non-Goals（明确不做什么）

至少列出 3 条不做项，防止 scope creep。
```

补充要求：

- `Why` 必须写出“为什么现在做”，而不是只描述“现在有什么”。
- `Scope` 必须显式写出前置依赖和下游影响。
- `Non-Goals` 必须足够锋利，能阻止 agent 顺手扩写。

### `specs/<module>/spec.md`（Delta Spec）质量要求

这是整个 Change 中最重要的文件。它定义的是行为规范增量，后续实现 Agent 将严格按此编写测试和代码。

格式必须与主规范 `openspec/specs/<module>/spec.md` 一致：

```markdown
# <Module> Specification — Delta: a0-xx-<slug>

## 变更摘要

一句话描述本 delta 对主规范的增量。

## 变更的 Requirements

### Requirement: <需求名>（新增 / 修改）

The system SHALL ...（用 SHALL/MUST 描述必要行为，用 MAY 描述可选行为）

详细的行为描述，包括：

- 前置条件
- 触发条件
- 预期行为
- 边界情况处理
- UI 约束（使用 Design Token 引用，如 `--color-bg-surface`）
- 可访问性要求（aria-label 等）

#### Scenario: <场景中文描述>

- **GIVEN** <上下文描述>
- **WHEN** <用户操作>
- **THEN** <预期结果>
- **AND** <额外断言>

每个 Requirement 至少 2-4 个 Scenario，必须包含：

1. 正常路径（Happy path）
2. 边界情况（Edge case）
3. 错误/异常路径（Error path）
4. 与其他功能的交互（Coexistence）

### 约束

列出本 delta 引入的硬约束，如禁止事项。
```

Delta Spec 禁止事项：

- 禁止只写一句话描述就算一个 Scenario。
- 禁止用“应该正常工作”这种模糊断言。
- 禁止省略错误路径的场景。
- 禁止不引用 Design Token 而使用硬编码颜色/阴影。
- 禁止不提可访问性。
- 禁止只描述正常路径而不描述边界。

补充要求：

- 若变更涉及快捷键，必须写明触发条件、冲突处理和无效场景。
- 若变更涉及错误展示，必须写明用户看到的文案层，而不是只写内部错误对象。
- 若变更涉及前端 surface，必须写明可见性规则、交互反馈和退出机制。

### `tasks.md` 质量要求

```markdown
# Tasks: a0-xx-<slug>

## 所属任务簇

P0-x: <簇名>

## 前置依赖

- [ ] <依赖的 A0-xx 任务>（若无则写"无"）

## 实施任务

### Phase: Delta Spec

- [ ] 更新/创建 delta spec（本目录 `specs/<module>/spec.md`）
- [ ] 每个 Scenario 的行为定义与主规范一致

### Phase: Red（先写失败测试）

- [ ] <具体测试文件路径>：<测试用例描述>
- [ ] <具体测试文件路径>：<测试用例描述>
- [ ] ...（每一条 backlog 验收标准必须映射到至少一个测试用例）

### Phase: Green（实现使测试通过）

- [ ] <具体实现步骤 1>
- [ ] <具体实现步骤 2>
- [ ] ...

### Phase: Refactor（清理）

- [ ] 确认无多余文件/导入
- [ ] i18n 文案检查（若涉及前端）
- [ ] Storybook 构建验证（若涉及可视组件）

## 验收标准 → 测试映射

| 验收标准（来自 backlog） | 对应测试文件 | 测试用例名 | 状态 |
| ------------------------ | ------------ | ---------- | ---- |
| <标准 1>                 | <文件路径>   | <用例名>   | [ ]  |
| <标准 2>                 | <文件路径>   | <用例名>   | [ ]  |

## Done 定义

- [ ] 所有 Scenario 有对应测试且通过
- [ ] PR body 包含 `Closes #<Issue编号>`
- [ ] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）
- [ ] 前端任务有视觉验收证据（若适用）
```

补充要求：

- `Red` 阶段的测试任务必须先于 `Green` 阶段的实现任务列出。
- 每个测试任务都应尽量写到文件级或用例级，禁止只写“补测试”。
- 若任务为决策类 change，`tasks.md` 也必须包含证据采集、方案比较和决策记录，而不是伪装成实现任务表。

## 关键质量红线

1. 每个任务的 Delta Spec 必须至少包含 2 个 Scenario；核心任务（A0-01、A0-12、A0-20）至少包含 4 个。
2. Scenario 必须采用 `GIVEN / WHEN / THEN / AND` 结构，不接受散文式描述。
3. `tasks.md` 中每条 backlog 验收标准都必须映射到至少一个测试用例。
4. `proposal.md` 的 `Why` 部分必须引用 AMP 审计文档的具体章节作为证据。
5. 涉及前端的 Change 必须在 spec 中指定 Design Token 引用，不得使用硬编码颜色。
6. 涉及用户可见文案的 Change 必须在 spec 中声明 i18n 要求。
7. 涉及错误消息的 Change 必须引用 `09-error-ux-audit.md` 中的具体泄露清单。
8. 决策类 Change（A0-08、A0-17、A0-18）的 spec 不是行为规范，而是决策框架，必须包含“必答问题”“方案对比”“决策门槛”。
9. 不得在任何 Change 中使用“优化”“改进”“完善”等模糊动词；所有描述都必须是可验证的具体行为变更。

## 交付完成标志

当且仅当满足以下条件，才算这份 Phase 0 changes 重建任务完成：

1. `openspec/changes/` 下已存在全部 24 个 A0 change 目录。
2. 每个 change 至少包含 `proposal.md`、`specs/.../spec.md`、`tasks.md`。
3. 每个 change 的内容符合本文件的质量红线。
4. `EXECUTION_ORDER.md` 已按新的 24 个 change 重写。
5. 不再保留旧版低质量 change 目录。

## 执行边界

本任务的目标是**重建高质量 OpenSpec Changes**，不是顺手开始实现代码。

- 允许：创建目录、撰写 `proposal.md`、撰写 delta spec、撰写 `tasks.md`、重写 `EXECUTION_ORDER.md`。
- 不允许：顺手修改业务实现、补真实功能代码、替某个 A0 任务直接写 PR 实现。
- 若在撰写 change 过程中发现某个 A0 任务定义仍然矛盾，应在对应 change 中把矛盾写清，而不是擅自替产品做额外范围裁决。
- 若确需引用代码现场，目的是支撑 change 文案质量，而不是借机展开代码改造。

## 执行顺序

一次性调用 subagent 创建全部 24 个 Change 目录与文件。按以下顺序处理，但不需要等待上一个完成后再开始下一个；这里是文件创建顺序，不是代码实现顺序。

1. 先创建 P0-2 簇（A0-13、A0-20、A0-21、A0-22、A0-02、A0-03）。
   说明：失败可见是后续所有改动的基础。
2. 再创建 P0-6 簇（A0-05、A0-10、A0-14、A0-23、A0-24）。
   说明：这一簇负责输入输出防线。
3. 再创建 P0-3 簇（A0-04、A0-06、A0-08、A0-15、A0-17、A0-18、A0-19）。
   说明：这一簇负责能力诚实化。
4. 再创建 P0-5 簇（A0-09、A0-16）。
   说明：这一簇负责 i18n 止血。
5. 再创建 P0-4 簇（A0-07、A0-11）。
   说明：这一簇负责发布边界。
6. 最后创建 P0-1 簇（A0-01、A0-12）。
   说明：这是最核心的“真实编辑与 AI 入口”任务簇，放到最后是为了吸收前面所有上下文。
7. 重写 `EXECUTION_ORDER.md`。

## 绝对禁止

- 禁止写出只有 5 行的 `spec.md`；这是行为规范，不是 TODO list。
- 禁止 Scenario 没有 `THEN` 断言。
- 禁止 `tasks.md` 只列 3 个 checkbox。
- 禁止 `proposal.md` 的 `Why` 只有一句话。
- 禁止不读 AMP 审计文档就凭空编造问题描述。
- 禁止不读主规范就写 Delta Spec。
- 禁止在 Delta Spec 中使用硬编码颜色值。
- 禁止忽略可访问性要求。
- 禁止把多个 A0 任务混进同一个 Change。
- 禁止使用兼容代码。
- 禁止使用 `any` 类型。
- 禁止在 JSX 中使用裸字符串。

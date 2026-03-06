# CreoNow — Agent 宪法 v2

**CreoNow（CN）** 是一个 AI 驱动的文字创作 IDE，定位为「创作者的 Cursor」。

技术选型已锁定，详见 `docs/references/tech-stack.md`。

所有 AI Agent 在执行任务前，必须先阅读本文件。

# Repository Guidelines
1. 回复尽量使用中文
2. 如果没有显示要求，禁止写兼容代码
3. 沟通方式：要有文化，要有诗意，能引经据典最好。

---

## 一、阅读链

```
1. AGENTS.md                                        ← 本文件（如已读可跳过）
2. openspec/project.md                              ← 项目概述与模块索引
3. openspec/specs/<module>/spec.md                  ← 任务相关模块行为规范
4. design/DESIGN_DECISIONS.md                       ← 设计决策（前端任务必读）
```

---

## 二、核心原则

### P1. Spec-First（规范优先）

收到任务后，第一步阅读 `openspec/specs/<module>/spec.md`。
- 如果 spec 不存在或不完整，通知 Owner 补充后再动手
- 如果开发中发现 spec 遗漏场景，先更新 spec 再实现
- 超出 spec 范围的行为需要 Owner 确认
- 修改模块对外行为 → 必须更新 spec.md
- 修复 bug（行为回归到 spec 定义）→ 不需要更新 spec

### P2. Test-First（测试先行）

先写测试，再写实现。Red → Green → Refactor。
- Spec 中的 Scenario 必须有对应测试
- 测试验证行为，不验证实现细节
- 测试必须独立、确定、有意义

### P3. Gates（门禁全绿）

PR 必须通过所有 required checks 且使用 auto-merge。
- Required checks：`ci`、`merge-serial`
- CI 不绿不合并，不得「先合并再修」
- 交付完成 = 代码已合并到 `main`

### P4. Deterministic & Isolated（确定性与隔离）

测试不得依赖真实时间、随机数、网络请求。
- 使用 fake timer、固定种子、mock
- LLM 在测试中必须 mock
- 分支从最新 `origin/main` 创建
- `pnpm install --frozen-lockfile`

### P5. Escalate, Don't Improvise（上报，不要即兴发挥）

遇到不确定的情况，停下来通知 Owner。
- Spec 不存在或矛盾 → 停下来
- 任务超出 spec 范围 → 停下来
- 上游依赖不一致 → 停下来

### P-Visual. 视觉验收（前端任务专用）

前端任务必须有视觉验收证据。仅跑 vitest 不算完成。
- 修改组件后，确认 Storybook 可构建（`pnpm -C apps/desktop storybook:build`）
- 涉及样式的修改，确认使用语义化 Design Token（CI 自动检查）
- 新组件必须有 Story

---

## 三、架构

| 架构层 | 路径 | 运行环境 |
|--------|------|----------|
| 前端 | `apps/desktop/renderer/` | Electron 渲染进程 |
| Preload | `apps/desktop/preload/` | Electron Preload |
| 后端 | `apps/desktop/main/` | Electron 主进程 |
| 共享层 | `packages/shared/` | 跨进程 |

模块索引详见 `openspec/project.md`。

---

## 四、工作流

详细步骤与命令见 `docs/delivery-skill.md`。

### 接到任务时

1. 阅读本文件（如已读可跳过）
2. 阅读 `openspec/specs/<module>/spec.md`
3. 确认 Issue 号和分支名（`task/<N>-<slug>`）
4. 从最新 `origin/main` 创建分支

### 开发流程

| 阶段 | 完成条件 |
|------|----------|
| **准备** | Issue 已创建；spec 已阅读（如需变更则已更新）；分支已创建 |
| **实现** | 按 TDD 循环实现；所有测试通过；前端任务有视觉验收 |
| **交付** | PR 已创建（含 `Closes #N`）；auto-merge 已开启；CI 全绿；已合并到 main |

规则冲突时，以 `docs/delivery-skill.md` 为主源。

---

## 五、补充禁令

1. 禁止 `any` 类型——TypeScript strict mode 必须编译通过
2. 禁止在组件中使用 Tailwind 原始色值——必须通过语义化 Design Token（详见 `docs/references/design-ui-architecture.md`）
3. 禁止在 JSX 中使用裸字符串字面量——所有用户可见文本必须走 `t()` / i18n
4. 禁止使用 Tailwind 内置阴影类（`shadow-lg`、`shadow-xl`、`shadow-2xl`）——必须走 `--shadow-*` Design Token
5. 禁止提交 CRLF/LF 噪音型大 diff——无语义改动却整文件替换视为格式风暴，必须阻断
6. 禁止删除/跳过测试来换取 CI 通过
7. 禁止在活跃内容中保留已废止治理体系的引用，并声称"已收口"

---

## 六、参考文档

| 文档 | 路径 | 查阅时机 |
|------|------|----------|
| 测试指南 | `docs/references/testing-guide.md` | 写测试前 |
| 设计与 UI 架构 | `docs/references/design-ui-architecture.md` | 写前端组件前 |
| 代码标准 | `docs/references/coding-standards.md` | 写代码前 |
| 异常处理 | `docs/references/exception-handling.md` | 遇到阻塞/异常时 |
| 技术选型 | `docs/references/tech-stack.md` | 选型疑问时 |
| 工具链 | `docs/references/toolchain.md` | 构建/CI/脚本相关 |
| 命名约定 | `docs/references/naming-conventions.md` | 命名不确定时 |
| 文件组织 | `docs/references/file-structure.md` | 创建新文件时 |

---

**读完本文件后，请阅读 `openspec/project.md`，然后阅读任务相关模块的 `spec.md` 和 `docs/delivery-skill.md`，再开始工作。**

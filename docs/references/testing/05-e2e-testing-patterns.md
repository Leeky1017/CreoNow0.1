# E2E 测试模式

## E2E 的职责

E2E 只守关键用户路径，不做全栈细枝末节的重复劳动。

应优先覆盖：

- 应用启动
- 项目切换 / 文档打开
- 编辑与保存
- 命令面板
- AI 成功 / 失败 / 取消
- 导出
- 设置与关键面板

## 工具与入口

- 运行入口：`pnpm -C apps/desktop test:e2e`
- 目录：`apps/desktop/tests/e2e/`
- 运行环境：Playwright + Electron

## 选择器约定

优先使用：

1. `data-testid`
2. 语义 role
3. 稳定的可访问名称

避免：

- 依赖易变文案
- 依赖视觉层级或复杂 CSS 选择器

`data-testid` 的意义不是偷懒，而是给 E2E 一根稳定的钉子。

## 测试隔离

E2E 必须隔离以下状态：

- `userDataDir`
- 项目数据目录
- mock server 生命周期
- 失败产物目录

每个测试都应能在全新环境中独立运行，不依赖上一个测试“留下的好天气”。

## AI 与外部依赖

E2E 中的 LLM 必须 mock。

推荐模式：

- fake AI server
- 预设响应脚本
- 显式区分成功、超时、取消、错误映射

禁止：

- 让 E2E 依赖真实模型或真实网络额度

## Windows-first 注意事项

CreoNow 的交付主平台是 Windows，因此 E2E 需要显式考虑：

- 键盘时序差异
- 路径分隔符差异
- Electron 打包与运行环境差异

若某个测试因平台问题暂时 `test.skip`，必须同时写明：

- 为什么跳过
- 哪个平台受影响
- 后续修复或回收条件

## 何时不用 E2E

以下场景优先降到集成或单元层：

- 只是验证某个 handler 的返回结构
- 只是验证 store 状态转移
- 只是验证一个组件的局部交互

若可以在更低层以更稳定、更快的方式证明行为，就不要把它抬高到 E2E。

## E2E review 清单

- 这个测试是否覆盖了真实用户价值，而不是技术细节？
- 选择器是否稳定？
- 外部依赖是否全部受控？
- 失败后能否从日志 / artifact 快速定位？
- 是否有可以下沉到集成层的断言被误放到了 E2E？

---

## 关键路径 ↔ E2E 映射表

> **维护说明**：新增或删除 E2E 文件时，必须同步更新本表。覆盖状态标记：
> ✅ 完整覆盖 ｜ ⚠️ 部分覆盖 ｜ ❌ 未覆盖

| #   | 关键用户路径          | E2E 文件                                                                                       | 覆盖状态 | 备注                                                |
| --- | --------------------- | ---------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| 1   | 应用启动              | `app-launch.spec.ts`, `db-bootstrap.spec.ts`                                                   | ✅       | 应用启动 + 安全沙箱校验 + 数据库初始化              |
| 2   | 项目切换 / 文档打开   | `project-lifecycle.spec.ts`, `documents-filetree.spec.ts`, `dashboard-project-actions.spec.ts` | ✅       | 项目创建/重启恢复 + 文件树 CRUD + 仪表盘操作        |
| 3   | 编辑与保存            | `editor-autosave.spec.ts`, `version-history.spec.ts`                                           | ✅       | autosave + 手动保存 Ctrl+S + 版本快照（见下方说明） |
| 4   | 命令面板              | `command-palette.spec.ts`                                                                      | ✅       | 命令面板唤起 + 9 条快捷键路径                       |
| 5   | AI 成功 / 失败 / 取消 | `ai-runtime.spec.ts`, `ai-apply.spec.ts`, `proxy-error-semantics.spec.ts`                      | ✅       | 成功/延迟/超时/上游错误/取消/冲突/代理配置          |
| 6   | 导出                  | `export-markdown.spec.ts`                                                                      | ⚠️       | 见下方处理结论                                      |
| 7   | 设置与关键面板        | `settings-dialog.spec.ts`, `theme.spec.ts`, `layout-panels.spec.ts`                            | ✅       | 快捷键唤起 + 主题持久化 + 面板布局                  |

### 补充关联 E2E（未列入七条关键路径但覆盖产品核心功能）

| E2E 文件                             | 覆盖范围                               |
| ------------------------------------ | -------------------------------------- |
| `search-rag.spec.ts`                 | FTS 命中 + 语义 RAG 检索 + 降级 + 截断 |
| `outline-panel.spec.ts`              | 大纲面板导航 + 空态 + 动态更新         |
| `rightpanel-info-quality.spec.ts`    | 右侧信息与质量面板                     |
| `knowledge-graph.spec.ts`            | 知识图谱侧边栏 CRUD + 上下文注入       |
| `memory-preference-learning.spec.ts` | 记忆偏好学习                           |
| `memory-semantic-recall.spec.ts`     | 语义记忆召回                           |
| `skills.spec.ts`                     | 技能列表 + 切换 + 命令面板             |
| `judge.spec.ts`                      | 评判器状态转移                         |
| `analytics.spec.ts`                  | 统计指标                               |
| `system-dialog.spec.ts`              | 系统对话框取消/确认                    |

### ⚠️ 空洞处理结论

#### 编辑与保存（✅ 完整覆盖）

**现状**：手动保存（Ctrl+S）已由现有 E2E 覆盖：

- `editor-autosave.spec.ts` 第 112 行：显式测试 `${modKey}+S` 快捷键触发手动保存，并验证 `actor === "user"` 的版本快照生成
- `version-history.spec.ts` 第 62 行：通过 `${modKey}+S` 创建用户版本后验证快照读取完整字段

**结论：编辑与保存路径已完整覆盖，包括 autosave 和手动保存两条管线。**

#### 导出（⚠️ 部分覆盖）

**现状**：`export-markdown.spec.ts` 验证 markdown 格式导出写入磁盘。Spec 支持 pdf/docx/txt/markdown 四种格式，仅 markdown 有 E2E。

**处理结论：markdown E2E 作为导出路径冒烟测试保留，其余格式由单元测试覆盖。**

理由：

1. 四种格式共享同一 IPC 通道和 ExportService 调度逻辑，markdown E2E 已验证完整通路
2. 各格式的差异点（渲染逻辑）已由后端单元测试覆盖：
   - `export-markdown.test.ts` — markdown 渲染
   - `export-pdf.test.ts` — PDF 渲染
   - `export-txt-docx.test.ts` — TXT/DOCX 渲染
3. pdf/docx 的 E2E 依赖系统级渲染引擎，环境脆弱且 CI 复现成本高

> 如后续需提升导出 E2E 覆盖率，优先补充 `export-txt.spec.ts`（无外部依赖），pdf/docx 建议维持单元测试。

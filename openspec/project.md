# CreoNow

更新时间：2026-03-07 11:40

AI 驱动的文字创作 IDE，Electron + React 18 + TypeScript + TipTap 2，Windows-first。

## Architecture

| Layer    | Path                     | Runtime           | Description                                                    |
| -------- | ------------------------ | ----------------- | -------------------------------------------------------------- |
| Renderer | `apps/desktop/renderer/` | Electron Renderer | React 组件、TipTap 编辑器、Zustand store、UI 交互              |
| Preload  | `apps/desktop/preload/`  | Electron Preload  | contextBridge，安全暴露 IPC API                                |
| Main     | `apps/desktop/main/`     | Electron Main     | 上下文引擎、知识图谱、记忆系统、技能系统、SQLite DAO、LLM 调用 |
| Shared   | `packages/shared/`       | Both              | IPC 类型定义、共享常量                                         |

## Directory Structure

```
CreoNow/
├── apps/desktop/           # Electron 桌面应用（monorepo 主包）
│   ├── main/src/           #   后端业务层（Electron 主进程）
│   ├── preload/src/        #   Preload 脚本
│   ├── renderer/src/       #   前端渲染层（React）
│   └── tests/              #   集成 / E2E 测试
├── packages/shared/        # 跨进程共享代码（IPC 类型等）
├── design/Variant/         # 设计资产 & Design Token
├── openspec/               # 项目规范（本目录）
│   ├── specs/              #   按模块组织的主规范（Source of Truth）
│   └── changes/            #   进行中的变更（Delta Specs）
├── scripts/                # 自动化脚本
└── .github/workflows/      # CI/CD
```

## Module Index

### 核心引擎（后端为主）

| Module             | Spec                                 | Description                                       |
| ------------------ | ------------------------------------ | ------------------------------------------------- |
| Context Engine     | `specs/context-engine/spec.md`       | 分层上下文管理、Token 预算分配与裁剪、Constraints |
| Knowledge Graph    | `specs/knowledge-graph/spec.md`      | 实体与关系管理、语义检索、角色管理系统            |
| Memory System      | `specs/memory-system/spec.md`        | 写作偏好学习、记忆存储与衰减                      |
| Skill System       | `specs/skill-system/spec.md`         | AI 技能抽象、三级作用域、技能执行                 |
| AI Service         | `specs/ai-service/spec.md`           | LLM 代理调用、流式响应、AI 面板、Judge            |
| Search & Retrieval | `specs/search-and-retrieval/spec.md` | 全文检索、RAG、向量嵌入、语义搜索                 |

### 用户界面（前端为主）

| Module        | Spec                                | Description                            |
| ------------- | ----------------------------------- | -------------------------------------- |
| Editor        | `specs/editor/spec.md`              | TipTap 编辑器、大纲、Diff 对比、禅模式 |
| Workbench     | `specs/workbench/spec.md`           | UI 外壳、布局、Surface、命令面板、设置 |
| Document Mgmt | `specs/document-management/spec.md` | 文档 CRUD、文件树、导出                |
| Project Mgmt  | `specs/project-management/spec.md`  | 项目生命周期、仪表盘、模板、引导       |

### 基础设施

| Module          | Spec                            | Description                        |
| --------------- | ------------------------------- | ---------------------------------- |
| IPC             | `specs/ipc/spec.md`             | 前后端通信契约、契约自动生成与校验 |
| Version Control | `specs/version-control/spec.md` | 快照、AI 修改标记、Diff、版本恢复  |

## Conventions

| Item             | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| Language         | TypeScript（strict mode）                                      |
| Package manager  | pnpm 8（`--frozen-lockfile`）                                  |
| Build tool       | Vite（via electron-vite）                                      |
| Styling          | Tailwind CSS 4                                                 |
| Component prims  | Radix UI                                                       |
| State management | Zustand                                                        |
| Editor           | TipTap 2                                                       |
| Database         | SQLite（better-sqlite3）                                       |
| Test framework   | Vitest                                                         |
| E2E              | Playwright                                                     |
| Testing SSOT     | `docs/references/testing/README.md`                              |
| CI               | GitHub Actions（`ci` + `merge-serial`）                            |
| Commit format    | `<type>: <summary> (#N)`                                       |

## Prohibitions

- 禁止跳过 spec 直接写代码
- 禁止先写实现再补测试
- 禁止直接修改主 spec（大型变更必须走 Proposal → Apply 流程；小型修复可直接 PR）
- 禁止 silent failure（异常必须有错误码、错误信息和日志）
- 禁止「先合并再修」（CI 不绿就不合并）
- 禁止手动合并 PR（必须用 auto-merge）
- 禁止脱离 `docs/references/testing/README.md` 自创测试约定
- 禁止 `any` 类型
- 禁止消耗真实 LLM API 额度（集成测试和 E2E 必须 mock）
- 禁止 `pnpm install` 不带 `--frozen-lockfile`

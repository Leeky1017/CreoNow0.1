# CN 文档现实对齐治理（Issue #600）

更新时间：2026-02-21 11:57

## 目标

对 CreoNow 仓库内会被后续 Agent 当作事实来源的文档进行“代码真实状态”对齐治理，并建立可被 CI 门禁校验的时间戳机制，防止文档静默漂移。

## 代码真实基线（治理相关）

- required checks：`openspec-log-guard` / `ci` / `merge-serial`（`.github/workflows/openspec-log-guard.yml:1`, `.github/workflows/ci.yml:1`, `.github/workflows/merge-serial.yml:1`）
- `ci` 为 PR 汇总门禁 job（`.github/workflows/ci.yml:190`）
- `pnpm install --frozen-lockfile` 在 CI 中被强制使用（`.github/workflows/ci.yml:177`）

## 文档-代码对齐矩阵（首批）

| 文档项                      | 发现（origin/main）                                                                         | 代码事实（证据）                                                                                                                                                 | 处理动作（本 PR）                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| README 安装命令             | `pnpm install` 未锁定依赖（`README.md:31 (origin/main)`）                                   | CI 强制 `pnpm install --frozen-lockfile`（`.github/workflows/ci.yml:177`）                                                                                       | 将 README 安装命令改为 `pnpm install --frozen-lockfile` 并补时间戳（`README.md`）                                                       |
| README 规范入口             | 指向不存在的 spec 与设计文档（`README.md:42-43 (origin/main)`）                             | OpenSpec 项目概述与模块索引入口为 `openspec/project.md`（`openspec/project.md:35`）；设计 SSOT 为 `design/DESIGN_DECISIONS.md`（`design/DESIGN_DECISIONS.md:1`） | 将 README “规范”改为 `openspec/project.md` / `openspec/specs/<module>/spec.md` / `design/DESIGN_DECISIONS.md` 并补时间戳（`README.md`） |
| 文件组织：main db 路径      | 将 main 的数据层写为 `dao/`（`docs/references/file-structure.md:24 (origin/main)`）         | Main 进程使用 `./db/*`（`apps/desktop/main/src/index.ts:8`）                                                                                                     | 将 `dao/` 修正为 `db/` 并补时间戳（`docs/references/file-structure.md`）                                                                |
| 文件组织：renderer 目录     | 缺少 `features/` 且误写 `pages/`（`docs/references/file-structure.md:31 (origin/main)`）    | Renderer 以 `features/*` 组织功能模块（`apps/desktop/renderer/src/App.tsx:4`）                                                                                   | 在源码结构中补 `features/`，移除 `pages/`，补齐 `lib/`/`surfaces/`，并补时间戳（`docs/references/file-structure.md`）                   |
| 文件组织：测试根目录        | 将测试根目录写为 `tests/`（`docs/references/file-structure.md:50 (origin/main)`）           | Monorepo 测试集中在 `apps/desktop/tests/*`（`package.json:17`）                                                                                                  | 将测试结构修正为 `apps/desktop/tests/*` 并补时间戳（`docs/references/file-structure.md`）                                               |
| 产品全景：更新字段          | 使用 `更新日期` 且缺少统一分钟级时间戳（`docs/PRODUCT_OVERVIEW.md:4 (origin/main)`）        | 时间戳治理要求 `更新时间：YYYY-MM-DD HH:mm`（`docs/references/document-timestamp-governance.md:13`）                                                             | 将头部改为 `更新时间：...`（前 5 行内）（`docs/PRODUCT_OVERVIEW.md`）                                                                   |
| 产品全景：OpenSpec 规模描述 | 写为 “5 套规范”（`docs/PRODUCT_OVERVIEW.md:63 (origin/main)`）                              | OpenSpec 模块索引包含 12 个模块 spec（`openspec/project.md:35`）+ 跨模块集成规范（`openspec/specs/cross-module-integration-spec.md:1`）                          | 更新 OpenSpec 目录说明，补 `project.md`/`changes/` 与规范规模描述（`docs/PRODUCT_OVERVIEW.md`）                                         |
| 产品全景：必读文档列表      | 指向不存在的 `openspec/specs/creonow-*`（`docs/PRODUCT_OVERVIEW.md:671-672 (origin/main)`） | 模块 spec 路径为 `openspec/specs/<module>/spec.md`（`openspec/project.md:39`）                                                                                   | 将“必读文档”改为 `openspec/project.md` + `openspec/specs/<module>/spec.md` + `docs/delivery-skill.md` 等（`docs/PRODUCT_OVERVIEW.md`）  |
| 产品全景：安装命令          | `pnpm install` 未锁定依赖（`docs/PRODUCT_OVERVIEW.md:633 (origin/main)`）                   | CI 强制 `pnpm install --frozen-lockfile`（`.github/workflows/ci.yml:177`）                                                                                       | 将安装命令改为 `pnpm install --frozen-lockfile`（`docs/PRODUCT_OVERVIEW.md`）                                                           |

## 时间戳治理落地（门禁）

- 规范文档：`docs/references/document-timestamp-governance.md`
- 校验脚本：`scripts/check_doc_timestamps.py`
- CI 接入：新增 `doc-timestamp-gate` 并纳入 `ci` 的 `needs`（`.github/workflows/ci.yml:25`, `.github/workflows/ci.yml:193`）
- Preflight 接入：`scripts/agent_pr_preflight.py` 调用脚本（`scripts/agent_pr_preflight.py:516`）

## 残留风险与后续批次

- `docs/Notion/**` 为历史导入文档，存在与现行 CI/门禁不一致的描述风险；后续将以“目录级声明 + 索引链接”方式明确其非事实来源，避免误用。
- 部分历史 Rulebook task 仍可能引用已不存在的 OpenSpec 路径（如 `openspec/specs/creonow-*`）；本批次已增加索引说明 `rulebook/tasks/README.md`，后续以“归档/清理 active 旧 task”方式进一步降噪。

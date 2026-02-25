# CN 文档现实对齐治理（二期）（Issue #602）

更新时间：2026-02-21 12:45

## 目标

对 `docs/PRODUCT_OVERVIEW.md` 中仍存在的“仓库真实状态漂移”进行对齐，避免后续 Agent 被过期路径/不存在的规范命名误导。

## 代码真实基线（本批次）

- OpenSpec 索引与模块 spec 路径：`openspec/project.md:16-62`
- OpenSpec specs 目录结构：`openspec/specs/*`（模块目录）+ `openspec/specs/cross-module-integration-spec.md`
- 审计材料目录：`CN-Code-Audit-2026-02-14/`
- 审计修复变更归档：`openspec/changes/archive/aud-*`

## 文档-代码对齐矩阵（Issue #602）

| 文档项                          | 当前说法（origin/main）                                                                          | 代码/仓库事实（证据）                                                                                               | 结论       | 处理动作（本批次）                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| PRODUCT_OVERVIEW：CI 门禁       | 用固定 YAML 片段列举 job，容易漂移（`docs/PRODUCT_OVERVIEW.md:523-541 (origin/main)`）           | required checks 以 branch protection 为准（`openspec/project.md:78`；workflow 见 `.github/workflows/*.yml`）        | 漂移风险高 | 改为“required checks + 指向 workflow 文件”的描述，避免写死 job 列表（`docs/PRODUCT_OVERVIEW.md`） |
| PRODUCT_OVERVIEW：AGENTS 摘要   | 自行新增/强化治理条款（如 JSDoc 必须）（`docs/PRODUCT_OVERVIEW.md:551-556 (origin/main)`）       | 宪法以 `AGENTS.md` 为主源（`AGENTS.md:44-200`）                                                                     | 以主源为准 | 改为引用主源并仅摘要 P1–P7，不新增新规则（`docs/PRODUCT_OVERVIEW.md`）                            |
| PRODUCT_OVERVIEW：OpenSpec 体系 | 引用不存在的 `openspec/specs/creonow-*` 目录（`docs/PRODUCT_OVERVIEW.md:560-568 (origin/main)`） | 实际模块规范路径为 `openspec/specs/<module>/spec.md` 且在 `openspec/project.md` 索引（`openspec/project.md:35-62`） | 事实错误   | 重写 OpenSpec 目录树与说明，改为当前结构（`docs/PRODUCT_OVERVIEW.md`）                            |
| PRODUCT_OVERVIEW：审计修复索引  | 引用不存在的 `creonow-audit-remediation`（`docs/PRODUCT_OVERVIEW.md:605 (origin/main)`）         | 审计材料位于 `CN-Code-Audit-2026-02-14/`；修复变更已归档为 `openspec/changes/archive/aud-*`                         | 事实错误   | 改为“目录索引”并删除写死数量/分级，避免静默漂移（`docs/PRODUCT_OVERVIEW.md`）                     |

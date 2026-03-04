# 文档时间戳治理

更新时间：2026-03-04 16:00

## 目标

受管文档默认可追溯、可审计，避免文档静默漂移误导后续 Agent 与开发者。

## 规则（硬要求）

### 时间戳格式与位置

- 必须包含时间戳行：`更新时间：YYYY-MM-DD HH:mm`
- 必须出现在文档标题下方，且位于文件前 5 行内

### 受管范围（门禁校验范围）

仅校验本 PR 变更的 Markdown 文件，且路径命中以下任一规则：

- `README*.md`
- `docs/**`
- `openspec/**`

### 例外（不纳入门禁校验）

- `docs/Notion/**`（历史导入/草案，默认不作为事实来源）

## 自动校验

### 脚本

- `scripts/check_doc_timestamps.py`

行为：

- 默认检查 `origin/main..HEAD` 的变更文件
- 对受管范围内的 `.md` 文件验证时间戳存在与格式
- 无受管文档变更时直接通过

### CI 接入

在 `.github/workflows/ci.yml` 中运行 `doc-timestamp-gate` job，并接入 required check `ci` 的 `needs` 列表。

### Preflight 接入

`scripts/agent_pr_preflight.py` 会调用 `python3 scripts/check_doc_timestamps.py`，本地提交前即可发现缺少时间戳的问题。

## 维护约定

- 任何对受管文档的内容变更都必须同步更新该文档的时间戳行
- 避免在文档中写入易漂移的精确统计数字（如“X 个模块 / Y 条通道”）；如必须写明，需确保可由代码或门禁自动校验

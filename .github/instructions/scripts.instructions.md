---
applyTo: "scripts/**"
description: "CreoNow delivery and automation script rules"
---

- 把 `scripts/` 视为交付控制面，不是一次性 glue code。
- 保持 `set -euo pipefail`、退出码 `0/1/2`、输出前缀 `[OK]/[FAIL]/[SKIP]/[WARN]` 约定。
- 改动 GitHub 交付逻辑时，必须同步更新 `scripts/tests/` 与 `scripts/README.md`。
- 优先复用 `agent_github_delivery.py` 的结构化 payload，避免在 shell 中散落重复 PR/评论模板。

---
applyTo: "docs/**/*.md"
description: "CreoNow governed delivery documentation rules"
---

- `docs/delivery-skill.md` 与 `docs/references/toolchain.md` 属于交付契约，改动 GitHub / PR / audit 流程时必须同步更新。
- 受治理文档必须维护时间戳，并通过 `python3 scripts/check_doc_timestamps.py` 校验。
- 若顶层 `AGENTS.md` / `CLAUDE.md` 与文档规则冲突，必须在同一变更中一并修正。

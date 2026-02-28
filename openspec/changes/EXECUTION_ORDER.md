# Active Changes Execution Order

更新时间：2026-02-28 10:43

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **0**（已完成 14，剩余 0）。
- 执行模式：**审计整改 3 Wave 推进**（基于 `docs/CN-审计整改-change拆解计划-2026-02-25.md`），已完成全量收口。
- 规则：
  - 任一 change 开始 Red 前，必须完成该 change 的依赖同步检查（Dependency Sync Check）。
  - 任一 wave 完成后，必须完成主会话审计签字与归档收口，才进入下一 wave。
  - 并行 lane 控制在 2-4 条，避免高冲突文件同时改动。

## 执行顺序

### Wave 1（P0，止血）— 已完成

| Lane | Change | 依赖 | 状态 | PR |
|------|--------|------|------|-----|
| A | `audit-fatal-error-visibility-guardrails`（C2） | 无 | DONE | #665 |
| B | `audit-degradation-telemetry-escalation`（C3） | 无 | DONE | #666 |

### Wave 2（P1 + C10，结构收敛）— 已完成

| Lane | Change | 依赖 | 状态 | PR |
|------|--------|------|------|-----|
| A | `audit-ipc-result-unification`（C4） | C2 | DONE | #674 |
| A | `audit-shared-runtime-utils-unification`（C5） | C4 | DONE | #684 |
| B | `audit-contextfs-async-ssot`（C6） | C4 | DONE | #683 |
| D | `audit-editor-save-queue-extraction`（C10） | 无 | DONE | #673 |
| B | `audit-dead-code-and-path-resolution-cleanup`（C12） | C10 | DONE | #682 |
| C | `audit-error-language-standardization`（C13） | C2 | DONE | #681 |
| D | `audit-memory-leak-prevention`（C15） | 无 | DONE | #680 |

> C12/C13/C15 原属 Wave 3，因依赖已满足且无文件冲突，提前并入 Wave 2 第二批执行。

### Wave 3（P2/P3，质量抬升）— 已完成

| Lane | Change | 依赖 | 状态 | PR |
|------|--------|------|------|-----|
| A | `audit-proxy-settings-normalization`（C7） | C4✅ | DONE | #687 |
| A | `audit-type-contract-alignment`（C8） | C7✅ | DONE | #690 |
| B | `audit-store-refresh-governance`（C9） | C1✅, C3✅ | DONE | #688 |
| C | `audit-legacy-adapter-retirement`（C11） | C8✅ | DONE | #700 |
| D | `audit-store-provider-style-unification`（C14） | C8✅, C11✅ | DONE | #704 |

> 关键路径 `C8 → C11 → C14` 已全量完成并归档。

## 依赖说明

### 已归档基线
- `issue-606-phase-1~4`：Workbench lane 已完成收口。
- `issue-617-*`（7 个 change）：Backend lane 已完成收口。
- `audit-race-serialization-core`（C1）：已完成实现与归档，可作为 C9 的并发治理基线。

### 审计整改依赖拓扑

```
C1（已归档） ────────────────────────────→ C9✅ → C11✅
C2✅ ──→ C4✅ ──→ C5✅                      ↑
  │        ├──→ C6✅ ──→ C7✅ ──→ C8✅ ──────┘──→ C14✅
  │        │                    └──→ C11✅
  └──→ C13✅
C3✅ ─────────────────────────────────→ C9✅
C10✅ ──→ C12✅
C15✅
```

## Wave 3 并行策略

### Phase 1（已完成）
- **C7 + C9 并行** — PR #687/#688 已合并

### Phase 2（已完成）
- **C8 串行** — PR #690 已合并

### Phase 3（已完成）
- **C11 串行** — PR #700 已合并

### Phase 4（已完成）
- **C14 串行** — PR #704 已合并，change 已归档

## 进度快照

- 审计整改 Wave 1：C1/C2/C3 全部完成。PR #661/#665/#666 已合并。
- 审计整改 Wave 2：C4/C5/C6/C10/C12/C13/C15 全部完成。PR #673/#674/#680/#681/#682/#683/#684 已合并。
- 审计整改 Wave 3：C7/C8/C9/C11/C14 全部完成。PR #687/#688/#690/#700/#704 已合并。
- 历史归档：ISSUE-606（Workbench lane 4 phases）、ISSUE-617（Backend lane 7 changes）已全部归档。
- 当前 active changes：**0**。

## 维护规则

- 新增活跃 change 时，必须同步更新本文件中的执行模式、顺序、依赖与进度快照。
- 任一活跃 change 的范围、依赖、状态变化时，必须同步更新本文件。
- 未同步本文件时，不得宣称多变更执行顺序已确认。

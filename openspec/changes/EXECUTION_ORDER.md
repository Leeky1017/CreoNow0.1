# Active Changes Execution Order

更新时间：2026-02-27 10:35

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **14**。
- 执行模式：**审计整改 3 Wave 推进**（基于 `docs/CN-审计整改-change拆解计划-2026-02-25.md`）。
- 规则：
  - 任一 change 开始 Red 前，必须完成该 change 的依赖同步检查（Dependency Sync Check）。
  - 任一 wave 完成后，必须完成主会话审计签字与归档收口，才进入下一 wave。
  - 并行 lane 控制在 2-4 条，避免高冲突文件同时改动。

## 执行顺序

### Wave 1（P0，止血）

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `audit-fatal-error-visibility-guardrails`（C2） | 无 | PENDING |
| B | `audit-degradation-telemetry-escalation`（C3） | 无 | PENDING |

### Wave 2（P1 + C10，结构收敛）

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `audit-ipc-result-unification`（C4） | C2 | PENDING |
| A | `audit-shared-runtime-utils-unification`（C5） | C4 | PENDING |
| B | `audit-contextfs-async-ssot`（C6） | C4 | PENDING |
| B | `audit-proxy-settings-normalization`（C7） | C4 | PENDING |
| C | `audit-type-contract-alignment`（C8） | C7 | PENDING |
| D | `audit-editor-save-queue-extraction`（C10） | 无 | PENDING |

> 关键路径：`C4 → (C5 ∥ C6) → C7 → C8`。Lane D 独立并行。

### Wave 3（P2/P3，质量抬升）

| Lane | Change | 依赖 | 状态 |
|------|--------|------|------|
| A | `audit-store-refresh-governance`（C9） | C3（C1 已归档） | PENDING |
| A | `audit-legacy-adapter-retirement`（C11） | C8 | PENDING |
| B | `audit-dead-code-and-path-resolution-cleanup`（C12） | C10 | PENDING |
| C | `audit-error-language-standardization`（C13） | C2 | PENDING |
| C | `audit-store-provider-style-unification`（C14） | C8 | PENDING |
| D | `audit-memory-leak-prevention`（C15） | 无 | PENDING |

## 依赖说明

### 已归档基线
- `issue-606-phase-1~4`：Workbench lane 已完成收口。
- `issue-617-*`（7 个 change）：Backend lane 已完成收口。
- `audit-race-serialization-core`（C1）：已完成实现与归档，可作为 C9 的并发治理基线。

### 审计整改依赖拓扑

```
C1（已归档） ────────────────────────────→ C9 → C11
C2 ──→ C4 ──→ C5                          ↑
  │      ├──→ C6 ──→ C7 ──→ C8 ──────────┘──→ C14
  │      │                    └──→ C11
  └──→ C13
C3 ─────────────────────────────────────→ C9
C10（独立）──→ C12
C15（独立）
```

## 波次并行建议

- Wave 1（P0 止血）：C1 已归档；当前剩余 C2/C3 两条独立 lane，可并行推进。
- Wave 2（P1 结构收敛 + C10）：C4 是关键路径起点；C10 独立并行。
- Wave 3（P2/P3 质量抬升）：C9/C11 串行（Lane A），C12 依赖 C10（Lane B），C13/C14 串行（Lane C），C15 独立（Lane D）。

## 进度快照

- 审计整改 Wave 1：C1 已归档完成；C2/C3 已创建 change 目录，状态 PENDING。
- 审计整改 Wave 2：C4/C5/C6/C7/C8/C10 已创建 change 目录，状态 PENDING。
- 审计整改 Wave 3：C9/C11/C12/C13/C14/C15 已创建 change 目录，状态 PENDING。
- 历史归档：ISSUE-606（Workbench lane 4 phases）、ISSUE-617（Backend lane 7 changes）已全部归档。

## 维护规则

- 任一活跃 change 的范围、依赖、状态发生变化时，必须同步更新本文件。
- 任一 Phase 依赖关系变化时，必须同步更新“执行顺序/依赖说明/进度快照”。
- 未同步本文件时，不得宣称多变更执行顺序已确认。

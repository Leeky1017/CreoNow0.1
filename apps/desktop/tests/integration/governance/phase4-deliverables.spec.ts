import assert from "node:assert/strict";

import {
  validateDeliverablesAndAdr,
  type Phase4DeliverablesLedgerInput,
} from "../../../../../scripts/phase4-governance";

const completeLedger: Phase4DeliverablesLedgerInput = {
  deliverables: [
    {
      id: "visual-audit-report",
      status: "accepted",
      updatedAt: "2026-02-24T02:10:00.000Z",
      owner: "design-owner",
      adrId: "ADR-606-P4-001",
    },
    {
      id: "screenshot-baseline-library",
      status: "reviewing",
      updatedAt: "2026-02-24T02:11:00.000Z",
      owner: "qa-owner",
      adrId: "ADR-606-P4-001",
    },
    {
      id: "benchmark-report",
      status: "accepted",
      updatedAt: "2026-02-24T02:12:00.000Z",
      owner: "perf-owner",
      adrId: "ADR-606-P4-001",
    },
    {
      id: "adr-catalog",
      status: "accepted",
      updatedAt: "2026-02-24T02:13:00.000Z",
      owner: "arch-owner",
    },
    {
      id: "ci-gate-config",
      status: "accepted",
      updatedAt: "2026-02-24T02:14:00.000Z",
      owner: "release-owner",
      adrId: "ADR-606-P4-001",
    },
    {
      id: "i18n-strategy-record",
      status: "reviewing",
      updatedAt: "2026-02-24T02:15:00.000Z",
      owner: "frontend-owner",
      adrId: "ADR-606-P4-001",
    },
  ],
  adrs: [
    {
      id: "ADR-606-P4-001",
      status: "Accepted",
      background: "Phase 4 needs a governance-first closure baseline.",
      decision:
        "Deliverables and quality gates are blocked by ADR-linked governance checks.",
      alternatives: [
        "Keep ADR optional for architecture-impacting changes.",
        "Gate only by checklist without ADR traceability.",
      ],
      consequences:
        "Review flow has stronger auditability but requires ADR maintenance discipline.",
    },
  ],
};

// PM-P4-S1
// 关键决策以 ADR 落盘并关联交付物
{
  const result = validateDeliverablesAndAdr(completeLedger);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
}

// PM-P4-S2
// 缺失 ADR 或交付物台账信息时阻断审阅
{
  const brokenLedger: Phase4DeliverablesLedgerInput = {
    ...completeLedger,
    deliverables: completeLedger.deliverables.map((item) =>
      item.id === "benchmark-report"
        ? {
            ...item,
            adrId: undefined,
          }
        : item,
    ),
  };

  const result = validateDeliverablesAndAdr(brokenLedger);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.code === "ADR_LINK_MISSING"),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}

// PM-P4-S1
// 关联 ADR 处于未接受状态时，交付物不能进入审阅通过态
{
  const proposedAdrLedger: Phase4DeliverablesLedgerInput = {
    ...completeLedger,
    adrs: completeLedger.adrs.map((adr) =>
      adr.id === "ADR-606-P4-001"
        ? {
            ...adr,
            status: "Proposed",
          }
        : adr,
    ),
  };

  const result = validateDeliverablesAndAdr(proposedAdrLedger);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.code === "ADR_NOT_ACCEPTED"),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}

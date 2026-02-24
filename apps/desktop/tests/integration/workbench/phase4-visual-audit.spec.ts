import assert from "node:assert/strict";

import {
  evaluateVisualAuditClosure,
  type Phase4VisualAuditItem,
} from "../../../main/src/services/workbench/phase4-delivery-gate";

// WB-P4-S1: 视觉审计项形成完整闭环并通过验收 [ADDED]
{
  const auditItems: Phase4VisualAuditItem[] = [
    {
      id: "WB-AUDIT-001",
      owner: "ui-owner",
      dueAt: "2026-02-24",
      remediationAction: "adjust command palette spacing",
      retestStatus: "PASS",
      evidenceLink: "https://example.local/evidence/wb-audit-001",
    },
    {
      id: "WB-AUDIT-002",
      owner: "ux-owner",
      dueAt: "2026-02-24",
      remediationAction: "accept tiny icon baseline mismatch",
      retestStatus: "WAIVED",
      waivedApproval: {
        approver: "owner",
        reason: "known low-risk anti-aliasing drift",
      },
      evidenceLink: "https://example.local/evidence/wb-audit-002",
    },
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, true);
  assert.deepEqual(gate.blockers, []);
}

// WB-P4-S2: 存在未闭环审计项时阻断阶段验收 [ADDED]
{
  const auditItems: Phase4VisualAuditItem[] = [
    {
      id: "WB-AUDIT-003",
      owner: "ui-owner",
      dueAt: "2026-02-24",
      remediationAction: "",
      retestStatus: "FAIL",
      evidenceLink: "https://example.local/evidence/wb-audit-003",
    },
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(gate.blockers.some((blocker) => blocker.itemId === "WB-AUDIT-003"), true);
}

// WB-P4-S2: non-empty id required
{
  const auditItems: Phase4VisualAuditItem[] = [
    {
      id: "   ",
      owner: "ui-owner",
      dueAt: "2026-02-24",
      remediationAction: "adjust spacing",
      retestStatus: "PASS",
      evidenceLink: "https://example.local/evidence/wb-audit-empty-id",
    },
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some((blocker) => blocker.reason === "missing id"),
    true,
  );
}

// WB-P4-S2: id must be unique
{
  const auditItems: Phase4VisualAuditItem[] = [
    {
      id: "WB-AUDIT-DUP",
      owner: "ui-owner",
      dueAt: "2026-02-24",
      remediationAction: "adjust spacing",
      retestStatus: "PASS",
      evidenceLink: "https://example.local/evidence/wb-audit-dup-1",
    },
    {
      id: "WB-AUDIT-DUP",
      owner: "ux-owner",
      dueAt: "2026-02-24",
      remediationAction: "align token usage",
      retestStatus: "PASS",
      evidenceLink: "https://example.local/evidence/wb-audit-dup-2",
    },
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some((blocker) => blocker.reason === "duplicate id"),
    true,
  );
}

// WB-P4-S2: owner and dueAt required
{
  const auditItems: Phase4VisualAuditItem[] = [
    {
      id: "WB-AUDIT-META-001",
      owner: "",
      dueAt: "",
      remediationAction: "align heading spacing",
      retestStatus: "PASS",
      evidenceLink: "https://example.local/evidence/wb-audit-meta-001",
    },
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some((blocker) => blocker.reason === "missing owner"),
    true,
  );
  assert.equal(
    gate.blockers.some((blocker) => blocker.reason === "missing dueAt"),
    true,
  );
}

// WB-P4-S2: WAIVED requires approval metadata
{
  const auditItems: Phase4VisualAuditItem[] = [
    {
      id: "WB-AUDIT-WAIVED-001",
      owner: "ui-owner",
      dueAt: "2026-02-24",
      remediationAction: "accept low-risk pixel drift",
      retestStatus: "WAIVED",
      evidenceLink: "https://example.local/evidence/wb-audit-waived-001",
      waivedApproval: {
        approver: "",
        reason: "",
      },
    },
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some(
      (blocker) => blocker.reason === "waived item requires approval metadata",
    ),
    true,
  );
}

// WB-P4-S2: PASS or WAIVED enforcement
{
  const auditItems: Phase4VisualAuditItem[] = [
    {
      id: "WB-AUDIT-STATUS-001",
      owner: "ui-owner",
      dueAt: "2026-02-24",
      remediationAction: "adjust token contrast",
      retestStatus: "FAIL",
      evidenceLink: "https://example.local/evidence/wb-audit-status-001",
    },
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some(
      (blocker) => blocker.reason === "retest status is not PASS or approved WAIVED",
    ),
    true,
  );
}

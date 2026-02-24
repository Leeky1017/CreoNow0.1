import assert from "node:assert/strict";

import {
  evaluateVisualAuditClosure,
  type Phase4VisualAuditItem,
} from "../../../main/src/services/workbench/phase4-delivery-gate";

function buildAuditItem(
  overrides: Partial<Phase4VisualAuditItem> & Pick<Phase4VisualAuditItem, "id">,
): Phase4VisualAuditItem {
  const { id, ...rest } = overrides;

  return {
    id,
    owner: "ui-owner",
    dueAt: "2026-02-24",
    source: "internal-audit",
    remediationAction: "adjust spacing",
    retestStatus: "PASS",
    evidenceLink: `https://example.local/evidence/${id.toLowerCase()}`,
    ...rest,
  };
}

// WB-P4-S1: 视觉审计项形成完整闭环并通过验收 [ADDED]
{
  const auditItems: Phase4VisualAuditItem[] = [
    buildAuditItem({
      id: "WB-AUDIT-001",
      source: "internal-audit",
      remediationAction: "adjust command palette spacing",
    }),
    buildAuditItem({
      id: "WB-AUDIT-002",
      owner: "ux-owner",
      source: "reference-benchmark",
      referenceSystem: "notion",
      remediationAction: "accept tiny icon baseline mismatch",
      retestStatus: "WAIVED",
      waivedApproval: {
        approver: "owner",
        reason: "known low-risk anti-aliasing drift",
      },
    }),
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, true);
  assert.deepEqual(gate.blockers, []);
}

// WB-P4-S2: 存在未闭环审计项时阻断阶段验收 [ADDED]
{
  const auditItems: Phase4VisualAuditItem[] = [
    buildAuditItem({
      id: "WB-AUDIT-003",
      remediationAction: "",
      retestStatus: "FAIL",
    }),
    buildAuditItem({
      id: "WB-AUDIT-004",
      source: "reference-benchmark",
      referenceSystem: "cursor",
    }),
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some((blocker) => blocker.itemId === "WB-AUDIT-003"),
    true,
  );
}

// WB-P4-S2: non-empty id required
{
  const auditItems: Phase4VisualAuditItem[] = [
    buildAuditItem({
      id: "   ",
    }),
    buildAuditItem({
      id: "WB-AUDIT-005",
      source: "reference-benchmark",
      referenceSystem: "linear",
    }),
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
    buildAuditItem({
      id: "WB-AUDIT-DUP",
    }),
    buildAuditItem({
      id: "WB-AUDIT-DUP",
      owner: "ux-owner",
      source: "reference-benchmark",
      referenceSystem: "linear",
      remediationAction: "align token usage",
    }),
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
    buildAuditItem({
      id: "WB-AUDIT-META-001",
      owner: "",
      dueAt: "",
    }),
    buildAuditItem({
      id: "WB-AUDIT-META-002",
      source: "reference-benchmark",
      referenceSystem: "obsidian",
    }),
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
    buildAuditItem({
      id: "WB-AUDIT-WAIVED-001",
      remediationAction: "accept low-risk pixel drift",
      retestStatus: "WAIVED",
      source: "reference-benchmark",
      referenceSystem: "ia-writer",
      waivedApproval: {
        approver: "",
        reason: "",
      },
    }),
    buildAuditItem({
      id: "WB-AUDIT-WAIVED-002",
      source: "internal-audit",
    }),
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
    buildAuditItem({
      id: "WB-AUDIT-STATUS-001",
      remediationAction: "adjust token contrast",
      retestStatus: "FAIL",
    }),
    buildAuditItem({
      id: "WB-AUDIT-STATUS-002",
      source: "reference-benchmark",
      referenceSystem: "notion",
    }),
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some(
      (blocker) =>
        blocker.reason === "retest status is not PASS or approved WAIVED",
    ),
    true,
  );
}

// WB-P4-S2: audit input must include reference benchmark coverage
{
  const auditItems: Phase4VisualAuditItem[] = [
    buildAuditItem({
      id: "WB-AUDIT-COVERAGE-001",
      source: "internal-audit",
    }),
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some(
      (blocker) => blocker.reason === "missing reference benchmark coverage",
    ),
    true,
  );
}

// WB-P4-S2: audit input must include internal visual audit coverage
{
  const auditItems: Phase4VisualAuditItem[] = [
    buildAuditItem({
      id: "WB-AUDIT-COVERAGE-002",
      source: "reference-benchmark",
      referenceSystem: "cursor",
    }),
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some(
      (blocker) => blocker.reason === "missing internal visual audit coverage",
    ),
    true,
  );
}

// WB-P4-S2: reference benchmark items must include target system
{
  const auditItems: Phase4VisualAuditItem[] = [
    buildAuditItem({
      id: "WB-AUDIT-REFERENCE-001",
      source: "internal-audit",
    }),
    buildAuditItem({
      id: "WB-AUDIT-REFERENCE-002",
      source: "reference-benchmark",
      referenceSystem: undefined,
    }),
  ];

  const gate = evaluateVisualAuditClosure(auditItems);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.blockers.some(
      (blocker) => blocker.reason === "missing reference system",
    ),
    true,
  );
}

export type Phase4RetestStatus = "PASS" | "FAIL" | "WAIVED";

export type Phase4Theme = "light" | "dark";

export type Phase4VisualAuditItem = {
  id: string;
  owner: string;
  dueAt: string;
  remediationAction?: string;
  retestStatus?: Phase4RetestStatus;
  evidenceLink?: string;
  waivedApproval?: {
    approver: string;
    reason: string;
  };
};

export type Phase4AuditBlocker = {
  itemId: string;
  reason: string;
};

export function evaluateVisualAuditClosure(
  items: readonly Phase4VisualAuditItem[],
): { ok: boolean; blockers: Phase4AuditBlocker[] } {
  const blockers: Phase4AuditBlocker[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    const normalizedId = item.id.trim();
    const itemId = normalizedId || "UNKNOWN";
    if (!normalizedId) {
      blockers.push({
        itemId,
        reason: "missing id",
      });
    } else if (seenIds.has(normalizedId)) {
      blockers.push({
        itemId,
        reason: "duplicate id",
      });
    } else {
      seenIds.add(normalizedId);
    }

    if (!item.owner.trim()) {
      blockers.push({
        itemId,
        reason: "missing owner",
      });
    }

    if (!item.dueAt.trim()) {
      blockers.push({
        itemId,
        reason: "missing dueAt",
      });
    }

    const remediationAction = item.remediationAction?.trim();
    if (!remediationAction) {
      blockers.push({
        itemId,
        reason: "missing remediation action",
      });
    }

    const evidenceLink = item.evidenceLink?.trim();
    if (!evidenceLink) {
      blockers.push({
        itemId,
        reason: "missing evidence link",
      });
    }

    if (item.retestStatus === "PASS") {
      continue;
    }

    if (item.retestStatus === "WAIVED") {
      const approver = item.waivedApproval?.approver?.trim();
      const reason = item.waivedApproval?.reason?.trim();
      if (approver && reason) {
        continue;
      }
      blockers.push({
        itemId,
        reason: "waived item requires approval metadata",
      });
      continue;
    }

    blockers.push({
      itemId,
      reason: "retest status is not PASS or approved WAIVED",
    });
  }

  return {
    ok: blockers.length === 0,
    blockers,
  };
}

export type Phase4BaselineView = {
  screen: string;
  state: string;
};

export const PHASE4_REQUIRED_BASELINE_VIEWS: readonly Phase4BaselineView[] = [
  { screen: "dashboard", state: "default" },
  { screen: "editor", state: "sidebar-expanded" },
  { screen: "editor", state: "sidebar-collapsed" },
  { screen: "zen-mode", state: "default" },
  { screen: "ai-panel", state: "empty" },
  { screen: "ai-panel", state: "streaming" },
  { screen: "ai-panel", state: "completed" },
  { screen: "kg-panel", state: "empty" },
  { screen: "kg-panel", state: "with-nodes" },
  { screen: "command-palette", state: "default" },
  { screen: "settings-modal", state: "default" },
] as const;

export type Phase4BaselineCaptureEntry = {
  screen: string;
  state: string;
  theme: Phase4Theme;
  baselinePath?: string;
  afterPath?: string;
};

export type Phase4BaselineMissingEntry = {
  screen: string;
  state: string;
  theme: Phase4Theme;
  reason: "missing-entry" | "missing-baseline" | "missing-after";
};

function buildBaselineKey(
  screen: string,
  state: string,
  theme: Phase4Theme,
): string {
  return `${screen}::${state}::${theme}`;
}

export function evaluateBaselineCaptureCompleteness(
  entries: readonly Phase4BaselineCaptureEntry[],
): { ok: boolean; missing: Phase4BaselineMissingEntry[] } {
  const index = new Map<string, Phase4BaselineCaptureEntry>();
  for (const entry of entries) {
    const key = buildBaselineKey(entry.screen, entry.state, entry.theme);
    index.set(key, entry);
  }

  const missing: Phase4BaselineMissingEntry[] = [];
  const requiredThemes: readonly Phase4Theme[] = ["light", "dark"] as const;

  for (const view of PHASE4_REQUIRED_BASELINE_VIEWS) {
    for (const theme of requiredThemes) {
      const key = buildBaselineKey(view.screen, view.state, theme);
      const capture = index.get(key);

      if (!capture) {
        missing.push({
          screen: view.screen,
          state: view.state,
          theme,
          reason: "missing-entry",
        });
        continue;
      }

      if (!capture.baselinePath?.trim()) {
        missing.push({
          screen: view.screen,
          state: view.state,
          theme,
          reason: "missing-baseline",
        });
      }
      if (!capture.afterPath?.trim()) {
        missing.push({
          screen: view.screen,
          state: view.state,
          theme,
          reason: "missing-after",
        });
      }
    }
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}

export type Phase4VisualDiffResult = {
  viewId: string;
  diffRatio: number;
};

export function evaluateVisualRegressionDiff(input: {
  threshold: number;
  results: readonly Phase4VisualDiffResult[];
}): { ok: boolean; blockedBy: Phase4VisualDiffResult[] } {
  const blockedBy = input.results.filter(
    (result) => result.diffRatio > input.threshold,
  );
  return {
    ok: blockedBy.length === 0,
    blockedBy,
  };
}

export type Phase4BenchmarkInput = {
  commandPaletteInvokeMs: number;
  workspaceInteractionMs: number;
  mainContentWidthPx: number;
  mainContentMinWidthPx: number;
};

export type Phase4BenchmarkFailure = {
  metric:
    | "commandPaletteInvokeMs"
    | "workspaceInteractionMs"
    | "mainContentWidthPx";
  actual: number;
  expected: string;
};

export function evaluatePhase4Benchmark(input: Phase4BenchmarkInput): {
  status: "PASS" | "FAIL";
  readyForCloseout: boolean;
  needsNextPolishRound: boolean;
  failures: Phase4BenchmarkFailure[];
} {
  const failures: Phase4BenchmarkFailure[] = [];

  if (input.commandPaletteInvokeMs >= 100) {
    failures.push({
      metric: "commandPaletteInvokeMs",
      actual: input.commandPaletteInvokeMs,
      expected: "<100ms",
    });
  }
  if (input.workspaceInteractionMs >= 100) {
    failures.push({
      metric: "workspaceInteractionMs",
      actual: input.workspaceInteractionMs,
      expected: "<100ms",
    });
  }
  if (input.mainContentWidthPx < input.mainContentMinWidthPx) {
    failures.push({
      metric: "mainContentWidthPx",
      actual: input.mainContentWidthPx,
      expected: `>=${input.mainContentMinWidthPx.toString()}px`,
    });
  }

  const status = failures.length === 0 ? "PASS" : "FAIL";
  return {
    status,
    readyForCloseout: status === "PASS",
    needsNextPolishRound: status === "FAIL",
    failures,
  };
}

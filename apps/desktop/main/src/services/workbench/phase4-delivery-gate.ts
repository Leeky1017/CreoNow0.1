export type Phase4RetestStatus = "PASS" | "FAIL" | "WAIVED";

export type Phase4Theme = "light" | "dark";

export type Phase4VisualAuditSource = "internal-audit" | "reference-benchmark";

export type Phase4ReferenceSystem =
  | "notion"
  | "cursor"
  | "linear"
  | "ia-writer"
  | "obsidian";

export type Phase4VisualAuditItem = {
  id: string;
  owner: string;
  dueAt: string;
  source: Phase4VisualAuditSource;
  referenceSystem?: Phase4ReferenceSystem;
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

const PHASE4_REFERENCE_SYSTEMS = new Set<Phase4ReferenceSystem>([
  "notion",
  "cursor",
  "linear",
  "ia-writer",
  "obsidian",
]);

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function evaluateVisualAuditClosure(
  items: readonly Phase4VisualAuditItem[],
): { ok: boolean; blockers: Phase4AuditBlocker[] } {
  const blockers: Phase4AuditBlocker[] = [];
  const seenIds = new Set<string>();
  let hasInternalAuditCoverage = false;
  let hasReferenceBenchmarkCoverage = false;

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

    if (!hasText(item.owner)) {
      blockers.push({
        itemId,
        reason: "missing owner",
      });
    }

    if (!hasText(item.dueAt)) {
      blockers.push({
        itemId,
        reason: "missing dueAt",
      });
    }

    if (item.source === "internal-audit") {
      hasInternalAuditCoverage = true;
    } else if (item.source === "reference-benchmark") {
      hasReferenceBenchmarkCoverage = true;
      if (
        !item.referenceSystem ||
        !PHASE4_REFERENCE_SYSTEMS.has(item.referenceSystem)
      ) {
        blockers.push({
          itemId,
          reason: "missing reference system",
        });
      }
    } else {
      blockers.push({
        itemId,
        reason: "invalid audit source",
      });
    }

    if (!hasText(item.remediationAction)) {
      blockers.push({
        itemId,
        reason: "missing remediation action",
      });
    }

    if (!hasText(item.evidenceLink)) {
      blockers.push({
        itemId,
        reason: "missing evidence link",
      });
    }

    if (item.retestStatus === "PASS") {
      continue;
    }

    if (item.retestStatus === "WAIVED") {
      if (
        hasText(item.waivedApproval?.approver) &&
        hasText(item.waivedApproval?.reason)
      ) {
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

  if (!hasInternalAuditCoverage) {
    blockers.push({
      itemId: "GLOBAL",
      reason: "missing internal visual audit coverage",
    });
  }

  if (!hasReferenceBenchmarkCoverage) {
    blockers.push({
      itemId: "GLOBAL",
      reason: "missing reference benchmark coverage",
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
  reason:
    | "missing-entry"
    | "missing-baseline"
    | "missing-after"
    | "duplicate-entry"
    | "invalid-baseline-path"
    | "invalid-after-path";
};

function buildBaselineKey(
  screen: string,
  state: string,
  theme: Phase4Theme,
): string {
  return `${screen}::${state}::${theme}`;
}

function hasDateLayer(path: string): boolean {
  return /(^|\/)\d{4}-\d{2}-\d{2}(\/|$)/u.test(path);
}

export function evaluateBaselineCaptureCompleteness(
  entries: readonly Phase4BaselineCaptureEntry[],
): { ok: boolean; missing: Phase4BaselineMissingEntry[] } {
  const index = new Map<string, Phase4BaselineCaptureEntry>();
  const missing: Phase4BaselineMissingEntry[] = [];

  for (const entry of entries) {
    const key = buildBaselineKey(entry.screen, entry.state, entry.theme);
    if (index.has(key)) {
      missing.push({
        screen: entry.screen,
        state: entry.state,
        theme: entry.theme,
        reason: "duplicate-entry",
      });
      continue;
    }
    index.set(key, entry);
  }

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

      const baselinePath = capture.baselinePath?.trim();
      if (!baselinePath) {
        missing.push({
          screen: view.screen,
          state: view.state,
          theme,
          reason: "missing-baseline",
        });
      } else if (!hasDateLayer(baselinePath)) {
        missing.push({
          screen: view.screen,
          state: view.state,
          theme,
          reason: "invalid-baseline-path",
        });
      }

      const afterPath = capture.afterPath?.trim();
      if (!afterPath) {
        missing.push({
          screen: view.screen,
          state: view.state,
          theme,
          reason: "missing-after",
        });
      } else if (!hasDateLayer(afterPath)) {
        missing.push({
          screen: view.screen,
          state: view.state,
          theme,
          reason: "invalid-after-path",
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

function isValidRatio(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function evaluateVisualRegressionDiff(input: {
  threshold: number;
  results: readonly Phase4VisualDiffResult[];
}): { ok: boolean; blockedBy: Phase4VisualDiffResult[] } {
  if (!isValidRatio(input.threshold)) {
    return {
      ok: false,
      blockedBy: [...input.results],
    };
  }

  const blockedBy = input.results.filter(
    (result) =>
      !isValidRatio(result.diffRatio) || result.diffRatio > input.threshold,
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
    | "mainContentWidthPx"
    | "mainContentMinWidthPx";
  actual: number;
  expected: string;
};

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function evaluatePhase4Benchmark(input: Phase4BenchmarkInput): {
  status: "PASS" | "FAIL";
  readyForCloseout: boolean;
  needsNextPolishRound: boolean;
  failures: Phase4BenchmarkFailure[];
} {
  const failures: Phase4BenchmarkFailure[] = [];

  if (!isFiniteNonNegative(input.commandPaletteInvokeMs)) {
    failures.push({
      metric: "commandPaletteInvokeMs",
      actual: input.commandPaletteInvokeMs,
      expected: "finite >=0ms",
    });
  } else if (input.commandPaletteInvokeMs >= 100) {
    failures.push({
      metric: "commandPaletteInvokeMs",
      actual: input.commandPaletteInvokeMs,
      expected: "<100ms",
    });
  }

  if (!isFiniteNonNegative(input.workspaceInteractionMs)) {
    failures.push({
      metric: "workspaceInteractionMs",
      actual: input.workspaceInteractionMs,
      expected: "finite >=0ms",
    });
  } else if (input.workspaceInteractionMs >= 100) {
    failures.push({
      metric: "workspaceInteractionMs",
      actual: input.workspaceInteractionMs,
      expected: "<100ms",
    });
  }

  if (!isFiniteNonNegative(input.mainContentMinWidthPx)) {
    failures.push({
      metric: "mainContentMinWidthPx",
      actual: input.mainContentMinWidthPx,
      expected: "finite >=0px",
    });
  }

  if (!isFiniteNonNegative(input.mainContentWidthPx)) {
    failures.push({
      metric: "mainContentWidthPx",
      actual: input.mainContentWidthPx,
      expected: "finite >=0px",
    });
  } else if (
    isFiniteNonNegative(input.mainContentMinWidthPx) &&
    input.mainContentWidthPx < input.mainContentMinWidthPx
  ) {
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

import type { Logger } from "../../logging/logger";
import type { JudgeSeverity } from "@shared/types/judge";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

type JudgeIssue = {
  severity: JudgeSeverity;
  label: string;
};

export type JudgeQualityResult = {
  severity: JudgeSeverity;
  labels: string[];
  summary: string;
  partialChecksSkipped: boolean;
};

export type JudgeQualityService = {
  evaluate: (args: {
    projectId: string;
    traceId: string;
    text: string;
    contextSummary: string;
  }) => Promise<ServiceResult<JudgeQualityResult>>;
};

type AdvancedCheckRunner = (args: {
  projectId: string;
  traceId: string;
  text: string;
  contextSummary: string;
}) => Promise<JudgeIssue[]>;

/**
 * Detect first-person perspective mismatches from a lightweight rules engine.
 *
 * Why: this check must work even when advanced model checks are unavailable.
 */
function detectPerspectiveMismatch(args: {
  text: string;
  contextSummary: string;
}): JudgeIssue[] {
  if (!args.contextSummary.includes("第一人称")) {
    return [];
  }

  const hasThirdPersonPronoun = /他|她|他们|她们/.test(args.text);
  if (!hasThirdPersonPronoun) {
    return [];
  }

  return [
    {
      severity: "high",
      label: "检测到叙述视角不一致",
    },
  ];
}

/**
 * Detect repeated fragments using sentence-level heuristics.
 *
 * Why: repetition checks are required baseline rules in degraded judge mode.
 */
function detectRepetition(text: string): JudgeIssue[] {
  const normalized = text.trim();
  if (normalized.length === 0) {
    return [];
  }

  const segments = normalized
    .split(/[。！？!?]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);

  const counts = new Map<string, number>();
  for (const segment of segments) {
    counts.set(segment, (counts.get(segment) ?? 0) + 1);
  }

  const hasRepeatedSentence = Array.from(counts.values()).some(
    (count) => count >= 2,
  );
  const hasRepeatedWindow = /(.{4,12})\1/.test(normalized.replace(/\s+/g, ""));

  if (!hasRepeatedSentence && !hasRepeatedWindow) {
    return [];
  }

  return [
    {
      severity: "low",
      label: "检测到重复片段",
    },
  ];
}

/**
 * Sort severity by strictness (high > medium > low).
 */
function compareSeverity(a: JudgeSeverity, b: JudgeSeverity): number {
  const rank: Record<JudgeSeverity, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  return rank[a] - rank[b];
}

/**
 * Compose a concise summary sentence from issues and degrade state.
 */
function buildSummary(args: {
  labels: string[];
  partialChecksSkipped: boolean;
}): string {
  if (args.labels.length === 0) {
    return args.partialChecksSkipped
      ? "质量校验通过；部分校验已跳过"
      : "质量校验通过";
  }

  if (!args.partialChecksSkipped) {
    return args.labels[0] ?? "质量校验完成";
  }

  return `${args.labels[0] ?? "质量校验完成"}；部分校验已跳过`;
}

/**
 * Create a judge-quality service with rule-engine fallback.
 *
 * Why: advanced checks can fail independently, but baseline quality checks
 * still must return deterministic, panel-consumable outputs.
 */
export function createJudgeQualityService(deps: {
  logger: Logger;
  runAdvancedChecks?: AdvancedCheckRunner;
}): JudgeQualityService {
  const runAdvancedChecks = deps.runAdvancedChecks ?? (async () => []);

  return {
    evaluate: async (args) => {
      const text = args.text.trim();
      if (args.projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      if (args.traceId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "traceId is required");
      }
      if (text.length === 0) {
        return ipcError("INVALID_ARGUMENT", "text is required");
      }
      if (args.contextSummary.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "contextSummary is required");
      }

      const ruleIssues = [
        ...detectPerspectiveMismatch({
          text,
          contextSummary: args.contextSummary,
        }),
        ...detectRepetition(text),
      ];

      let partialChecksSkipped = false;
      let advancedIssues: JudgeIssue[] = [];
      try {
        advancedIssues = await runAdvancedChecks(args);
      } catch (error) {
        partialChecksSkipped = true;
        deps.logger.error("judge_advanced_check_failed", {
          projectId: args.projectId,
          traceId: args.traceId,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      const mergedIssues = [...ruleIssues, ...advancedIssues];
      const labels = Array.from(
        new Set(mergedIssues.map((issue) => issue.label)),
      );
      const severity = mergedIssues.reduce<JudgeSeverity>(
        (current, issue) =>
          compareSeverity(issue.severity, current) > 0
            ? issue.severity
            : current,
        "low",
      );

      return {
        ok: true,
        data: {
          severity,
          labels,
          summary: buildSummary({ labels, partialChecksSkipped }),
          partialChecksSkipped,
        },
      };
    },
  };
}

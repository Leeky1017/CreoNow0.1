import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type LintStatsSnapshot = {
  totalViolations: number;
  byRule: Record<string, number>;
};

export type LintRatchetBaseline = {
  version: string;
  generatedAt: string;
  source: string;
  governance: {
    issue: string;
    reason: string;
  };
  snapshot: LintStatsSnapshot;
};

export type LintRuleRegression = {
  rule: string;
  baseline: number;
  current: number;
  delta: number;
};

export type LintRatchetResult = {
  ok: boolean;
  totalDelta: number;
  baselineTotal: number;
  currentTotal: number;
  regressionsByRule: LintRuleRegression[];
};

type EslintMessage = {
  ruleId: string | null;
  severity?: number;
};

type EslintResult = {
  messages?: EslintMessage[];
};

const DEFAULT_BASELINE_PATH = path.join("scripts", "lint-baseline.json");
const UNKNOWN_RULE = "__unknown_rule__";
const WARNING_SEVERITY = 1;

function asObject(value: unknown, fieldPath: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`invalid ${fieldPath}: expected object`);
  }
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown, fieldPath: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`invalid ${fieldPath}: expected non-empty string`);
  }
  return value;
}

function asIssueRef(value: unknown, fieldPath: string): string {
  const issue = asNonEmptyString(value, fieldPath);
  if (!/^#[0-9]+$/.test(issue)) {
    throw new Error(`invalid ${fieldPath}: expected issue ref like #556`);
  }
  return issue;
}

function asCount(value: unknown, fieldPath: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`invalid ${fieldPath}: expected non-negative integer`);
  }
  return Number(value);
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function parseLintRatchetBaseline(raw: string): LintRatchetBaseline {
  const parsed = JSON.parse(raw) as unknown;
  const root = asObject(parsed, "baseline");

  const governance = asObject(root.governance, "governance");
  const snapshot = asObject(root.snapshot, "snapshot");
  const byRuleRaw = asObject(snapshot.byRule, "snapshot.byRule");

  const byRule: Record<string, number> = {};
  for (const [rule, value] of Object.entries(byRuleRaw)) {
    if (rule.trim().length === 0) {
      throw new Error("invalid snapshot.byRule: rule key must be non-empty");
    }
    byRule[rule] = asCount(value, `snapshot.byRule.${rule}`);
  }

  const totalViolations = asCount(
    snapshot.totalViolations,
    "snapshot.totalViolations",
  );
  const sumByRule = Object.values(byRule).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (totalViolations !== sumByRule) {
    throw new Error(
      `invalid snapshot.totalViolations: expected ${sumByRule}, got ${totalViolations}`,
    );
  }

  const generatedAt = asNonEmptyString(root.generatedAt, "generatedAt");
  if (Number.isNaN(Date.parse(generatedAt))) {
    throw new Error("invalid generatedAt: expected ISO timestamp");
  }

  return {
    version: asNonEmptyString(root.version, "version"),
    generatedAt,
    source: asNonEmptyString(root.source, "source"),
    governance: {
      issue: asIssueRef(governance.issue, "governance.issue"),
      reason: asNonEmptyString(governance.reason, "governance.reason"),
    },
    snapshot: {
      totalViolations,
      byRule,
    },
  };
}

export function readLintRatchetBaseline(
  baselinePath: string = path.resolve(process.cwd(), DEFAULT_BASELINE_PATH),
): LintRatchetBaseline {
  if (!existsSync(baselinePath)) {
    throw new Error(`baseline file not found: ${baselinePath}`);
  }
  return parseLintRatchetBaseline(readFileSync(baselinePath, "utf8"));
}

export function evaluateLintRatchet(
  baseline: LintRatchetBaseline,
  current: LintStatsSnapshot,
): LintRatchetResult {
  const rules = uniqueSorted([
    ...Object.keys(baseline.snapshot.byRule),
    ...Object.keys(current.byRule),
  ]);

  const regressionsByRule: LintRuleRegression[] = [];
  for (const rule of rules) {
    const base = baseline.snapshot.byRule[rule] ?? 0;
    const now = current.byRule[rule] ?? 0;
    const delta = now - base;
    if (delta > 0) {
      regressionsByRule.push({
        rule,
        baseline: base,
        current: now,
        delta,
      });
    }
  }

  const totalDelta =
    current.totalViolations - baseline.snapshot.totalViolations;

  return {
    ok: totalDelta <= 0 && regressionsByRule.length === 0,
    totalDelta,
    baselineTotal: baseline.snapshot.totalViolations,
    currentTotal: current.totalViolations,
    regressionsByRule,
  };
}

export function parseLintWarningSnapshotFromEslintJson(
  raw: string,
): LintStatsSnapshot {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("invalid eslint json: expected array");
  }

  const byRule: Record<string, number> = {};
  let totalViolations = 0;
  for (const fileResult of parsed as EslintResult[]) {
    const messages = fileResult.messages ?? [];
    for (const message of messages) {
      const severity = message.severity ?? 0;
      if (severity !== WARNING_SEVERITY) {
        continue;
      }
      const rule = message.ruleId ?? UNKNOWN_RULE;
      byRule[rule] = (byRule[rule] ?? 0) + 1;
      totalViolations += 1;
    }
  }

  return {
    totalViolations,
    byRule,
  };
}

function runEslintJson(repoRoot: string): string {
  const proc = spawnSync(
    "pnpm",
    ["exec", "eslint", ".", "--ext", ".ts,.tsx", "-f", "json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 1024 * 1024 * 64,
    },
  );

  if (proc.error) {
    throw proc.error;
  }

  // eslint exits 1 when violations exist; this is expected for ratchet counting.
  if (proc.status !== 0 && proc.status !== 1) {
    throw new Error(
      `eslint failed with exit code ${proc.status}: ${proc.stderr || proc.stdout}`,
    );
  }

  const stdout = proc.stdout ?? "";
  if (stdout.trim().length === 0) {
    throw new Error("eslint produced empty json output");
  }
  return stdout;
}

function formatRuleDiffLines(result: LintRatchetResult): string[] {
  return result.regressionsByRule.map((item) => {
    return `${item.rule}: baseline=${item.baseline} current=${item.current} delta=+${item.delta}`;
  });
}

function readIssueReasonFromArgs(args: string[]): {
  issue: string;
  reason: string;
} {
  const issueArg = args.find((arg) => arg.startsWith("--issue="));
  const reasonArg = args.find((arg) => arg.startsWith("--reason="));

  const issue =
    issueArg?.slice("--issue=".length) || process.env.LINT_BASELINE_ISSUE;
  const reason =
    reasonArg?.slice("--reason=".length) || process.env.LINT_BASELINE_REASON;

  return {
    issue: asIssueRef(issue, "governance.issue"),
    reason: asNonEmptyString(reason, "governance.reason"),
  };
}

function readEslintSnapshot(
  repoRoot: string,
  args: string[],
): LintStatsSnapshot {
  const reportArg = args.find((arg) => arg.startsWith("--eslint-report="));
  const reportPath = reportArg?.slice("--eslint-report=".length);
  if (reportPath) {
    const absPath = path.resolve(repoRoot, reportPath);
    if (!existsSync(absPath)) {
      throw new Error(`eslint report not found: ${absPath}`);
    }
    return parseLintWarningSnapshotFromEslintJson(
      readFileSync(absPath, "utf8"),
    );
  }

  return parseLintWarningSnapshotFromEslintJson(runEslintJson(repoRoot));
}

function buildBaseline(
  snapshot: LintStatsSnapshot,
  args: string[],
): LintRatchetBaseline {
  const governance = readIssueReasonFromArgs(args);
  return {
    version: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    source: "eslint-json",
    governance,
    snapshot: {
      totalViolations: snapshot.totalViolations,
      byRule: Object.fromEntries(
        Object.entries(snapshot.byRule).sort((a, b) =>
          a[0].localeCompare(b[0]),
        ),
      ),
    },
  };
}

function writeBaselineFile(
  repoRoot: string,
  baselinePath: string,
  baseline: LintRatchetBaseline,
): void {
  const absPath = path.resolve(repoRoot, baselinePath);
  writeFileSync(absPath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
}

function main(): number {
  const args = process.argv.slice(2);
  const repoRoot = process.cwd();
  const baselineArg = args.find((arg) => arg.startsWith("--baseline="));
  const baselinePath =
    baselineArg?.slice("--baseline=".length) ?? DEFAULT_BASELINE_PATH;
  const shouldWriteBaseline = args.includes("--write-baseline");

  const current = readEslintSnapshot(repoRoot, args);

  if (shouldWriteBaseline) {
    const baseline = buildBaseline(current, args);
    writeBaselineFile(repoRoot, baselinePath, baseline);
    console.log(`[LINT_WARNING_BUDGET] BASELINE_UPDATED path=${baselinePath}`);
    console.log(
      `[LINT_WARNING_BUDGET] TOTAL_WARNINGS=${baseline.snapshot.totalViolations}`,
    );
    return 0;
  }

  const baseline = readLintRatchetBaseline(
    path.resolve(repoRoot, baselinePath),
  );
  const result = evaluateLintRatchet(baseline, current);

  if (!result.ok) {
    console.error(
      `[LINT_WARNING_BUDGET] FAIL baseline=${result.baselineTotal} current=${result.currentTotal} delta=${result.totalDelta >= 0 ? `+${result.totalDelta}` : result.totalDelta}`,
    );
    for (const line of formatRuleDiffLines(result)) {
      console.error(`[LINT_WARNING_BUDGET] REGRESSION ${line}`);
    }
    return 1;
  }

  console.log(
    `[LINT_WARNING_BUDGET] PASS baseline=${result.baselineTotal} current=${result.currentTotal} delta=${result.totalDelta}`,
  );
  return 0;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  process.exit(main());
}

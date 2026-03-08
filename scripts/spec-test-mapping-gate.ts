/**
 * G0-05: Spec-Test Mapping Gate
 *
 * Parses spec.md files for Scenario IDs (S-XXX-NN format) and checks
 * if corresponding test files reference those Scenario IDs.
 *
 * Supports baseline ratchet and Tier 2 semantic dimensions:
 *   - negation:   "should NOT" / @negation
 *   - capability:  "声称支持" / "capability" / @capability
 *   - cjk:        "CJK" / "中文" / "日文" / "韩文" / @cjk
 *   - rejection:  "拒绝" / "reject" / "deny" / @rejection
 *
 * Usage:
 *   pnpm gate:spec-test-mapping                   # check mode
 *   pnpm gate:spec-test-mapping --update-baseline  # update baseline
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export type Tier2Dimension =
  | "negation"
  | "capability"
  | "cjk"
  | "rejection"
  | "general";

export type ScenarioEntry = {
  id: string;
  title: string;
  specFile: string;
  dimension: Tier2Dimension;
};

export type MappingResult = {
  scenario: ScenarioEntry;
  mapped: boolean;
  testFiles: string[];
};

export type Tier2Summary = {
  negation: { mapped: number; total: number };
  capability: { mapped: number; total: number };
  cjk: { mapped: number; total: number };
  rejection: { mapped: number; total: number };
};

export type SpecTestMappingBaseline = {
  count: number;
  updatedAt: string;
};

export type SpecTestMappingResult = {
  ok: boolean;
  mappings: MappingResult[];
  unmapped: MappingResult[];
  total: number;
  mapped: number;
  baseline: number;
  tier2: Tier2Summary;
};

// ── Constants ──────────────────────────────────────────────────────

const SPEC_DIRS = [
  path.join("openspec", "specs"),
  path.join("openspec", "changes"),
];

const TEST_DIRS = [
  path.join("apps", "desktop"),
  path.join("packages", "shared"),
  path.join("scripts"),
];

const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "spec-test-mapping-baseline.json",
);

const GATE_NAME = "SPEC_TEST_MAP";

const SCENARIO_ID_RE = /###\s+Scenario\s+(S-[A-Z]+(?:-[A-Z]+)*-\d+)/g;

// ── Dimension Classification ───────────────────────────────────────

const DIMENSION_RULES: Array<{
  dimension: Tier2Dimension;
  tagPattern: RegExp;
  titlePattern: RegExp;
}> = [
  {
    dimension: "negation",
    tagPattern: /@negation\b/i,
    titlePattern: /\bshould\s+NOT\b/i,
  },
  {
    dimension: "capability",
    tagPattern: /@capability\b/i,
    titlePattern: /(声称支持|capability|能力声明)/i,
  },
  {
    dimension: "cjk",
    tagPattern: /@cjk\b/i,
    titlePattern: /(CJK|中文|日文|韩文|\bChinese\b|\bJapanese\b|\bKorean\b)/i,
  },
  {
    dimension: "rejection",
    tagPattern: /@rejection\b/i,
    titlePattern: /(拒绝|\breject\b|\bdeny\b|失败|\bdenied\b)/i,
  },
];

// ── File Utilities ─────────────────────────────────────────────────

function walk(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".git" || entry === "dist")
        continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// ── Core Logic ─────────────────────────────────────────────────────

function classifyDimension(title: string): Tier2Dimension {
  for (const rule of DIMENSION_RULES) {
    if (rule.tagPattern.test(title) || rule.titlePattern.test(title)) {
      return rule.dimension;
    }
  }
  return "general";
}

/**
 * Extract all Scenario IDs from spec.md files.
 */
export function extractScenarios(rootDir: string = "."): ScenarioEntry[] {
  const scenarios: ScenarioEntry[] = [];

  for (const specDir of SPEC_DIRS) {
    const fullDir = path.join(rootDir, specDir);
    const files = walk(fullDir);

    for (const filePath of files) {
      if (!filePath.endsWith("spec.md") && !filePath.endsWith(".spec.md"))
        continue;

      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        // Reset lastIndex for global regex
        SCENARIO_ID_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = SCENARIO_ID_RE.exec(line)) !== null) {
          const id = match[1];
          const title = line;
          const dimension = classifyDimension(title);
          scenarios.push({
            id,
            title: title.replace(/^###\s+Scenario\s+/, "").trim(),
            specFile: path.relative(rootDir, filePath),
            dimension,
          });
        }
      }
    }
  }

  return scenarios;
}

/**
 * Search test files for Scenario ID references.
 */
export function findTestMappings(
  scenarios: ScenarioEntry[],
  rootDir: string = ".",
): MappingResult[] {
  // Collect all test files
  const testFiles: string[] = [];
  for (const testDir of TEST_DIRS) {
    const fullDir = path.join(rootDir, testDir);
    const files = walk(fullDir);
    for (const f of files) {
      if (
        f.match(/\.(test|spec)\.(ts|tsx|js|jsx|cjs|mjs)$/) &&
        !f.includes("node_modules")
      ) {
        testFiles.push(f);
      }
    }
  }

  // Read all test file contents
  const testFileContents = new Map<string, string>();
  for (const tf of testFiles) {
    testFileContents.set(tf, readFileSync(tf, "utf-8"));
  }

  // Map each scenario
  return scenarios.map((scenario) => {
    const matchedFiles: string[] = [];
    for (const [filePath, content] of testFileContents) {
      if (content.includes(scenario.id)) {
        matchedFiles.push(path.relative(rootDir, filePath));
      }
    }
    return {
      scenario,
      mapped: matchedFiles.length > 0,
      testFiles: matchedFiles,
    };
  });
}

/**
 * Compute Tier 2 dimension summary.
 */
export function computeTier2Summary(mappings: MappingResult[]): Tier2Summary {
  const dims: Tier2Dimension[] = [
    "negation",
    "capability",
    "cjk",
    "rejection",
  ];
  const summary: Tier2Summary = {
    negation: { mapped: 0, total: 0 },
    capability: { mapped: 0, total: 0 },
    cjk: { mapped: 0, total: 0 },
    rejection: { mapped: 0, total: 0 },
  };

  for (const m of mappings) {
    const dim = m.scenario.dimension;
    if (dims.includes(dim)) {
      const key = dim as keyof Tier2Summary;
      summary[key].total++;
      if (m.mapped) summary[key].mapped++;
    }
  }

  return summary;
}

// ── Baseline ───────────────────────────────────────────────────────

export function readBaseline(
  rootDir: string = ".",
): SpecTestMappingBaseline {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return { count: 0, updatedAt: "1970-01-01T00:00:00.000Z" };
  }
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

export function writeBaseline(
  count: number,
  rootDir: string = ".",
): void {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  const data: SpecTestMappingBaseline = {
    count,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(baselinePath, JSON.stringify(data, null, 2) + "\n");
}

// ── Gate Runner ────────────────────────────────────────────────────

export function runGate(rootDir: string = "."): SpecTestMappingResult {
  const scenarios = extractScenarios(rootDir);
  const mappings = findTestMappings(scenarios, rootDir);
  const unmapped = mappings.filter((m) => !m.mapped);
  const baseline = readBaseline(rootDir);
  const tier2 = computeTier2Summary(mappings);

  return {
    ok: unmapped.length <= baseline.count,
    mappings,
    unmapped,
    total: scenarios.length,
    mapped: mappings.filter((m) => m.mapped).length,
    baseline: baseline.count,
    tier2,
  };
}

// ── CLI Entry ──────────────────────────────────────────────────────

function pct(mapped: number, total: number): string {
  if (total === 0) return "N/A";
  return `${Math.round((mapped / total) * 100)}%`;
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("spec-test-mapping-gate.ts") ||
    process.argv[1].endsWith("spec-test-mapping-gate.js"))
) {
  const updateBaselineMode = process.argv.includes("--update-baseline");
  const result = runGate();

  if (updateBaselineMode) {
    writeBaseline(result.unmapped.length);
    console.log(
      `[${GATE_NAME}] Baseline updated: ${result.unmapped.length} unmapped scenarios`,
    );
    process.exit(0);
  }

  // Coverage line
  console.log(
    `[${GATE_NAME}] coverage: ${result.mapped}/${result.total} (${pct(result.mapped, result.total)})`,
  );

  // Tier 2 summary
  const t2 = result.tier2;
  console.log(`[${GATE_NAME}] Tier-2 summary:`);
  console.log(
    `  negation:   ${t2.negation.mapped}/${t2.negation.total} (${pct(t2.negation.mapped, t2.negation.total)})`,
  );
  console.log(
    `  capability: ${t2.capability.mapped}/${t2.capability.total} (${pct(t2.capability.mapped, t2.capability.total)})`,
  );
  console.log(
    `  cjk:        ${t2.cjk.mapped}/${t2.cjk.total} (${pct(t2.cjk.mapped, t2.cjk.total)})`,
  );
  console.log(
    `  rejection:  ${t2.rejection.mapped}/${t2.rejection.total} (${pct(t2.rejection.mapped, t2.rejection.total)})`,
  );

  // Pass/Fail
  if (result.ok) {
    console.log(
      `[${GATE_NAME}] PASS  unmapped: ${result.unmapped.length} (baseline: ${result.baseline})`,
    );
  } else {
    const newCount = result.unmapped.length - result.baseline;
    console.log(
      `[${GATE_NAME}] FAIL  unmapped: ${result.unmapped.length} (baseline: ${result.baseline})  +${newCount} new:`,
    );
    for (const m of result.unmapped) {
      console.log(
        `  - ${m.scenario.specFile}: ${m.scenario.id} — ${m.scenario.title}`,
      );
    }
    process.exit(1);
  }
}

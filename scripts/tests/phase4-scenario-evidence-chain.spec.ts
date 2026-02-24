import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type ScenarioMappingRow = {
  scenarioId: string;
  testFile: string;
  redCommandId: string;
  greenCommandId: string;
};

const EXPECTED_SCENARIO_IDS = [
  "WB-P4-S1",
  "WB-P4-S2",
  "WB-P4-S3",
  "WB-P4-S4",
  "WB-P4-S5",
  "WB-P4-S6",
  "PM-P4-S1",
  "PM-P4-S2",
  "PM-P4-S3",
  "PM-P4-S4",
  "PM-P4-S5",
  "PM-P4-S6",
  "PM-P4-S7",
  "PM-P4-S8",
] as const;

function compareScenarioId(a: string, b: string): number {
  const [aPrefix = "", aIndexRaw = "0"] = a.split("-S");
  const [bPrefix = "", bIndexRaw = "0"] = b.split("-S");
  if (aPrefix !== bPrefix) {
    return aPrefix.localeCompare(bPrefix);
  }
  return Number.parseInt(aIndexRaw, 10) - Number.parseInt(bIndexRaw, 10);
}

function sortedUnique(ids: string[]): string[] {
  return [...new Set(ids)].sort(compareScenarioId);
}

const repoRoot = path.resolve(import.meta.dirname, "../..");
const tasksPath = path.join(
  repoRoot,
  "openspec/changes/issue-606-phase-4-polish-and-delivery/tasks.md",
);
const runLogPath = path.join(repoRoot, "openspec/_ops/task_runs/ISSUE-635.md");

const tasksText = readFileSync(tasksPath, "utf8");
const runLogText = readFileSync(runLogPath, "utf8");

const mappingRows: ScenarioMappingRow[] = [
  ...tasksText.matchAll(
    /^\|\s*((?:WB|PM)-P4-S\d+)\s*\|\s*`([^`]+)`\s*\|\s*[^|]+\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|$/gmu,
  ),
].map((match) => ({
  scenarioId: match[1] ?? "",
  testFile: match[2] ?? "",
  redCommandId: match[3] ?? "",
  greenCommandId: match[4] ?? "",
}));

assert.equal(
  mappingRows.length,
  EXPECTED_SCENARIO_IDS.length,
  "phase4 scenario mapping row count mismatch",
);

const mappedScenarioIds = sortedUnique(
  mappingRows.map((row) => row.scenarioId),
);
assert.deepEqual(
  mappedScenarioIds,
  [...EXPECTED_SCENARIO_IDS].sort(compareScenarioId),
  "phase4 scenario mapping ids are incomplete",
);

const commandIndex = new Map(
  [...tasksText.matchAll(/^- `([A-Z0-9-]+)`: `(.+)`$/gmu)].map((match) => [
    match[1] ?? "",
    match[2] ?? "",
  ]),
);

for (const row of mappingRows) {
  assert.equal(
    commandIndex.has(row.redCommandId),
    true,
    `missing red command id: ${row.redCommandId}`,
  );
  assert.equal(
    commandIndex.has(row.greenCommandId),
    true,
    `missing green command id: ${row.greenCommandId}`,
  );

  const testPath = path.resolve(repoRoot, row.testFile);
  assert.equal(
    existsSync(testPath),
    true,
    `missing mapped test file: ${row.testFile}`,
  );
  const testSource = readFileSync(testPath, "utf8");
  assert.match(
    testSource,
    new RegExp(`\\b${row.scenarioId}\\b`, "u"),
    `scenario marker missing in ${row.testFile}: ${row.scenarioId}`,
  );
}

for (const scenarioId of EXPECTED_SCENARIO_IDS) {
  assert.match(
    runLogText,
    new RegExp(`Red-Command\\s+${scenarioId}:`, "u"),
    `run log missing red command marker for ${scenarioId}`,
  );
  assert.match(
    runLogText,
    new RegExp(`Green-Command\\s+${scenarioId}:`, "u"),
    `run log missing green command marker for ${scenarioId}`,
  );
}

console.log(
  `[phase4-evidence-chain] scenarios=${EXPECTED_SCENARIO_IDS.length.toString()} mappings=${mappingRows.length.toString()} command-index=${commandIndex.size.toString()}`,
);

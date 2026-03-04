import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const ciWorkflowPath = path.join(repoRoot, ".github/workflows/ci.yml");
const ciWorkflow = readFileSync(ciWorkflowPath, "utf8");

// M5-S1: CI must include coverage gate job and artifact upload [ADDED]
assert.match(ciWorkflow, /^\s*coverage-gate:\s*$/m);
assert.match(ciWorkflow, /name:\s*Frontend coverage/m);
assert.match(ciWorkflow, /name:\s*Backend coverage/m);
assert.match(ciWorkflow, /name:\s*Upload coverage artifacts/m);

// M5-S2: aggregate ci gate must depend on coverage-gate [ADDED]
assert.match(ciWorkflow, /needs:[\s\S]*- coverage-gate/m);

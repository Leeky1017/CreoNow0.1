import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const packageJsonPath = path.join(repoRoot, "package.json");
const runnerScriptPath = path.join(repoRoot, "scripts/run-discovered-tests.ts");

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  scripts?: Record<string, string>;
};
const runnerScript = readFileSync(runnerScriptPath, "utf8");

// S1: unit/integration must use discovery runner entrypoint [ADDED]
assert.equal(
  packageJson.scripts?.["desktop:ensure-native-node-abi"],
  "tsx scripts/ensure-desktop-native-node-abi.ts",
);
assert.equal(
  packageJson.scripts?.["test:unit"],
  "pnpm desktop:ensure-native-node-abi && tsx scripts/run-discovered-tests.ts --mode unit",
);
assert.equal(
  packageJson.scripts?.["test:integration"],
  "tsx scripts/run-discovered-tests.ts --mode integration",
);

// S2: discovery runner must include integration + perf roots [ADDED]
assert.match(
  runnerScript,
  /apps\/desktop\/tests\/integration/,
  "integration discovery root is required",
);
assert.match(
  runnerScript,
  /apps\/desktop\/tests\/perf/,
  "perf discovery root is required",
);

// S3: unit discovery must include desktop unit + lint + main source tests [ADDED]
assert.match(
  runnerScript,
  /apps\/desktop\/tests\/unit/,
  "unit discovery root is required",
);
assert.match(
  runnerScript,
  /apps\/desktop\/tests\/lint/,
  "lint discovery root is required",
);
assert.match(
  runnerScript,
  /apps\/desktop\/main\/src/,
  "main source test discovery root is required",
);

// S4: discovery runner must expose import-safe execution plan for deterministic guard checks [ADDED]
assert.match(
  runnerScript,
  /export\s+async\s+function\s+discoverUnitBuckets/u,
  "runner must export discoverUnitBuckets for governance checks",
);
assert.match(
  runnerScript,
  /export\s+async\s+function\s+buildUnitExecutionPlan/u,
  "runner must export unit execution plan builder for governance checks",
);
assert.match(
  runnerScript,
  /if\s*\(isEntrypoint\(import\.meta\.url\)\)/u,
  "runner entrypoint should be gated to avoid side effects on import",
);

type UnitExecutionPlan = {
  buckets: {
    tsxFiles: string[];
    vitestFiles: string[];
  };
  commands: Array<{
    command: string;
    args: string[];
    cwd: string;
  }>;
};

type IntegrationExecutionPlan = {
  files: string[];
  commands: Array<{
    command: string;
    args: string[];
    cwd: string;
  }>;
};

const runnerModule = (await import(pathToFileURL(runnerScriptPath).href)) as {
  buildUnitExecutionPlan: () => Promise<UnitExecutionPlan>;
  buildIntegrationExecutionPlan: () => Promise<IntegrationExecutionPlan>;
};
const unitPlan = await runnerModule.buildUnitExecutionPlan();
const integrationPlan = await runnerModule.buildIntegrationExecutionPlan();

const unitTsxSentinel = "apps/desktop/tests/unit/test-runner-discovery.spec.ts";
const mainTsxSentinel =
  "apps/desktop/main/src/services/context/__tests__/rulesFetcher.test.ts";
const lintVitestSentinel =
  "apps/desktop/tests/lint/renderer-viewport-ownership.test.ts";
const unitVitestSentinel = "tests/unit/main/window-load-catch.test.ts";
const lintVitestExecutionSentinel =
  "tests/lint/renderer-viewport-ownership.test.ts";

assert.equal(
  unitPlan.buckets.tsxFiles.some((file) => file.endsWith(unitTsxSentinel)),
  true,
  "tsx bucket should include tests/unit suites",
);
assert.equal(
  unitPlan.buckets.tsxFiles.some((file) => file.endsWith(mainTsxSentinel)),
  true,
  "tsx bucket should include main/src __tests__ suites",
);
assert.equal(
  unitPlan.buckets.vitestFiles.some((file) =>
    file.endsWith("apps/desktop/tests/unit/main/window-load-catch.test.ts"),
  ),
  true,
  "vitest bucket should include tests/unit main vitest suites",
);
assert.equal(
  unitPlan.buckets.vitestFiles.some((file) =>
    file.endsWith(lintVitestSentinel),
  ),
  true,
  "vitest bucket should include tests/lint viewport ownership suite",
);

const tsxExecutionTargets = unitPlan.commands
  .filter(
    (command) =>
      command.command === "pnpm" &&
      command.args[0] === "exec" &&
      command.args[1] === "tsx",
  )
  .map((command) => command.args[2] ?? "");

assert.equal(
  tsxExecutionTargets.some((file) => file.endsWith(unitTsxSentinel)),
  true,
  "unit tsx suites should be part of execution plan",
);
assert.equal(
  tsxExecutionTargets.some((file) => file.endsWith(mainTsxSentinel)),
  true,
  "main tsx suites should be part of execution plan",
);

const vitestExecution = unitPlan.commands.find((command) =>
  command.args.includes("vitest"),
);
assert.ok(vitestExecution, "vitest execution command should exist");
assert.equal(
  (vitestExecution?.args ?? []).includes(unitVitestSentinel),
  true,
  "unit vitest suites should be part of execution plan",
);
assert.equal(
  (vitestExecution?.args ?? []).includes(lintVitestExecutionSentinel),
  true,
  "lint vitest suites should be part of execution plan",
);

const integrationSentinel =
  "apps/desktop/tests/integration/runtime-governance-consistency.test.ts";
const perfSentinel =
  "apps/desktop/tests/perf/project-lifecycle.benchmark.test.ts";
const integrationDiscoverySentinels = [
  "scripts/tests/lint-ratchet-regression.test.ts",
  "scripts/tests/path-alias-migration-check.test.ts",
] as const;

assert.match(
  runnerScript,
  /apps\/desktop\/tests\/e2e\/visual/,
  "phase4 visual discovery root is required",
);
assert.match(
  runnerScript,
  /scripts\/tests/,
  "scripts/tests discovery root is required",
);

assert.equal(
  integrationPlan.files.some((file) => file.endsWith(integrationSentinel)),
  true,
  "integration discovery should include integration suites",
);
assert.equal(
  integrationPlan.files.some((file) => file.endsWith(perfSentinel)),
  true,
  "integration discovery should include perf suites",
);
for (const sentinel of integrationDiscoverySentinels) {
  assert.equal(
    integrationPlan.files.some((file) => file.endsWith(sentinel)),
    true,
    `integration discovery should include ${sentinel}`,
  );
}

const integrationExecutionTargets = integrationPlan.commands
  .filter(
    (command) =>
      command.command === "pnpm" &&
      command.args[0] === "exec" &&
      command.args[1] === "tsx",
  )
  .map((command) => command.args[2] ?? "");

for (const sentinel of integrationDiscoverySentinels) {
  assert.equal(
    integrationExecutionTargets.some((file) => file.endsWith(sentinel)),
    true,
    `integration execution plan should run ${sentinel}`,
  );
}

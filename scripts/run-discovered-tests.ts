import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type Mode = "unit" | "integration";

type DiscoveredBuckets = {
  tsxFiles: string[];
  vitestFiles: string[];
};

type CommandSpec = {
  command: string;
  args: string[];
  cwd: string;
};

type UnitExecutionPlan = {
  buckets: DiscoveredBuckets;
  commands: CommandSpec[];
};

type IntegrationExecutionPlan = {
  files: string[];
  commands: CommandSpec[];
};

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const DESKTOP_ROOT = path.join(REPO_ROOT, "apps/desktop");

function parseMode(argv: string[]): Mode {
  const modeFlag = argv.find((arg) => arg.startsWith("--mode="));
  if (modeFlag) {
    const mode = modeFlag.slice("--mode=".length);
    if (mode === "unit" || mode === "integration") {
      return mode;
    }
  }

  const modeIndex = argv.findIndex((arg) => arg === "--mode");
  if (modeIndex >= 0) {
    const raw = argv[modeIndex + 1] ?? "";
    if (raw === "unit" || raw === "integration") {
      return raw;
    }
  }

  throw new Error(
    "Usage: tsx scripts/run-discovered-tests.ts --mode unit|integration",
  );
}

async function walkFiles(rootDir: string): Promise<string[]> {
  const out: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist") {
          continue;
        }
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      out.push(fullPath);
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function isTestFile(filePath: string): boolean {
  return /\.(test|spec)\.(ts|tsx)$/u.test(filePath);
}

async function isVitestFile(filePath: string): Promise<boolean> {
  if (filePath.endsWith(".tsx")) {
    return true;
  }
  const source = await readFile(filePath, "utf8");
  return /from\s+["']vitest["']/u.test(source);
}

function runCommand(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export async function discoverUnitBuckets(): Promise<DiscoveredBuckets> {
  const roots = [
    path.join(REPO_ROOT, "apps/desktop/tests/unit"),
    path.join(REPO_ROOT, "apps/desktop/tests/lint"),
    path.join(REPO_ROOT, "apps/desktop/main/src"),
  ];

  const allFiles: string[] = [];
  for (const root of roots) {
    const files = await walkFiles(root);
    for (const file of files) {
      if (isTestFile(file)) {
        allFiles.push(file);
      }
    }
  }

  const unique = [...new Set(allFiles)].sort((a, b) => a.localeCompare(b));
  const buckets: DiscoveredBuckets = { tsxFiles: [], vitestFiles: [] };
  for (const file of unique) {
    if (await isVitestFile(file)) {
      buckets.vitestFiles.push(file);
    } else {
      buckets.tsxFiles.push(file);
    }
  }

  return buckets;
}

export async function discoverIntegrationFiles(): Promise<string[]> {
  const roots = [
    path.join(REPO_ROOT, "apps/desktop/tests/integration"),
    path.join(REPO_ROOT, "apps/desktop/tests/perf"),
  ];

  const allFiles: string[] = [];
  for (const root of roots) {
    const files = await walkFiles(root);
    for (const file of files) {
      if (isTestFile(file)) {
        allFiles.push(file);
      }
    }
  }

  return [...new Set(allFiles)].sort((a, b) => a.localeCompare(b));
}

function toDesktopRelative(filePath: string): string {
  return path.relative(DESKTOP_ROOT, filePath).split(path.sep).join("/");
}

export async function buildUnitExecutionPlan(): Promise<UnitExecutionPlan> {
  const buckets = await discoverUnitBuckets();
  const commands: CommandSpec[] = buckets.tsxFiles.map((file) => ({
    command: "pnpm",
    args: ["exec", "tsx", file],
    cwd: REPO_ROOT,
  }));

  if (buckets.vitestFiles.length > 0) {
    commands.push({
      command: "pnpm",
      args: [
        "-C",
        "apps/desktop",
        "exec",
        "vitest",
        "run",
        "--config",
        "tests/unit/main/vitest.node.config.ts",
        ...buckets.vitestFiles.map(toDesktopRelative),
      ],
      cwd: REPO_ROOT,
    });
  }

  return { buckets, commands };
}

export async function buildIntegrationExecutionPlan(): Promise<IntegrationExecutionPlan> {
  const files = await discoverIntegrationFiles();
  const commands: CommandSpec[] = files.map((file) => ({
    command: "pnpm",
    args: ["exec", "tsx", file],
    cwd: REPO_ROOT,
  }));
  return { files, commands };
}

async function runUnitDiscovered(): Promise<void> {
  const { buckets, commands } = await buildUnitExecutionPlan();
  console.log(
    `[test-discovery] mode=unit tsx=${buckets.tsxFiles.length.toString()} vitest=${buckets.vitestFiles.length.toString()}`,
  );

  for (const command of commands) {
    runCommand(command.command, command.args, command.cwd);
  }
}

async function runIntegrationDiscovered(): Promise<void> {
  const { files, commands } = await buildIntegrationExecutionPlan();
  console.log(
    `[test-discovery] mode=integration tests=${files.length.toString()}`,
  );

  for (const command of commands) {
    runCommand(command.command, command.args, command.cwd);
  }
}

function isEntrypoint(moduleUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return pathToFileURL(entry).href === moduleUrl;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const mode = parseMode(argv);
  if (mode === "unit") {
    await runUnitDiscovered();
    return;
  }
  await runIntegrationDiscovered();
}

if (isEntrypoint(import.meta.url)) {
  void main();
}

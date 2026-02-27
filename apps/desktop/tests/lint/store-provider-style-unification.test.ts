import { describe, expect, it } from "vitest";

import { spawnSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";

const TARGET_STORE_BASENAMES = [
  "aiStore",
  "fileStore",
  "searchStore",
  "kgStore",
  "memoryStore",
] as const;

const STORE_ROOT_RELATIVE = "apps/desktop/renderer/src/stores";

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function toPosixRelative(rootDir: string, filePath: string): string {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
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

function isStoreSourceFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return ext === ".ts" || ext === ".tsx";
}

async function collectCreateElementViolations(
  storeRoot: string,
  reportRoot: string,
): Promise<string[]> {
  const files = await walkFiles(storeRoot);
  const violations: string[] = [];
  for (const filePath of files) {
    if (!isStoreSourceFile(filePath)) {
      continue;
    }

    const source = await readFile(filePath, "utf8");
    if (source.includes("React.createElement(")) {
      violations.push(toPosixRelative(reportRoot, filePath));
    }
  }
  return violations.sort((a, b) => a.localeCompare(b));
}

describe("AUD-C14 store provider style unification", () => {
  it("AUD-C14-S1 target store files should all be .tsx and contain zero React.createElement", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const storeRoot = path.join(repoRoot, STORE_ROOT_RELATIVE);

    const extensionViolations: string[] = [];
    for (const baseName of TARGET_STORE_BASENAMES) {
      const tsPath = path.join(storeRoot, `${baseName}.ts`);
      const tsxPath = path.join(storeRoot, `${baseName}.tsx`);

      if (await pathExists(tsPath)) {
        extensionViolations.push(
          `${toPosixRelative(repoRoot, tsPath)} should be renamed to .tsx`,
        );
      }

      if (!(await pathExists(tsxPath))) {
        extensionViolations.push(
          `${toPosixRelative(repoRoot, tsxPath)} is missing`,
        );
      }
    }

    const createElementViolations = await collectCreateElementViolations(
      storeRoot,
      repoRoot,
    );

    if (extensionViolations.length > 0 || createElementViolations.length > 0) {
      throw new Error(
        `Store provider style violations (AUD-C14-S1):\n${[
          ...extensionViolations.map((line) => `- ${line}`),
          ...createElementViolations.map(
            (line) => `- ${line} contains React.createElement`,
          ),
        ].join("\n")}`,
      );
    }

    expect(extensionViolations).toEqual([]);
    expect(createElementViolations).toEqual([]);
  });

  it("AUD-C14-S4 lint should reject React.createElement usage in store files", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const lintInput = `
import React from "react";

export function BrokenProvider(): JSX.Element {
  return React.createElement("div", null, "x");
}
    `;

    const lintResult = spawnSync(
      "pnpm",
      [
        "exec",
        "eslint",
        "--stdin",
        "--stdin-filename",
        "apps/desktop/renderer/src/stores/__lint_fixture__.tsx",
        "--format",
        "json",
      ],
      {
        cwd: repoRoot,
        input: lintInput,
        encoding: "utf8",
      },
    );

    if (lintResult.error) {
      throw lintResult.error;
    }

    expect(lintResult.status).toBe(1);

    type LintMessage = {
      ruleId: string | null;
      message: string;
    };

    type LintReport = {
      messages: LintMessage[];
    };

    const reports = JSON.parse(lintResult.stdout) as LintReport[];
    const messages = reports.flatMap((report) => report.messages);
    const hasGuardError = messages.some(
      (message) =>
        message.ruleId === "no-restricted-syntax" &&
        message.message.includes("Use JSX"),
    );

    expect(hasGuardError).toBe(true);
  });
});

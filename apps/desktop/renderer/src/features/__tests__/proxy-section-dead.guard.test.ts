import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../..",
);

/** Recursively collect .ts/.tsx files, skipping node_modules and test files */
function collectSourceFiles(dir: string, results: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      collectSourceFiles(full, results);
    } else if (
      /\.(tsx?|ts)$/.test(entry.name) &&
      !entry.name.includes(".test.") &&
      !entry.name.includes(".guard.test.")
    ) {
      results.push(full);
    }
  }
  return results;
}

describe("WB-FE-CLN-S1: ProxySection dead code guard", () => {
  it("ProxySection.tsx does not exist", () => {
    const filePath = path.join(
      REPO_ROOT,
      "apps/desktop/renderer/src/features/settings/ProxySection.tsx",
    );
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it("no imports reference ProxySection", () => {
    const srcDir = path.join(REPO_ROOT, "apps/desktop/renderer/src");
    const files = collectSourceFiles(srcDir);
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      if (/ProxySection/.test(content)) {
        violations.push(path.relative(REPO_ROOT, file));
      }
    }
    expect(violations).toEqual([]);
  });
});

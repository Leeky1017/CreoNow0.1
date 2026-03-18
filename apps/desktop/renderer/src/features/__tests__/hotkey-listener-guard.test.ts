import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Files allowed to keep raw addEventListener("keydown") because their
 * keyboard interaction is tightly coupled to transient UI state
 * (autocomplete menus, etc.) and does not represent a configurable shortcut.
 */
const FEATURE_WHITELIST = new Set(["EditorPane.tsx", "useEntityCompletion.ts"]);

function getFilesRecursively(dir: string, ext: string): string[] {
  const result: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      try {
        if (statSync(fullPath).isDirectory()) {
          result.push(...getFilesRecursively(fullPath, ext));
        } else if (
          fullPath.endsWith(ext) &&
          !fullPath.includes(".test.") &&
          !fullPath.includes(".stories.")
        ) {
          result.push(fullPath);
        }
      } catch {
        // skip unreadable entries
      }
    }
  } catch {
    // skip unreadable directories
  }
  return result;
}

function basename(p: string): string {
  return p.split(/[\\/]/).pop() ?? p;
}

describe("hotkey listener guard", () => {
  it("no raw addEventListener keydown in features (except whitelisted)", () => {
    const featuresDir = resolve(__dirname, "../../features");
    const files = getFilesRecursively(featuresDir, ".tsx");
    const violations: string[] = [];

    for (const file of files) {
      if (FEATURE_WHITELIST.has(basename(file))) continue;
      const content = readFileSync(file, "utf8");
      if (/addEventListener\s*\(\s*["']keydown["']/.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it("no raw addEventListener keydown in components", () => {
    const componentsDir = resolve(__dirname, "../../components");
    const files = getFilesRecursively(componentsDir, ".tsx");
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (/addEventListener\s*\(\s*["']keydown["']/.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});

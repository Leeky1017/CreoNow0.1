import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const containerSource = readFileSync(
  path.resolve(__dirname, "VersionHistoryContainer.tsx"),
  "utf8",
);

const helpersSource = readFileSync(
  path.resolve(__dirname, "versionHistoryHelpers.ts"),
  "utf8",
);

describe("VersionHistoryContainer type convergence", () => {
  it("Scenario S2-1: uses imported VersionListItem from versionStore", () => {
    expect(containerSource).toMatch(
      /import\s*\{[^}]*type\s+VersionListItem[^}]*\}\s*from\s*["']\.\.\/\.\.\/stores\/versionStore["']/s,
    );
  });

  it("Scenario S2-2: does not keep a local VersionListItem duplicate", () => {
    expect(containerSource).not.toMatch(
      /^\s*type\s+VersionListItem\s*=\s*|^\s*interface\s+VersionListItem\s*\{/m,
    );
    expect(helpersSource).toMatch(
      /convertToTimeGroups\(\s*\n?\s*items:\s*VersionListItem\[\]/,
    );
    expect(containerSource).toMatch(/useState<VersionListItem\[\]>\(\[\]\)/);
  });
});

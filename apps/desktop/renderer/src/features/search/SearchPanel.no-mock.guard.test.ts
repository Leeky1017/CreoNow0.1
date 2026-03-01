import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../..",
);

describe("WB-FE-CLN-S2: SearchPanel mock data guard", () => {
  it("SearchPanel has no MOCK_ exports or constants", () => {
    const filePath = path.join(
      REPO_ROOT,
      "apps/desktop/renderer/src/features/search/SearchPanel.tsx",
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const mockMatches = content.match(/\bMOCK_\w+/g);
    expect(mockMatches).toBeNull();
  });
});

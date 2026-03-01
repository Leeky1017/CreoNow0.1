import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("AiPanel styles guard", () => {
  it("WB-FE-STYLE-S1 does not inject inline <style> in AiPanel", () => {
    const sourcePathCandidates = [
      resolve(process.cwd(), "renderer/src/features/ai/AiPanel.tsx"),
      resolve(process.cwd(), "apps/desktop/renderer/src/features/ai/AiPanel.tsx"),
    ];
    const sourcePath = sourcePathCandidates.find((path) => existsSync(path));
    if (!sourcePath) {
      throw new Error("Unable to resolve AiPanel.tsx from current cwd");
    }
    const source = readFileSync(sourcePath, "utf8");

    expect(source).not.toMatch(/<style>/);
    expect(source).not.toMatch(/@keyframes\s+blink/);
  });
});

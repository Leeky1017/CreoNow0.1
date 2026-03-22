import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

describe("V1-20 Storybook Excellence Guard", () => {
  const featuresDir = path.resolve(__dirname, "../features");

  it("all feature directories should have story files", () => {
    const dirs = fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== "__tests__")
      .map((d) => d.name);

    const missingStories: string[] = [];
    for (const dir of dirs) {
      const dirPath = path.join(featuresDir, dir);
      const entries = fs.readdirSync(dirPath, { recursive: true });
      const hasStory = entries.some(
        (f) => typeof f === "string" && f.endsWith(".stories.tsx"),
      );
      if (!hasStory) missingStories.push(dir);
    }

    expect(missingStories).toEqual([]);
  });

  it("no story file should exceed 500 lines", () => {
    const storyFiles = execSync(`find ${featuresDir} -name "*.stories.tsx"`, {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);

    const oversized: string[] = [];
    for (const file of storyFiles) {
      const lines = fs.readFileSync(file, "utf-8").split("\n").length;
      if (lines > 500) oversized.push(`${path.basename(file)}: ${lines} lines`);
    }

    expect(oversized).toEqual([]);
  });
});

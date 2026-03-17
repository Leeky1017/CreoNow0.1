import { describe, expect, it } from "vitest";

import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const CJK_PATTERN = /[\u4e00-\u9fff]/gu;

const BACKEND_ERROR_FILES = [
  "apps/desktop/main/src/ipc/runtime-validation.ts",
  "apps/desktop/main/src/services/ai/providerResolver.ts",
] as const;

function findChineseFragments(source: string): string[] {
  const matches = source.match(CJK_PATTERN);
  return [...new Set(matches ?? [])].sort((a, b) => a.localeCompare(b));
}

describe("AUD-C13-S3 backend error language guard", () => {
  it("detects chinese fragments in fixtures", async () => {
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "backend-error-lang-"),
    );
    const fixture = path.join(tempDir, "fixture.ts");
    await writeFile(
      fixture,
      'throw new Error("请求参数不符合契约");\n',
      "utf8",
    );

    const source = await readFile(fixture, "utf8");
    const fragments = findChineseFragments(source);

    expect(fragments.length).toBeGreaterThan(0);
  });

  it("repo backend target files should contain no chinese characters", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");

    const violations: string[] = [];
    for (const relativePath of BACKEND_ERROR_FILES) {
      const absolutePath = path.join(repoRoot, relativePath);
      const source = await readFile(absolutePath, "utf8");
      const fragments = findChineseFragments(source);
      if (fragments.length > 0) {
        violations.push(`${relativePath}: ${fragments.join(" ")}`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Backend error language violations (AUD-C13-S3):\n${violations
          .map((line) => `- ${line}`)
          .join("\n")}`,
      );
    }

    expect(violations).toEqual([]);
  });
});

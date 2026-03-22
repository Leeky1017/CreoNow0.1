/**
 * v1-18 Arbitrary Value Cleanup Guards
 *
 * 守卫测试：确保 features/ 层的 arbitrary CSS 值已被 Design Token 替代。
 * 口径：apps/desktop/renderer/src/components/features/，排除 .stories. 和 .test. 文件。
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const FEATURES_DIR = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/components/features",
);

function countArbitrary(pattern: string): number {
  try {
    const result = execSync(
      `grep -rn '${pattern}' "${FEATURES_DIR}" --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l`,
      { encoding: "utf8" },
    );
    return parseInt(result.trim(), 10);
  } catch {
    return 0;
  }
}

function countVariants(): number {
  try {
    const result = execSync(
      `grep -rnE 'variant="(pill|bento|compact|underline|category)"|size="icon"' "${FEATURES_DIR}" --include='*.tsx' | wc -l`,
      { encoding: "utf8" },
    );
    return parseInt(result.trim(), 10);
  } catch {
    return 0;
  }
}

describe("v1-18 Arbitrary Value Cleanup Guards", () => {
  it("text-[ arbitrary values in features/ prod ≤ 10", () => {
    expect(countArbitrary("text-\\[")).toBeLessThanOrEqual(10);
  });

  it("rounded-[ arbitrary values in features/ prod ≤ 5", () => {
    expect(countArbitrary("rounded-\\[")).toBeLessThanOrEqual(5);
  });

  it("p-[]/m-[]/gap-[] arbitrary values in features/ prod = 0", () => {
    const p = countArbitrary("p-\\[");
    const m = countArbitrary("m-\\[");
    const gap = countArbitrary("gap-\\[");
    expect(p + m + gap).toBe(0);
  });

  it("shadow-[ arbitrary values in features/ prod ≤ 3", () => {
    expect(countArbitrary("shadow-\\[")).toBeLessThanOrEqual(3);
  });
});

describe("v1-18 Variant Adoption Guards", () => {
  it("v1-02 variant usage in features/ ≥ 15", () => {
    expect(countVariants()).toBeGreaterThanOrEqual(15);
  });
});

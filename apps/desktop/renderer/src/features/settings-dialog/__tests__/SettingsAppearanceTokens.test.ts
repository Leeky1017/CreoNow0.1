import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * v1-07 Guard Proof: Settings Appearance Token Compliance
 *
 * Verifies that accent palette tokens are registered in tokens.css.
 */

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));

describe("[Guard] accent palette token registration", () => {
  const TOKENS_PATH = resolve(CURRENT_DIR, "../../../styles/tokens.css");

  it("registers --color-accent-* tokens for all palette colors in tokens.css", () => {
    const tokens = readFileSync(TOKENS_PATH, "utf8");
    expect(tokens).toContain("--color-accent-white");
    expect(tokens).toContain("--color-accent-blue");
    expect(tokens).toContain("--color-accent-green");
    expect(tokens).toContain("--color-accent-orange");
    expect(tokens).toContain("--color-accent-purple");
    expect(tokens).toContain("--color-accent-pink");
  });
});

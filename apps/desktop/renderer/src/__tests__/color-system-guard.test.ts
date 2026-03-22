import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const tokensPath = path.resolve(
  __dirname,
  "../../../../../design/system/01-tokens.css",
);
const css = fs.readFileSync(tokensPath, "utf-8");

describe("V1-23 Color System Guard", () => {
  it("should define 10-step gray scale for dark theme", () => {
    for (let i = 1; i <= 10; i++) {
      expect(css).toContain(`--gray-${i}:`);
    }
  });

  it("should use HSL format for gray scale", () => {
    const grayMatches = css.match(/--gray-\d+:\s*hsl/g);
    expect(grayMatches).not.toBeNull();
    expect(grayMatches!.length).toBeGreaterThanOrEqual(20);
  });

  it("should define functional color hover/active states", () => {
    const colors = ["error", "success", "warning", "info"];
    for (const color of colors) {
      expect(css).toContain(`--color-${color}-hover:`);
      expect(css).toContain(`--color-${color}-active:`);
    }
  });

  it("should define accent active state", () => {
    expect(css).toContain("--color-accent-active:");
  });

  it("should include high contrast media query", () => {
    expect(css).toContain("prefers-contrast: more");
  });

  it("should reference gray scale in semantic bg tokens", () => {
    const bgGrayRefs = css.match(/--color-bg-\w+:\s*var\(--gray-/g);
    expect(bgGrayRefs).not.toBeNull();
    expect(bgGrayRefs!.length).toBeGreaterThanOrEqual(6);
  });
});

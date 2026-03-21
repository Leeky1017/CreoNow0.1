import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STYLES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const MAIN_CSS = fs.readFileSync(path.join(STYLES_DIR, "main.css"), "utf-8");

describe("V1-12 AC-1: .transition-default utility class", () => {
  it("defines .transition-default in main.css", () => {
    expect(MAIN_CSS).toMatch(/\.transition-default\s*\{/);
  });

  it("uses var(--duration-fast) for transition-duration", () => {
    const block = MAIN_CSS.match(
      /\.transition-default\s*\{([^}]+)\}/s,
    );
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(/transition-duration\s*:\s*var\(--duration-fast\)/);
  });

  it("uses var(--ease-default) for transition-timing-function", () => {
    const block = MAIN_CSS.match(
      /\.transition-default\s*\{([^}]+)\}/s,
    );
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(
      /transition-timing-function\s*:\s*var\(--ease-default\)/,
    );
  });
});

describe("V1-12 AC-2: .transition-slow utility class", () => {
  it("defines .transition-slow in main.css", () => {
    expect(MAIN_CSS).toMatch(/\.transition-slow\s*\{/);
  });

  it("uses var(--duration-normal) for transition-duration", () => {
    const block = MAIN_CSS.match(
      /\.transition-slow\s*\{([^}]+)\}/s,
    );
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(
      /transition-duration\s*:\s*var\(--duration-normal\)/,
    );
  });
});

describe("V1-12 AC-3: .scroll-shadow-y utility class", () => {
  it("defines .scroll-shadow-y in main.css", () => {
    expect(MAIN_CSS).toMatch(/\.scroll-shadow-y\s*\{/);
  });

  it("uses mask-image for scroll shadow effect", () => {
    const block = MAIN_CSS.match(
      /\.scroll-shadow-y\s*\{([^}]+)\}/s,
    );
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(/mask-image\s*:/);
  });
});

describe("V1-12 AC-14: motion utilities use semantic Design Tokens", () => {
  it("no hardcoded durations in transition utility class definitions", () => {
    // Only check top-level definitions (not inside @media blocks)
    const cssWithoutMedia = MAIN_CSS.replace(
      /@media\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\}/g,
      "",
    );
    const transitionBlocks = [
      ...cssWithoutMedia.matchAll(
        /\.transition-(?:default|slow)\s*\{([^}]+)\}/gs,
      ),
    ];
    expect(transitionBlocks.length).toBeGreaterThanOrEqual(2);

    for (const match of transitionBlocks) {
      const body = match[1];
      const withoutVars = body.replace(/var\([^)]+\)/g, "");
      expect(withoutVars).not.toMatch(/\d+ms/);
      expect(withoutVars).not.toMatch(/\d+s\b/);
    }
  });
});

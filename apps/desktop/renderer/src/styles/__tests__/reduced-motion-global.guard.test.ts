import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STYLES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const MAIN_CSS = fs.readFileSync(
  path.join(STYLES_DIR, "main.css"),
  "utf-8",
);
const TOKENS_CSS = fs.readFileSync(
  path.join(STYLES_DIR, "tokens.css"),
  "utf-8",
);

const FEATURES_DIR = path.resolve(STYLES_DIR, "..", "features");
const SEARCH_PANEL_TSX = fs.readFileSync(
  path.join(FEATURES_DIR, "search", "SearchPanel.tsx"),
  "utf-8",
);

describe("WB-FE-MOTION-S1: main.css contains global reduced-motion rule", () => {
  it("has @media (prefers-reduced-motion: reduce) with animation-duration and transition-duration overrides for all elements", () => {
    // Extract all reduced-motion media query blocks
    const reducedMotionBlocks = [
      ...MAIN_CSS.matchAll(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\})\s*\}/g,
      ),
    ];

    // Find a block that targets *, *::before, *::after (global override)
    const hasGlobalOverride = reducedMotionBlocks.some((m) => {
      const blockContent = m[1];
      const targetsAllElements =
        /\*[\s,]*\*::before[\s,]*\*::after|[\*]/.test(blockContent) ||
        /\*\s*\{/.test(blockContent);
      const hasAnimationDuration = /animation-duration/.test(blockContent);
      const hasTransitionDuration = /transition-duration/.test(blockContent);
      return targetsAllElements && hasAnimationDuration && hasTransitionDuration;
    });

    expect(hasGlobalOverride).toBe(true);
  });
});

describe("WB-FE-MOTION-S2: tokens.css overrides duration tokens under reduced motion", () => {
  it("defines --duration-fast, --duration-normal, --duration-slow as 0ms in @media (prefers-reduced-motion: reduce)", () => {
    // Extract reduced-motion blocks from tokens.css
    const reducedMotionBlocks = [
      ...TOKENS_CSS.matchAll(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\})\s*\}/g,
      ),
    ];

    expect(reducedMotionBlocks.length).toBeGreaterThan(0);

    // At least one block must contain :root with all three duration tokens set to 0ms
    const hasTokenOverrides = reducedMotionBlocks.some((m) => {
      const blockContent = m[1];
      const hasRoot = /:root/.test(blockContent);
      const hasFast = /--duration-fast\s*:\s*0ms/.test(blockContent);
      const hasNormal = /--duration-normal\s*:\s*0ms/.test(blockContent);
      const hasSlow = /--duration-slow\s*:\s*0ms/.test(blockContent);
      return hasRoot && hasFast && hasNormal && hasSlow;
    });

    expect(hasTokenOverrides).toBe(true);
  });
});

describe("WB-FE-MOTION-S3: no inline @keyframes in feature files", () => {
  it("SearchPanel.tsx does not contain @keyframes", () => {
    expect(SEARCH_PANEL_TSX).not.toMatch(/@keyframes/);
  });
});

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STYLES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const MAIN_CSS = fs.readFileSync(path.join(STYLES_DIR, "main.css"), "utf-8");

describe("WB-FE-THEME-S1: main.css defines theme transition on root element", () => {
  it("html rule includes transition with background-color and color", () => {
    // Match an `html` (or `html,`) selector block containing a transition property
    // that covers background-color and color.
    const hasTransitionOnRoot =
      /html[\s,{][^}]*transition\s*:[^;]*background-color[^;]*color/s.test(
        MAIN_CSS,
      );
    expect(hasTransitionOnRoot).toBe(true);
  });
});

describe("WB-FE-THEME-S2: theme transition uses duration token, not hardcoded ms", () => {
  it("transition references var(--duration-fast) and does not hardcode milliseconds", () => {
    // Extract all transition declarations from html blocks
    const htmlBlockMatch = MAIN_CSS.match(
      /html[\s,{][^}]*transition\s*:([^;]+);/s,
    );
    expect(htmlBlockMatch).not.toBeNull();

    const transitionValue = htmlBlockMatch![1];

    // Must reference duration token
    expect(transitionValue).toMatch(/var\(--duration-fast\)/);

    // Must NOT contain hardcoded ms values like 100ms, 200ms etc.
    // (but var(...) references are fine, so strip them first)
    const withoutVars = transitionValue.replace(/var\([^)]+\)/g, "");
    expect(withoutVars).not.toMatch(/\d+ms/);
  });
});

describe("WB-FE-THEME-S3: theme transition is disabled under reduced motion", () => {
  it("main.css has a global reduced-motion rule that disables transitions on root", () => {
    // There must be a @media (prefers-reduced-motion: reduce) block that sets
    // transition on html (or * or :root) to none / 0s / 0ms.
    const reducedMotionBlocks = [
      ...MAIN_CSS.matchAll(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\})\s*\}/g,
      ),
    ];

    expect(reducedMotionBlocks.length).toBeGreaterThan(0);

    // At least one block must target html/* /:root and set transition to none/0
    const disablesThemeTransition = reducedMotionBlocks.some((m) => {
      const body = m[1];
      // Targets html, *, or :root AND sets transition-duration: 0 or transition: none
      const targetsRoot = /(?:html|\*|:root)\s*\{/.test(body);
      const disablesTransition =
        /transition-duration\s*:\s*0s/i.test(body) ||
        /transition\s*:\s*none/i.test(body);
      return targetsRoot && disablesTransition;
    });

    expect(disablesThemeTransition).toBe(true);
  });
});

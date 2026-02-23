import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const TOOLBAR_PATH = resolve(CURRENT_DIR, "EditorToolbar.tsx");
const BUBBLE_MENU_PATH = resolve(CURRENT_DIR, "EditorBubbleMenu.tsx");
const INLINE_BUTTON_PATH = resolve(CURRENT_DIR, "InlineFormatButton.tsx");
const REDUCED_MOTION_HELPER_PATH = resolve(
  CURRENT_DIR,
  "../../lib/motion/reducedMotion.ts",
);

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("editor motion contracts", () => {
  it("[ED-MOTION-01] should not use transition-all in editor toolbar/bubble controls", () => {
    const toolbarSource = read(TOOLBAR_PATH);
    const bubbleMenuSource = read(BUBBLE_MENU_PATH);
    const inlineButtonSource = read(INLINE_BUTTON_PATH);

    expect(toolbarSource).not.toContain("transition-all");
    expect(bubbleMenuSource).not.toContain("transition-all");
    expect(inlineButtonSource).not.toContain("transition-all");
  });

  it("[ED-MOTION-01] should keep duration/ease token-based transitions in inline controls", () => {
    const inlineButtonSource = read(INLINE_BUTTON_PATH);

    expect(inlineButtonSource).toContain("duration-[var(--duration-fast)]");
  });

  it("[ED-MOTION-02] should use reduced-motion helper instead of hardcoded bubble durations", () => {
    const bubbleMenuSource = read(BUBBLE_MENU_PATH);

    expect(bubbleMenuSource).toContain("resolveReducedMotionDurationPair");
    expect(bubbleMenuSource).not.toContain("duration: [100, 100]");
  });

  it("[ED-MOTION-02] reduced-motion helper should expose duration pair resolver", () => {
    expect(existsSync(REDUCED_MOTION_HELPER_PATH)).toBe(true);

    const helperSource = existsSync(REDUCED_MOTION_HELPER_PATH)
      ? read(REDUCED_MOTION_HELPER_PATH)
      : "";
    expect(helperSource).toContain("resolveReducedMotionDurationPair");
  });
});

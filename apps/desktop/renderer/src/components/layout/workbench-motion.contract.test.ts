import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const SIDEBAR_PATH = resolve(CURRENT_DIR, "Sidebar.tsx");
const RIGHT_PANEL_PATH = resolve(CURRENT_DIR, "RightPanel.tsx");
const ICON_BAR_PATH = resolve(CURRENT_DIR, "IconBar.tsx");
const REDUCED_MOTION_HELPER_PATH = resolve(
  CURRENT_DIR,
  "../../lib/motion/reducedMotion.ts",
);

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("workbench motion contracts", () => {
  it("[WB-MOTION-01] should not use transition-all in key workbench components", () => {
    const sidebarSource = read(SIDEBAR_PATH);
    const rightPanelSource = read(RIGHT_PANEL_PATH);
    const iconBarSource = read(ICON_BAR_PATH);

    expect(sidebarSource).not.toContain("transition-all");
    expect(rightPanelSource).not.toContain("transition-all");
    expect(iconBarSource).not.toContain("transition-all");
  });

  it("[WB-MOTION-02] should use duration/ease tokens in width transitions", () => {
    const sidebarSource = read(SIDEBAR_PATH);

    expect(sidebarSource).toContain("var(--duration-slow)");
    expect(sidebarSource).toContain("var(--ease-default)");
  });

  it("[WB-A11Y-01] should provide reduced-motion helper in shared lib", () => {
    expect(existsSync(REDUCED_MOTION_HELPER_PATH)).toBe(true);
  });

  it("[WB-A11Y-01] reduced-motion helper should include deterministic matchMedia mock", () => {
    const helperSource = existsSync(REDUCED_MOTION_HELPER_PATH)
      ? read(REDUCED_MOTION_HELPER_PATH)
      : "";

    expect(helperSource).toContain("createReducedMotionMatchMediaMock");
  });
});

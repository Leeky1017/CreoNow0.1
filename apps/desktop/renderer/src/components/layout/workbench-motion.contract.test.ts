import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const SIDEBAR_PATH = resolve(CURRENT_DIR, "Sidebar.tsx");
const RIGHT_PANEL_PATH = resolve(CURRENT_DIR, "RightPanel.tsx");
const ICON_BAR_PATH = resolve(CURRENT_DIR, "IconBar.tsx");

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

  it("[WB-MOTION-02] should use duration/ease tokens in workbench transition classes", () => {
    const sidebarSource = read(SIDEBAR_PATH);
    const rightPanelSource = read(RIGHT_PANEL_PATH);
    const iconBarSource = read(ICON_BAR_PATH);

    // Sidebar must NOT have width transition (causes drag jank)
    expect(sidebarSource).not.toContain("var(--duration-slow)");
    expect(sidebarSource).not.toContain("widthTransition");
    expect(rightPanelSource).toContain("duration-[var(--duration-fast)]");
    expect(rightPanelSource).toContain("ease-[var(--ease-default)]");
    expect(iconBarSource).toContain("duration-[var(--duration-fast)]");
    expect(iconBarSource).toContain("ease-[var(--ease-default)]");
    expect(rightPanelSource).not.toContain("duration-200");
    expect(iconBarSource).not.toContain("duration-200");
  });

  it("[WB-A11Y-01] sidebar must not have width transition (drag jank fix)", () => {
    const sidebarSource = read(SIDEBAR_PATH);
    expect(sidebarSource).not.toContain("readPrefersReducedMotion");
    expect(sidebarSource).not.toContain("resolveReducedMotionDuration");
    expect(sidebarSource).not.toContain("widthTransitionDuration");
    expect(sidebarSource).not.toContain("widthTransition");
  });
});

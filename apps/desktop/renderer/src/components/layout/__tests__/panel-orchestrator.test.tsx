import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  computeNextPanelWidth,
  computeNextSidebarWidth,
} from "../PanelOrchestrator";
import { LAYOUT_DEFAULTS } from "../../../stores/layoutStore";

function readSource(relativePath: string): string {
  const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(filePath, "utf8");
}

describe("WB-P2-S5/S6 PanelOrchestrator orchestration", () => {
  it("preserves editor minimum width when resizing panels (WB-P2-S5)", () => {
    const windowWidth = 1000;
    const panelWidth = 320;
    const sidebarStartWidth = 240;

    const nextSidebarWidth = computeNextSidebarWidth({
      deltaX: 10_000,
      startWidth: sidebarStartWidth,
      windowWidth,
      panelWidth,
      panelCollapsed: false,
    });

    const mainWidthAfterSidebarResize =
      windowWidth -
      LAYOUT_DEFAULTS.iconBarWidth -
      panelWidth -
      nextSidebarWidth;
    expect(mainWidthAfterSidebarResize).toBeGreaterThanOrEqual(
      LAYOUT_DEFAULTS.mainMinWidth,
    );

    const sidebarWidth = 240;
    const panelStartWidth = 320;
    const nextPanelWidth = computeNextPanelWidth({
      deltaX: -10_000,
      startWidth: panelStartWidth,
      windowWidth,
      sidebarWidth,
      sidebarCollapsed: false,
    });

    const mainWidthAfterPanelResize =
      windowWidth -
      LAYOUT_DEFAULTS.iconBarWidth -
      sidebarWidth -
      nextPanelWidth;
    expect(mainWidthAfterPanelResize).toBeGreaterThanOrEqual(
      LAYOUT_DEFAULTS.mainMinWidth,
    );
  });

  it("panel surface components do not mutate global layout widths (WB-P2-S6)", () => {
    const sidebarSource = readSource("../Sidebar.tsx");
    const rightPanelSource = readSource("../RightPanel.tsx");

    for (const src of [sidebarSource, rightPanelSource]) {
      expect(src).not.toContain("setSidebarWidth");
      expect(src).not.toContain("setPanelWidth");
      expect(src).not.toContain("resetSidebarWidth");
      expect(src).not.toContain("resetPanelWidth");
    }
  });

  it("AppShell delegates panel collapse state writes to orchestrator helpers (WB-P2-S5/S6)", () => {
    const appShellSource = readSource("../AppShell.tsx");
    const layoutHookSource = readSource("../useAppShellLayout.ts");

    // usePanelVisibilityActions is called in the extracted layout hook
    expect(layoutHookSource).toContain("usePanelVisibilityActions");
    // Neither AppShell nor its layout hook directly call low-level collapse setters
    expect(appShellSource).not.toContain("setSidebarCollapsed");
    expect(appShellSource).not.toContain("setPanelCollapsed");
    expect(layoutHookSource).not.toContain("setSidebarCollapsed");
    expect(layoutHookSource).not.toContain("setPanelCollapsed");
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { LayoutShell } from "../LayoutShell";

function readSource(relativePath: string): string {
  const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(filePath, "utf8");
}

describe("WB-P2-S1 LayoutShell boundary", () => {
  it("renders only layout slots (no business wiring)", () => {
    render(
      <LayoutShell
        testId="layout-shell"
        activityBar={<div data-testid="slot-activity">activity</div>}
        left={<div data-testid="slot-left">left</div>}
        leftResizer={<div data-testid="slot-left-resizer">lr</div>}
        main={<div data-testid="slot-main">main</div>}
        rightResizer={<div data-testid="slot-right-resizer">rr</div>}
        right={<div data-testid="slot-right">right</div>}
        bottomBar={<div data-testid="slot-bottom">bottom</div>}
        overlays={<div data-testid="slot-overlays">overlays</div>}
      />,
    );

    expect(screen.getByTestId("layout-shell")).toBeInTheDocument();
    expect(screen.getByTestId("slot-activity")).toBeInTheDocument();
    expect(screen.getByTestId("slot-left")).toBeInTheDocument();
    expect(screen.getByTestId("slot-left-resizer")).toBeInTheDocument();
    expect(screen.getByTestId("slot-main")).toBeInTheDocument();
    expect(screen.getByTestId("slot-right-resizer")).toBeInTheDocument();
    expect(screen.getByTestId("slot-right")).toBeInTheDocument();
    expect(screen.getByTestId("slot-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("slot-overlays")).toBeInTheDocument();
  });

  it("does not import IPC/service modules (static boundary)", () => {
    const source = readSource("../LayoutShell.tsx");

    // Hard boundary: skeleton must not initiate business IPC calls directly.
    expect(source).not.toContain("ipcClient");
    expect(source).not.toContain("ipcRenderer");
    expect(source).not.toContain("/services/");
    expect(source).not.toContain("invoke(");

    // Keep LayoutShell as a pure layout skeleton; no store wiring.
    expect(source).not.toContain("useLayoutStore");
    expect(source).not.toContain("../stores/");
    expect(source).not.toContain("../../stores/");
  });

  it("AppShell composes LayoutShell + NavigationController + PanelOrchestrator", () => {
    const source = readSource("../AppShell.tsx");

    expect(source).toContain("<LayoutShell");
    expect(source).toContain("NavigationController");
    expect(source).toContain("PanelOrchestrator");
  });
});

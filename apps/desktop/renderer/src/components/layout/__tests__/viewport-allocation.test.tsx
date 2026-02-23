import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function readSource(relativePath: string): string {
  const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(filePath, "utf8");
}

describe("WB-P2-S4 Viewport allocation ownership", () => {
  it("feature panels do not claim the viewport (no h-screen/w-screen)", () => {
    const sidebarSource = readSource("../Sidebar.tsx");
    const rightPanelSource = readSource("../RightPanel.tsx");

    for (const src of [sidebarSource, rightPanelSource]) {
      expect(src).not.toContain("h-screen");
      expect(src).not.toContain("w-screen");
    }
  });

  it("shell skeleton avoids h-screen/w-screen and uses container sizing", () => {
    const appShellSource = readSource("../AppShell.tsx");
    const layoutShellSource = readSource("../LayoutShell.tsx");

    for (const src of [appShellSource, layoutShellSource]) {
      expect(src).not.toContain("h-screen");
      expect(src).not.toContain("w-screen");
    }

    // Shell must own full-height container sizing via h-full (not h-screen).
    expect(layoutShellSource).toContain("h-full");
  });
});

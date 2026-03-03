import { describe, expect, it, vi, afterEach } from "vitest";
import { fireEvent, render, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { NavigationController } from "../NavigationController";

function readSource(relativePath: string): string {
  const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(filePath, "utf8");
}

afterEach(() => cleanup());

describe("WB-P2-S2 NavigationController boundary", () => {
  it("handles shortcuts and route/visibility toggles only", () => {
    const onToggleSidebar = vi.fn();
    const onToggleRightPanel = vi.fn();
    const onToggleZenMode = vi.fn();
    const onExitZenMode = vi.fn();
    const onOpenCommandPalette = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenCreateProject = vi.fn();
    const onCreateDocument = vi.fn();

    render(
      <NavigationController
        zenMode={false}
        canCreateDocument={true}
        onToggleSidebar={onToggleSidebar}
        onToggleRightPanel={onToggleRightPanel}
        onToggleZenMode={onToggleZenMode}
        onExitZenMode={onExitZenMode}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenSettings={onOpenSettings}
        onOpenCreateProject={onOpenCreateProject}
        onCreateDocument={onCreateDocument}
      />,
    );

    fireEvent.keyDown(document, { key: "\\", ctrlKey: true });
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
    expect(onToggleRightPanel).toHaveBeenCalledTimes(0);

    fireEvent.keyDown(document, { key: "l", ctrlKey: true });
    expect(onToggleRightPanel).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "F11" });
    expect(onToggleZenMode).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "p", ctrlKey: true });
    expect(onOpenCommandPalette).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: ",", ctrlKey: true });
    expect(onOpenSettings).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "n", ctrlKey: true, shiftKey: true });
    expect(onOpenCreateProject).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "n", ctrlKey: true });
    expect(onCreateDocument).toHaveBeenCalledTimes(1);
  });

  it("blocks non-exit shortcuts in ZenMode", () => {
    const onToggleSidebar = vi.fn();
    const onToggleRightPanel = vi.fn();
    const onToggleZenMode = vi.fn();
    const onExitZenMode = vi.fn();
    const onOpenCommandPalette = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenCreateProject = vi.fn();
    const onCreateDocument = vi.fn();

    render(
      <NavigationController
        zenMode={true}
        canCreateDocument={true}
        onToggleSidebar={onToggleSidebar}
        onToggleRightPanel={onToggleRightPanel}
        onToggleZenMode={onToggleZenMode}
        onExitZenMode={onExitZenMode}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenSettings={onOpenSettings}
        onOpenCreateProject={onOpenCreateProject}
        onCreateDocument={onCreateDocument}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExitZenMode).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "p", ctrlKey: true });
    fireEvent.keyDown(document, { key: "\\", ctrlKey: true });
    fireEvent.keyDown(document, { key: "l", ctrlKey: true });
    fireEvent.keyDown(document, { key: ",", ctrlKey: true });
    fireEvent.keyDown(document, { key: "n", ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(document, { key: "n", ctrlKey: true });

    expect(onOpenCommandPalette).toHaveBeenCalledTimes(0);
    expect(onToggleSidebar).toHaveBeenCalledTimes(0);
    expect(onToggleRightPanel).toHaveBeenCalledTimes(0);
    expect(onOpenSettings).toHaveBeenCalledTimes(0);
    expect(onOpenCreateProject).toHaveBeenCalledTimes(0);
    expect(onCreateDocument).toHaveBeenCalledTimes(0);
  });

  it("does not perform width allocation (static boundary)", () => {
    const source = readSource("../NavigationController.tsx");

    // Forbidden: width allocation or resize orchestration in NavigationController.
    expect(source).not.toContain("computeSidebarMax");
    expect(source).not.toContain("computePanelMax");
    expect(source).not.toContain("setSidebarWidth");
    expect(source).not.toContain("setPanelWidth");
    expect(source).not.toContain("resetSidebarWidth");
    expect(source).not.toContain("resetPanelWidth");
  });
});

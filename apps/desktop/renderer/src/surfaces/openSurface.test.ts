import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSurfaceActions,
  type DialogStoreActions,
  type LayoutStoreActions,
} from "./openSurface";

function createMockLayoutStore(): LayoutStoreActions {
  return {
    setActiveLeftPanel: vi.fn(),
    setActiveRightPanel: vi.fn(),
    setDialogType: vi.fn(),
    setSpotlightOpen: vi.fn(),
    setSidebarCollapsed: vi.fn(),
    setPanelCollapsed: vi.fn(),
    setZenMode: vi.fn(),
  };
}

function createMockDialogStore(): DialogStoreActions {
  return {
    openSettingsDialog: vi.fn(),
    openExportDialog: vi.fn(),
    openCreateProjectDialog: vi.fn(),
    openCreateTemplateDialog: vi.fn(),
    openMemoryCreateDialog: vi.fn(),
    openMemorySettingsDialog: vi.fn(),
    openSkillPicker: vi.fn(),
    closeDialog: vi.fn(),
  };
}

describe("openSurface dialog and spotlight routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens dialog-mapped surfaces via dialogType and closes spotlight", () => {
    const layout = createMockLayoutStore();
    const dialog = createMockDialogStore();
    const actions = createSurfaceActions(layout, dialog);

    const result = actions.open({ surfaceId: "memoryPanel" });

    expect(result).toEqual({ ok: true });
    expect(layout.setDialogType).toHaveBeenCalledWith("memory");
    expect(layout.setSpotlightOpen).toHaveBeenCalledWith(false);
  });

  it("opens spotlight surfaces and clears dialogType", () => {
    const layout = createMockLayoutStore();
    const dialog = createMockDialogStore();
    const actions = createSurfaceActions(layout, dialog);

    const result = actions.open({ surfaceId: "searchPanel" });

    expect(result).toEqual({ ok: true });
    expect(layout.setDialogType).toHaveBeenCalledWith(null);
    expect(layout.setSpotlightOpen).toHaveBeenCalledWith(true);
  });

  it("closes dialog surfaces by clearing dialogType", () => {
    const layout = createMockLayoutStore();
    const dialog = createMockDialogStore();
    const actions = createSurfaceActions(layout, dialog);

    const result = actions.close("knowledgeGraph");

    expect(result).toEqual({ ok: true });
    expect(layout.setDialogType).toHaveBeenCalledWith(null);
  });

  it("closes spotlight surfaces by setting spotlightOpen=false", () => {
    const layout = createMockLayoutStore();
    const dialog = createMockDialogStore();
    const actions = createSurfaceActions(layout, dialog);

    const result = actions.close("searchPanel");

    expect(result).toEqual({ ok: true });
    expect(layout.setSpotlightOpen).toHaveBeenCalledWith(false);
  });
});

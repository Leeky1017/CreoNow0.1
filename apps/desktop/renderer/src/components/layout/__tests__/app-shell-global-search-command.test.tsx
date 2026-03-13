import { describe, expect, it, vi } from "vitest";

import { buildCommandEntries } from "../AppShell";
import { LAYOUT_SHORTCUTS } from "../../../config/shortcuts";

describe("AppShell global search command discoverability", () => {
  it("includes a command palette entry for global search with formatted shortcut", async () => {
    const onOpenGlobalSearch = vi.fn();
    const close = vi.fn();
    const entries = buildCommandEntries({
      modKey: "Ctrl",
      t: ((key: string) => {
        if (key === "search.shortcut.label") return "Global Search";
        return key;
      }) as never,
      currentProjectId: "proj-1",
      zenMode: false,
      openSettingsDialog: vi.fn(),
      setExportDialogOpen: vi.fn(),
      toggleSidebarVisibility: vi.fn(),
      toggleAiPanel: vi.fn(),
      setZenMode: vi.fn(),
      createDocument: vi.fn(async () => ({ ok: true })),
      openVersionHistoryPanel: vi.fn(),
      setCreateProjectDialogOpen: vi.fn(),
      openGlobalSearch: onOpenGlobalSearch,
      close,
    });

    const searchEntry = entries.find((item) => item.id === "open-global-search");
    expect(searchEntry).toBeDefined();
    expect(searchEntry?.label).toBe("Global Search");
    expect(searchEntry?.shortcut).toBe(LAYOUT_SHORTCUTS.globalSearch.display());

    await searchEntry?.onSelect();
    expect(onOpenGlobalSearch).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});

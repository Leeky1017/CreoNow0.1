import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CommandPalette, type CommandItem } from "./CommandPalette";

// Mock stores
vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      current: { projectId: "test-project" },
    };
    return selector(state);
  }),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn((selector) => {
    const state = {
      documentId: "test-document",
    };
    return selector(state);
  }),
}));

vi.mock("../../lib/ipcClient", () => ({
  invoke: vi.fn().mockResolvedValue({ ok: true }),
}));

function createCommandsWithOpenFolder(): CommandItem[] {
  return [
    {
      id: "open-settings",
      label: "Open Settings",
      group: "Commands",
      onSelect: vi.fn(),
    },
    {
      id: "open-folder",
      label: "Open Folder",
      group: "Commands",
      category: "command",
      onSelect: vi.fn(),
    },
  ];
}

describe("CommandPalette Open Folder Command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // WB-FE-OPENF-UI-S3: Open Folder command exists in palette
  it("exposes Open Folder command in palette", async () => {
    const commands = createCommandsWithOpenFolder();
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={commands}
        layoutActions={{
          onToggleSidebar: vi.fn(),
          onToggleRightPanel: vi.fn(),
          onToggleZenMode: vi.fn(),
        }}
        dialogActions={{
          onOpenSettings: vi.fn(),
          onOpenExport: vi.fn(),
          onOpenCreateProject: vi.fn(),
        }}
        documentActions={{
          onCreateDocument: vi.fn(),
        }}
      />,
    );

    // Search for "Open Folder"
    const searchInput = screen.getByPlaceholderText("搜索命令或文件...");
    await userEvent.type(searchInput, "Open Folder");

    expect(screen.getByText("Open Folder")).toBeInTheDocument();
  });

  // WB-FE-OPENF-UI-S3b: Selecting command triggers action
  it("triggers open-folder action on command select", async () => {
    const commands = createCommandsWithOpenFolder();
    const openFolderCmd = commands.find((c) => c.id === "open-folder")!;
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={commands}
        layoutActions={{
          onToggleSidebar: vi.fn(),
          onToggleRightPanel: vi.fn(),
          onToggleZenMode: vi.fn(),
        }}
        dialogActions={{
          onOpenSettings: vi.fn(),
          onOpenExport: vi.fn(),
          onOpenCreateProject: vi.fn(),
        }}
        documentActions={{
          onCreateDocument: vi.fn(),
        }}
      />,
    );

    const searchInput = screen.getByPlaceholderText("搜索命令或文件...");
    await userEvent.type(searchInput, "Open Folder");

    const option = screen.getByText("Open Folder");
    await userEvent.click(option);

    expect(openFolderCmd.onSelect).toHaveBeenCalled();
  });
});

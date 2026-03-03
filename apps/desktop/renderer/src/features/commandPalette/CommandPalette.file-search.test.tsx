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

// =============================================================================
// Helpers
// =============================================================================

function createCommandItems(): CommandItem[] {
  return [
    {
      id: "open-settings",
      label: "Open Settings",
      group: "command",
      category: "command",
      onSelect: vi.fn(),
    },
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      group: "command",
      category: "command",
      onSelect: vi.fn(),
    },
  ];
}

function createFileItems(): CommandItem[] {
  return [
    {
      id: "file-chapter1",
      label: "第一章.md",
      subtext: "小说/章节",
      group: "file",
      category: "file",
      onSelect: vi.fn(),
    },
    {
      id: "file-chapter2",
      label: "第二章.md",
      subtext: "小说/章节",
      group: "file",
      category: "file",
      onSelect: vi.fn(),
    },
    {
      id: "file-readme",
      label: "README.md",
      subtext: "项目根目录",
      group: "file",
      category: "file",
      onSelect: vi.fn(),
    },
  ];
}

// =============================================================================
// Tests
// =============================================================================

describe("CommandPalette file search integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows file results when query matches file names (WB-FE-CP-S2)", async () => {
    const user = userEvent.setup();
    const commands = [...createCommandItems(), ...createFileItems()];

    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={commands}
      />,
    );

    const input = screen.getByRole("textbox", { name: /search commands/i });
    await user.type(input, "章");

    // File items matching "章" should appear (use testid since highlightMatch splits text)
    expect(screen.getByTestId("command-item-file-chapter1")).toBeInTheDocument();
    expect(screen.getByTestId("command-item-file-chapter2")).toBeInTheDocument();
    // "README.md" should not appear since it doesn't match "章"
    expect(
      screen.queryByTestId("command-item-file-readme"),
    ).not.toBeInTheDocument();
  });

  it("shows file items with fuzzy match (WB-FE-CP-S2)", async () => {
    const user = userEvent.setup();
    const commands = [...createCommandItems(), ...createFileItems()];

    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={commands}
      />,
    );

    const input = screen.getByRole("textbox", { name: /search commands/i });
    await user.type(input, "rdm");

    // "README.md" should match fuzzy for "rdm" (R-ea-D-M-e)
    expect(screen.getByTestId("command-item-file-readme")).toBeInTheDocument();
  });

  it("degrades gracefully when no file items available (WB-FE-CP-S3)", async () => {
    const user = userEvent.setup();
    // Only command items, no file items
    const commands = createCommandItems();

    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={commands}
      />,
    );

    const input = screen.getByRole("textbox", { name: /search commands/i });
    await user.type(input, "set");

    // Command items should still work (use testid since highlightMatch splits text)
    expect(
      screen.getByTestId("command-item-open-settings"),
    ).toBeInTheDocument();
    // No error should appear
    expect(
      screen.queryByTestId("command-palette-error"),
    ).not.toBeInTheDocument();
  });

  it("does not show file items when query is empty (file items hidden by default)", () => {
    const commands = [...createCommandItems(), ...createFileItems()];

    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={commands}
      />,
    );

    // With empty query, file items should be hidden (existing behavior)
    expect(screen.queryByText("第一章.md")).not.toBeInTheDocument();
    expect(screen.queryByText("第二章.md")).not.toBeInTheDocument();
    // Command items should be visible
    expect(screen.getByText("Open Settings")).toBeInTheDocument();
  });
});

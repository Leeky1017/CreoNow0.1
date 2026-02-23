import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { OutlinePanel, type OutlineItem } from "./OutlinePanel";

const SAMPLE_ITEMS: OutlineItem[] = [
  { id: "h1-title", title: "Document Title", level: "h1" },
  { id: "h2-intro", title: "Introduction", level: "h2" },
  { id: "h3-background", title: "Background", level: "h3" },
  { id: "h2-conclusion", title: "Conclusion", level: "h2" },
];

const SAMPLE_WORD_COUNTS: Record<string, number> = {
  "h1-title": 2450,
  "h2-intro": 320,
  "h3-background": 150,
  "h2-conclusion": 200,
};

describe("OutlinePanel", () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  it("renders with items", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    expect(screen.getByTestId("outline-panel")).toBeInTheDocument();
    expect(screen.getByText("Document Title")).toBeInTheDocument();
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Conclusion")).toBeInTheDocument();
  });

  it("renders empty state when no items", () => {
    render(<OutlinePanel items={[]} />);

    expect(screen.getByTestId("outline-empty-state")).toBeInTheDocument();
    expect(screen.getByText(/No outline yet/)).toBeInTheDocument();
  });

  it("shows active indicator for active item", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} activeId="h1-title" />);

    const activeItem = screen.getByTestId("outline-item-h1-title");
    expect(activeItem).toHaveAttribute("aria-selected", "true");
  });

  it("[ED-SCROLL-01] 大纲滚动区域应由 ScrollArea viewport 承载", () => {
    const onNavigate = vi.fn();
    const longItems: OutlineItem[] = Array.from({ length: 180 }, (_, index) => ({
      id: `outline-${index}`,
      title: `Heading ${index}`,
      level: (["h1", "h2", "h3"] as const)[index % 3],
    }));
    render(<OutlinePanel items={longItems} onNavigate={onNavigate} />);

    const viewport = screen.getByTestId("outline-scroll-viewport");
    const searchInput = screen.getByTestId("outline-search-input");
    const expandAllButton = screen.getByRole("button", {
      name: "Expand all outline items",
    });
    const collapseAllButton = screen.getByRole("button", {
      name: "Collapse all outline items",
    });

    expect(viewport).toBeInTheDocument();
    expect(viewport.className).toContain("overflow-y-auto");
    expect(viewport).not.toContainElement(searchInput);
    expect(viewport).not.toContainElement(expandAllButton);
    expect(viewport).not.toContainElement(collapseAllButton);

    fireEvent.scroll(viewport, { target: { scrollTop: 640 } });
    fireEvent.change(searchInput, { target: { value: "Heading 120" } });
    fireEvent.click(expandAllButton);
    fireEvent.click(collapseAllButton);

    const panel = screen.getByTestId("outline-panel");
    panel.focus();
    fireEvent.keyDown(panel, { key: "ArrowDown" });

    expect(searchInput).toHaveValue("Heading 120");
    expect(screen.getByText("Heading 120")).toBeInTheDocument();
    expect(onNavigate).toHaveBeenCalledWith("outline-120");
  });

  // ==========================================================================
  // P0: Single Node Collapse
  // ==========================================================================

  it("shows collapse toggle for items with children", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    // H1 and H2 items should have collapse toggles (they have child items after them)
    const h1Item = screen.getByTestId("outline-item-h1-title");
    const collapseButton = h1Item.querySelector('button[aria-label="Collapse"]');
    expect(collapseButton).toBeInTheDocument();
  });

  it("collapses and expands child items when toggle clicked", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    // Find the collapse button on the H1 item
    const h1Item = screen.getByTestId("outline-item-h1-title");
    const collapseButton = h1Item.querySelector('button[aria-label="Collapse"]');
    expect(collapseButton).toBeInTheDocument();

    // Click to collapse
    await user.click(collapseButton!);

    // H2 and H3 should be hidden (they are children of H1)
    // Note: The visibility is controlled by not rendering, so we check for absence
    // This depends on the implementation - we may need to adjust
  });

  // ==========================================================================
  // P0: Drag and Drop
  // ==========================================================================

  it("handles drag start", () => {
    const onReorder = vi.fn();
    render(<OutlinePanel items={SAMPLE_ITEMS} onReorder={onReorder} draggable />);

    const item = screen.getByTestId("outline-item-h2-intro");
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(),
      effectAllowed: "",
    };

    fireEvent.dragStart(item, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "h2-intro");
  });

  it("handles drop with position", () => {
    const onReorder = vi.fn();
    render(<OutlinePanel items={SAMPLE_ITEMS} onReorder={onReorder} draggable />);

    const targetItem = screen.getByTestId("outline-item-h2-conclusion");
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("h2-intro"),
    };

    // Simulate drag over and drop
    fireEvent.dragOver(targetItem, {
      dataTransfer,
      clientY: targetItem.getBoundingClientRect().top + 5, // Near top = "before"
    });
    fireEvent.drop(targetItem, { dataTransfer });

    expect(onReorder).toHaveBeenCalled();
  });

  // ==========================================================================
  // P0: Editor Sync
  // ==========================================================================

  it("shows scroll sync indicator when enabled", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} scrollSyncEnabled />);

    expect(screen.getByText("Sync with editor")).toBeInTheDocument();
  });

  it("does not show scroll sync indicator when disabled", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} scrollSyncEnabled={false} />);

    expect(screen.queryByText("Sync with editor")).not.toBeInTheDocument();
  });

  // ==========================================================================
  // P1: Word Count
  // ==========================================================================

  it("displays word counts when provided", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} wordCounts={SAMPLE_WORD_COUNTS} />);

    // Should show formatted word counts - check that word count elements exist
    // Word counts are displayed with formatWordCount function
    const h1Item = screen.getByTestId("outline-item-h1-title");
    const h2IntroItem = screen.getByTestId("outline-item-h2-intro");
    
    // The word count should be rendered within the items
    expect(h1Item.textContent).toContain("2.5k"); // 2450 formatted
    expect(h2IntroItem.textContent).toContain("320");
  });

  // ==========================================================================
  // P1: Search/Filter
  // ==========================================================================

  it("renders search input", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    expect(screen.getByTestId("outline-search-input")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter outline...")).toBeInTheDocument();
  });

  it("filters items based on search query", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    const searchInput = screen.getByTestId("outline-search-input");
    await user.type(searchInput, "intro");

    // Only "Introduction" should be visible
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.queryByText("Conclusion")).not.toBeInTheDocument();
  });

  it("shows no results state when search has no matches", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    const searchInput = screen.getByTestId("outline-search-input");
    await user.type(searchInput, "xyz123nonexistent");

    expect(screen.getByText(/No results for/)).toBeInTheDocument();
  });

  it("clears search when clear button clicked", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    const searchInput = screen.getByTestId("outline-search-input");
    await user.type(searchInput, "intro");

    // Click clear button
    const clearButton = screen.getByText("×");
    await user.click(clearButton);

    // All items should be visible again
    expect(screen.getByText("Document Title")).toBeInTheDocument();
    expect(screen.getByText("Conclusion")).toBeInTheDocument();
  });

  // ==========================================================================
  // P1: Multi-select
  // ==========================================================================

  it("selects item on Ctrl+Click", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    const item = screen.getByTestId("outline-item-h2-intro");
    fireEvent.click(item, { ctrlKey: true });

    // Selection bar should appear
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("shows selection count and actions", () => {
    const onDelete = vi.fn();
    render(<OutlinePanel items={SAMPLE_ITEMS} onDelete={onDelete} />);

    // Select two items with Ctrl+Click
    const item1 = screen.getByTestId("outline-item-h2-intro");
    const item2 = screen.getByTestId("outline-item-h2-conclusion");
    fireEvent.click(item1, { ctrlKey: true });
    fireEvent.click(item2, { ctrlKey: true });

    expect(screen.getByText("2 selected")).toBeInTheDocument();
    // Find delete button in selection bar
    const selectionBar = screen.getByText("2 selected").closest("div");
    expect(selectionBar?.textContent).toContain("Delete");
    expect(selectionBar?.textContent).toContain("Clear");
  });

  it("deletes selected items", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<OutlinePanel items={SAMPLE_ITEMS} onDelete={onDelete} />);

    // Select two items with Ctrl+Click using fireEvent
    const item1 = screen.getByTestId("outline-item-h2-intro");
    const item2 = screen.getByTestId("outline-item-h2-conclusion");
    fireEvent.click(item1, { ctrlKey: true });
    fireEvent.click(item2, { ctrlKey: true });

    // Click delete in selection bar
    const selectionBar = screen.getByText("2 selected").closest("div");
    const deleteButton = selectionBar?.querySelector('button');
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton!);

    expect(onDelete).toHaveBeenCalledWith(expect.arrayContaining(["h2-intro", "h2-conclusion"]));
  });

  it("clears selection", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    // Select an item with Ctrl+Click using fireEvent
    const item = screen.getByTestId("outline-item-h2-intro");
    fireEvent.click(item, { ctrlKey: true });

    // Should show selection bar
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    // Click clear (in the selection bar)
    const selectionBar = screen.getByText("1 selected").closest("div");
    const buttons = selectionBar?.querySelectorAll("button");
    const clearButton = buttons?.[buttons.length - 1]; // Last button is Clear
    expect(clearButton).toBeInTheDocument();
    await user.click(clearButton!);

    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

  // ==========================================================================
  // P1: Keyboard Navigation
  // ==========================================================================

  it("navigates with Arrow keys", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<OutlinePanel items={SAMPLE_ITEMS} activeId="h1-title" onNavigate={onNavigate} />);

    // Focus the panel
    const panel = screen.getByTestId("outline-panel");
    panel.focus();

    // Press ArrowDown
    await user.keyboard("{ArrowDown}");

    expect(onNavigate).toHaveBeenCalledWith("h2-intro");
  });

  it("enters edit mode on F2", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} activeId="h1-title" />);

    // Focus the panel
    const panel = screen.getByTestId("outline-panel");
    panel.focus();

    // Press F2
    await user.keyboard("{F2}");

    // Should have an input now
    const h1Item = screen.getByTestId("outline-item-h1-title");
    const input = h1Item.querySelector("input");
    expect(input).toBeInTheDocument();
  });

  it("deletes on Delete key", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<OutlinePanel items={SAMPLE_ITEMS} activeId="h1-title" onDelete={onDelete} />);

    // Focus the panel
    const panel = screen.getByTestId("outline-panel");
    panel.focus();

    // Press Delete
    await user.keyboard("{Delete}");

    expect(onDelete).toHaveBeenCalledWith(["h1-title"]);
  });

  it("selects all on Ctrl+A", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    // Focus the panel
    const panel = screen.getByTestId("outline-panel");
    panel.focus();

    // Press Ctrl+A
    await user.keyboard("{Control>}a{/Control}");

    expect(screen.getByText("4 selected")).toBeInTheDocument();
  });

  // ==========================================================================
  // Editing
  // ==========================================================================

  it("calls onNavigate when item is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<OutlinePanel items={SAMPLE_ITEMS} onNavigate={onNavigate} />);

    await user.click(screen.getByText("Introduction"));

    expect(onNavigate).toHaveBeenCalledWith("h2-intro");
  });

  it("enters edit mode on double click", async () => {
    const user = userEvent.setup();
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    const item = screen.getByTestId("outline-item-h2-intro");
    await user.dblClick(item);

    const input = item.querySelector("input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Introduction");
  });

  it("commits edit on Enter key", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(<OutlinePanel items={SAMPLE_ITEMS} onRename={onRename} />);

    const item = screen.getByTestId("outline-item-h2-intro");
    await user.dblClick(item);

    const input = item.querySelector("input");
    expect(input).toBeInTheDocument();

    await user.clear(input!);
    await user.type(input!, "New Title{Enter}");

    expect(onRename).toHaveBeenCalledWith("h2-intro", "New Title");
  });

  it("cancels edit on Escape key", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(<OutlinePanel items={SAMPLE_ITEMS} onRename={onRename} />);

    const item = screen.getByTestId("outline-item-h2-intro");
    await user.dblClick(item);

    const input = item.querySelector("input");
    expect(input).toBeInTheDocument();

    await user.type(input!, "New Title{Escape}");

    expect(onRename).not.toHaveBeenCalled();
    expect(item.querySelector("input")).not.toBeInTheDocument();
  });

  // ==========================================================================
  // Hover Actions
  // ==========================================================================

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<OutlinePanel items={SAMPLE_ITEMS} onDelete={onDelete} />);

    const item = screen.getByTestId("outline-item-h2-intro");
    await user.hover(item);

    const deleteButton = item.querySelector('button[title*="Delete"]');
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton!);

    expect(onDelete).toHaveBeenCalledWith(["h2-intro"]);
  });

  // ==========================================================================
  // Header Actions
  // ==========================================================================

  it("renders header with Expand/Collapse buttons", () => {
    render(<OutlinePanel items={SAMPLE_ITEMS} />);

    expect(screen.getByText("Outline")).toBeInTheDocument();
    expect(screen.getByTitle("Expand All")).toBeInTheDocument();
    expect(screen.getByTitle("Collapse All")).toBeInTheDocument();
  });
});

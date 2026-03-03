import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShortcutsPanel } from "./ShortcutsPanel";

vi.mock("../../config/shortcuts", () => ({
  getAllShortcuts: () => [
    {
      id: "save",
      label: "Save",
      keys: "mod+S",
      display: () => "Ctrl+S",
    },
    {
      id: "search",
      label: "Search",
      keys: "mod+F",
      display: () => "Ctrl+F",
    },
    {
      id: "bold",
      label: "Bold",
      keys: "mod+B",
      display: () => "Ctrl+B",
    },
  ],
}));

describe("ShortcutsPanel", () => {
  it("renders all shortcuts from getAllShortcuts", () => {
    render(<ShortcutsPanel />);
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
  });

  it("renders shortcut key display strings", () => {
    render(<ShortcutsPanel />);
    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+F")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+B")).toBeInTheDocument();
  });

  it("has accessible heading", () => {
    render(<ShortcutsPanel />);
    expect(
      screen.getByRole("heading", { name: /keyboard shortcuts/i }),
    ).toBeInTheDocument();
  });
});

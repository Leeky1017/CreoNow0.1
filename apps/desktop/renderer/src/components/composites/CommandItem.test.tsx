import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandItem } from "./CommandItem";

describe("CommandItem", () => {
  it("renders icon, label, and hint", () => {
    render(
      <CommandItem
        icon={<span data-testid="cmd-icon">⚙️</span>}
        label="Open Settings"
        hint="⌘,"
      />,
    );

    expect(screen.getByTestId("cmd-icon")).toBeInTheDocument();
    expect(screen.getByText("Open Settings")).toBeInTheDocument();
    expect(screen.getByText("⌘,")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<CommandItem label="Run Command" onSelect={handleSelect} />);

    await user.click(screen.getByText("Run Command"));
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it("shows active state when active prop is true", () => {
    render(<CommandItem label="Active Command" active />);

    const item = screen.getByRole("option");
    expect(item).toHaveAttribute("aria-selected", "true");
  });
});

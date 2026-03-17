import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("renders in unchecked state by default", () => {
    render(<Toggle />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("renders in checked state when checked prop is true", () => {
    render(<Toggle checked={true} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("renders with defaultChecked", () => {
    render(<Toggle defaultChecked={true} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("toggles state when clicked (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Toggle defaultChecked={false} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("calls onCheckedChange when toggled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Toggle checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders label when provided", () => {
    render(<Toggle label="Enable feature" />);

    expect(screen.getByText("Enable feature")).toBeInTheDocument();
    expect(screen.getByLabelText("Enable feature")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<Toggle label="Focus Mode" description="Dims interface elements" />);

    expect(screen.getByText("Dims interface elements")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Toggle disabled={true} onCheckedChange={onCheckedChange} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();

    await user.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("can be toggled with keyboard", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Toggle checked={false} onCheckedChange={onCheckedChange} />);

    const toggle = screen.getByRole("switch");
    toggle.focus();

    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

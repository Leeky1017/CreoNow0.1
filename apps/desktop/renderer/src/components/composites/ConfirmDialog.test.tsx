import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    title: "Delete project?",
    description: "This action cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    open: true,
  };

  it("renders title and description when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete project?")).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone."),
    ).toBeInTheDocument();
  });

  it("applies destructive style to confirm button", () => {
    render(<ConfirmDialog {...defaultProps} destructive />);
    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    expect(confirmBtn.className).toMatch(/destructive/i);
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders confirm button without destructive style by default", () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    expect(confirmBtn.className).not.toMatch(/destructive/i);
  });
});

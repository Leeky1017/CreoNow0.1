import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders icon, title, and description", () => {
    render(
      <EmptyState
        icon={<span data-testid="empty-icon">📁</span>}
        title="No files"
        description="Create a new file to get started"
      />,
    );
    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
    expect(screen.getByText("No files")).toBeInTheDocument();
    expect(
      screen.getByText("Create a new file to get started"),
    ).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No files"
        action={<button onClick={onClick}>Create File</button>}
      />,
    );
    const btn = screen.getByText("Create File");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders without icon and description", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("applies custom data-testid", () => {
    render(<EmptyState title="Test" data-testid="custom-empty" />);
    expect(screen.getByTestId("custom-empty")).toBeInTheDocument();
  });
});

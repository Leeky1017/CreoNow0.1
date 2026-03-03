import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolbarGroup } from "./ToolbarGroup";

describe("ToolbarGroup", () => {
  it("renders children in a flex container", () => {
    render(
      <ToolbarGroup data-testid="toolbar-group">
        <button type="button">Bold</button>
        <button type="button">Italic</button>
      </ToolbarGroup>,
    );
    const group = screen.getByTestId("toolbar-group");
    expect(group).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Italic")).toBeInTheDocument();
  });
});

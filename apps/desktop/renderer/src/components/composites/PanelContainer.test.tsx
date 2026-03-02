import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PanelContainer } from "./PanelContainer";

describe("PanelContainer", () => {
  it("renders title and children", () => {
    render(
      <PanelContainer title="Test Panel">
        <p>Panel content</p>
      </PanelContainer>,
    );

    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });

  it("renders header actions when provided", () => {
    render(
      <PanelContainer
        title="Actions Panel"
        actions={<button type="button">Action</button>}
      >
        <p>Body</p>
      </PanelContainer>,
    );

    expect(screen.getByText("Actions Panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <PanelContainer title="With Icon" icon={<span data-testid="panel-icon">🎨</span>}>
        <p>Body</p>
      </PanelContainer>,
    );

    expect(screen.getByTestId("panel-icon")).toBeInTheDocument();
  });
});

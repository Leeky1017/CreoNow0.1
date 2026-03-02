import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CharacterPanelSkeleton } from "./CharacterPanelSkeleton";

describe("CharacterPanelSkeleton", () => {
  it("renders skeleton elements for character cards", () => {
    render(<CharacterPanelSkeleton />);

    const container = screen.getByTestId("character-panel-skeleton");
    expect(container).toBeInTheDocument();

    const skeletons = container.querySelectorAll('[role="progressbar"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

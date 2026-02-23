import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScrollArea } from "./ScrollArea";

describe("ScrollArea primitive", () => {
  it("renders root and viewport containers", () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div>content</div>
      </ScrollArea>,
    );

    expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
    expect(screen.getByTestId("scroll-area-viewport")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("supports custom viewport test id", () => {
    render(
      <ScrollArea data-testid="custom-scroll" viewportTestId="custom-viewport">
        <div>rows</div>
      </ScrollArea>,
    );

    expect(screen.getByTestId("custom-viewport")).toBeInTheDocument();
  });
});

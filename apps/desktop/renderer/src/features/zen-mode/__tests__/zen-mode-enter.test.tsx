import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../../components/layout/AppShell";
import { LayoutTestWrapper } from "../../../components/layout/test-utils";

describe("S3-ZEN-MODE-S1", () => {
  it("entering zen mode hides side panels and keeps editor focus", () => {
    render(
      <LayoutTestWrapper>
        <AppShell />
      </LayoutTestWrapper>,
    );

    const main = screen.getByRole("main");
    main.setAttribute("tabindex", "-1");
    main.focus();
    expect(document.activeElement).toBe(main);

    fireEvent.keyDown(document, { key: "F11" });

    expect(screen.getByTestId("layout-sidebar")).toHaveClass("hidden");
    expect(screen.getByTestId("layout-panel")).toHaveClass("hidden");
    expect(screen.getByTestId("zen-mode")).toBeInTheDocument();
    expect(document.activeElement).toBe(main);
  });
});

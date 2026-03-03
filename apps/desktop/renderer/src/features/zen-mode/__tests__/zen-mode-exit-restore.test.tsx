import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "../../../components/layout/AppShell";
import { LayoutTestWrapper } from "../../../components/layout/test-utils";

describe("S3-ZEN-MODE-S2", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("exiting zen mode restores previous layout snapshot", () => {
    vi.useFakeTimers();

    render(
      <LayoutTestWrapper>
        <AppShell />
      </LayoutTestWrapper>,
    );

    const sidebar = screen.getByTestId("layout-sidebar");
    const panel = screen.getByTestId("layout-panel");
    expect(sidebar).not.toHaveClass("hidden");
    expect(panel).not.toHaveClass("hidden");

    fireEvent.keyDown(document, { key: "\\", ctrlKey: true });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(sidebar).toHaveClass("hidden");
    expect(panel).not.toHaveClass("hidden");

    fireEvent.keyDown(document, { key: "F11" });
    expect(sidebar).toHaveClass("hidden");
    expect(panel).toHaveClass("hidden");
    expect(screen.getByTestId("zen-mode")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("zen-mode")).not.toBeInTheDocument();
    expect(sidebar).toHaveClass("hidden");
    expect(panel).not.toHaveClass("hidden");
  });
});

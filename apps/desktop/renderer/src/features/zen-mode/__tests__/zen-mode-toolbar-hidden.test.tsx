import { fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "../../../components/layout/AppShell";
import { LayoutTestWrapper } from "../../../components/layout/test-utils";

describe("AC-3: zen mode hides toolbar and slash panel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("zen mode overlay does not contain toolbar or slash panel", () => {
    vi.useFakeTimers();

    render(
      <LayoutTestWrapper>
        <AppShell />
      </LayoutTestWrapper>,
    );

    // Enter zen mode with F11
    fireEvent.keyDown(document, { key: "F11" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Zen mode should be visible
    const zenOverlay = screen.getByTestId("zen-mode");
    expect(zenOverlay).toBeInTheDocument();

    // Toolbar and slash panel should not be inside zen overlay
    expect(zenOverlay.querySelector('[data-testid="editor-toolbar"]')).toBeNull();
    expect(zenOverlay.querySelector('[data-testid="slash-command-panel"]')).toBeNull();
  });

  it("SlashCommandPanel is not rendered when zen mode is active", () => {
    vi.useFakeTimers();

    render(
      <LayoutTestWrapper>
        <AppShell />
      </LayoutTestWrapper>,
    );

    // Enter zen mode
    fireEvent.keyDown(document, { key: "F11" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("zen-mode")).toBeInTheDocument();
    expect(screen.queryByTestId("slash-command-panel")).not.toBeInTheDocument();
  });

  it("zen mode overlay has EditorContent area for real editing", () => {
    vi.useFakeTimers();

    render(
      <LayoutTestWrapper>
        <AppShell />
      </LayoutTestWrapper>,
    );

    fireEvent.keyDown(document, { key: "F11" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("zen-editor-area")).toBeInTheDocument();
  });
});

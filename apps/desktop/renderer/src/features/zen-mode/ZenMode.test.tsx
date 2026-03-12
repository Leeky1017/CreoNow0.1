import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Editor } from "@tiptap/react";
import { ZenMode, type ZenModeProps } from "./ZenMode";

// Mock EditorContent to avoid needing a real ProseMirror view in jsdom
vi.mock("@tiptap/react", () => ({
  EditorContent: (props: { editor: unknown; className?: string }) => (
    <div data-testid="tiptap-editor-content" className={props.className} />
  ),
}));

/**
 * Minimal mock editor for testing.
 * Provides the commands.focus() method needed by ZenMode.
 */
function createMockEditor(overrides: Record<string, unknown> = {}) {
  return {
    commands: { focus: vi.fn() },
    getJSON: vi.fn(() => ({ type: "doc", content: [] })),
    ...overrides,
  } as unknown as Editor;
}

const defaultStats = {
  wordCount: 847,
  saveStatus: "Saved",
  readTimeMinutes: 4,
};

const defaultProps: ZenModeProps = {
  open: true,
  onExit: vi.fn(),
  editor: createMockEditor(),
  title: "The Architecture of Silence",
  isEmpty: false,
  stats: defaultStats,
  currentTime: "11:32 PM",
};

describe("ZenMode", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(<ZenMode {...defaultProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders fullscreen overlay when open is true", () => {
    render(<ZenMode {...defaultProps} />);
    const zenMode = screen.getByTestId("zen-mode");
    expect(zenMode).toBeInTheDocument();
    expect(zenMode).toHaveClass("fixed", "inset-0");
  });

  it("displays the title", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByText("The Architecture of Silence")).toBeInTheDocument();
  });

  it("renders EditorContent (not static paragraphs)", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByTestId("zen-editor-content")).toBeInTheDocument();
    // No zen-cursor should exist (BlinkingCursor removed)
    expect(screen.queryByTestId("zen-cursor")).not.toBeInTheDocument();
  });

  it("has no zen-cursor element", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.queryByTestId("zen-cursor")).not.toBeInTheDocument();
  });

  it("displays word count in status bar", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByTestId("zen-word-count")).toHaveTextContent("847 words");
  });

  it("displays save status", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByTestId("zen-save-status")).toHaveTextContent("Saved");
  });

  it("displays read time", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByTestId("zen-read-time")).toHaveTextContent("4 min read");
  });

  it("displays current time when provided", () => {
    render(<ZenMode {...defaultProps} currentTime="11:32 PM" />);
    expect(screen.getByTestId("zen-time")).toHaveTextContent("11:32 PM");
  });

  it("hides time when not provided", () => {
    render(<ZenMode {...defaultProps} currentTime={undefined} />);
    expect(screen.queryByTestId("zen-time")).not.toBeInTheDocument();
  });

  it("calls onExit when ESC key is pressed", () => {
    const onExit = vi.fn();
    render(<ZenMode {...defaultProps} onExit={onExit} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("calls onExit when X button is clicked", () => {
    const onExit = vi.fn();
    render(<ZenMode {...defaultProps} onExit={onExit} />);

    const exitButton = screen.getByTestId("zen-exit-button");
    fireEvent.click(exitButton);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility label on exit button", () => {
    render(<ZenMode {...defaultProps} />);
    const exitButton = screen.getByTestId("zen-exit-button");
    expect(exitButton).toHaveAttribute("aria-label", "Exit zen mode");
  });

  it("does not call onExit when open is false and ESC is pressed", () => {
    const onExit = vi.fn();
    render(<ZenMode {...defaultProps} open={false} onExit={onExit} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("removes ESC listener when component unmounts", () => {
    const onExit = vi.fn();
    const { unmount } = render(<ZenMode {...defaultProps} onExit={onExit} />);

    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("removes ESC listener when open becomes false", () => {
    const onExit = vi.fn();
    const { rerender } = render(<ZenMode {...defaultProps} onExit={onExit} />);

    rerender(<ZenMode {...defaultProps} open={false} onExit={onExit} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("has proper z-index for modal layer", () => {
    render(<ZenMode {...defaultProps} />);
    const zenMode = screen.getByTestId("zen-mode");
    expect(zenMode.style.zIndex).toBe("var(--z-modal)");
  });

  it("has exit hint text visible", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByText("Press Esc or F11 to exit")).toBeInTheDocument();
  });

  it("overlay has role=dialog and aria-label", () => {
    render(<ZenMode {...defaultProps} />);
    const zenMode = screen.getByTestId("zen-mode");
    expect(zenMode).toHaveAttribute("role", "dialog");
    expect(zenMode).toHaveAttribute("aria-label", "Zen writing mode");
  });

  it("auto-focuses editor on open", () => {
    vi.useFakeTimers();
    const mockEditor = createMockEditor();
    render(<ZenMode {...defaultProps} editor={mockEditor} />);
    vi.advanceTimersByTime(100);
    expect(mockEditor.commands.focus).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("ZenMode empty document", () => {
  it("shows untitled document title when empty", () => {
    render(<ZenMode {...defaultProps} isEmpty={true} title="Untitled" />);
    expect(screen.getByText("Untitled Document")).toBeInTheDocument();
  });

  it("shows placeholder text when empty", () => {
    render(<ZenMode {...defaultProps} isEmpty={true} />);
    expect(screen.getByTestId("zen-placeholder")).toHaveTextContent(
      "Start writing...",
    );
  });

  it("does not show placeholder when content exists", () => {
    render(<ZenMode {...defaultProps} isEmpty={false} />);
    expect(screen.queryByTestId("zen-placeholder")).not.toBeInTheDocument();
  });
});

describe("ZenMode content area", () => {
  it("has proper max-width for content", () => {
    render(<ZenMode {...defaultProps} />);
    const content = screen.getByTestId("zen-content");
    expect(content).toBeInTheDocument();
  });
});

describe("ZenMode status bar", () => {
  it("has data-testid for status area", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByTestId("zen-status-area")).toBeInTheDocument();
  });

  it("has data-testid for status bar", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByTestId("zen-status-bar")).toBeInTheDocument();
  });
});

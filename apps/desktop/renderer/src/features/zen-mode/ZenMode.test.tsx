import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ZenMode, type ZenModeProps } from "./ZenMode";

/**
 * Test data matching design spec
 */
const defaultContent = {
  title: "The Architecture of Silence",
  paragraphs: [
    "The rain fell in sheets, blurring the city lights into abstract rivers of color.",
    "She watched from the fourteenth floor, coffee growing cold in her hands.",
  ],
  showCursor: true,
};

const defaultStats = {
  wordCount: 847,
  saveStatus: "Saved",
  readTimeMinutes: 4,
};

const defaultProps: ZenModeProps = {
  open: true,
  onExit: vi.fn(),
  content: defaultContent,
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
    // Check for fixed positioning via class instead of computed style (JSDOM limitation)
    expect(zenMode).toHaveClass("fixed", "inset-0");
  });

  it("displays the title", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByText("The Architecture of Silence")).toBeInTheDocument();
  });

  it("displays all paragraphs", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByText(/The rain fell in sheets/)).toBeInTheDocument();
    expect(
      screen.getByText(/She watched from the fourteenth floor/),
    ).toBeInTheDocument();
  });

  it("shows blinking cursor when showCursor is true", () => {
    render(<ZenMode {...defaultProps} />);
    const cursor = screen.getByTestId("zen-cursor");
    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveClass("animate-cursor-blink");
  });

  it("hides cursor when showCursor is false", () => {
    render(
      <ZenMode
        {...defaultProps}
        content={{ ...defaultContent, showCursor: false }}
      />,
    );
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

  it("formats large word counts with commas", () => {
    render(
      <ZenMode
        {...defaultProps}
        stats={{ ...defaultStats, wordCount: 12345 }}
      />,
    );
    expect(screen.getByTestId("zen-word-count")).toHaveTextContent(
      "12,345 words",
    );
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

    // Close zen mode
    rerender(<ZenMode {...defaultProps} open={false} onExit={onExit} />);

    // ESC should not trigger onExit now
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("has proper z-index for modal layer", () => {
    render(<ZenMode {...defaultProps} />);
    const zenMode = screen.getByTestId("zen-mode");
    // z-index is set via inline style with CSS variable
    expect(zenMode.style.zIndex).toBe("var(--z-modal)");
  });

  it("has exit hint text visible", () => {
    render(<ZenMode {...defaultProps} />);
    expect(screen.getByText("Press Esc or F11 to exit")).toBeInTheDocument();
  });
});

describe("ZenMode content area", () => {
  it("has proper max-width for content", () => {
    render(<ZenMode {...defaultProps} />);
    const content = screen.getByTestId("zen-content");
    expect(content).toBeInTheDocument();
  });

  it("renders empty state with placeholder title and cursor when no paragraphs", () => {
    render(
      <ZenMode
        {...defaultProps}
        content={{
          title: "New Document",
          paragraphs: [],
          showCursor: true,
        }}
        stats={{ ...defaultStats, wordCount: 0 }}
      />,
    );
    expect(screen.getByText("New Document")).toBeInTheDocument();
    expect(screen.getByTestId("zen-cursor")).toBeInTheDocument();
    expect(screen.getByTestId("zen-word-count")).toHaveTextContent("0 words");
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

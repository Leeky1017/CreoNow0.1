import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@tiptap/react", () => ({
  EditorContent: ({ editor }: { editor: unknown }) =>
    editor ? <div data-testid="mock-editor-content" /> : null,
}));

import { ZenMode, type ZenModeProps } from "./ZenMode";

/**
 * Create a minimal mock TipTap Editor for testing.
 */
function createMockEditor(opts?: {
  isEmpty?: boolean;
  html?: string;
}) {
  const isEmpty = opts?.isEmpty ?? false;
  const html = opts?.html ?? "<p>Hello world</p>";
  return {
    isEmpty,
    getHTML: vi.fn(() => html),
    getJSON: vi.fn(() => ({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }],
    })),
    commands: {
      focus: vi.fn(),
    },
    state: {
      doc: {
        textContent: isEmpty ? "" : "Hello world",
      },
      selection: { empty: true },
    },
    isEditable: true,
    view: {
      dom: document.createElement("div"),
    },
    options: {
      element: document.createElement("div"),
    },
    on: vi.fn(),
    off: vi.fn(),
  };
}

const defaultStats = {
  wordCount: 847,
  saveStatus: "Saved",
  readTimeMinutes: 4,
};

function buildProps(overrides?: Partial<ZenModeProps>): ZenModeProps {
  return {
    open: true,
    onExit: vi.fn(),
    editor: createMockEditor() as unknown as ZenModeProps["editor"],
    title: "The Architecture of Silence",
    stats: defaultStats,
    currentTime: "11:32 PM",
    ...overrides,
  };
}

describe("ZenMode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when open is false", () => {
    const { container } = render(<ZenMode {...buildProps({ open: false })} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders fullscreen overlay when open is true", () => {
    render(<ZenMode {...buildProps()} />);
    const zenMode = screen.getByTestId("zen-mode");
    expect(zenMode).toBeInTheDocument();
    expect(zenMode).toHaveClass("fixed", "inset-0");
  });

  it("displays the title", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByText("The Architecture of Silence")).toBeInTheDocument();
  });

  // AC-9: BlinkingCursor removed
  it("does not render BlinkingCursor (zen-cursor removed)", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.queryByTestId("zen-cursor")).not.toBeInTheDocument();
  });

  // AC-1: EditorContent area is rendered
  it("renders zen-editor-area when open with editor", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByTestId("zen-editor-area")).toBeInTheDocument();
  });

  // AC-7: role="dialog" and aria-label
  it("overlay has role=\"dialog\" and aria-label", () => {
    render(<ZenMode {...buildProps()} />);
    const overlay = screen.getByTestId("zen-mode");
    expect(overlay).toHaveAttribute("role", "dialog");
    expect(overlay).toHaveAttribute("aria-label", "Zen mode editor");
  });

  // AC-7: auto-focus editor on open
  it("calls editor.commands.focus after opening", () => {
    const editor = createMockEditor();
    render(<ZenMode {...buildProps({ editor: editor as unknown as ZenModeProps["editor"] })} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(editor.commands.focus).toHaveBeenCalled();
  });

  // AC-6: empty document shows untitled and placeholder
  it("shows untitled title and placeholder for empty editor", () => {
    const editor = createMockEditor({ isEmpty: true });
    render(
      <ZenMode
        {...buildProps({
          editor: editor as unknown as ZenModeProps["editor"],
          title: "Untitled Document",
        })}
      />,
    );
    expect(screen.getByText("Untitled Document")).toBeInTheDocument();
    expect(screen.getByTestId("zen-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("zen-placeholder")).toHaveTextContent("Start writing...");
  });

  // AC-6: placeholder hidden when editor has content
  it("does not show placeholder when editor has content", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.queryByTestId("zen-placeholder")).not.toBeInTheDocument();
  });

  it("displays word count in status bar", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByTestId("zen-word-count")).toHaveTextContent("847 words");
  });

  it("displays save status", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByTestId("zen-save-status")).toHaveTextContent("Saved");
  });

  it("displays read time", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByTestId("zen-read-time")).toHaveTextContent("4 min read");
  });

  it("displays current time when provided", () => {
    render(<ZenMode {...buildProps({ currentTime: "11:32 PM" })} />);
    expect(screen.getByTestId("zen-time")).toHaveTextContent("11:32 PM");
  });

  it("hides time when not provided", () => {
    render(<ZenMode {...buildProps({ currentTime: undefined })} />);
    expect(screen.queryByTestId("zen-time")).not.toBeInTheDocument();
  });

  it("calls onExit when ESC key is pressed", () => {
    const onExit = vi.fn();
    render(<ZenMode {...buildProps({ onExit })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("calls onExit when X button is clicked", () => {
    const onExit = vi.fn();
    render(<ZenMode {...buildProps({ onExit })} />);
    const exitButton = screen.getByTestId("zen-exit-button");
    fireEvent.click(exitButton);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility label on exit button", () => {
    render(<ZenMode {...buildProps()} />);
    const exitButton = screen.getByTestId("zen-exit-button");
    expect(exitButton).toHaveAttribute("aria-label", "Exit zen mode");
  });

  it("does not call onExit when open is false and ESC is pressed", () => {
    const onExit = vi.fn();
    render(<ZenMode {...buildProps({ open: false, onExit })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("removes ESC listener when open becomes false", () => {
    const onExit = vi.fn();
    const props = buildProps({ onExit });
    const { rerender } = render(<ZenMode {...props} />);

    rerender(<ZenMode {...props} open={false} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("has proper z-index for modal layer", () => {
    render(<ZenMode {...buildProps()} />);
    const zenMode = screen.getByTestId("zen-mode");
    expect(zenMode.style.zIndex).toBe("var(--z-modal)");
  });

  it("has exit hint text visible", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByText("Press Esc or F11 to exit")).toBeInTheDocument();
  });

  it("renders without editor (null editor) showing placeholder", () => {
    render(<ZenMode {...buildProps({ editor: null, title: "Untitled Document" })} />);
    expect(screen.getByTestId("zen-mode")).toBeInTheDocument();
    expect(screen.getByTestId("zen-placeholder")).toBeInTheDocument();
  });
});

describe("ZenMode content area", () => {
  it("renders zen-editor-area container", () => {
    render(<ZenMode {...buildProps()} />);
    const content = screen.getByTestId("zen-content");
    expect(content).toBeInTheDocument();
  });

  it("renders empty state with untitled and placeholder when editor is empty", () => {
    const editor = createMockEditor({ isEmpty: true });
    render(
      <ZenMode
        {...buildProps({
          editor: editor as unknown as ZenModeProps["editor"],
          title: "Untitled Document",
          stats: { ...defaultStats, wordCount: 0 },
        })}
      />,
    );
    expect(screen.getByText("Untitled Document")).toBeInTheDocument();
    expect(screen.getByTestId("zen-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("zen-word-count")).toHaveTextContent("0 words");
  });
});

describe("ZenMode status bar", () => {
  it("has data-testid for status area", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByTestId("zen-status-area")).toBeInTheDocument();
  });

  it("has data-testid for status bar", () => {
    render(<ZenMode {...buildProps()} />);
    expect(screen.getByTestId("zen-status-bar")).toBeInTheDocument();
  });
});

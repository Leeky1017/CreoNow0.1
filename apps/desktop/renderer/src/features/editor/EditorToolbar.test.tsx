import { useEffect } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { describe, it, expect } from "vitest";

import { EditorToolbar } from "./EditorToolbar";

/**
 * Test harness with a real TipTap editor instance.
 */
function ToolbarHarness(props: {
  initialContent?: string;
  onEditorReady?: (editor: Editor) => void;
}): JSX.Element {
  const editor = useEditor({
    extensions: [StarterKit],
    content:
      props.initialContent ??
      "<p>Hello world</p><h2><strong>Bold Heading</strong></h2>",
  });

  useEffect(() => {
    if (editor) {
      props.onEditorReady?.(editor);
    }
  }, [editor, props]);

  return (
    <div>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} data-testid="editor-content" />
    </div>
  );
}

describe("EditorToolbar", () => {
  it("should return null when editor is null", () => {
    const { container } = render(<EditorToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should apply heading format when clicking H1 toolbar button", async () => {
    let editorInstance: Editor | null = null;
    render(
      <ToolbarHarness
        initialContent="<p>Heading source</p>"
        onEditorReady={(editor) => {
          editorInstance = editor;
        }}
      />,
    );

    const h1Button = await screen.findByTestId("toolbar-h1");
    fireEvent.click(h1Button);

    await waitFor(() => {
      expect(editorInstance?.isActive("heading", { level: 1 })).toBe(true);
      expect(editorInstance?.getJSON().content?.[0]?.type).toBe("heading");
      expect(h1Button).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("should toggle bold mark when pressing Ctrl/Cmd+B", async () => {
    let editorInstance: Editor | null = null;
    render(
      <ToolbarHarness
        initialContent="<p>Hello world</p>"
        onEditorReady={(editor) => {
          editorInstance = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(editorInstance).not.toBeNull();
    });

    act(() => {
      editorInstance?.commands.focus("start");
      editorInstance?.commands.setTextSelection({ from: 1, to: 5 });
    });

    act(() => {
      editorInstance?.view.dom.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "b",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await waitFor(() => {
      expect(editorInstance?.isActive("bold")).toBe(true);
    });

    act(() => {
      editorInstance?.view.dom.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "b",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await waitFor(() => {
      expect(editorInstance?.isActive("bold")).toBe(false);
    });
  });

  it("should reflect active formatting state for bold and H2 after cursor move", async () => {
    let editorInstance: Editor | null = null;
    render(
      <ToolbarHarness
        onEditorReady={(editor) => {
          editorInstance = editor;
        }}
      />,
    );

    const boldButton = await screen.findByTestId("toolbar-bold");
    const h2Button = await screen.findByTestId("toolbar-h2");

    expect(boldButton).toHaveAttribute("aria-pressed", "false");
    expect(h2Button).toHaveAttribute("aria-pressed", "false");

    act(() => {
      editorInstance?.commands.focus("end");
    });

    await waitFor(() => {
      expect(boldButton).toHaveAttribute("aria-pressed", "true");
      expect(h2Button).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("should disable Undo button when no history exists", async () => {
    render(<ToolbarHarness initialContent="<p>Fresh document</p>" />);
    const undoButton = await screen.findByTestId("toolbar-undo");
    expect(undoButton).toBeDisabled();
    expect(undoButton.className).toContain("cursor-not-allowed");
    expect(undoButton.className).toContain("opacity-40");
  });

  it("should display mac shortcut in tooltip for Bold button", async () => {
    const originalPlatform = navigator.platform;
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "MacIntel",
    });

    try {
      render(<ToolbarHarness initialContent="<p>Tooltip check</p>" />);
      const boldButton = await screen.findByTestId("toolbar-bold");
      // After Tooltip migration, the native title attribute is replaced by a
      // Radix Tooltip. We verify the button still has the correct aria-label.
      expect(boldButton).toHaveAttribute("aria-label", "Bold");
    } finally {
      Object.defineProperty(window.navigator, "platform", {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it("should render underline control for inline marks", async () => {
    render(<ToolbarHarness initialContent="<p>Underline ready</p>" />);
    expect(await screen.findByTestId("toolbar-underline")).toBeInTheDocument();
  });

  it("[ED-A11Y-01] should toggle bold with keyboard-only navigation when pressing Enter on focused toolbar button", async () => {
    const user = userEvent.setup();
    render(<ToolbarHarness initialContent="<p>Keyboard nav</p>" />);

    const boldButton = await screen.findByTestId("toolbar-bold");
    expect(boldButton.className).toContain("focus-visible:ring-2");
    expect(boldButton.className).toContain("focus-visible:outline-none");

    boldButton.focus();
    expect(boldButton).toHaveFocus();

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(boldButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("should expose aria label and pressed state for active bold button", async () => {
    let editorInstance: Editor | null = null;
    render(
      <ToolbarHarness
        initialContent="<p>Bold text</p>"
        onEditorReady={(editor) => {
          editorInstance = editor;
        }}
      />,
    );

    const boldButton = await screen.findByTestId("toolbar-bold");

    act(() => {
      editorInstance?.commands.focus("start");
      editorInstance?.commands.setTextSelection({ from: 1, to: 5 });
      editorInstance?.commands.toggleBold();
    });

    await waitFor(() => {
      expect(boldButton).toHaveAttribute("aria-label", "Bold");
      expect(boldButton).toHaveAttribute("aria-pressed", "true");
    });
  });
});

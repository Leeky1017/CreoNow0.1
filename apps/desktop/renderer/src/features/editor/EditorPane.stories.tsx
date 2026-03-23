import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";

import {
  EditorBubbleMenu,
  EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY,
} from "./EditorBubbleMenu";
import { EditorToolbar } from "./EditorToolbar";
import {
  createEditorStore,
  EditorStoreProvider,
} from "../../stores/editorStore";

const mockEditorStore = createEditorStore({
  invoke: () => Promise.resolve(undefined as never),
});

/**
 * EditorPane integrates TipTap editor with toolbar and autosave.
 *
 * This story shows the editor UI without the full store integration.
 */
const meta: Meta = {
  title: "Features/Editor/EditorPane",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <EditorStoreProvider store={mockEditorStore}>
        <Story />
      </EditorStoreProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

/**
 * Standalone editor component for stories.
 */
function StandaloneEditor(props: {
  initialContent?: string;
  className?: string;
  selectRange?: { from: number; to: number };
  readOnly?: boolean;
  activateBold?: boolean;
}): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
      }),
      BubbleMenuExtension.configure({
        pluginKey: EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY,
      }),
    ],
    content: props.initialContent ?? "<p>Start writing your story...</p>",
    autofocus: true,
    editorProps: {
      attributes: {
        "data-testid": "tiptap-editor",
        class: "h-full outline-none p-4 text-[var(--color-fg-default)]",
      },
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!props.readOnly);

    if (props.selectRange) {
      editor.commands.focus("start");
      editor.commands.setTextSelection(props.selectRange);
    }

    if (props.activateBold) {
      editor.chain().focus().toggleBold().run();
    }
  }, [editor, props.activateBold, props.readOnly, props.selectRange]);

  return (
    <div
      data-testid="editor-pane"
      className={`flex h-full w-full min-w-0 flex-col ${props.className ?? ""}`}
    >
      <EditorBubbleMenu editor={editor} />
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

/**
 * Default editor with toolbar and empty content.
 */
export const Default: Story = {
  render: () => (
    <div className="h-screen bg-[var(--color-bg-base)]">
      <StandaloneEditor />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("editor-pane")).toBeInTheDocument();
    await expect(canvas.getByTestId("editor-toolbar")).toBeInTheDocument();
  },
};

/**
 * Editor with sample content.
 */
export const WithContent: Story = {
  render: () => (
    <div className="h-screen bg-[var(--color-bg-base)]">
      <StandaloneEditor
        initialContent={`
          <h1>Chapter 1: The Beginning</h1>
          <p>It was a dark and stormy night. The wind howled through the ancient trees, their branches reaching toward the sky like gnarled fingers.</p>
          <p><strong>Sarah</strong> stood at the window, watching the rain streak down the glass. She had been waiting for hours, but the letter still hadn't arrived.</p>
          <h2>The Discovery</h2>
          <p>When she finally found it, hidden beneath the loose floorboard, her heart nearly stopped. The envelope was yellowed with age, and the seal—</p>
          <blockquote>
            "Some secrets are better left buried," her grandmother used to say. But Sarah had never been one to leave stones unturned.
          </blockquote>
          <p>She broke the seal.</p>
          <h3>What the Letter Revealed</h3>
          <ul>
            <li>A family secret spanning three generations</li>
            <li>A hidden inheritance</li>
            <li>A warning from the past</li>
          </ul>
          <p>The contents of the letter changed everything she thought she knew about her family.</p>
          <hr />
          <p><em>To be continued...</em></p>
        `}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("editor-pane")).toBeInTheDocument();
    await expect(canvas.getByTestId("tiptap-editor")).toBeInTheDocument();
  },
};

/**
 * Editor with code and technical content.
 */
export const TechnicalContent: Story = {
  render: () => (
    <div className="h-screen bg-[var(--color-bg-base)]">
      <StandaloneEditor
        initialContent={`
          <h1>Technical Documentation</h1>
          <p>This document covers the implementation details of the editor component.</p>
          <h2>Features</h2>
          <ol>
            <li>Rich text formatting with <strong>bold</strong>, <em>italic</em>, and <s>strikethrough</s></li>
            <li>Headings (H1, H2, H3)</li>
            <li>Lists (bullet and numbered)</li>
            <li>Code blocks and <code>inline code</code></li>
          </ol>
          <h2>Code Example</h2>
          <pre><code>const editor = useEditor({
  extensions: [StarterKit],
  content: initialContent,
});</code></pre>
          <p>The editor uses TipTap with the StarterKit extension for basic formatting.</p>
        `}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Editor in a constrained container.
 */
export const ConstrainedWidth: Story = {
  render: () => (
    <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)] p-8">
      <div className="h-[600px] w-[600px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)]">
        <StandaloneEditor initialContent="<p>This editor is in a constrained container.</p>" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Empty editor state.
 */
export const Empty: Story = {
  render: () => (
    <div className="h-screen bg-[var(--color-bg-base)]">
      <StandaloneEditor initialContent="<p></p>" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Bubble Menu visible state with selected text.
 */
export const BubbleMenuVisible: Story = {
  render: () => (
    <div className="h-screen bg-[var(--color-bg-base)]">
      <StandaloneEditor
        initialContent="<p>Select this sentence to show the bubble menu.</p>"
        selectRange={{ from: 1, to: 18 }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Bubble Menu active state where Bold is currently enabled.
 */
export const BubbleMenuActive: Story = {
  render: () => (
    <div className="h-screen bg-[var(--color-bg-base)]">
      <StandaloneEditor
        initialContent="<p>Bold formatting active in bubble menu state.</p>"
        selectRange={{ from: 1, to: 8 }}
        activateBold
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Bubble Menu hidden state in read-only mode.
 */
export const BubbleMenuHidden: Story = {
  render: () => (
    <div className="h-screen bg-[var(--color-bg-base)]">
      <StandaloneEditor
        initialContent="<p>Read-only documents should not show bubble actions.</p>"
        selectRange={{ from: 1, to: 10 }}
        readOnly
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

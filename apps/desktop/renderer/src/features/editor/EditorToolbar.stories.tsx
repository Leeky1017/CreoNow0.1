import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { CSSProperties } from "react";

import { EditorToolbar } from "./EditorToolbar";

/**
 * EditorToolbar provides formatting controls for the TipTap editor.
 *
 * Features:
 * - Text formatting: Bold, Italic, Strikethrough, Inline Code
 * - Headings: H1, H2, H3
 * - Lists: Bullet, Numbered
 * - Blocks: Quote, Code Block, Horizontal Rule
 * - History: Undo, Redo
 */
const meta: Meta<typeof EditorToolbar> = {
  title: "Features/Editor/EditorToolbar",
  component: EditorToolbar,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[800px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EditorToolbar>;

/**
 * Wrapper component that creates a real TipTap editor instance.
 */
function ToolbarWithEditor(props: { initialContent?: string }): JSX.Element {
  const editor = useEditor({
    extensions: [StarterKit],
    content: props.initialContent ?? "<p>Start typing here...</p>",
  });

  return (
    <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)]">
      <EditorToolbar editor={editor} />
      <div className="p-4 min-h-[200px] text-[var(--color-fg-default)]">
        {editor ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        ) : (
          <p className="text-[var(--color-fg-muted)]">Loading editor...</p>
        )}
      </div>
    </div>
  );
}

/**
 * Default toolbar with a basic editor.
 */
export const Default: Story = {
  render: () => <ToolbarWithEditor />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("toolbar-bold")).toBeInTheDocument();
    await expect(canvas.getByTestId("toolbar-italic")).toBeInTheDocument();
    await expect(canvas.getByTestId("toolbar-undo")).toBeInTheDocument();
  },
};

/**
 * Toolbar with formatted content showing active states.
 */
export const WithFormattedContent: Story = {
  render: () => (
    <ToolbarWithEditor
      initialContent={`
        <h1>Heading 1</h1>
        <p>This is a paragraph with <strong>bold</strong>, <em>italic</em>, and <code>inline code</code>.</p>
        <h2>Heading 2</h2>
        <ul>
          <li>Bullet item 1</li>
          <li>Bullet item 2</li>
        </ul>
        <h3>Heading 3</h3>
        <ol>
          <li>Numbered item 1</li>
          <li>Numbered item 2</li>
        </ol>
        <blockquote>This is a blockquote.</blockquote>
        <pre><code>const code = "block";</code></pre>
        <hr />
        <p>End of content.</p>
      `}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("toolbar-bold")).toBeInTheDocument();
    await expect(canvas.getByTestId("toolbar-h1")).toBeInTheDocument();
    await expect(canvas.getByTestId("toolbar-bullet-list")).toBeInTheDocument();
  },
};

/**
 * Simulated focus-visible state to keep keyboard a11y baseline in snapshots.
 */
export const FocusVisibleBold: Story = {
  render: () => (
    <div className="[&_[data-testid='toolbar-bold']]:ring-2 [&_[data-testid='toolbar-bold']]:ring-[var(--color-ring-focus)] [&_[data-testid='toolbar-bold']]:ring-offset-1 [&_[data-testid='toolbar-bold']]:ring-offset-[var(--color-bg-surface)]">
      <ToolbarWithEditor />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Simulated reduced-motion state by overriding duration tokens to 0ms.
 */
export const ReducedMotionDefault: Story = {
  render: () => {
    const reducedMotionStyle: CSSProperties = {
      ["--duration-fast" as string]: "0ms",
      ["--duration-normal" as string]: "0ms",
      ["--duration-slow" as string]: "0ms",
    };
    return (
      <div style={reducedMotionStyle}>
        <ToolbarWithEditor />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Dark mode baseline for visual diff auditing.
 */
export const DarkModeDefault: Story = {
  render: () => (
    <div data-theme="dark">
      <ToolbarWithEditor />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * System font scale 125% baseline for ED-TYPO-02 visual guard.
 */
export const FontScale125: Story = {
  render: () => {
    const scaleStyle: CSSProperties = {
      fontSize: "125%",
      lineHeight: "1.8",
    };
    return (
      <div style={scaleStyle}>
        <ToolbarWithEditor />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * System font scale 150% baseline for ED-TYPO-02 visual guard.
 */
export const FontScale150: Story = {
  render: () => {
    const scaleStyle: CSSProperties = {
      fontSize: "150%",
      lineHeight: "1.8",
    };
    return (
      <div style={scaleStyle}>
        <ToolbarWithEditor />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Toolbar without an editor (null state).
 */
export const NoEditor: Story = {
  render: () => (
    <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)]">
      <EditorToolbar editor={null} />
      <div className="p-4 min-h-[100px] text-[var(--color-fg-muted)]">
        Toolbar returns null when no editor is provided.
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Multiple toolbars showing different editor states.
 */
export const MultipleStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[var(--color-fg-default)] mb-2">
          Empty Document
        </h3>
        <ToolbarWithEditor initialContent="<p></p>" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-[var(--color-fg-default)] mb-2">
          With Bold Text
        </h3>
        <ToolbarWithEditor initialContent="<p><strong>Bold text selected</strong></p>" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-[var(--color-fg-default)] mb-2">
          With Heading
        </h3>
        <ToolbarWithEditor initialContent="<h2>A Heading</h2>" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

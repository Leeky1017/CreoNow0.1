import React from "react";
import type { Editor } from "@tiptap/react";

import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { InlineFormatButton } from "./InlineFormatButton";
import { createToggleButtonA11yProps } from "./a11y";

import { Bold, Code, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Minus, Quote, Redo, SquareCode, Strikethrough, Underline, Undo } from "lucide-react";
/**
 * Toolbar button props.
 */
interface ToolbarButtonProps {
  /** Button label for accessibility */
  label: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Whether the button is currently active */
  isActive?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Icon element */
  children: React.ReactNode;
  /** Test ID for E2E testing */
  testId?: string;
}

/**
 * Single toolbar button with tooltip.
 */
function ToolbarButton({
  label,
  shortcut,
  isActive,
  disabled,
  onClick,
  children,
  testId,
}: ToolbarButtonProps): JSX.Element {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      type="button"
      data-testid={testId}
      title={title}
      {...createToggleButtonA11yProps({ label, pressed: isActive })}
      disabled={disabled}
      onClick={onClick}
      className={`
        flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]
        transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-surface)]
        ${isActive ? "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]" : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-default)]"}
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Separator between toolbar button groups.
 */
function ToolbarSeparator(): JSX.Element {
  return <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />;
}

const icons = {
  bold: <Bold size={16} strokeWidth={1.5} />,
  italic: <Italic size={16} strokeWidth={1.5} />,
  underline: <Underline size={16} strokeWidth={1.5} />,
  strikethrough: <Strikethrough size={16} strokeWidth={1.5} />,
  heading1: <Heading1 size={16} strokeWidth={1.5} />,
  heading2: <Heading2 size={16} strokeWidth={1.5} />,
  heading3: <Heading3 size={16} strokeWidth={1.5} />,
  bulletList: <List size={16} strokeWidth={1.5} />,
  orderedList: <ListOrdered size={16} strokeWidth={1.5} />,
  blockquote: <Quote size={16} strokeWidth={1.5} />,
  code: <Code size={16} strokeWidth={1.5} />,
  codeBlock: <SquareCode size={16} strokeWidth={1.5} />,
  horizontalRule: <Minus size={16} strokeWidth={1.5} />,
  undo: <Undo size={16} strokeWidth={1.5} />,
  redo: <Redo size={16} strokeWidth={1.5} />,
};

export interface EditorToolbarProps {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Disable all toolbar actions (used in read-only preview mode) */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EditorToolbar provides formatting controls for the TipTap editor.
 *
 * Why: Writers need quick access to formatting options without memorizing shortcuts.
 * Shortcuts are provided in tooltips for power users.
 */
export function EditorToolbar({
  editor,
  disabled = false,
  className,
}: EditorToolbarProps): JSX.Element | null {
  if (!editor) {
    return null;
  }

  const inlineDisabled = !editor.isEditable || editor.isActive("codeBlock");

  return (
    <div
      data-testid="editor-toolbar"
      className={`flex items-center gap-0.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1.5 ${className ?? ""}`}
    >
      {/* Text formatting */}
      <InlineFormatButton
        testId="toolbar-bold"
        label={EDITOR_SHORTCUTS.bold.label}
        shortcut={EDITOR_SHORTCUTS.bold.display()}
        isActive={editor.isActive("bold")}
        disabled={disabled || inlineDisabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        {icons.bold}
      </InlineFormatButton>
      <InlineFormatButton
        testId="toolbar-italic"
        label={EDITOR_SHORTCUTS.italic.label}
        shortcut={EDITOR_SHORTCUTS.italic.display()}
        isActive={editor.isActive("italic")}
        disabled={disabled || inlineDisabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        {icons.italic}
      </InlineFormatButton>
      <InlineFormatButton
        testId="toolbar-underline"
        label={EDITOR_SHORTCUTS.underline.label}
        shortcut={EDITOR_SHORTCUTS.underline.display()}
        isActive={editor.isActive("underline")}
        disabled={disabled || inlineDisabled}
        onClick={() => editor.chain().focus().toggleMark("underline").run()}
      >
        {icons.underline}
      </InlineFormatButton>
      <InlineFormatButton
        testId="toolbar-strike"
        label={EDITOR_SHORTCUTS.strikethrough.label}
        shortcut={EDITOR_SHORTCUTS.strikethrough.display()}
        isActive={editor.isActive("strike")}
        disabled={disabled || inlineDisabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        {icons.strikethrough}
      </InlineFormatButton>
      <InlineFormatButton
        testId="toolbar-code"
        label={EDITOR_SHORTCUTS.code.label}
        shortcut={EDITOR_SHORTCUTS.code.display()}
        isActive={editor.isActive("code")}
        disabled={disabled || inlineDisabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {icons.code}
      </InlineFormatButton>

      <ToolbarSeparator />

      {/* Headings */}
      <ToolbarButton
        testId="toolbar-h1"
        label={EDITOR_SHORTCUTS.heading1.label}
        shortcut={EDITOR_SHORTCUTS.heading1.display()}
        isActive={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        {icons.heading1}
      </ToolbarButton>
      <ToolbarButton
        testId="toolbar-h2"
        label={EDITOR_SHORTCUTS.heading2.label}
        shortcut={EDITOR_SHORTCUTS.heading2.display()}
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        {icons.heading2}
      </ToolbarButton>
      <ToolbarButton
        testId="toolbar-h3"
        label={EDITOR_SHORTCUTS.heading3.label}
        shortcut={EDITOR_SHORTCUTS.heading3.display()}
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        {icons.heading3}
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton
        testId="toolbar-bullet-list"
        label={EDITOR_SHORTCUTS.bulletList.label}
        shortcut={EDITOR_SHORTCUTS.bulletList.display()}
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        {icons.bulletList}
      </ToolbarButton>
      <ToolbarButton
        testId="toolbar-ordered-list"
        label={EDITOR_SHORTCUTS.orderedList.label}
        shortcut={EDITOR_SHORTCUTS.orderedList.display()}
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        {icons.orderedList}
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Blocks */}
      <ToolbarButton
        testId="toolbar-blockquote"
        label={EDITOR_SHORTCUTS.blockquote.label}
        shortcut={EDITOR_SHORTCUTS.blockquote.display()}
        isActive={editor.isActive("blockquote")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        {icons.blockquote}
      </ToolbarButton>
      <ToolbarButton
        testId="toolbar-code-block"
        label={EDITOR_SHORTCUTS.codeBlock.label}
        shortcut={EDITOR_SHORTCUTS.codeBlock.display()}
        isActive={editor.isActive("codeBlock")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {icons.codeBlock}
      </ToolbarButton>
      <ToolbarButton
        testId="toolbar-hr"
        label="Horizontal Rule"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        {icons.horizontalRule}
      </ToolbarButton>

      <ToolbarSeparator />

      {/* History */}
      <ToolbarButton
        testId="toolbar-undo"
        label={EDITOR_SHORTCUTS.undo.label}
        shortcut={EDITOR_SHORTCUTS.undo.display()}
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        {icons.undo}
      </ToolbarButton>
      <ToolbarButton
        testId="toolbar-redo"
        label={EDITOR_SHORTCUTS.redo.label}
        shortcut={EDITOR_SHORTCUTS.redo.display()}
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        {icons.redo}
      </ToolbarButton>
    </div>
  );
}

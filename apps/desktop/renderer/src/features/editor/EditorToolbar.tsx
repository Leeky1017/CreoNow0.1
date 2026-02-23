import React from "react";
import type { Editor } from "@tiptap/react";

import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { InlineFormatButton } from "./InlineFormatButton";
import { createToggleButtonA11yProps } from "./a11y";

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

/**
 * SVG icons for toolbar buttons.
 *
 * Why: Inline SVGs allow theming via currentColor and avoid external dependencies.
 */
const icons = {
  bold: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  underline: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  ),
  strikethrough: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  ),
  heading1: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17 12l3-2v8" />
    </svg>
  ),
  heading2: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </svg>
  ),
  heading3: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
      <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
    </svg>
  ),
  bulletList: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  orderedList: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  ),
  blockquote: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4z" />
    </svg>
  ),
  code: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  codeBlock: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <polyline points="9 8 5 12 9 16" />
      <polyline points="15 8 19 12 15 16" />
    </svg>
  ),
  horizontalRule: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  undo: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  redo: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  ),
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

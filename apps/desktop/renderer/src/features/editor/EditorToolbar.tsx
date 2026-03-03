import React from "react";
import type { Editor } from "@tiptap/react";

import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { InlineFormatButton } from "./InlineFormatButton";
import { createToggleButtonA11yProps } from "./a11y";
import { useOverflowDetection } from "./useOverflowDetection";
import { Tooltip } from "../../components/primitives/Tooltip";

import { Bold, Code, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Minus, MoreHorizontal, Quote, Redo, SquareCode, Strikethrough, Underline, Undo } from "lucide-react";
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
  const tooltipContent = shortcut ? `${label} (${shortcut})` : label;

  return (
    <Tooltip content={tooltipContent}>
      <button
        type="button"
        data-testid={testId}
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
    </Tooltip>
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

/* ------------------------------------------------------------------ */
/* Data-driven toolbar item definitions                                */
/* ------------------------------------------------------------------ */

type ToolbarItemButton = {
  kind: "button";
  testId: string;
  label: string;
  shortcutDisplay?: () => string;
  icon: keyof typeof icons;
  getActive: (editor: Editor) => boolean;
  getDisabled: (editor: Editor, disabled: boolean, inlineDisabled: boolean) => boolean;
  run: (editor: Editor) => void;
  /** If true, renders via InlineFormatButton instead of ToolbarButton */
  inline?: boolean;
};

type ToolbarItemSeparator = { kind: "separator" };

type ToolbarItem = ToolbarItemButton | ToolbarItemSeparator;

function buildToolbarItems(): ToolbarItem[] {
  return [
    /* Text formatting (inline) */
    { kind: "button", testId: "toolbar-bold", label: EDITOR_SHORTCUTS.bold.label, shortcutDisplay: () => EDITOR_SHORTCUTS.bold.display(), icon: "bold", getActive: (e) => e.isActive("bold"), getDisabled: (_e, d, i) => d || i, run: (e) => e.chain().focus().toggleBold().run(), inline: true },
    { kind: "button", testId: "toolbar-italic", label: EDITOR_SHORTCUTS.italic.label, shortcutDisplay: () => EDITOR_SHORTCUTS.italic.display(), icon: "italic", getActive: (e) => e.isActive("italic"), getDisabled: (_e, d, i) => d || i, run: (e) => e.chain().focus().toggleItalic().run(), inline: true },
    { kind: "button", testId: "toolbar-underline", label: EDITOR_SHORTCUTS.underline.label, shortcutDisplay: () => EDITOR_SHORTCUTS.underline.display(), icon: "underline", getActive: (e) => e.isActive("underline"), getDisabled: (_e, d, i) => d || i, run: (e) => e.chain().focus().toggleMark("underline").run(), inline: true },
    { kind: "button", testId: "toolbar-strike", label: EDITOR_SHORTCUTS.strikethrough.label, shortcutDisplay: () => EDITOR_SHORTCUTS.strikethrough.display(), icon: "strikethrough", getActive: (e) => e.isActive("strike"), getDisabled: (_e, d, i) => d || i, run: (e) => e.chain().focus().toggleStrike().run(), inline: true },
    { kind: "button", testId: "toolbar-code", label: EDITOR_SHORTCUTS.code.label, shortcutDisplay: () => EDITOR_SHORTCUTS.code.display(), icon: "code", getActive: (e) => e.isActive("code"), getDisabled: (_e, d, i) => d || i, run: (e) => e.chain().focus().toggleCode().run(), inline: true },
    { kind: "separator" },
    /* Headings */
    { kind: "button", testId: "toolbar-h1", label: EDITOR_SHORTCUTS.heading1.label, shortcutDisplay: () => EDITOR_SHORTCUTS.heading1.display(), icon: "heading1", getActive: (e) => e.isActive("heading", { level: 1 }), getDisabled: (_e, d) => d, run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { kind: "button", testId: "toolbar-h2", label: EDITOR_SHORTCUTS.heading2.label, shortcutDisplay: () => EDITOR_SHORTCUTS.heading2.display(), icon: "heading2", getActive: (e) => e.isActive("heading", { level: 2 }), getDisabled: (_e, d) => d, run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { kind: "button", testId: "toolbar-h3", label: EDITOR_SHORTCUTS.heading3.label, shortcutDisplay: () => EDITOR_SHORTCUTS.heading3.display(), icon: "heading3", getActive: (e) => e.isActive("heading", { level: 3 }), getDisabled: (_e, d) => d, run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { kind: "separator" },
    /* Lists */
    { kind: "button", testId: "toolbar-bullet-list", label: EDITOR_SHORTCUTS.bulletList.label, shortcutDisplay: () => EDITOR_SHORTCUTS.bulletList.display(), icon: "bulletList", getActive: (e) => e.isActive("bulletList"), getDisabled: (_e, d) => d, run: (e) => e.chain().focus().toggleBulletList().run() },
    { kind: "button", testId: "toolbar-ordered-list", label: EDITOR_SHORTCUTS.orderedList.label, shortcutDisplay: () => EDITOR_SHORTCUTS.orderedList.display(), icon: "orderedList", getActive: (e) => e.isActive("orderedList"), getDisabled: (_e, d) => d, run: (e) => e.chain().focus().toggleOrderedList().run() },
    { kind: "separator" },
    /* Blocks */
    { kind: "button", testId: "toolbar-blockquote", label: EDITOR_SHORTCUTS.blockquote.label, shortcutDisplay: () => EDITOR_SHORTCUTS.blockquote.display(), icon: "blockquote", getActive: (e) => e.isActive("blockquote"), getDisabled: (_e, d) => d, run: (e) => e.chain().focus().toggleBlockquote().run() },
    { kind: "button", testId: "toolbar-code-block", label: EDITOR_SHORTCUTS.codeBlock.label, shortcutDisplay: () => EDITOR_SHORTCUTS.codeBlock.display(), icon: "codeBlock", getActive: (e) => e.isActive("codeBlock"), getDisabled: (_e, d) => d, run: (e) => e.chain().focus().toggleCodeBlock().run() },
    { kind: "button", testId: "toolbar-hr", label: "Horizontal Rule", icon: "horizontalRule", getActive: () => false, getDisabled: (_e, d) => d, run: (e) => e.chain().focus().setHorizontalRule().run() },
    { kind: "separator" },
    /* History */
    { kind: "button", testId: "toolbar-undo", label: EDITOR_SHORTCUTS.undo.label, shortcutDisplay: () => EDITOR_SHORTCUTS.undo.display(), icon: "undo", getActive: () => false, getDisabled: (e, d) => d || !e.can().undo(), run: (e) => e.chain().focus().undo().run() },
    { kind: "button", testId: "toolbar-redo", label: EDITOR_SHORTCUTS.redo.label, shortcutDisplay: () => EDITOR_SHORTCUTS.redo.display(), icon: "redo", getActive: () => false, getDisabled: (e, d) => d || !e.can().redo(), run: (e) => e.chain().focus().redo().run() },
  ];
}

/* ------------------------------------------------------------------ */
/* Render helpers                                                      */
/* ------------------------------------------------------------------ */

function renderToolbarItem(
  item: ToolbarItem,
  editor: Editor,
  disabled: boolean,
  inlineDisabled: boolean,
  index: number,
  onClickExtra?: () => void,
  testIdPrefix?: string,
): React.ReactNode {
  if (item.kind === "separator") {
    return <ToolbarSeparator key={`sep-${String(index)}`} />;
  }

  const isActive = item.getActive(editor);
  const isDisabled = item.getDisabled(editor, disabled, inlineDisabled);
  const handleClick = () => {
    item.run(editor);
    onClickExtra?.();
  };
  const testId = testIdPrefix
    ? `${testIdPrefix}-${item.testId.replace("toolbar-", "")}`
    : item.testId;

  if (item.inline) {
    return (
      <InlineFormatButton
        key={testId}
        testId={testId}
        label={item.label}
        shortcut={item.shortcutDisplay?.()}
        isActive={isActive}
        disabled={isDisabled}
        onClick={handleClick}
      >
        {icons[item.icon]}
      </InlineFormatButton>
    );
  }

  return (
    <ToolbarButton
      key={testId}
      testId={testId}
      label={item.label}
      shortcut={item.shortcutDisplay?.()}
      isActive={isActive}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {icons[item.icon]}
    </ToolbarButton>
  );
}

export interface EditorToolbarProps {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Disable all toolbar actions (used in read-only preview mode) */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Stable reference to toolbar item definitions (same shape every render) */
const TOOLBAR_ITEMS = buildToolbarItems();

/**
 * EditorToolbar provides formatting controls for the TipTap editor.
 *
 * Why: Writers need quick access to formatting options without memorizing shortcuts.
 * Shortcuts are provided in tooltips for power users.
 *
 * When the toolbar overflows its container, a "More" menu appears with all
 * toolbar items — data-driven, not hardcoded — so every action remains accessible.
 */
export function EditorToolbar({
  editor,
  disabled = false,
  className,
}: EditorToolbarProps): JSX.Element | null {
  const { containerRef, isOverflowing } = useOverflowDetection();
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);

  if (!editor) {
    return null;
  }

  const inlineDisabled = !editor.isEditable || editor.isActive("codeBlock");

  return (
    <div
      data-testid="editor-toolbar"
      className={`relative flex items-center gap-0.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1.5 ${className ?? ""}`}
    >
      <div
        ref={containerRef}
        data-testid="editor-toolbar-buttons"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden"
      >
        {TOOLBAR_ITEMS.map((item, i) =>
          renderToolbarItem(item, editor, disabled, inlineDisabled, i),
        )}
      </div>

      {/* Overflow "More" menu — data-driven: renders all toolbar items so
          every action remains accessible when the toolbar width is constrained */}
      {isOverflowing ? (
        <div className="relative ml-auto flex-shrink-0">
          <ToolbarButton
            testId="toolbar-overflow-trigger"
            label="More"
            onClick={() => setOverflowMenuOpen((prev) => !prev)}
            isActive={overflowMenuOpen}
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </ToolbarButton>
          {overflowMenuOpen ? (
            <div
              data-testid="toolbar-overflow-menu"
              className="absolute right-0 top-full z-10 mt-1 flex flex-col gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-1.5 shadow-[var(--shadow-md)]"
            >
              {TOOLBAR_ITEMS.map((item, i) =>
                renderToolbarItem(
                  item,
                  editor,
                  disabled,
                  inlineDisabled,
                  i,
                  () => setOverflowMenuOpen(false),
                  "overflow",
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

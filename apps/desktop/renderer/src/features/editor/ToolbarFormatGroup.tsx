import React from "react";
import type { TFunction } from "i18next";
import type { Editor } from "@tiptap/react";

import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { InlineFormatButton } from "./InlineFormatButton";
import { createToggleButtonA11yProps } from "./a11y";
import { Tooltip } from "../../components/primitives/Tooltip";

import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  SquareCode,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* ToolbarButton                                                       */
/* ------------------------------------------------------------------ */

interface ToolbarButtonProps {
  label: string;
  shortcut?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}

export function ToolbarButton({
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
      {/* eslint-disable-next-line creonow/no-native-html-element -- Editor: ToolbarButton is a specialized toggle with aria-pressed */}
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

/* ------------------------------------------------------------------ */
/* ToolbarSeparator                                                    */
/* ------------------------------------------------------------------ */

export function ToolbarSeparator(): JSX.Element {
  return <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />;
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

export const toolbarIcons = {
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

export type ToolbarItemButton = {
  kind: "button";
  testId: string;
  label: string;
  shortcutDisplay?: () => string;
  icon: keyof typeof toolbarIcons;
  getActive: (editor: Editor) => boolean;
  getDisabled: (
    editor: Editor,
    disabled: boolean,
    inlineDisabled: boolean,
  ) => boolean;
  run: (editor: Editor) => void;
  inline?: boolean;
};

export type ToolbarItemSeparator = { kind: "separator" };

export type ToolbarItem = ToolbarItemButton | ToolbarItemSeparator;

export function buildToolbarItems(t: TFunction): ToolbarItem[] {
  return [
    {
      kind: "button",
      testId: "toolbar-bold",
      label: EDITOR_SHORTCUTS.bold.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.bold.display(),
      icon: "bold",
      getActive: (e) => e.isActive("bold"),
      getDisabled: (_e, d, i) => d || i,
      run: (e) => e.chain().focus().toggleBold().run(),
      inline: true,
    },
    {
      kind: "button",
      testId: "toolbar-italic",
      label: EDITOR_SHORTCUTS.italic.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.italic.display(),
      icon: "italic",
      getActive: (e) => e.isActive("italic"),
      getDisabled: (_e, d, i) => d || i,
      run: (e) => e.chain().focus().toggleItalic().run(),
      inline: true,
    },
    {
      kind: "button",
      testId: "toolbar-underline",
      label: EDITOR_SHORTCUTS.underline.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.underline.display(),
      icon: "underline",
      getActive: (e) => e.isActive("underline"),
      getDisabled: (_e, d, i) => d || i,
      run: (e) => e.chain().focus().toggleMark("underline").run(),
      inline: true,
    },
    {
      kind: "button",
      testId: "toolbar-strike",
      label: EDITOR_SHORTCUTS.strikethrough.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.strikethrough.display(),
      icon: "strikethrough",
      getActive: (e) => e.isActive("strike"),
      getDisabled: (_e, d, i) => d || i,
      run: (e) => e.chain().focus().toggleStrike().run(),
      inline: true,
    },
    {
      kind: "button",
      testId: "toolbar-code",
      label: EDITOR_SHORTCUTS.code.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.code.display(),
      icon: "code",
      getActive: (e) => e.isActive("code"),
      getDisabled: (_e, d, i) => d || i,
      run: (e) => e.chain().focus().toggleCode().run(),
      inline: true,
    },
    { kind: "separator" },
    {
      kind: "button",
      testId: "toolbar-h1",
      label: EDITOR_SHORTCUTS.heading1.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.heading1.display(),
      icon: "heading1",
      getActive: (e) => e.isActive("heading", { level: 1 }),
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      kind: "button",
      testId: "toolbar-h2",
      label: EDITOR_SHORTCUTS.heading2.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.heading2.display(),
      icon: "heading2",
      getActive: (e) => e.isActive("heading", { level: 2 }),
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      kind: "button",
      testId: "toolbar-h3",
      label: EDITOR_SHORTCUTS.heading3.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.heading3.display(),
      icon: "heading3",
      getActive: (e) => e.isActive("heading", { level: 3 }),
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    { kind: "separator" },
    {
      kind: "button",
      testId: "toolbar-bullet-list",
      label: EDITOR_SHORTCUTS.bulletList.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.bulletList.display(),
      icon: "bulletList",
      getActive: (e) => e.isActive("bulletList"),
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      kind: "button",
      testId: "toolbar-ordered-list",
      label: EDITOR_SHORTCUTS.orderedList.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.orderedList.display(),
      icon: "orderedList",
      getActive: (e) => e.isActive("orderedList"),
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    { kind: "separator" },
    {
      kind: "button",
      testId: "toolbar-blockquote",
      label: EDITOR_SHORTCUTS.blockquote.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.blockquote.display(),
      icon: "blockquote",
      getActive: (e) => e.isActive("blockquote"),
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      kind: "button",
      testId: "toolbar-code-block",
      label: EDITOR_SHORTCUTS.codeBlock.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.codeBlock.display(),
      icon: "codeBlock",
      getActive: (e) => e.isActive("codeBlock"),
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
    {
      kind: "button",
      testId: "toolbar-hr",
      label: t("editor.toolbar.horizontalRule"),
      icon: "horizontalRule",
      getActive: () => false,
      getDisabled: (_e, d) => d,
      run: (e) => e.chain().focus().setHorizontalRule().run(),
    },
    { kind: "separator" },
    {
      kind: "button",
      testId: "toolbar-undo",
      label: EDITOR_SHORTCUTS.undo.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.undo.display(),
      icon: "undo",
      getActive: () => false,
      getDisabled: (e, d) => d || !e.can().undo(),
      run: (e) => e.chain().focus().undo().run(),
    },
    {
      kind: "button",
      testId: "toolbar-redo",
      label: EDITOR_SHORTCUTS.redo.label,
      shortcutDisplay: () => EDITOR_SHORTCUTS.redo.display(),
      icon: "redo",
      getActive: () => false,
      getDisabled: (e, d) => d || !e.can().redo(),
      run: (e) => e.chain().focus().redo().run(),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Render helper                                                       */
/* ------------------------------------------------------------------ */

export function renderToolbarItem(
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
        {toolbarIcons[item.icon]}
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
      {toolbarIcons[item.icon]}
    </ToolbarButton>
  );
}

/* ------------------------------------------------------------------ */
/* Stable cache                                                        */
/* ------------------------------------------------------------------ */

const TOOLBAR_ITEMS_CACHE = new WeakMap<TFunction, ToolbarItem[]>();
export function getToolbarItems(t: TFunction): ToolbarItem[] {
  let items = TOOLBAR_ITEMS_CACHE.get(t);
  if (!items) {
    items = buildToolbarItems(t);
    TOOLBAR_ITEMS_CACHE.set(t, items);
  }
  return items;
}

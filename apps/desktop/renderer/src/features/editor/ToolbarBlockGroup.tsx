import React from "react";
import { useTranslation } from "react-i18next";
import type { Editor } from "@tiptap/react";

import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { Tooltip } from "../../components/primitives/Tooltip";
import { createToggleButtonA11yProps } from "./a11y";

import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  SquareCode,
  Undo,
} from "lucide-react";

interface ToolbarBlockButtonProps {
  label: string;
  shortcut?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}

function ToolbarBlockButton({
  label,
  shortcut,
  isActive,
  disabled,
  onClick,
  children,
  testId,
}: ToolbarBlockButtonProps): JSX.Element {
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

export { ToolbarBlockButton as ToolbarButton };

export interface ToolbarBlockGroupProps {
  editor: Editor;
  disabled: boolean;
  testIdPrefix?: string;
  onItemClick?: () => void;
}

export function ToolbarBlockGroup({
  editor,
  disabled,
  testIdPrefix,
  onItemClick,
}: ToolbarBlockGroupProps): JSX.Element {
  const { t } = useTranslation();
  const tid = (base: string) =>
    testIdPrefix ? `${testIdPrefix}-${base}` : `toolbar-${base}`;

  const wrap = (action: () => void) => () => {
    action();
    onItemClick?.();
  };

  return (
    <>
      <ToolbarBlockButton
        testId={tid("h1")}
        label={EDITOR_SHORTCUTS.heading1.label}
        shortcut={EDITOR_SHORTCUTS.heading1.display()}
        isActive={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        onClick={wrap(() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run(),
        )}
      >
        <Heading1 size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <ToolbarBlockButton
        testId={tid("h2")}
        label={EDITOR_SHORTCUTS.heading2.label}
        shortcut={EDITOR_SHORTCUTS.heading2.display()}
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        onClick={wrap(() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
        )}
      >
        <Heading2 size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <ToolbarBlockButton
        testId={tid("h3")}
        label={EDITOR_SHORTCUTS.heading3.label}
        shortcut={EDITOR_SHORTCUTS.heading3.display()}
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        onClick={wrap(() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run(),
        )}
      >
        <Heading3 size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />
      <ToolbarBlockButton
        testId={tid("bullet-list")}
        label={EDITOR_SHORTCUTS.bulletList.label}
        shortcut={EDITOR_SHORTCUTS.bulletList.display()}
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={wrap(() => editor.chain().focus().toggleBulletList().run())}
      >
        <List size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <ToolbarBlockButton
        testId={tid("ordered-list")}
        label={EDITOR_SHORTCUTS.orderedList.label}
        shortcut={EDITOR_SHORTCUTS.orderedList.display()}
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        onClick={wrap(() => editor.chain().focus().toggleOrderedList().run())}
      >
        <ListOrdered size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />
      <ToolbarBlockButton
        testId={tid("blockquote")}
        label={EDITOR_SHORTCUTS.blockquote.label}
        shortcut={EDITOR_SHORTCUTS.blockquote.display()}
        isActive={editor.isActive("blockquote")}
        disabled={disabled}
        onClick={wrap(() => editor.chain().focus().toggleBlockquote().run())}
      >
        <Quote size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <ToolbarBlockButton
        testId={tid("code-block")}
        label={EDITOR_SHORTCUTS.codeBlock.label}
        shortcut={EDITOR_SHORTCUTS.codeBlock.display()}
        isActive={editor.isActive("codeBlock")}
        disabled={disabled}
        onClick={wrap(() => editor.chain().focus().toggleCodeBlock().run())}
      >
        <SquareCode size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <ToolbarBlockButton
        testId={tid("hr")}
        label={t("editor.toolbar.horizontalRule")}
        isActive={false}
        disabled={disabled}
        onClick={wrap(() => editor.chain().focus().setHorizontalRule().run())}
      >
        <Minus size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />
      <ToolbarBlockButton
        testId={tid("undo")}
        label={EDITOR_SHORTCUTS.undo.label}
        shortcut={EDITOR_SHORTCUTS.undo.display()}
        isActive={false}
        disabled={disabled || !editor.can().undo()}
        onClick={wrap(() => editor.chain().focus().undo().run())}
      >
        <Undo size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
      <ToolbarBlockButton
        testId={tid("redo")}
        label={EDITOR_SHORTCUTS.redo.label}
        shortcut={EDITOR_SHORTCUTS.redo.display()}
        isActive={false}
        disabled={disabled || !editor.can().redo()}
        onClick={wrap(() => editor.chain().focus().redo().run())}
      >
        <Redo size={16} strokeWidth={1.5} />
      </ToolbarBlockButton>
    </>
  );
}

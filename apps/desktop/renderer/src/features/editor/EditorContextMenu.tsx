import React from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  ClipboardCopy,
  ClipboardPaste,
  Italic,
  Redo,
  Sparkles,
  Underline,
  Undo,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { captureSelectionRef } from "../ai/applySelection";
import { useOptionalAiStore } from "../../stores/aiStore";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const AI_CONTEXT_ACTIONS = [
  { id: "builtin:polish", labelKey: "editor.contextMenu.aiPolish", testId: "ctx-ai-polish" },
  { id: "builtin:rewrite", labelKey: "editor.contextMenu.aiRewrite", testId: "ctx-ai-rewrite" },
] as const;

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const menuContentClass = [
  "min-w-[180px]",
  "rounded-[var(--radius-md)]",
  "bg-[var(--color-bg-raised)]",
  "border",
  "border-[var(--color-border-default)]",
  "shadow-[var(--shadow-lg)]",
  "p-1",
  "z-[var(--z-popover)]",
  // Animation
  "animate-in",
  "fade-in-0",
  "zoom-in-95",
  "data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0",
  "data-[state=closed]:zoom-out-95",
].join(" ");

const menuItemClass = [
  "flex",
  "items-center",
  "gap-2",
  "px-2",
  "py-1.5",
  "text-sm",
  "rounded-[var(--radius-sm)]",
  "text-[var(--color-fg-default)]",
  "cursor-pointer",
  "outline-none",
  "select-none",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "motion-reduce:transition-none",
  "data-[highlighted]:bg-[var(--color-bg-hover)]",
  "data-[disabled]:text-[var(--color-fg-disabled)]",
  "data-[disabled]:cursor-not-allowed",
  "data-[disabled]:pointer-events-none",
].join(" ");

const separatorClass =
  "my-1 h-px bg-[var(--color-border-default)]";

const labelClass =
  "px-2 py-1 text-xs font-medium text-[var(--color-fg-muted)] select-none";

const shortcutClass =
  "ml-auto text-xs text-[var(--color-fg-muted)]";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface EditorContextMenuProps {
  editor: Editor | null;
  children: React.ReactNode;
}

/**
 * Custom context menu for the editor area.
 *
 * Why: writers need quick access to editing actions and AI skills
 * without navigating away from their text. The browser default
 * context menu provides none of these actions.
 */
export function EditorContextMenu({
  editor,
  children,
}: EditorContextMenuProps): JSX.Element {
  const { t } = useTranslation();
  const setSelectionSnapshot = useOptionalAiStore(
    (s) => s.setSelectionSnapshot,
  );
  const setSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const runSkill = useOptionalAiStore((s) => s.run);

  const hasSelection = editor ? !editor.state.selection.empty : false;
  const isEditable = editor?.isEditable ?? false;

  /* ---- Handlers ---- */

  const handleCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(
      window.getSelection()?.toString() ?? "",
    );
  }, []);

  const handlePaste = React.useCallback(async () => {
    if (!editor || !isEditable) return;
    try {
      const text = await navigator.clipboard.readText();
      editor.chain().focus().insertContent(text).run();
    } catch {
      // clipboard permission denied — noop
    }
  }, [editor, isEditable]);

  const handleUndo = React.useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const handleRedo = React.useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const handleBold = React.useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const handleItalic = React.useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const handleUnderline = React.useCallback(() => {
    editor?.chain().focus().toggleMark("underline").run();
  }, [editor]);

  const handleAiAction = React.useCallback(
    (skillId: string) => {
      if (!editor) return;
      const result = captureSelectionRef(editor);
      if (result.ok && setSelectionSnapshot) {
        setSelectionSnapshot(result.data);
      }
      setSelectedSkillId?.(skillId);
      void runSkill?.();
    },
    [editor, setSelectionSnapshot, setSelectedSkillId, runSkill],
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={menuContentClass}>
          {/* ---- Basic editing ---- */}
          <ContextMenu.Item
            data-testid="ctx-copy"
            className={menuItemClass}
            onSelect={handleCopy}
          >
            <ClipboardCopy size={16} strokeWidth={1.5} />
            {t("editor.contextMenu.copy")}
            <span className={shortcutClass}>
              {EDITOR_SHORTCUTS.bold.display().replace("B", "C").replace("⌘C", "⌘C")}
            </span>
          </ContextMenu.Item>

          <ContextMenu.Item
            data-testid="ctx-paste"
            className={menuItemClass}
            disabled={!isEditable}
            onSelect={() => void handlePaste()}
          >
            <ClipboardPaste size={16} strokeWidth={1.5} />
            {t("editor.contextMenu.paste")}
          </ContextMenu.Item>

          <ContextMenu.Separator className={separatorClass} />

          <ContextMenu.Item
            data-testid="ctx-undo"
            className={menuItemClass}
            disabled={!isEditable}
            onSelect={handleUndo}
          >
            <Undo size={16} strokeWidth={1.5} />
            {t("editor.contextMenu.undo")}
            <span className={shortcutClass}>
              {EDITOR_SHORTCUTS.undo.display()}
            </span>
          </ContextMenu.Item>

          <ContextMenu.Item
            data-testid="ctx-redo"
            className={menuItemClass}
            disabled={!isEditable}
            onSelect={handleRedo}
          >
            <Redo size={16} strokeWidth={1.5} />
            {t("editor.contextMenu.redo")}
            <span className={shortcutClass}>
              {EDITOR_SHORTCUTS.redo.display()}
            </span>
          </ContextMenu.Item>

          <ContextMenu.Separator className={separatorClass} />

          {/* ---- Formatting ---- */}
          <ContextMenu.Label className={labelClass}>{t("editor.contextMenu.format")}</ContextMenu.Label>

          <ContextMenu.Item
            data-testid="ctx-bold"
            className={menuItemClass}
            disabled={!hasSelection || !isEditable}
            onSelect={handleBold}
          >
            <Bold size={16} strokeWidth={1.5} />
            {t("editor.contextMenu.bold")}
            <span className={shortcutClass}>
              {EDITOR_SHORTCUTS.bold.display()}
            </span>
          </ContextMenu.Item>

          <ContextMenu.Item
            data-testid="ctx-italic"
            className={menuItemClass}
            disabled={!hasSelection || !isEditable}
            onSelect={handleItalic}
          >
            <Italic size={16} strokeWidth={1.5} />
            {t("editor.contextMenu.italic")}
            <span className={shortcutClass}>
              {EDITOR_SHORTCUTS.italic.display()}
            </span>
          </ContextMenu.Item>

          <ContextMenu.Item
            data-testid="ctx-underline"
            className={menuItemClass}
            disabled={!hasSelection || !isEditable}
            onSelect={handleUnderline}
          >
            <Underline size={16} strokeWidth={1.5} />
            {t("editor.contextMenu.underline")}
            <span className={shortcutClass}>
              {EDITOR_SHORTCUTS.underline.display()}
            </span>
          </ContextMenu.Item>

          <ContextMenu.Separator className={separatorClass} />

          {/* ---- AI actions ---- */}
          <ContextMenu.Label className={labelClass}>{t("editor.contextMenu.ai")}</ContextMenu.Label>

          {AI_CONTEXT_ACTIONS.map((action) => (
            <ContextMenu.Item
              key={action.id}
              data-testid={action.testId}
              className={menuItemClass}
              disabled={!hasSelection || !isEditable}
              onSelect={() => handleAiAction(action.id)}
            >
              <Sparkles size={16} strokeWidth={1.5} />
              {t(action.labelKey)}
            </ContextMenu.Item>
          ))}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

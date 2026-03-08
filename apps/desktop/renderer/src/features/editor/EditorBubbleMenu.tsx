import React from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react";
import { useTranslation } from 'react-i18next';

import { InlineFormatButton } from "./InlineFormatButton";
import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { captureSelectionRef } from "../ai/applySelection";
import { useEditorStore } from "../../stores/editorStore";
import { useOptionalAiStore } from "../../stores/aiStore";
import { useLayoutStore } from "../../stores/layoutStore";
import {
  readPrefersReducedMotion,
  resolveReducedMotionDurationPair,
} from "../../lib/motion/reducedMotion";

import { Bold, Code, Italic, Link, Strikethrough, Underline } from "lucide-react";
export const EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY = "cn-editor-inline-bubble";
const BUBBLE_AI_SKILLS = [
  {
    id: "builtin:polish",
    labelKey: "editor.bubbleMenu.polish",
    testId: "bubble-ai-polish",
  },
  {
    id: "builtin:rewrite",
    labelKey: "editor.bubbleMenu.rewrite",
    testId: "bubble-ai-rewrite",
  },
  {
    id: "builtin:describe",
    labelKey: "editor.bubbleMenu.describe",
    testId: "bubble-ai-describe",
  },
  {
    id: "builtin:dialogue",
    labelKey: "editor.bubbleMenu.dialogue",
    testId: "bubble-ai-dialogue",
  },
] as const;

type BubblePlacement = "top" | "bottom";

const BUBBLE_MENU_HEIGHT = 42;
const BUBBLE_MENU_VIEWPORT_PADDING = 8;
const IS_VITEST_RUNTIME =
  typeof process !== "undefined" && Boolean(process.env.VITEST);

/**
 * Resolve bubble placement based on current selection top edge.
 *
 * Why: jsdom cannot verify popper's runtime flip behavior reliably; keeping this
 * pure helper makes placement fallback deterministic and testable.
 */
export function resolveBubbleMenuPlacement(
  selectionTop: number,
): BubblePlacement {
  const hasSpaceAbove =
    selectionTop - BUBBLE_MENU_HEIGHT >= BUBBLE_MENU_VIEWPORT_PADDING;
  return hasSpaceAbove ? "top" : "bottom";
}

/**
 * Read selection top from current DOM selection range.
 *
 * Why: BubbleMenu placement needs viewport-relative coordinates and TipTap
 * selection positions alone are not sufficient.
 */
function readSelectionTop(): number | null {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) {
    return null;
  }
  const range = domSelection.getRangeAt(0);
  if (typeof range.getBoundingClientRect !== "function") {
    return null;
  }
  return range.getBoundingClientRect().top;
}

/**
 * Inline Bubble Menu bound to TipTap selection.
 *
 * Why: writers need near-selection formatting controls without moving cursor
 * focus to the fixed toolbar.
 */
export function EditorBubbleMenu(props: {
  editor: Editor | null;
}): JSX.Element | null {
  const { editor } = props;
  const { t } = useTranslation();
  const zenMode = useLayoutStore((s) => s.zenMode);
  const [visible, setVisible] = React.useState(false);
  const [placement, setPlacement] = React.useState<BubblePlacement>("top");
  const projectId = useEditorStore((s) => s.projectId);
  const documentId = useEditorStore((s) => s.documentId);
  const aiStatus = useOptionalAiStore((s) => s.status);
  const setSelectionSnapshot = useOptionalAiStore(
    (s) => s.setSelectionSnapshot,
  );
  const setSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const runSkill = useOptionalAiStore((s) => s.run);

  const updateVisibilityAndPlacement = React.useCallback(() => {
    if (!editor) {
      setVisible(false);
      return;
    }

    const hasSelection = !editor.state.selection.empty;
    const suppressBubble = !editor.isEditable || editor.isActive("codeBlock");
    setVisible(hasSelection && !suppressBubble);

    const selectionTop = readSelectionTop();
    if (selectionTop !== null) {
      setPlacement(resolveBubbleMenuPlacement(selectionTop));
    }
  }, [editor]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    updateVisibilityAndPlacement();

    editor.on("selectionUpdate", updateVisibilityAndPlacement);
    editor.on("update", updateVisibilityAndPlacement);

    return () => {
      editor.off("selectionUpdate", updateVisibilityAndPlacement);
      editor.off("update", updateVisibilityAndPlacement);
    };
  }, [editor, updateVisibilityAndPlacement]);

  if (!editor) {
    return null;
  }

  // Keep BubbleMenu mounted and drive visibility via shouldShow to avoid
  // unmount/remount races while ProseMirror selection updates.
  // Suppress BubbleMenu entirely in zen mode (AC-3)
  const shouldShowBubble = visible && editor.isEditable && !zenMode;
  const inlineDisabled = !editor.isEditable || editor.isActive("codeBlock");

  const toggleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: "https://example.com" }).run();
  };

  const aiDisabled =
    inlineDisabled ||
    aiStatus === "running" ||
    aiStatus === "streaming" ||
    !setSelectionSnapshot ||
    !setSelectedSkillId ||
    !runSkill;

  const handleAiSkillClick = (skillId: string) => {
    if (aiDisabled) {
      return;
    }

    const captured = captureSelectionRef(editor);
    if (!captured.ok) {
      return;
    }

    const selectionText = captured.data.selectionText.trim();
    if (selectionText.length === 0) {
      return;
    }

    setSelectionSnapshot({
      selectionRef: captured.data.selectionRef,
      selectionText,
    });
    setSelectedSkillId(skillId);

    void runSkill({
      inputOverride: selectionText,
      context: {
        projectId: projectId ?? undefined,
        documentId: documentId ?? undefined,
      },
    });
  };

  const bubbleContent = (
    <div
      data-testid="editor-bubble-menu"
      data-bubble-placement={placement}
      className="z-[var(--z-dropdown)] flex items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-1 shadow-[var(--shadow-lg)]"
    >
      <InlineFormatButton
        testId="bubble-bold"
        label={EDITOR_SHORTCUTS.bold.label}
        shortcut={EDITOR_SHORTCUTS.bold.display()}
        isActive={editor.isActive("bold")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        {icons.bold}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-italic"
        label={EDITOR_SHORTCUTS.italic.label}
        shortcut={EDITOR_SHORTCUTS.italic.display()}
        isActive={editor.isActive("italic")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        {icons.italic}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-underline"
        label={EDITOR_SHORTCUTS.underline.label}
        shortcut={EDITOR_SHORTCUTS.underline.display()}
        isActive={editor.isActive("underline")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleMark("underline").run()}
      >
        {icons.underline}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-strike"
        label={EDITOR_SHORTCUTS.strikethrough.label}
        shortcut={EDITOR_SHORTCUTS.strikethrough.display()}
        isActive={editor.isActive("strike")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        {icons.strike}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-code"
        label={EDITOR_SHORTCUTS.code.label}
        shortcut={EDITOR_SHORTCUTS.code.display()}
        isActive={editor.isActive("code")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {icons.code}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-link"
        label={t('editor.bubbleMenu.link')}
        isActive={editor.isActive("link")}
        disabled={inlineDisabled}
        onClick={toggleLink}
      >
        {icons.link}
      </InlineFormatButton>
      <div className="mx-1 h-5 w-px bg-[var(--color-border-default)]" />
      <div className="flex items-center gap-1">
        {BUBBLE_AI_SKILLS.map((skill) => (
          <button
            key={skill.id}
            type="button"
            data-testid={skill.testId}
            aria-label={`AI ${t(skill.labelKey)}`}
            disabled={aiDisabled}
            className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--color-fg-default)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-raised)] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => handleAiSkillClick(skill.id)}
          >
            {t(skill.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );

  if (IS_VITEST_RUNTIME) {
    return shouldShowBubble ? bubbleContent : null;
  }

  const bubbleDurations = resolveReducedMotionDurationPair(
    readPrefersReducedMotion(),
    [100, 100],
  );

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY}
      shouldShow={() => shouldShowBubble}
      tippyOptions={{
        placement,
        duration: bubbleDurations,
        zIndex: 400, // maps to --z-modal; tippy.js API requires number
        appendTo: () => document.body,
        popperOptions: {
          modifiers: [
            {
              name: "flip",
              options: {
                fallbackPlacements: ["bottom", "top"],
              },
            },
            {
              name: "preventOverflow",
              options: {
                boundary: "viewport",
                padding: BUBBLE_MENU_VIEWPORT_PADDING,
              },
            },
          ],
        },
      }}
    >
      {bubbleContent}
    </BubbleMenu>
  );
}

const icons = {
  bold: <Bold size={16} strokeWidth={1.5} />,
  italic: <Italic size={16} strokeWidth={1.5} />,
  underline: <Underline size={16} strokeWidth={1.5} />,
  strike: <Strikethrough size={16} strokeWidth={1.5} />,
  code: <Code size={16} strokeWidth={1.5} />,
  link: <Link size={16} strokeWidth={1.5} />,
};

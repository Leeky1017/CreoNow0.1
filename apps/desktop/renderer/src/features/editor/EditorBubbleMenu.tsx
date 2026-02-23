import React from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react";

import { InlineFormatButton } from "./InlineFormatButton";
import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { captureSelectionRef } from "../ai/applySelection";
import { useEditorStore } from "../../stores/editorStore";
import { useOptionalAiStore } from "../../stores/aiStore";
import {
  readPrefersReducedMotion,
  resolveReducedMotionDurationPair,
} from "../../lib/motion/reducedMotion";

export const EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY = "cn-editor-inline-bubble";
const BUBBLE_AI_SKILLS = [
  {
    id: "builtin:polish",
    label: "润色",
    testId: "bubble-ai-polish",
  },
  {
    id: "builtin:rewrite",
    label: "改写",
    testId: "bubble-ai-rewrite",
  },
  {
    id: "builtin:describe",
    label: "描写",
    testId: "bubble-ai-describe",
  },
  {
    id: "builtin:dialogue",
    label: "对白",
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
  const shouldShowBubble = visible && editor.isEditable;
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
        label="Link"
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
            aria-label={`AI ${skill.label}`}
            disabled={aiDisabled}
            className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--color-fg-default)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-bg-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => handleAiSkillClick(skill.id)}
          >
            {skill.label}
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
        zIndex: 400,
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
  strike: (
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
  link: (
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
      <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 1 0-7.07-7.07L10 5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 7.07 7.07L14 18" />
    </svg>
  ),
};

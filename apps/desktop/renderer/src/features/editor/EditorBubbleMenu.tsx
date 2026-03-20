import React from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react";

import { useEditorStore } from "../../stores/editorStore";
import { useOptionalAiStore } from "../../stores/aiStore";
import { useOptionalLayoutStore } from "../../stores/layoutStore";
import {
  readPrefersReducedMotion,
  resolveReducedMotionDurationPair,
} from "../../lib/motion/reducedMotion";
import { BubbleMenuFormatActions } from "./BubbleMenuFormatActions";
import { BubbleMenuAiActions } from "./BubbleMenuAiActions";

export const EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY = "cn-editor-inline-bubble";

type BubblePlacement = "top" | "bottom";

const BUBBLE_MENU_HEIGHT = 42;
const BUBBLE_MENU_VIEWPORT_PADDING = 8;
const IS_VITEST_RUNTIME =
  typeof process !== "undefined" && Boolean(process.env.VITEST);

/**
 * Resolve bubble placement based on current selection top edge.
 */
export function resolveBubbleMenuPlacement(
  selectionTop: number,
): BubblePlacement {
  const hasSpaceAbove =
    selectionTop - BUBBLE_MENU_HEIGHT >= BUBBLE_MENU_VIEWPORT_PADDING;
  return hasSpaceAbove ? "top" : "bottom";
}

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
 */
export function EditorBubbleMenu(props: {
  editor: Editor | null;
}): JSX.Element | null {
  const { editor } = props;
  const [visible, setVisible] = React.useState(false);
  const [placement, setPlacement] = React.useState<BubblePlacement>("top");
  const projectId = useEditorStore((s) => s.projectId);
  const documentId = useEditorStore((s) => s.documentId);
  const zenMode = useOptionalLayoutStore((s) => s.zenMode) ?? false;
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

  const shouldShowBubble = visible && editor.isEditable && !zenMode;
  const inlineDisabled = !editor.isEditable || editor.isActive("codeBlock");

  const bubbleContent = (
    <div
      data-testid="editor-bubble-menu"
      data-bubble-placement={placement}
      className="z-[var(--z-dropdown)] flex items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-1 shadow-[var(--shadow-lg)]"
    >
      <BubbleMenuFormatActions
        editor={editor}
        inlineDisabled={inlineDisabled}
      />
      <div className="mx-1 h-5 w-px bg-[var(--color-border-default)]" />
      <BubbleMenuAiActions
        editor={editor}
        inlineDisabled={inlineDisabled}
        aiStatus={aiStatus}
        projectId={projectId}
        documentId={documentId}
        setSelectionSnapshot={setSelectionSnapshot}
        setSelectedSkillId={setSelectedSkillId}
        runSkill={runSkill}
      />
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

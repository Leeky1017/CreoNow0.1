import { useTranslation } from "react-i18next";
import type { Editor } from "@tiptap/react";

import { useEditorStore } from "../../stores/editorStore";
import { useOptionalAiStore } from "../../stores/aiStore";
import { captureSelectionRef } from "../ai/applySelection";

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

export function BubbleMenuAiActions(props: {
  editor: Editor;
  inlineDisabled: boolean;
}): JSX.Element {
  const { editor, inlineDisabled } = props;
  const { t } = useTranslation();

  const projectId = useEditorStore((s) => s.projectId);
  const documentId = useEditorStore((s) => s.documentId);
  const aiStatus = useOptionalAiStore((s) => s.status);
  const setSelectionSnapshot = useOptionalAiStore(
    (s) => s.setSelectionSnapshot,
  );
  const setSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const runSkill = useOptionalAiStore((s) => s.run);

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

  return (
    <div className="flex items-center gap-1">
      {BUBBLE_AI_SKILLS.map((skill) => (
        // eslint-disable-next-line creonow/no-native-html-element -- Editor: AI skill inline button with custom compact styling
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
  );
}

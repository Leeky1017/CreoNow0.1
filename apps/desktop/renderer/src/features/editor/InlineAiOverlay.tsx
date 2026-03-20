import { type useEditor } from "@tiptap/react";

import {
  useOptionalAiStore,
  useOptionalAiStoreApi,
} from "../../stores/aiStore";
import type { UseInlineAiStore, SelectionRef as InlineAiSelectionRef } from "./inlineAiStore";
import { InlineAiInput } from "./InlineAiInput";
import { InlineAiDiffPreview } from "./InlineAiDiffPreview";
import { applySelection } from "../ai/applySelection";

function buildInlineAiRequestInput(
  selectionText: string,
  instruction: string,
): string {
  return `Selection context:
${selectionText}

${instruction}`.trim();
}

async function runInlineAiRequest(args: {
  inlineAiStore: UseInlineAiStore;
  selectionRef: InlineAiSelectionRef | null;
  instruction: string;
  projectId: string | null;
  documentId: string | null;
  aiRun:
    | ((args?: {
        inputOverride?: string;
        context?: { projectId?: string; documentId?: string };
        streamOverride?: boolean;
      }) => Promise<void>)
    | null;
  aiSetSelectedSkillId: ((skillId: string) => void) | null;
  aiStoreApi: ReturnType<typeof useOptionalAiStoreApi>;
}): Promise<void> {
  const {
    inlineAiStore,
    selectionRef,
    instruction,
    projectId,
    documentId,
    aiRun,
    aiSetSelectedSkillId,
    aiStoreApi,
  } = args;
  if (
    !selectionRef ||
    !projectId ||
    !documentId ||
    !aiRun ||
    !aiSetSelectedSkillId ||
    !aiStoreApi
  ) {
    inlineAiStore.getState().setError();
    return;
  }

  inlineAiStore.getState().submitInstruction(instruction);
  aiSetSelectedSkillId("builtin:rewrite");
  await aiRun({
    inputOverride: buildInlineAiRequestInput(selectionRef.text, instruction),
    context: { projectId, documentId },
    streamOverride: false,
  });

  const aiState = aiStoreApi.getState();
  if (aiState.status === "error" || aiState.lastError) {
    inlineAiStore.getState().setError();
    return;
  }

  if (aiState.outputText.trim().length === 0) {
    inlineAiStore.getState().setError();
    return;
  }

  inlineAiStore.getState().setReady(aiState.outputText);
}

export function InlineAiOverlay(props: {
  inlineAiStore: UseInlineAiStore;
  editor: ReturnType<typeof useEditor>;
  projectId: string | null;
  documentId: string | null;
}): JSX.Element | null {
  const { inlineAiStore, editor, projectId, documentId } = props;
  const aiStoreApi = useOptionalAiStoreApi();
  const aiRun = useOptionalAiStore((s) => s.run);
  const aiSetSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const aiPersistApply = useOptionalAiStore((s) => s.persistAiApply);
  const aiCancel = useOptionalAiStore((s) => s.cancel);
  const aiLastRunId = useOptionalAiStore((s) => s.lastRunId);
  const phase = inlineAiStore((s) => s.phase);
  const selectionRef = inlineAiStore((s) => s.selectionRef);
  const result = inlineAiStore((s) => s.result);
  const instruction = inlineAiStore((s) => s.instruction);

  if (phase === "input") {
    return (
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <InlineAiInput
          onSubmit={(nextInstruction) => {
            void runInlineAiRequest({
              inlineAiStore,
              selectionRef,
              instruction: nextInstruction,
              projectId,
              documentId,
              aiRun,
              aiSetSelectedSkillId,
              aiStoreApi,
            });
          }}
          onDismiss={() => {
            inlineAiStore.getState().dismiss();
          }}
        />
      </div>
    );
  }

  if ((phase === "streaming" || phase === "ready") && selectionRef) {
    return (
      <div className="absolute inset-x-4 top-4">
        <InlineAiDiffPreview
          phase={phase}
          originalText={selectionRef.text}
          suggestedText={result ?? ""}
          onAccept={() => {
            if (
              !editor ||
              !selectionRef ||
              !result ||
              !projectId ||
              !documentId ||
              !aiPersistApply ||
              !aiStoreApi
            ) {
              inlineAiStore.getState().setError();
              return;
            }
            const applied = applySelection({
              editor,
              selectionRef: {
                range: { from: selectionRef.from, to: selectionRef.to },
                selectionTextHash: selectionRef.selectionTextHash,
              },
              replacementText: result,
            });
            if (!applied.ok) {
              inlineAiStore.getState().setError();
              return;
            }
            void aiPersistApply({
              projectId,
              documentId,
              contentJson: JSON.stringify(editor.getJSON()),
              runId: aiLastRunId ?? "inline-ai",
            }).then(() => {
              if (aiStoreApi.getState().applyStatus === "applied") {
                inlineAiStore.getState().accept();
                return;
              }
              inlineAiStore.getState().setError();
            });
          }}
          onReject={() => {
            if (phase === "streaming" && aiCancel) {
              void aiCancel();
            }
            inlineAiStore.getState().reject();
          }}
          onRegenerate={() => {
            if (!instruction) {
              inlineAiStore.getState().setError();
              return;
            }
            void runInlineAiRequest({
              inlineAiStore,
              selectionRef,
              instruction,
              projectId,
              documentId,
              aiRun,
              aiSetSelectedSkillId,
              aiStoreApi,
            });
          }}
        />
      </div>
    );
  }

  return null;
}

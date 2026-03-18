import React from "react";
import { useTranslation } from "react-i18next";
import type { useEditor } from "@tiptap/react";

import { useOptionalAiStore } from "../../stores/aiStore";
import { useEditorStore } from "../../stores/editorStore";
import { useHotkey } from "../../lib/hotkeys/useHotkey";
import { resolveFinalDocumentEditDecision } from "./finalDocumentEditGuard";
import { buildAiStreamUndoCheckpoint, undoAiStream } from "./aiStreamUndo";
import type { AiStreamCheckpoint } from "./aiStreamUndo";
import { buildWriteInput, isAiRunning } from "./editorPasteUtils";
import {
  routeSlashCommandExecution,
  type SlashCommandExecutors,
  type SlashCommandId,
} from "./slashCommands";
import { captureSelectionRef } from "../ai/applySelection";
import { type UseInlineAiStore } from "./inlineAiStore";

export function useEditorKeybindings(deps: {
  editor: ReturnType<typeof useEditor>;
  projectId: string;
  documentId: string | null;
  contentReady: boolean;
  bootstrapStatus: string;
  isPreviewMode: boolean;
  documentStatus: string | null;
  closeSlashPanel: () => void;
  zenMode: boolean;
  inlineAiStore: UseInlineAiStore;
}): {
  handleSlashCommandSelect: (commandId: SlashCommandId) => void;
  onWriteClick: () => Promise<void>;
  requestEditFromFinal: () => Promise<void>;
  aiStreamCheckpointRef: React.MutableRefObject<AiStreamCheckpoint | null>;
} {
  const {
    editor,
    projectId,
    documentId,
    contentReady,
    bootstrapStatus,
    isPreviewMode,
    documentStatus,
    closeSlashPanel,
    zenMode,
    inlineAiStore,
  } = deps;

  const aiStatus = useOptionalAiStore((s) => s.status) ?? "idle";
  const aiSetSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const aiRun = useOptionalAiStore((s) => s.run);
  const save = useEditorStore((s) => s.save);
  const downgradeFinalStatusForEdit = useEditorStore(
    (s) => s.downgradeFinalStatusForEdit,
  );
  const { t } = useTranslation();

  const aiStreamCheckpointRef = React.useRef<AiStreamCheckpoint | null>(null);

  const editorReady =
    !!editor && bootstrapStatus === "ready" && !!documentId && contentReady;

  // --- Action handlers ---

  async function requestEditFromFinal(): Promise<void> {
    if (!documentId || documentStatus !== "final") {
      return;
    }
    const confirmed = window.confirm(t("editor.confirmSwitchToDraft"));
    const decision = resolveFinalDocumentEditDecision({
      status: documentStatus,
      confirmed,
    });
    if (!decision.allowEditing) {
      return;
    }
    await downgradeFinalStatusForEdit({
      projectId: projectId,
      documentId: documentId,
    });
  }

  const runSlashAiSkill = React.useCallback(
    async (skillId: string): Promise<void> => {
      if (
        !aiSetSelectedSkillId ||
        !aiRun ||
        !editor ||
        !documentId ||
        isAiRunning(aiStatus)
      ) {
        return;
      }

      aiStreamCheckpointRef.current = buildAiStreamUndoCheckpoint({
        preStreamContent: editor.state.doc.textContent,
        docJson: editor.getJSON() as Record<string, unknown>,
        cursorPos: editor.state.selection.to,
      });

      aiSetSelectedSkillId(skillId);
      await aiRun({
        inputOverride: buildWriteInput(editor),
        context: {
          projectId: projectId,
          documentId: documentId,
        },
      });
    },
    [aiRun, aiSetSelectedSkillId, aiStatus, documentId, editor, projectId],
  );

  const handleAiUndo = React.useCallback((): boolean => {
    if (!editor || !aiStreamCheckpointRef.current) return false;
    const result = undoAiStream(editor, aiStreamCheckpointRef.current);
    aiStreamCheckpointRef.current = null;
    return result;
  }, [editor]);

  const onWriteClick = React.useCallback(async (): Promise<void> => {
    await runSlashAiSkill("builtin:write");
  }, [runSlashAiSkill]);

  const handleSlashCommandSelect = React.useCallback(
    (commandId: SlashCommandId) => {
      const executors: SlashCommandExecutors = {
        continueWriting: () => {
          void onWriteClick();
        },
        describe: () => {
          void runSlashAiSkill("builtin:describe");
        },
        dialogue: () => {
          void runSlashAiSkill("builtin:dialogue");
        },
        character: () => {
          void runSlashAiSkill("builtin:character");
        },
        outline: () => {
          void runSlashAiSkill("builtin:outline");
        },
        search: () => {
          void runSlashAiSkill("builtin:search");
        },
      };

      routeSlashCommandExecution(commandId, executors);
      closeSlashPanel();
    },
    [closeSlashPanel, onWriteClick, runSlashAiSkill],
  );

  // --- Keyboard shortcuts ---

  useHotkey(
    "editor:continue-writing",
    { key: "Enter", modKey: true },
    React.useCallback(() => {
      if (!editorReady) return;
      void onWriteClick();
    }, [editorReady, onWriteClick]),
    "editor",
    10,
  );

  useHotkey(
    "editor:polish",
    { key: "r", modKey: true, shiftKey: true },
    React.useCallback(() => {
      if (!editorReady) return;
      void runSlashAiSkill("builtin:polish");
    }, [editorReady, runSlashAiSkill]),
    "editor",
    10,
  );

  useHotkey(
    "editor:ai-undo",
    { key: "z", modKey: true },
    React.useCallback(() => {
      if (!editorReady) return false;
      if (!handleAiUndo()) return false;
      return undefined;
    }, [editorReady, handleAiUndo]),
    "editor",
    5,
  );

  useHotkey(
    "editor:save",
    { key: "s", modKey: true },
    React.useCallback(() => {
      if (!editorReady || !editor || !documentId) return;
      if (isPreviewMode) return;

      const json = JSON.stringify(editor.getJSON());
      void save({
        projectId: projectId,
        documentId: documentId,
        contentJson: json,
        actor: "user",
        reason: "manual-save",
      });
    }, [editorReady, editor, documentId, isPreviewMode, projectId, save]),
    "editor",
    10,
  );

  const inlineAiPhase = inlineAiStore((s) => s.phase);

  useHotkey(
    "editor:inline-ai",
    { key: "k", modKey: true },
    React.useCallback(() => {
      if (zenMode) return;
      if (!editor) return;
      const captured = captureSelectionRef(editor);
      if (!captured.ok) return;
      const selectedText = captured.data.selectionText.trim();
      if (selectedText.length === 0) return;
      if (inlineAiPhase !== "idle") return;
      inlineAiStore.getState().openInput({
        from: captured.data.selectionRef.range.from,
        to: captured.data.selectionRef.range.to,
        text: selectedText,
        selectionTextHash: captured.data.selectionRef.selectionTextHash,
      });
    }, [zenMode, editor, inlineAiPhase, inlineAiStore]),
    "editor",
    10,
  );

  return {
    handleSlashCommandSelect,
    onWriteClick,
    requestEditFromFinal,
    aiStreamCheckpointRef,
  };
}

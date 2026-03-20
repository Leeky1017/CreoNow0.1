import React from "react";
import type { useEditor } from "@tiptap/react";
import { useHotkey } from "../../lib/hotkeys/useHotkey";
import { resolveFinalDocumentEditDecision } from "./finalDocumentEditGuard";
import { buildWriteInput, isAiRunning } from "./editorPaneHelpers";
import {
  routeSlashCommandExecution,
  type SlashCommandExecutors,
  type SlashCommandId,
} from "./slashCommands";
import {
  buildAiStreamUndoCheckpoint,
  undoAiStream,
  type AiStreamCheckpoint,
} from "./aiStreamUndo";

export interface UseEditorKeybindingsDeps {
  editor: ReturnType<typeof useEditor>;
  aiSetSelectedSkillId: ((id: string) => void) | null;
  aiRun:
    | ((args?: {
        inputOverride?: string;
        context?: { projectId?: string; documentId?: string };
      }) => Promise<void>)
    | null;
  aiStatus: string;
  documentId: string | null;
  projectId: string;
  isPreviewMode: boolean;
  documentStatus: string | null;
  save: (args: {
    projectId: string;
    documentId: string;
    contentJson: string;
    actor: "user" | "auto";
    reason: "manual-save" | "autosave";
  }) => Promise<void>;
  closeSlashPanel: () => void;
  contentReady: boolean;
  bootstrapStatus: string;
  downgradeFinalStatusForEdit: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<boolean>;
  t: (key: string) => string;
}

export function useEditorKeybindings(deps: UseEditorKeybindingsDeps) {
  const {
    aiRun,
    aiSetSelectedSkillId,
    aiStatus,
    bootstrapStatus,
    closeSlashPanel,
    contentReady,
    documentId,
    documentStatus,
    downgradeFinalStatusForEdit,
    editor,
    isPreviewMode,
    projectId,
    save,
    t,
  } = deps;

  const aiStreamCheckpointRef = React.useRef<AiStreamCheckpoint | null>(null);

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

  const editorReady =
    !!editor && bootstrapStatus === "ready" && !!documentId && contentReady;

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

  return {
    handleSlashCommandSelect,
    onWriteClick,
    requestEditFromFinal,
    aiStreamCheckpointRef,
  };
}

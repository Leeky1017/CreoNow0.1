import React from "react";
import { useTranslation } from "react-i18next";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";

import {
  useOptionalAiStore,
} from "../../stores/aiStore";
import {
  useEditorStore,
} from "../../stores/editorStore";
import { useOptionalLayoutStore } from "../../stores/layoutStore";
import { useVersionStore } from "../../stores/versionStore";
import { useAutosave } from "./useAutosave";
import { EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY } from "./EditorBubbleMenu";
import { SlashCommandExtension } from "./extensions/slashCommand";
import { DragHandleExtension } from "./extensions/dragHandle";
import { InlineDiffExtension } from "./extensions/inlineDiff";
import {
  createInlineAiStore,
  type UseInlineAiStore,
} from "./inlineAiStore";
import { useEntityCompletion } from "./useEntityCompletion";
import { useEditorKeybindings } from "./useEditorKeybindings";
import {
  isAiRunning,
  parseEditorContentJsonSafely,
  chunkLargePasteText,
  shouldWarnDocumentCapacity,
  shouldConfirmOverflowPaste,
  sanitizePastedHtml,
  LARGE_PASTE_THRESHOLD_CHARS,
  EDITOR_DOCUMENT_CHARACTER_LIMIT,
} from "./editorPaneHelpers";

const IS_VITEST_RUNTIME =
  typeof process !== "undefined" && Boolean(process.env.VITEST);

export function useEditorSetup(projectId: string) {
  const { t } = useTranslation();
  const bootstrapStatus = useEditorStore((s) => s.bootstrapStatus);
  const documentId = useEditorStore((s) => s.documentId);
  const documentStatus = useEditorStore((s) => s.documentStatus);
  const documentContentJson = useEditorStore((s) => s.documentContentJson);
  const save = useEditorStore((s) => s.save);
  const setDocumentCharacterCount = useEditorStore((s) => s.setDocumentCharacterCount);
  const setCapacityWarning = useEditorStore((s) => s.setCapacityWarning);
  const entityCompletionSession = useEditorStore((s) => s.entityCompletionSession);
  const setEntityCompletionSession = useEditorStore((s) => s.setEntityCompletionSession);
  const clearEntityCompletionSession = useEditorStore((s) => s.clearEntityCompletionSession);
  const listKnowledgeEntities = useEditorStore((s) => s.listKnowledgeEntities);
  const downgradeFinalStatusForEdit = useEditorStore((s) => s.downgradeFinalStatusForEdit);
  const setEditorInstance = useEditorStore((s) => s.setEditorInstance);
  const previewStatus = useVersionStore((s) => s.previewStatus);
  const previewTimestamp = useVersionStore((s) => s.previewTimestamp);
  const previewContentJson = useVersionStore((s) => s.previewContentJson);
  const exitPreview = useVersionStore((s) => s.exitPreview);
  const aiStatus = useOptionalAiStore((s) => s.status) ?? "idle";
  const aiSetSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const aiRun = useOptionalAiStore((s) => s.run);
  const zenMode = useOptionalLayoutStore((s) => s.zenMode) ?? false;

  const suppressAutosaveRef = React.useRef<boolean>(false);
  const [contentReady, setContentReady] = React.useState(false);
  const [writeHovering, setWriteHovering] = React.useState(false);
  const [isSlashPanelOpen, setIsSlashPanelOpen] = React.useState(false);
  const [slashSearchQuery, setSlashSearchQuery] = React.useState("");
  const slashPanelOpenRef = React.useRef(false);
  const isPreviewMode = previewStatus === "ready" && previewContentJson !== null;
  const activeContentJson = isPreviewMode ? previewContentJson : documentContentJson;

  const syncCapacityState = React.useCallback(
    (nextCount: number) => {
      setDocumentCharacterCount(nextCount);
      setCapacityWarning(
        shouldWarnDocumentCapacity(nextCount)
          ? t("editor.pane.charLimitReached")
          : null,
      );
    },
    [setCapacityWarning, setDocumentCharacterCount, t],
  );

  React.useEffect(() => {
    slashPanelOpenRef.current = isSlashPanelOpen;
  }, [isSlashPanelOpen]);

  const openSlashPanel = React.useCallback(() => {
    if (zenMode) {
      return;
    }
    setIsSlashPanelOpen(true);
  }, [zenMode]);

  const closeSlashPanel = React.useCallback(() => {
    setIsSlashPanelOpen(false);
    setSlashSearchQuery("");
  }, []);

  React.useEffect(() => {
    if (zenMode && isSlashPanelOpen) {
      closeSlashPanel();
    }
  }, [closeSlashPanel, isSlashPanelOpen, zenMode]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
      }),
      SlashCommandExtension.configure({
        isPanelOpen: () => slashPanelOpenRef.current,
        onOpenPanel: openSlashPanel,
        onClosePanel: closeSlashPanel,
      }),
      DragHandleExtension,
      InlineDiffExtension,
      ...(!IS_VITEST_RUNTIME
        ? [
            BubbleMenuExtension.configure({
              pluginKey: EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY,
            }),
          ]
        : []),
    ],
    autofocus: true,
    editorProps: {
      transformPastedHTML: sanitizePastedHtml,
      handlePaste(view, event) {
        const clipboardText = event.clipboardData?.getData("text/plain") ?? "";
        if (clipboardText.length < LARGE_PASTE_THRESHOLD_CHARS) {
          return false;
        }

        event.preventDefault();

        const currentLength = view.state.doc.textContent.length;
        const chunks = chunkLargePasteText(clipboardText);
        if (chunks.length === 0) {
          return true;
        }

        const overflow = shouldConfirmOverflowPaste({
          currentLength,
          pasteLength: clipboardText.length,
        });
        const shouldContinueOverflow =
          !overflow || window.confirm(t("editor.pane.pasteLimitExceeded"));

        const allowedLength = shouldContinueOverflow
          ? clipboardText.length
          : Math.max(EDITOR_DOCUMENT_CHARACTER_LIMIT - currentLength, 0);
        if (allowedLength <= 0) {
          return true;
        }

        let remaining = allowedLength;
        for (const chunk of chunks) {
          if (remaining <= 0) {
            break;
          }
          const nextChunk = chunk.slice(0, remaining);
          const tr = view.state.tr.insertText(
            nextChunk,
            view.state.selection.from,
            view.state.selection.to,
          );
          view.dispatch(tr);
          remaining -= nextChunk.length;
        }
        return true;
      },
      attributes: {
        "data-testid": "tiptap-editor",
        class: "h-full outline-none p-4 text-[var(--color-fg-default)]",
      },
    },
    content: { type: "doc", content: [{ type: "paragraph" }] },
  });

  React.useEffect(() => {
    setEditorInstance(editor ?? null);
    return () => setEditorInstance(null);
  }, [editor, setEditorInstance]);

  React.useEffect(() => {
    if (!contentReady || isPreviewMode) {
      closeSlashPanel();
    }
  }, [closeSlashPanel, contentReady, isPreviewMode]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(documentStatus !== "final" && !isPreviewMode);
  }, [documentStatus, editor, isPreviewMode]);

  React.useEffect(() => {
    if (!editor || !documentId || !activeContentJson) {
      setContentReady(false);
      return;
    }

    try {
      setContentReady(false);
      suppressAutosaveRef.current = true;
      editor.commands.setContent(
        parseEditorContentJsonSafely(activeContentJson),
      );
    } finally {
      window.setTimeout(() => {
        suppressAutosaveRef.current = false;
        setContentReady(true);
        syncCapacityState(editor.state.doc.textContent.length);
      }, 0);
    }
  }, [activeContentJson, documentId, editor, syncCapacityState]);

  const {
    handleSlashCommandSelect,
    onWriteClick,
    requestEditFromFinal,
    aiStreamCheckpointRef,
  } = useEditorKeybindings({
    editor,
    aiSetSelectedSkillId,
    aiRun,
    aiStatus,
    documentId,
    projectId,
    isPreviewMode,
    documentStatus,
    save,
    closeSlashPanel,
    contentReady,
    bootstrapStatus,
    downgradeFinalStatusForEdit,
    t,
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const onUpdate = () => {
      syncCapacityState(editor.state.doc.textContent.length);

      if (aiStreamCheckpointRef.current && !isAiRunning(aiStatus)) {
        aiStreamCheckpointRef.current = null;
      }
    };

    onUpdate();
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [aiStreamCheckpointRef, aiStatus, editor, syncCapacityState]);

  const { applyEntityCompletionCandidate } = useEntityCompletion({
    editor,
    bootstrapStatus,
    documentId,
    contentReady,
    isPreviewMode,
    documentStatus,
    entityCompletionSession,
    setEntityCompletionSession,
    clearEntityCompletionSession,
    listKnowledgeEntities,
    projectId,
  });

  useAutosave({
    enabled:
      bootstrapStatus === "ready" &&
      !!documentId &&
      contentReady &&
      documentStatus !== "final" &&
      !isPreviewMode,
    projectId,
    documentId: documentId ?? "",
    editor,
    suppressRef: suppressAutosaveRef,
  });

  const inlineAiStoreRef = React.useRef<UseInlineAiStore | null>(null);
  if (!inlineAiStoreRef.current) {
    inlineAiStoreRef.current = createInlineAiStore();
  }
  const inlineAiStore = inlineAiStoreRef.current;

  return {
    t,
    bootstrapStatus,
    projectId,
    documentId,
    documentStatus,
    contentReady,
    editor,
    previewTimestamp,
    isPreviewMode,
    entityCompletionSession,
    applyEntityCompletionCandidate,
    isSlashPanelOpen,
    slashSearchQuery,
    setSlashSearchQuery,
    handleSlashCommandSelect,
    closeSlashPanel,
    writeHovering,
    setWriteHovering,
    exitPreview,
    requestEditFromFinal,
    aiSetSelectedSkillId,
    aiRun,
    aiStatus,
    onWriteClick,
    zenMode,
    inlineAiStore,
  };
}

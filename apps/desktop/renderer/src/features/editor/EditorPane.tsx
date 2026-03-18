import React from "react";
import { useTranslation } from "react-i18next";
import { EditorContent } from "@tiptap/react";

import { useOptionalAiStore } from "../../stores/aiStore";
import { useEditorStore } from "../../stores/editorStore";
import { useOptionalLayoutStore } from "../../stores/layoutStore";
import { useVersionStore } from "../../stores/versionStore";
import { Button, ScrollArea, Text } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { EditorContextMenu } from "./EditorContextMenu";
import { EditorFeaturedImage } from "./EditorFeaturedImage";
import { WriteButton } from "./WriteButton";
import { useEditorSetup, isAiRunning } from "./useEditorSetup";
import { InlineAiOverlay } from "./InlineAiOverlay";
import { EntityCompletionPopover } from "./EntityCompletionPopover";
import { SlashCommandMenu, useSlashPanel } from "./SlashCommandMenu";
import { useEditorKeybindings } from "./useEditorKeybindings";
import { createInlineAiStore } from "./inlineAiStore";
import { resolveEditorTypographyVars } from "./typography";

// Re-exports for backward compatibility
export {
  EDITOR_DOCUMENT_CHARACTER_LIMIT,
  LARGE_PASTE_THRESHOLD_CHARS,
  chunkLargePasteText,
  parseEditorContentJsonSafely,
  sanitizePastedHtml,
  shouldConfirmOverflowPaste,
  shouldWarnDocumentCapacity,
} from "./editorPasteUtils";
export { InlineAiOverlay } from "./InlineAiOverlay";

export function EditorPane(props: { projectId: string }): JSX.Element {
  const { t } = useTranslation();
  const bootstrapStatus = useEditorStore((s) => s.bootstrapStatus);
  const documentId = useEditorStore((s) => s.documentId);
  const documentStatus = useEditorStore((s) => s.documentStatus);
  const previewTimestamp = useVersionStore((s) => s.previewTimestamp);
  const exitPreview = useVersionStore((s) => s.exitPreview);
  const aiStatus = useOptionalAiStore((s) => s.status) ?? "idle";
  const aiSetSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const aiRun = useOptionalAiStore((s) => s.run);
  const zenMode = useOptionalLayoutStore((s) => s.zenMode) ?? false;

  const [writeHovering, setWriteHovering] = React.useState(false);

  const {
    isSlashPanelOpen,
    slashSearchQuery,
    setSlashSearchQuery,
    slashPanelOpenRef,
    openSlashPanel,
    closeSlashPanel,
  } = useSlashPanel();

  const { editor, contentReady, isPreviewMode, syncCapacityState } =
    useEditorSetup({
      projectId: props.projectId,
      slashPanelOpenRef,
      openSlashPanel,
      closeSlashPanel,
    });

  const [inlineAiStore] = React.useState(() => createInlineAiStore());

  const {
    handleSlashCommandSelect,
    onWriteClick,
    requestEditFromFinal,
    aiStreamCheckpointRef,
  } = useEditorKeybindings({
    editor,
    projectId: props.projectId,
    documentId,
    contentReady,
    bootstrapStatus,
    isPreviewMode,
    documentStatus,
    closeSlashPanel,
    zenMode,
    inlineAiStore,
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

  if (bootstrapStatus !== "ready") {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {t("editor.pane.loadingEditor")}
      </Text>
    );
  }

  if (!documentId) {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {t("editor.pane.noDocumentSelected")}
      </Text>
    );
  }

  if (!contentReady) {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {t("editor.pane.loadingDocument")}
      </Text>
    );
  }

  const editorTypographyVars = resolveEditorTypographyVars();

  return (
    <div
      data-testid="editor-pane"
      data-document-id={documentId}
      className="flex h-full w-full min-w-0 flex-col"
    >
      {isPreviewMode ? (
        <div
          data-testid="editor-preview-banner"
          className="flex items-center justify-between gap-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-4 py-2"
        >
          <Text size="small" color="muted">
            {t("editor.pane.previewingVersion", {
              timestamp: previewTimestamp ?? t("editor.pane.history"),
            })}
          </Text>
          <div className="flex items-center gap-2">
            <Tooltip content={t("editor.pane.restoreTooltip")}>
              <Button
                data-testid="preview-restore-placeholder"
                variant="secondary"
                size="sm"
                disabled={true}
              >
                {t("editor.pane.restoreVersion")}
              </Button>
            </Tooltip>
            <Button
              data-testid="preview-return-current"
              variant="secondary"
              size="sm"
              onClick={exitPreview}
            >
              {t("editor.pane.backToCurrent")}
            </Button>
          </div>
        </div>
      ) : null}

      {documentStatus === "final" && !isPreviewMode ? (
        <div
          data-testid="final-document-guard"
          className="flex items-center justify-between gap-3 border-b border-[var(--color-separator)] bg-[var(--color-bg-surface)] px-4 py-2"
        >
          <Text size="small" color="muted">
            {t("editor.pane.finalDocumentHint")}
          </Text>
          <Button
            data-testid="final-document-edit-trigger"
            variant="secondary"
            size="sm"
            onClick={() => void requestEditFromFinal()}
          >
            {t("editor.pane.editAnyway")}
          </Button>
        </div>
      ) : null}
      <EditorBubbleMenu editor={editor} />
      {!zenMode && <EditorToolbar editor={editor} disabled={isPreviewMode} />}
      {!zenMode && (
        <SlashCommandMenu
          open={isSlashPanelOpen}
          query={slashSearchQuery}
          onQueryChange={setSlashSearchQuery}
          onSelectCommand={handleSlashCommandSelect}
          onRequestClose={closeSlashPanel}
        />
      )}
      <div
        data-testid="editor-content-region"
        className="relative flex-1 min-h-0 font-[var(--editor-active-font-family)] text-[length:var(--editor-font-size)] leading-[var(--editor-line-height)]"
        style={editorTypographyVars}
        onMouseEnter={() => setWriteHovering(true)}
        onMouseLeave={() => setWriteHovering(false)}
      >
        <EditorContextMenu editor={editor}>
          <ScrollArea
            data-testid="editor-content-scroll"
            viewportTestId="editor-content-scroll-viewport"
            className="h-full"
          >
            <EditorFeaturedImage />
            <EditorContent editor={editor} className="h-full" />
          </ScrollArea>
        </EditorContextMenu>
        <EntityCompletionPopover
          editor={editor}
          projectId={props.projectId}
          bootstrapStatus={bootstrapStatus}
          documentId={documentId}
          contentReady={contentReady}
          isPreviewMode={isPreviewMode}
          documentStatus={documentStatus}
        />
        <WriteButton
          visible={
            writeHovering &&
            !!editor &&
            contentReady &&
            documentStatus !== "final" &&
            !isPreviewMode &&
            editor.isEditable &&
            editor.state.selection.empty
          }
          disabled={!aiSetSelectedSkillId || !aiRun || isAiRunning(aiStatus)}
          running={isAiRunning(aiStatus)}
          onClick={() => void onWriteClick()}
        />
        <InlineAiOverlay
          inlineAiStore={inlineAiStore}
          editor={editor}
          projectId={props.projectId}
          documentId={documentId}
        />
      </div>
    </div>
  );
}

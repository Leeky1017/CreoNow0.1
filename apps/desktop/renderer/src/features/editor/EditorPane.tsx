import React from "react";
import { EditorContent } from "@tiptap/react";

import { useHotkey } from "../../lib/hotkeys/useHotkey";
import { Button, ScrollArea, Text } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { WriteButton } from "./WriteButton";
import { EditorContextMenu } from "./EditorContextMenu";
import { SlashCommandPanel } from "./SlashCommandPanel";
import { EntityCompletionPanel } from "./EntityCompletionPanel";
import { getSlashCommandRegistry } from "./slashCommands";
import {
  resolveEditorLineHeightToken,
  resolveEditorScaleFactor,
} from "./typography";
import { captureSelectionRef } from "../ai/applySelection";
import { useEditorSetup } from "./useEditorSetup";
import { InlineAiOverlay } from "./InlineAiOverlay";
import { isAiRunning } from "./editorPaneHelpers";

// Re-export extracted modules for backward compatibility
export { useEditorKeybindings } from "./useEditorKeybindings";
export { useEntityCompletion } from "./useEntityCompletion";
export {
  parseEditorContentJsonSafely,
  chunkLargePasteText,
  sanitizePastedHtml,
  EDITOR_DOCUMENT_CHARACTER_LIMIT,
  LARGE_PASTE_THRESHOLD_CHARS,
  shouldWarnDocumentCapacity,
  shouldConfirmOverflowPaste,
} from "./editorPaneHelpers";
export { InlineAiOverlay } from "./InlineAiOverlay";

/**
 * EditorPane mounts TipTap editor and wires autosave to the DB SSOT.
 */
export function EditorPane(props: { projectId: string }): JSX.Element {
  const core = useEditorSetup(props.projectId);
  const zenMode = core.zenMode;
  const inlineAiPhase = core.inlineAiStore((s) => s.phase);

  // Cmd/Ctrl+K: Inline AI — only when text is selected, not in zen mode
  useHotkey(
    "editor:inline-ai",
    { key: "k", modKey: true },
    React.useCallback(() => {
      if (zenMode) return;
      if (!core.editor) return;
      const captured = captureSelectionRef(core.editor);
      if (!captured.ok) return;
      const selectedText = captured.data.selectionText.trim();
      if (selectedText.length === 0) return;
      if (inlineAiPhase !== "idle") return;
      core.inlineAiStore.getState().openInput({
        from: captured.data.selectionRef.range.from,
        to: captured.data.selectionRef.range.to,
        text: selectedText,
        selectionTextHash: captured.data.selectionRef.selectionTextHash,
      });
    }, [zenMode, core.editor, inlineAiPhase, core.inlineAiStore]),
    "editor",
    10,
  );

  if (core.bootstrapStatus !== "ready") {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {core.t("editor.pane.loadingEditor")}
      </Text>
    );
  }

  if (!core.documentId) {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {core.t("editor.pane.noDocumentSelected")}
      </Text>
    );
  }

  if (!core.contentReady) {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {core.t("editor.pane.loadingDocument")}
      </Text>
    );
  }

  const locale =
    (typeof document !== "undefined" && document.documentElement.lang) ||
    (typeof navigator !== "undefined" ? navigator.language : null);
  const scalePercent =
    typeof window !== "undefined"
      ? Math.round((window.devicePixelRatio || 1) * 100)
      : 100;
  const editorLineHeightToken = resolveEditorLineHeightToken(locale);
  const editorScaleFactor = resolveEditorScaleFactor(scalePercent);
  const editorTypographyVars = {
    "--editor-line-height": editorLineHeightToken,
    "--editor-scale-factor": editorScaleFactor,
    "--editor-font-size":
      "calc(var(--text-editor-size) * var(--editor-scale-factor))",
  } as React.CSSProperties;

  return (
    <div
      data-testid="editor-pane"
      data-document-id={core.documentId}
      className="flex h-full w-full min-w-0 flex-col"
    >
      {core.isPreviewMode ? (
        <div
          data-testid="editor-preview-banner"
          className="flex items-center justify-between gap-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-4 py-2"
        >
          <Text size="small" color="muted">
            {core.t("editor.pane.previewingVersion", {
              timestamp: core.previewTimestamp ?? core.t("editor.pane.history"),
            })}
          </Text>
          <div className="flex items-center gap-2">
            <Tooltip content={core.t("editor.pane.restoreTooltip")}>
              <Button
                data-testid="preview-restore-placeholder"
                variant="secondary"
                size="sm"
                disabled={true}
              >
                {core.t("editor.pane.restoreVersion")}
              </Button>
            </Tooltip>
            <Button
              data-testid="preview-return-current"
              variant="secondary"
              size="sm"
              onClick={core.exitPreview}
            >
              {core.t("editor.pane.backToCurrent")}
            </Button>
          </div>
        </div>
      ) : null}

      {core.documentStatus === "final" && !core.isPreviewMode ? (
        <div
          data-testid="final-document-guard"
          className="flex items-center justify-between gap-3 border-b border-[var(--color-separator)] bg-[var(--color-bg-surface)] px-4 py-2"
        >
          <Text size="small" color="muted">
            {core.t("editor.pane.finalDocumentHint")}
          </Text>
          <Button
            data-testid="final-document-edit-trigger"
            variant="secondary"
            size="sm"
            onClick={() => void core.requestEditFromFinal()}
          >
            {core.t("editor.pane.editAnyway")}
          </Button>
        </div>
      ) : null}
      <EditorBubbleMenu editor={core.editor} />
      {!zenMode && (
        <EditorToolbar editor={core.editor} disabled={core.isPreviewMode} />
      )}
      {!zenMode && (
        <SlashCommandPanel
          open={core.isSlashPanelOpen}
          query={core.slashSearchQuery}
          candidates={getSlashCommandRegistry()}
          onQueryChange={core.setSlashSearchQuery}
          onSelectCommand={core.handleSlashCommandSelect}
          onRequestClose={core.closeSlashPanel}
        />
      )}
      <div
        data-testid="editor-content-region"
        className="relative flex-1 min-h-0 font-[var(--font-family-body)] text-[length:var(--editor-font-size)] leading-[var(--editor-line-height)]"
        style={editorTypographyVars}
        onMouseEnter={() => core.setWriteHovering(true)}
        onMouseLeave={() => core.setWriteHovering(false)}
      >
        <EditorContextMenu editor={core.editor}>
          <ScrollArea
            data-testid="editor-content-scroll"
            viewportTestId="editor-content-scroll-viewport"
            className="h-full"
          >
            <EditorContent editor={core.editor} className="h-full" />
          </ScrollArea>
        </EditorContextMenu>
        <EntityCompletionPanel
          session={core.entityCompletionSession}
          onSelectCandidate={core.applyEntityCompletionCandidate}
        />
        <WriteButton
          visible={
            core.writeHovering &&
            !!core.editor &&
            core.contentReady &&
            core.documentStatus !== "final" &&
            !core.isPreviewMode &&
            core.editor.isEditable &&
            core.editor.state.selection.empty
          }
          disabled={
            !core.aiSetSelectedSkillId ||
            !core.aiRun ||
            isAiRunning(core.aiStatus)
          }
          running={isAiRunning(core.aiStatus)}
          onClick={() => void core.onWriteClick()}
        />
        <InlineAiOverlay
          inlineAiStore={core.inlineAiStore}
          editor={core.editor}
          projectId={core.projectId}
          documentId={core.documentId}
        />
      </div>
    </div>
  );
}

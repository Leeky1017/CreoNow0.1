import { useTranslation } from "react-i18next";

import { Button, Text } from "../../components/primitives";
import { PanelContainer } from "../../components/composites/PanelContainer";
import { EmptyState } from "../../components/patterns/EmptyState";
import { LoadingState } from "../../components/patterns/LoadingState";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";

import type { FileTreePanelProps } from "./fileTreeTypes";
import { FileTreeNodeRow } from "./FileTreeNodeRow";
import { useFileTreeState } from "./useFileTreeState";

// Re-export types for backward compatibility
export type { FileTreePanelProps } from "./fileTreeTypes";

export function FileTreePanel(props: FileTreePanelProps): JSX.Element {
  const { t } = useTranslation();
  const state = useFileTreeState(
    props.projectId,
    t,
    props.initialRenameDocumentId,
  );

  return (
    <PanelContainer
      data-testid="sidebar-files"
      title={t("files.tree.panelTitle")}
      actions={
        <>
          <Button
            data-testid="file-create"
            variant="secondary"
            size="sm"
            onClick={() => void state.onCreate("chapter")}
          >
            {t("files.tree.newButton")}
          </Button>
          <Button
            data-testid="file-create-note"
            variant="ghost"
            size="sm"
            onClick={() => void state.onCreate("note")}
          >
            {t("files.tree.noteButton")}
          </Button>
        </>
      }
    >
      {state.lastError ? (
        <div
          role="alert"
          className="p-3 border-b border-[var(--color-separator)]"
        >
          <Text size="small" className="mb-2 block">
            {getHumanErrorMessage(state.lastError)}
          </Text>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => state.clearError()}
          >
            {t("files.tree.dismiss")}
          </Button>
        </div>
      ) : null}

      <div
        data-testid="file-tree-list"
        role="tree"
        aria-label={t("files.tree.panelTitle")}
        tabIndex={0}
        onKeyDown={state.onTreeKeyDown}
        className="flex-1 overflow-auto scroll-shadow-y min-h-0 focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-ring-focus)]"
      >
        {state.bootstrapStatus !== "ready" ? (
          <LoadingState
            variant="spinner"
            size="sm"
            text={t("files.tree.loading")}
            className="p-3"
          />
        ) : state.items.length === 0 ? (
          <EmptyState
            variant="files"
            title={t("files.tree.emptyTitle")}
            description={t("files.tree.emptyDescription")}
            actionLabel={t("files.tree.newFile")}
            onAction={() => void state.onCreate("chapter")}
          />
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {state.visibleNodes.map((entry) => (
              <FileTreeNodeRow
                key={entry.node.documentId}
                ref={state.inputRef}
                entry={entry}
                focusedDocumentId={state.focusedDocumentId}
                currentDocumentId={state.currentDocumentId}
                editing={state.editing}
                setEditing={state.setEditing}
                draggingDocumentId={state.draggingDocumentId}
                setDraggingDocumentId={state.setDraggingDocumentId}
                dropTarget={state.dropTarget}
                setDropTarget={state.setDropTarget}
                setFocusedDocumentId={state.setFocusedDocumentId}
                expandedFolderIds={state.expandedFolderIds}
                toggleFolderExpanded={state.toggleFolderExpanded}
                resolveMoveTargetFolder={state.resolveMoveTargetFolder}
                onSelect={state.onSelect}
                onCopy={state.onCopy}
                onDelete={state.onDelete}
                onCommitRename={state.onCommitRename}
                onToggleStatus={state.onToggleStatus}
                onDropOnDocument={state.onDropOnDocument}
                onMoveDocumentToFolder={state.onMoveDocumentToFolder}
                onOpenVersionHistory={props.onOpenVersionHistory}
              />
            ))}
          </div>
        )}
      </div>

      <SystemDialog {...state.dialogProps} />
    </PanelContainer>
  );
}

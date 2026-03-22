import React from "react";
import { useTranslation } from "react-i18next";

import {
  ContextMenu,
  ListItem,
  Popover,
  PopoverClose,
  Text,
} from "../../components/primitives";
import { Button } from "../../components/primitives/Button";
import type {
  DropTargetState,
  EditingState,
  TreeNode,
  VisibleTreeNode,
} from "./fileTreeTypes";
import type { DropMode } from "./fileTreeTypes";
import { iconForType, isFolderCandidate } from "./fileTreeHelpers";
import { buildNodeContextMenuItems } from "./fileTreeContextMenu";
import { FileTreeRenameRow } from "./FileTreeRenameRow";

export interface FileTreeNodeRowProps {
  entry: VisibleTreeNode;
  focusedDocumentId: string | null;
  currentDocumentId: string | null;
  editing: EditingState;
  setEditing: (state: EditingState) => void;
  draggingDocumentId: string | null;
  setDraggingDocumentId: (id: string | null) => void;
  dropTarget: DropTargetState | null;
  setDropTarget: (target: DropTargetState | null) => void;
  setFocusedDocumentId: (id: string | null) => void;
  expandedFolderIds: Set<string>;
  toggleFolderExpanded: (id: string) => void;
  resolveMoveTargetFolder: (documentId: string) => string | null;
  onSelect: (documentId: string) => Promise<void>;
  onCopy: (item: TreeNode) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onCommitRename: () => Promise<void>;
  onToggleStatus: (args: {
    documentId: string;
    next: "draft" | "final";
  }) => Promise<void>;
  onDropOnDocument: (targetId: string) => Promise<void>;
  onMoveDocumentToFolder: (args: {
    documentId: string;
    parentId: string;
  }) => Promise<void>;
  onOpenVersionHistory?: (documentId: string) => void;
}

/* eslint-disable react/prop-types -- TypeScript interface provides type safety; React.memo(forwardRef()) confuses prop-types plugin */
export const FileTreeNodeRow = React.memo(
  React.forwardRef<HTMLInputElement, FileTreeNodeRowProps>(
    function FileTreeNodeRow(props, ref) {
      const { t } = useTranslation();
      const { entry, editing, setEditing } = props;
      const item = entry.node;
      const hasChildren = item.children.length > 0;
      const selected =
        item.documentId ===
        (props.focusedDocumentId ?? props.currentDocumentId);
      const isRenaming =
        editing.mode === "rename" && editing.documentId === item.documentId;
      const isDragging = props.draggingDocumentId === item.documentId;
      const dropBefore =
        props.dropTarget?.documentId === item.documentId &&
        props.dropTarget?.mode === "before";
      const dropInto =
        props.dropTarget?.documentId === item.documentId &&
        props.dropTarget?.mode === "into";

      const moveTargetFolderId = props.resolveMoveTargetFolder(item.documentId);

      const contextMenuItems = buildNodeContextMenuItems(
        item,
        moveTargetFolderId,
        {
          t: t,
          setEditing,
          onCopy: props.onCopy,
          onDelete: props.onDelete,
          onToggleStatus: props.onToggleStatus,
          onMoveDocumentToFolder: props.onMoveDocumentToFolder,
          onOpenVersionHistory: props.onOpenVersionHistory,
        },
      );

      if (isRenaming) {
        return (
          <FileTreeRenameRow
            ref={ref}
            item={item}
            entry={entry}
            editing={editing}
            dropBefore={dropBefore}
            setEditing={setEditing}
            onCommitRename={props.onCommitRename}
          />
        );
      }

      return (
        <div
          key={item.documentId}
          className="relative"
          style={{ paddingLeft: `${entry.depth * 16}px` }}
        >
          {dropBefore ? (
            <div
              data-testid={`file-drop-indicator-${item.documentId}`}
              className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-info)]" />
            </div>
          ) : null}
          <ContextMenu items={contextMenuItems}>
            <ListItem
              data-testid={`file-row-${item.documentId}`}
              aria-selected={selected}
              selected={selected}
              interactive
              compact
              draggable
              onDragStart={(e) => {
                props.setDraggingDocumentId(item.documentId);
                props.setDropTarget(null);
                props.setFocusedDocumentId(item.documentId);
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = "move";
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (props.draggingDocumentId === item.documentId) {
                  return;
                }
                const nextMode: DropMode = isFolderCandidate(item)
                  ? "into"
                  : "before";
                props.setDropTarget({
                  documentId: item.documentId,
                  mode: nextMode,
                });
              }}
              onDrop={(e) => {
                e.preventDefault();
                void props.onDropOnDocument(item.documentId);
                props.setDropTarget(null);
                props.setDraggingDocumentId(null);
              }}
              onDragEnd={() => {
                props.setDropTarget(null);
                props.setDraggingDocumentId(null);
              }}
              onClick={() => void props.onSelect(item.documentId)}
              className={`h-8 border ${selected ? "border-[var(--color-border-focus)]" : "border-transparent"} group ${dropInto ? "bg-[var(--color-bg-hover)]" : ""} ${isDragging ? "opacity-50" : ""}`}
            >
              {hasChildren ? (
                <Button
                  type="button"
                  data-testid={`file-folder-toggle-${item.documentId}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.toggleFolderExpanded(item.documentId);
                  }}
                  className="shrink-0 w-4 text-[10px] text-[var(--color-fg-muted)] transition-transform duration-[var(--duration-fast)]"
                  style={{
                    transform: props.expandedFolderIds.has(item.documentId)
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                  }}
                  aria-label={
                    props.expandedFolderIds.has(item.documentId)
                      ? t("files.tree.collapse")
                      : t("files.tree.expand")
                  }
                >
                  {/* 审计：v1-13 #009 KEEP */}
                  {/* eslint-disable-next-line i18next/no-literal-string -- 技术原因：decorative chevron glyph, not user-facing translatable text */}
                  {"▸"}
                </Button>
              ) : (
                <span className="shrink-0 w-4" />
              )}
              <span
                data-testid={`file-type-icon-${item.documentId}`}
                className="shrink-0"
                aria-hidden="true"
              >
                {iconForType(item.type)}
              </span>
              <Text
                size="small"
                className="block overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0"
              >
                {item.title}
              </Text>
              {item.status === "final" ? (
                <span
                  data-testid={`file-status-final-${item.documentId}`}
                  className="inline-block w-2 h-2 rounded-full bg-[var(--color-success)] shrink-0"
                />
              ) : null}
              <Popover
                trigger={
                  <Button
                    data-testid={`file-actions-${item.documentId}`}
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0 w-6 h-6 p-0"
                  >
                    {t("files.tree.moreActions")}
                  </Button>
                }
                side="bottom"
                align="end"
              >
                <div className="flex flex-col gap-1 -m-2">
                  <PopoverClose asChild>
                    <Button
                      data-testid={`file-rename-${item.documentId}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing({
                          mode: "rename",
                          documentId: item.documentId,
                          title: item.title,
                        });
                      }}
                      className="justify-start w-full"
                    >
                      {t("files.tree.rename")}
                    </Button>
                  </PopoverClose>
                  <PopoverClose asChild>
                    <Button
                      data-testid={`file-copy-${item.documentId}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => void props.onCopy(item)}
                      className="justify-start w-full"
                    >
                      {t("files.tree.copy")}
                    </Button>
                  </PopoverClose>
                  <PopoverClose asChild>
                    <Button
                      data-testid={`file-move-${item.documentId}`}
                      variant="ghost"
                      size="sm"
                      disabled={!moveTargetFolderId}
                      onClick={() => {
                        if (!moveTargetFolderId) {
                          return;
                        }
                        void props.onMoveDocumentToFolder({
                          documentId: item.documentId,
                          parentId: moveTargetFolderId,
                        });
                      }}
                      className="justify-start w-full"
                    >
                      {t("files.tree.moveToFolder")}
                    </Button>
                  </PopoverClose>
                  <PopoverClose asChild>
                    <Button
                      data-testid={`file-status-toggle-${item.documentId}`}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void props.onToggleStatus({
                          documentId: item.documentId,
                          next: item.status === "final" ? "draft" : "final",
                        })
                      }
                      className="justify-start w-full"
                    >
                      {item.status === "final"
                        ? t("files.tree.markAsDraft")
                        : t("files.tree.markAsFinal")}
                    </Button>
                  </PopoverClose>
                  <PopoverClose asChild>
                    <Button
                      data-testid={`file-delete-${item.documentId}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => void props.onDelete(item.documentId)}
                      className="justify-start w-full text-[var(--color-error)]"
                    >
                      {t("files.tree.delete")}
                    </Button>
                  </PopoverClose>
                </div>
              </Popover>
            </ListItem>
          </ContextMenu>
        </div>
      );
    },
  ),
);

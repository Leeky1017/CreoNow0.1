import React from "react";
import type { useTranslation } from "react-i18next";

import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useEditorStore } from "../../stores/editorStore";
import { useFileStore } from "../../stores/fileStore";
import type { EditingState, DropTargetState } from "./fileTreeTypes";
import { buildTreeSnapshot, flattenTree } from "./fileTreeHelpers";

/**
 * FileTree 核心状态：store 消费、React 状态、副作用。
 * 拆自 useFileTreeState，仅负责 state + effects，不含 CRUD handlers。
 */
// 审计：v1-13 #008 KEEP
// eslint-disable-next-line max-lines-per-function -- 技术原因：核心状态 hook 聚合 store 消费、React 状态与副作用，拆分会破坏内聚性
export function useFileTreeCore(
  projectId: string,
  t: ReturnType<typeof useTranslation>["t"],
  initialRenameDocumentId?: string,
) {
  const items = useFileStore((s) => s.items);
  const currentDocumentId = useFileStore((s) => s.currentDocumentId);
  const bootstrapStatus = useFileStore((s) => s.bootstrapStatus);
  const lastError = useFileStore((s) => s.lastError);

  const createAndSetCurrent = useFileStore((s) => s.createAndSetCurrent);
  const rename = useFileStore((s) => s.rename);
  const updateStatus = useFileStore((s) => s.updateStatus);
  const deleteDocument = useFileStore((s) => s.delete);
  const setCurrent = useFileStore((s) => s.setCurrent);
  const clearError = useFileStore((s) => s.clearError);
  const reorder = useFileStore((s) => s.reorder);
  const moveToFolder = useFileStore((s) => s.moveToFolder);

  const openDocument = useEditorStore((s) => s.openDocument);
  const { confirm, dialogProps } = useConfirmDialog();
  const openCurrentForProject = useEditorStore(
    (s) => s.openCurrentDocumentForProject,
  );

  const [editing, setEditing] = React.useState<EditingState>({ mode: "idle" });
  const [expandedFolderIds, setExpandedFolderIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [focusedDocumentId, setFocusedDocumentId] = React.useState<
    string | null
  >(null);
  const [draggingDocumentId, setDraggingDocumentId] = React.useState<
    string | null
  >(null);
  const [dropTarget, setDropTarget] = React.useState<DropTargetState | null>(
    null,
  );

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const initialRenameAppliedRef = React.useRef(false);

  const tree = React.useMemo(() => buildTreeSnapshot(items), [items]);
  const visibleNodes = React.useMemo(
    () => flattenTree(tree.roots, expandedFolderIds, tree.parentById),
    [tree.roots, expandedFolderIds, tree.parentById],
  );

  // Auto-expand all expandable folders
  React.useEffect(() => {
    const expandableIds = new Set<string>();
    for (const node of tree.nodeById.values()) {
      if (node.children.length > 0) {
        expandableIds.add(node.documentId);
      }
    }
    setExpandedFolderIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (expandableIds.has(id)) next.add(id);
      }
      for (const id of expandableIds) next.add(id);
      if (next.size === prev.size) {
        let unchanged = true;
        for (const id of next) {
          if (!prev.has(id)) {
            unchanged = false;
            break;
          }
        }
        if (unchanged) return prev;
      }
      return next;
    });
  }, [tree.nodeById]);

  // Initial rename trigger
  React.useEffect(() => {
    if (
      !initialRenameDocumentId ||
      initialRenameAppliedRef.current ||
      editing.mode !== "idle"
    )
      return;
    const doc = items.find(
      (item) => item.documentId === initialRenameDocumentId,
    );
    if (!doc) return;
    initialRenameAppliedRef.current = true;
    setEditing({
      mode: "rename",
      documentId: doc.documentId,
      title: doc.title,
    });
  }, [editing.mode, items, initialRenameDocumentId]);

  // Focus rename input
  React.useEffect(() => {
    if (editing.mode !== "rename") return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing.mode]);

  // Sync focusedDocumentId with visible nodes
  React.useEffect(() => {
    if (visibleNodes.length === 0) {
      setFocusedDocumentId(null);
      return;
    }
    const visibleIdSet = new Set(visibleNodes.map((e) => e.node.documentId));
    setFocusedDocumentId((prev) => {
      if (prev && visibleIdSet.has(prev)) return prev;
      if (currentDocumentId && visibleIdSet.has(currentDocumentId))
        return currentDocumentId;
      return visibleNodes[0]?.node.documentId ?? null;
    });
  }, [currentDocumentId, visibleNodes]);

  function toggleFolderExpanded(documentId: string): void {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  }

  return {
    // store data
    items,
    currentDocumentId,
    bootstrapStatus,
    lastError,
    clearError,
    // store actions
    createAndSetCurrent,
    rename,
    updateStatus,
    deleteDocument: deleteDocument,
    setCurrent,
    reorder,
    moveToFolder,
    openDocument,
    confirm,
    dialogProps,
    openCurrentForProject,
    // local state
    editing,
    setEditing,
    expandedFolderIds,
    setExpandedFolderIds,
    focusedDocumentId,
    setFocusedDocumentId,
    draggingDocumentId,
    setDraggingDocumentId,
    dropTarget,
    setDropTarget,
    inputRef,
    // derived
    tree,
    visibleNodes,
    // actions
    toggleFolderExpanded,
    // params
    projectId,
    t,
  };
}

import React from "react";
import type { useTranslation } from "react-i18next";

import type { DocumentListItem, DocumentType } from "./fileTreeTypes";
import {
  collectDescendantIds,
  compareDocumentOrder,
  defaultTitleI18nKey,
  isFolderCandidate,
  performDropOnDocument,
} from "./fileTreeHelpers";
import { handleTreeKeyDown } from "./useFileTreeKeyboard";
import { useFileTreeCore } from "./useFileTreeCore";

export const FILE_TREE_EXIT_ANIMATION_MS = 150;

function shouldReduceMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function waitForListItemExit(): Promise<void> {
  if (shouldReduceMotion()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, FILE_TREE_EXIT_ANIMATION_MS);
  });
}

// 审计：v1-13 #010 KEEP
// eslint-disable-next-line max-lines-per-function -- 技术原因：聚合 useFileTreeCore 与 CRUD handlers，已拆分核心逻辑至 useFileTreeCore，进一步拆分会破坏 API 内聚性
export function useFileTreeState(
  projectId: string,
  t: ReturnType<typeof useTranslation>["t"],
  initialRenameDocumentId?: string,
) {
  const core = useFileTreeCore(projectId, t, initialRenameDocumentId);
  const [exitingDocumentIds, setExitingDocumentIds] = React.useState<
    Set<string>
  >(new Set());
  const exitingDocumentIdsRef = React.useRef(exitingDocumentIds);

  React.useEffect(() => {
    exitingDocumentIdsRef.current = exitingDocumentIds;
  }, [exitingDocumentIds]);

  function markDocumentExiting(documentId: string): boolean {
    if (exitingDocumentIdsRef.current.has(documentId)) {
      return false;
    }
    exitingDocumentIdsRef.current = new Set(exitingDocumentIdsRef.current).add(
      documentId,
    );
    setExitingDocumentIds((prev) => {
      const next = new Set(prev);
      next.add(documentId);
      return next;
    });
    return true;
  }

  function clearExitingDocument(documentId: string): void {
    if (!exitingDocumentIdsRef.current.has(documentId)) {
      return;
    }
    const nextIds = new Set(exitingDocumentIdsRef.current);
    nextIds.delete(documentId);
    exitingDocumentIdsRef.current = nextIds;
    setExitingDocumentIds((prev) => {
      if (!prev.has(documentId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(documentId);
      return next;
    });
  }

  function resolveMoveTargetFolder(documentId: string): string | null {
    const sourceNode = core.tree.nodeById.get(documentId);
    const descendants = sourceNode
      ? collectDescendantIds(sourceNode)
      : new Set<string>();
    const candidates = [...core.tree.nodeById.values()]
      .filter((n) => n.documentId !== documentId)
      .filter((n) => !descendants.has(n.documentId))
      .filter((n) => isFolderCandidate(n))
      .sort(compareDocumentOrder);
    return candidates[0]?.documentId ?? null;
  }

  async function onCreate(type: DocumentType = "chapter"): Promise<void> {
    const res = await core.createAndSetCurrent({ projectId, type });
    if (!res.ok) return;
    await core.openDocument({ projectId, documentId: res.data.documentId });
    core.setFocusedDocumentId(res.data.documentId);
    core.setEditing({
      mode: "rename",
      documentId: res.data.documentId,
      title: t(defaultTitleI18nKey(type)),
    });
  }

  async function onCopy(item: DocumentListItem): Promise<void> {
    const res = await core.createAndSetCurrent({
      projectId,
      type: item.type,
      title: t("files.tree.copySuffix", { title: item.title }),
    });
    if (!res.ok) return;
    await core.openDocument({ projectId, documentId: res.data.documentId });
    core.setFocusedDocumentId(res.data.documentId);
  }

  async function onSelect(documentId: string): Promise<void> {
    core.setFocusedDocumentId(documentId);
    const p = core.setCurrent({ projectId, documentId });
    await core.openDocument({ projectId, documentId });
    await p;
  }

  async function onCommitRename(): Promise<void> {
    if (core.editing.mode !== "rename") return;
    const res = await core.rename({
      projectId,
      documentId: core.editing.documentId,
      title: core.editing.title,
    });
    if (res.ok) core.setEditing({ mode: "idle" });
  }

  async function onDelete(documentId: string): Promise<void> {
    if (exitingDocumentIdsRef.current.has(documentId)) return;
    const confirmed = await core.confirm({
      title: t("files.tree.deleteTitle"),
      description: t("files.tree.deleteDescription"),
      primaryLabel: t("files.tree.deleteConfirm"),
      secondaryLabel: t("files.tree.deleteCancel"),
    });
    if (!confirmed) return;
    if (!markDocumentExiting(documentId)) return;
    try {
      await waitForListItemExit();
      const res = await core.deleteDocument({ projectId, documentId });
      if (res.ok) await core.openCurrentForProject(projectId);
    } finally {
      clearExitingDocument(documentId);
    }
  }

  async function onToggleStatus(args: {
    documentId: string;
    next: "draft" | "final";
  }): Promise<void> {
    const res = await core.updateStatus({
      projectId,
      documentId: args.documentId,
      status: args.next,
    });
    if (!res.ok) return;
    if (core.currentDocumentId === args.documentId) {
      await core.openDocument({ projectId, documentId: args.documentId });
    }
  }

  async function onMoveDocumentToFolder(args: {
    documentId: string;
    parentId: string;
  }): Promise<void> {
    const sourceNode = core.tree.nodeById.get(args.documentId);
    if (!sourceNode || args.documentId === args.parentId) return;
    if (collectDescendantIds(sourceNode).has(args.parentId)) return;
    const res = await core.moveToFolder({
      projectId,
      documentId: args.documentId,
      parentId: args.parentId,
    });
    if (res.ok) {
      core.setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        next.add(args.parentId);
        return next;
      });
    }
  }

  async function onDropOnDocument(targetDocumentId: string): Promise<void> {
    await performDropOnDocument(targetDocumentId, {
      draggingDocumentId: core.draggingDocumentId,
      dropTarget: core.dropTarget,
      tree: core.tree,
      items: core.items,
      reorder: core.reorder,
      projectId,
      onMoveDocumentToFolder,
    });
  }

  function onTreeKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    handleTreeKeyDown(event, {
      editing: core.editing,
      tree: core.tree,
      visibleNodes: core.visibleNodes,
      focusedDocumentId: core.focusedDocumentId,
      currentDocumentId: core.currentDocumentId,
      expandedFolderIds: core.expandedFolderIds,
      toggleFolderExpanded: core.toggleFolderExpanded,
      setEditing: core.setEditing,
      setFocusedDocumentId: core.setFocusedDocumentId,
      onDelete,
      onSelect,
    });
  }

  return {
    items: core.items,
    currentDocumentId: core.currentDocumentId,
    bootstrapStatus: core.bootstrapStatus,
    lastError: core.lastError,
    clearError: core.clearError,
    editing: core.editing,
    setEditing: core.setEditing,
    expandedFolderIds: core.expandedFolderIds,
    focusedDocumentId: core.focusedDocumentId,
    setFocusedDocumentId: core.setFocusedDocumentId,
    draggingDocumentId: core.draggingDocumentId,
    setDraggingDocumentId: core.setDraggingDocumentId,
    dropTarget: core.dropTarget,
    setDropTarget: core.setDropTarget,
    inputRef: core.inputRef,
    tree: core.tree,
    visibleNodes: core.visibleNodes,
    exitingDocumentIds,
    dialogProps: core.dialogProps,
    toggleFolderExpanded: core.toggleFolderExpanded,
    resolveMoveTargetFolder,
    onCreate,
    onCopy,
    onSelect,
    onCommitRename,
    onDelete,
    onToggleStatus,
    onMoveDocumentToFolder,
    onDropOnDocument,
    onTreeKeyDown,
  };
}

import type React from "react";
import type {
  EditingState,
  TreeSnapshot,
  VisibleTreeNode,
} from "./fileTreeTypes";

export interface TreeKeyDownDeps {
  editing: EditingState;
  tree: TreeSnapshot;
  visibleNodes: VisibleTreeNode[];
  focusedDocumentId: string | null;
  currentDocumentId: string | null;
  expandedFolderIds: Set<string>;
  toggleFolderExpanded: (id: string) => void;
  setEditing: (state: EditingState) => void;
  setFocusedDocumentId: (id: string | null) => void;
  onDelete: (documentId: string) => Promise<void>;
  onSelect: (documentId: string) => Promise<void>;
}

export function handleTreeKeyDown(
  event: React.KeyboardEvent<HTMLDivElement>,
  deps: TreeKeyDownDeps,
): void {
  const {
    editing,
    tree,
    visibleNodes,
    focusedDocumentId,
    currentDocumentId,
    expandedFolderIds,
    toggleFolderExpanded,
    setEditing,
    setFocusedDocumentId,
    onDelete,
    onSelect,
  } = deps;
  if (editing.mode === "rename") {
    return;
  }

  if (visibleNodes.length === 0) {
    return;
  }

  const activeId =
    focusedDocumentId ??
    currentDocumentId ??
    visibleNodes[0]?.node.documentId ??
    null;
  if (!activeId) {
    return;
  }

  const currentIndex = visibleNodes.findIndex(
    (entry) => entry.node.documentId === activeId,
  );
  if (currentIndex < 0) {
    return;
  }

  const activeNode = visibleNodes[currentIndex]?.node;
  if (!activeNode) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    const next =
      visibleNodes[Math.min(currentIndex + 1, visibleNodes.length - 1)];
    if (next) {
      setFocusedDocumentId(next.node.documentId);
    }
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    const next = visibleNodes[Math.max(currentIndex - 1, 0)];
    if (next) {
      setFocusedDocumentId(next.node.documentId);
    }
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (activeNode.children.length === 0) {
      return;
    }
    if (!expandedFolderIds.has(activeNode.documentId)) {
      toggleFolderExpanded(activeNode.documentId);
      return;
    }
    const firstChild = activeNode.children[0];
    if (firstChild) {
      setFocusedDocumentId(firstChild.documentId);
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (
      activeNode.children.length > 0 &&
      expandedFolderIds.has(activeNode.documentId)
    ) {
      toggleFolderExpanded(activeNode.documentId);
      return;
    }
    const parentId = tree.parentById.get(activeNode.documentId);
    if (parentId) {
      setFocusedDocumentId(parentId);
    }
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    void onSelect(activeNode.documentId);
    return;
  }

  if (event.key === "F2") {
    event.preventDefault();
    setEditing({
      mode: "rename",
      documentId: activeNode.documentId,
      title: activeNode.title,
    });
    return;
  }

  if (event.key === "Delete") {
    event.preventDefault();
    void onDelete(activeNode.documentId);
  }
}

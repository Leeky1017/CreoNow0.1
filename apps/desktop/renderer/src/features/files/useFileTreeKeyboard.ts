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

interface ResolvedContext {
  currentIndex: number;
  activeNode: VisibleTreeNode["node"];
}

function handleArrowDown(ctx: ResolvedContext, deps: TreeKeyDownDeps): void {
  const next =
    deps.visibleNodes[
      Math.min(ctx.currentIndex + 1, deps.visibleNodes.length - 1)
    ];
  if (next) deps.setFocusedDocumentId(next.node.documentId);
}

function handleArrowUp(ctx: ResolvedContext, deps: TreeKeyDownDeps): void {
  const next = deps.visibleNodes[Math.max(ctx.currentIndex - 1, 0)];
  if (next) deps.setFocusedDocumentId(next.node.documentId);
}

function handleArrowRight(ctx: ResolvedContext, deps: TreeKeyDownDeps): void {
  if (ctx.activeNode.children.length === 0) return;
  if (!deps.expandedFolderIds.has(ctx.activeNode.documentId)) {
    deps.toggleFolderExpanded(ctx.activeNode.documentId);
    return;
  }
  const firstChild = ctx.activeNode.children[0];
  if (firstChild) deps.setFocusedDocumentId(firstChild.documentId);
}

function handleArrowLeft(ctx: ResolvedContext, deps: TreeKeyDownDeps): void {
  if (
    ctx.activeNode.children.length > 0 &&
    deps.expandedFolderIds.has(ctx.activeNode.documentId)
  ) {
    deps.toggleFolderExpanded(ctx.activeNode.documentId);
    return;
  }
  const parentId = deps.tree.parentById.get(ctx.activeNode.documentId);
  if (parentId) deps.setFocusedDocumentId(parentId);
}

function handleHome(deps: TreeKeyDownDeps): void {
  const first = deps.visibleNodes[0];
  if (first) deps.setFocusedDocumentId(first.node.documentId);
}

function handleEnd(deps: TreeKeyDownDeps): void {
  const last = deps.visibleNodes[deps.visibleNodes.length - 1];
  if (last) deps.setFocusedDocumentId(last.node.documentId);
}

export function handleTreeKeyDown(
  event: React.KeyboardEvent<HTMLDivElement>,
  deps: TreeKeyDownDeps,
): void {
  if (deps.editing.mode === "rename") return;
  if (deps.visibleNodes.length === 0) return;

  const activeId =
    deps.focusedDocumentId ??
    deps.currentDocumentId ??
    deps.visibleNodes[0]?.node.documentId ??
    null;
  if (!activeId) return;

  const currentIndex = deps.visibleNodes.findIndex(
    (entry) => entry.node.documentId === activeId,
  );
  if (currentIndex < 0) return;

  const activeNode = deps.visibleNodes[currentIndex]?.node;
  if (!activeNode) return;

  const ctx: ResolvedContext = { currentIndex, activeNode };

  const keyActions: Record<string, () => void> = {
    ArrowDown: () => handleArrowDown(ctx, deps),
    ArrowUp: () => handleArrowUp(ctx, deps),
    ArrowRight: () => handleArrowRight(ctx, deps),
    ArrowLeft: () => handleArrowLeft(ctx, deps),
    Enter: () => void deps.onSelect(activeNode.documentId),
    " ": () => void deps.onSelect(activeNode.documentId),
    Home: () => handleHome(deps),
    End: () => handleEnd(deps),
    F2: () =>
      deps.setEditing({
        mode: "rename",
        documentId: activeNode.documentId,
        title: activeNode.title,
      }),
    Delete: () => void deps.onDelete(activeNode.documentId),
  };

  const action = keyActions[event.key];
  if (action) {
    event.preventDefault();
    action();
  }
}

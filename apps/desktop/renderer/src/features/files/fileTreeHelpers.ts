import type {
  DocumentListItem,
  DocumentType,
  TreeNode,
  TreeSnapshot,
  VisibleTreeNode,
} from "./fileTreeTypes";

/**
 * Resolve display icon by document type.
 */
export function iconForType(type: DocumentType): string {
  switch (type) {
    case "chapter":
      return "📄";
    case "note":
      return "📝";
    case "setting":
      return "📘";
    case "timeline":
      return "🕒";
    case "character":
      return "👤";
    default:
      return "📄";
  }
}

/**
 * Resolve untitled title i18n key by document type.
 */
export function defaultTitleI18nKey(type: DocumentType): string {
  switch (type) {
    case "chapter":
      return "files.tree.untitledChapter";
    case "note":
      return "files.tree.untitledNote";
    case "setting":
      return "files.tree.untitledSetting";
    case "timeline":
      return "files.tree.untitledTimeline";
    case "character":
      return "files.tree.untitledCharacter";
    default:
      return "files.tree.untitled";
  }
}

/**
 * Sort documents by persisted order first, then recency, then id.
 */
export function compareDocumentOrder(
  a: DocumentListItem,
  b: DocumentListItem,
): number {
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }
  if (a.updatedAt !== b.updatedAt) {
    return b.updatedAt - a.updatedAt;
  }
  return a.documentId.localeCompare(b.documentId);
}

/**
 * Build a tree snapshot from flat document records.
 */
export function buildTreeSnapshot(items: DocumentListItem[]): TreeSnapshot {
  const sorted = [...items].sort(compareDocumentOrder);
  const nodeById = new Map<string, TreeNode>();
  const parentById = new Map<string, string | null>();

  for (const item of sorted) {
    nodeById.set(item.documentId, { ...item, children: [] });
  }

  const roots: TreeNode[] = [];

  for (const item of sorted) {
    const node = nodeById.get(item.documentId);
    if (!node) {
      continue;
    }

    const parentId = item.parentId ?? null;
    const parentNode = parentId ? nodeById.get(parentId) : undefined;
    if (!parentNode || parentNode.documentId === node.documentId) {
      parentById.set(node.documentId, null);
      roots.push(node);
      continue;
    }

    parentById.set(node.documentId, parentNode.documentId);
    parentNode.children.push(node);
  }

  function sortNodeChildren(nodes: TreeNode[]): void {
    nodes.sort(compareDocumentOrder);
    for (const node of nodes) {
      sortNodeChildren(node.children);
    }
  }

  sortNodeChildren(roots);

  return { roots, nodeById, parentById };
}

/**
 * Determine whether a row can act as a folder-like drop target.
 */
export function isFolderCandidate(
  node: Pick<TreeNode, "title" | "children">,
): boolean {
  if (node.children.length > 0) {
    return true;
  }
  return /卷|folder/i.test(node.title);
}

/**
 * Flatten tree by expansion state into a visible row list.
 */
export function flattenTree(
  roots: TreeNode[],
  expandedFolderIds: ReadonlySet<string>,
  parentById: ReadonlyMap<string, string | null>,
): VisibleTreeNode[] {
  const visible: VisibleTreeNode[] = [];

  function visit(nodes: TreeNode[], depth: number): void {
    for (const node of nodes) {
      visible.push({
        node,
        depth,
        parentId: parentById.get(node.documentId) ?? null,
      });
      if (node.children.length > 0 && expandedFolderIds.has(node.documentId)) {
        visit(node.children, depth + 1);
      }
    }
  }

  visit(roots, 0);
  return visible;
}

/**
 * Collect descendant ids for a node (cycle prevention for moves).
 */
export function collectDescendantIds(node: TreeNode): Set<string> {
  const ids = new Set<string>();
  const queue = [...node.children];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    ids.add(current.documentId);
    queue.push(...current.children);
  }
  return ids;
}

/**
 * Build reordered ids for sibling reorder while preserving global order.
 */
export function buildReorderedDocumentIds(args: {
  items: DocumentListItem[];
  sourceDocumentId: string;
  targetDocumentId: string;
  targetParentId: string | null;
}): string[] | null {
  const orderedGlobalIds = [...args.items]
    .sort(compareDocumentOrder)
    .map((item) => item.documentId);

  const siblingIds = [...args.items]
    .filter((item) => (item.parentId ?? null) === args.targetParentId)
    .sort(compareDocumentOrder)
    .map((item) => item.documentId);

  if (
    !siblingIds.includes(args.sourceDocumentId) ||
    !siblingIds.includes(args.targetDocumentId)
  ) {
    return null;
  }

  const nextSiblingIds = siblingIds.filter(
    (id) => id !== args.sourceDocumentId,
  );
  const targetIndex = nextSiblingIds.indexOf(args.targetDocumentId);
  nextSiblingIds.splice(targetIndex, 0, args.sourceDocumentId);

  const siblingSet = new Set(siblingIds);
  const remainingIds = orderedGlobalIds.filter((id) => !siblingSet.has(id));
  const insertAt = orderedGlobalIds.findIndex((id) => siblingSet.has(id));
  const safeInsertAt = insertAt >= 0 ? insertAt : remainingIds.length;

  return [
    ...remainingIds.slice(0, safeInsertAt),
    ...nextSiblingIds,
    ...remainingIds.slice(safeInsertAt),
  ];
}

export interface DropOnDocumentDeps {
  draggingDocumentId: string | null;
  dropTarget: { documentId: string; mode: "before" | "into" } | null;
  tree: TreeSnapshot;
  items: DocumentListItem[];
  reorder: (args: {
    projectId: string;
    orderedDocumentIds: string[];
  }) => Promise<unknown>;
  projectId: string;
  onMoveDocumentToFolder: (args: {
    documentId: string;
    parentId: string;
  }) => Promise<void>;
}

export async function performDropOnDocument(
  targetDocumentId: string,
  deps: DropOnDocumentDeps,
): Promise<void> {
  const {
    draggingDocumentId,
    dropTarget,
    tree,
    items,
    reorder,
    projectId,
    onMoveDocumentToFolder,
  } = deps;
  if (!draggingDocumentId || draggingDocumentId === targetDocumentId) {
    return;
  }

  const targetMode =
    dropTarget && dropTarget.documentId === targetDocumentId
      ? dropTarget.mode
      : "before";

  if (targetMode === "into") {
    await onMoveDocumentToFolder({
      documentId: draggingDocumentId,
      parentId: targetDocumentId,
    });
    return;
  }

  const targetParentId = tree.parentById.get(targetDocumentId) ?? null;
  const reorderedIds = buildReorderedDocumentIds({
    items,
    sourceDocumentId: draggingDocumentId,
    targetDocumentId,
    targetParentId,
  });

  if (!reorderedIds) {
    return;
  }

  await reorder({
    projectId: projectId,
    orderedDocumentIds: reorderedIds,
  });
}

import React from "react";
import { useTranslation } from "react-i18next";

import {
  Button,
  ContextMenu,
  Input,
  ListItem,
  Popover,
  PopoverClose,
  Text,
  type ContextMenuItem,
} from "../../components/primitives";
import { PanelContainer } from "../../components/composites/PanelContainer";
import { EmptyState } from "../../components/composites/EmptyState";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useEditorStore } from "../../stores/editorStore";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import {
  useFileStore,
  type DocumentListItem,
  type DocumentType,
} from "../../stores/fileStore";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";

type EditingState =
  | { mode: "idle" }
  | { mode: "rename"; documentId: string; title: string };

type DropMode = "before" | "into";

type DropTargetState = {
  documentId: string;
  mode: DropMode;
};

type TreeNode = DocumentListItem & {
  children: TreeNode[];
};

type TreeSnapshot = {
  roots: TreeNode[];
  nodeById: Map<string, TreeNode>;
  parentById: Map<string, string | null>;
};

type VisibleTreeNode = {
  node: TreeNode;
  depth: number;
  parentId: string | null;
};

export interface FileTreePanelProps {
  projectId: string;
  onOpenVersionHistory?: (documentId: string) => void;
  /**
   * 首次渲染时自动进入某个文档的 Rename 模式。
   *
   * Why: 仅用于 Storybook/QA 快速复现并验证 Rename 溢出问题，避免依赖复杂交互路径。
   */
  initialRenameDocumentId?: string;
}

/**
 * Resolve display icon by document type.
 *
 * Why: file tree must expose type differences visually for quick scanning.
 */
function iconForType(type: DocumentType): string {
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
 *
 * Why: new document enters rename mode and needs deterministic initial text.
 */
function defaultTitleI18nKey(type: DocumentType): string {
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
 *
 * Why: drag and keyboard navigation rely on deterministic row order.
 */
function compareDocumentOrder(
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
 *
 * Why: file-tree interactions (hierarchy, keyboard traversal, move) need parent/child lookup.
 */
function buildTreeSnapshot(items: DocumentListItem[]): TreeSnapshot {
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
 *
 * Why: current schema has no dedicated folder type; grouping is parentId-based.
 */
function isFolderCandidate(
  node: Pick<TreeNode, "title" | "children">,
): boolean {
  if (node.children.length > 0) {
    return true;
  }
  return /卷|folder/i.test(node.title);
}

/**
 * Flatten tree by expansion state into a visible row list.
 *
 * Why: Arrow navigation and drag targets operate on visible rows only.
 */
function flattenTree(
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
 * Collect descendant ids for a node.
 *
 * Why: move-to-folder must block cycles (parent cannot be moved into its own child).
 */
function collectDescendantIds(node: TreeNode): Set<string> {
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
 * Build reordered ids for sibling reorder and preserve global order of non-siblings.
 *
 * Why: IPC reorder expects an explicit id sequence; tree reorder should only mutate one sibling group.
 */
function buildReorderedDocumentIds(args: {
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

/**
 * FileTreePanel renders the project-scoped documents tree and actions.
 *
 * Why: P1 requires sortable tree hierarchy with keyboard/context interactions.
 */

interface TreeKeyDownDeps {
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

function handleTreeKeyDown(
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

function buildNodeContextMenuItems(
  item: TreeNode,
  moveTargetFolderId: string | null,
  deps: {
    t: ReturnType<typeof useTranslation>["t"];
    setEditing: (state: EditingState) => void;
    onCopy: (item: TreeNode) => Promise<void>;
    onDelete: (documentId: string) => Promise<void>;
    onToggleStatus: (args: {
      documentId: string;
      next: "draft" | "final";
    }) => Promise<void>;
    onMoveDocumentToFolder: (args: {
      documentId: string;
      parentId: string;
    }) => Promise<void>;
    onOpenVersionHistory?: (documentId: string) => void;
  },
): ContextMenuItem[] {
  const moveToFolderDisabled = !moveTargetFolderId;
  return [
    {
      key: "rename",
      label: deps.t("files.tree.rename"),
      onSelect: () => {
        deps.setEditing({
          mode: "rename",
          documentId: item.documentId,
          title: item.title,
        });
      },
    },
    {
      key: "copy",
      label: deps.t("files.tree.copy"),
      onSelect: () => void deps.onCopy(item),
    },
    {
      key: "move",
      label: deps.t("files.tree.moveToFolder"),
      disabled: moveToFolderDisabled,
      onSelect: () => {
        if (!moveTargetFolderId) {
          return;
        }
        void deps.onMoveDocumentToFolder({
          documentId: item.documentId,
          parentId: moveTargetFolderId,
        });
      },
    },
    {
      key: "delete",
      label: deps.t("files.tree.delete"),
      onSelect: () => void deps.onDelete(item.documentId),
      destructive: true,
    },
    {
      key: "version-history",
      label: deps.t("files.tree.versionHistory"),
      onSelect: () => {
        deps.onOpenVersionHistory?.(item.documentId);
      },
    },
    {
      key: "status",
      label:
        item.status === "final"
          ? deps.t("files.tree.markAsDraft")
          : deps.t("files.tree.markAsFinal"),
      onSelect: () =>
        void deps.onToggleStatus({
          documentId: item.documentId,
          next: item.status === "final" ? "draft" : "final",
        }),
    },
  ];
}

const FileTreeRenameRow = React.forwardRef<
  HTMLInputElement,
  {
    item: TreeNode;
    entry: VisibleTreeNode;
    editing: { mode: "rename"; documentId: string; title: string };
    dropBefore: boolean;
    setEditing: (state: EditingState) => void;
    onCommitRename: () => Promise<void>;
  }
>(function FileTreeRenameRow(props, ref) {
  const { t } = useTranslation();
  const { item, entry, editing, dropBefore, setEditing } = props;
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
        />
      ) : null}
      <div
        data-testid={`file-row-${item.documentId}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-focus)] bg-[var(--color-bg-selected)] overflow-hidden"
      >
        <Input
          ref={ref}
          data-testid={`file-rename-input-${item.documentId}`}
          value={editing.title}
          onChange={(e) =>
            setEditing({
              mode: "rename",
              documentId: item.documentId,
              title: e.target.value,
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing({ mode: "idle" });
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              void props.onCommitRename();
            }
          }}
          onBlur={() => void props.onCommitRename()}
          className="h-6 text-xs flex-1 min-w-0 max-w-full"
        />
        <div className="flex gap-1 shrink-0">
          <Button
            data-testid={`file-rename-confirm-${item.documentId}`}
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void props.onCommitRename();
            }}
          >
            {t("files.tree.ok")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditing({ mode: "idle" });
            }}
          >
            {t("files.tree.closeSymbol")}
          </Button>
        </div>
      </div>
    </div>
  );
});

interface DropOnDocumentDeps {
  draggingDocumentId: string | null;
  dropTarget: DropTargetState | null;
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

async function performDropOnDocument(
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

// eslint-disable-next-line max-lines-per-function
function useFileTreeState(
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
        if (expandableIds.has(id)) {
          next.add(id);
        }
      }
      for (const id of expandableIds) {
        next.add(id);
      }
      if (next.size === prev.size) {
        let unchanged = true;
        for (const id of next) {
          if (!prev.has(id)) {
            unchanged = false;
            break;
          }
        }
        if (unchanged) {
          return prev;
        }
      }
      return next;
    });
  }, [tree.nodeById]);

  React.useEffect(() => {
    if (!initialRenameDocumentId) {
      return;
    }
    if (initialRenameAppliedRef.current) {
      return;
    }
    if (editing.mode !== "idle") {
      return;
    }

    const doc = items.find(
      (item) => item.documentId === initialRenameDocumentId,
    );
    if (!doc) {
      return;
    }

    initialRenameAppliedRef.current = true;
    setEditing({
      mode: "rename",
      documentId: doc.documentId,
      title: doc.title,
    });
  }, [editing.mode, items, initialRenameDocumentId]);

  React.useEffect(() => {
    if (editing.mode !== "rename") {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing.mode]);

  React.useEffect(() => {
    if (visibleNodes.length === 0) {
      setFocusedDocumentId(null);
      return;
    }

    const visibleIdSet = new Set(
      visibleNodes.map((entry) => entry.node.documentId),
    );

    setFocusedDocumentId((prev) => {
      if (prev && visibleIdSet.has(prev)) {
        return prev;
      }
      if (currentDocumentId && visibleIdSet.has(currentDocumentId)) {
        return currentDocumentId;
      }
      return visibleNodes[0]?.node.documentId ?? null;
    });
  }, [currentDocumentId, visibleNodes]);

  function toggleFolderExpanded(documentId: string): void {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }

  function resolveMoveTargetFolder(documentId: string): string | null {
    const sourceNode = tree.nodeById.get(documentId);
    const descendants = sourceNode
      ? collectDescendantIds(sourceNode)
      : new Set();

    const candidates = [...tree.nodeById.values()]
      .filter((node) => node.documentId !== documentId)
      .filter((node) => !descendants.has(node.documentId))
      .filter((node) => isFolderCandidate(node))
      .sort(compareDocumentOrder);

    return candidates[0]?.documentId ?? null;
  }

  async function onCreate(type: DocumentType = "chapter"): Promise<void> {
    const res = await createAndSetCurrent({
      projectId: projectId,
      type,
    });
    if (!res.ok) {
      return;
    }

    await openDocument({
      projectId: projectId,
      documentId: res.data.documentId,
    });

    setFocusedDocumentId(res.data.documentId);
    setEditing({
      mode: "rename",
      documentId: res.data.documentId,
      title: t(defaultTitleI18nKey(type)),
    });
  }

  async function onCopy(item: DocumentListItem): Promise<void> {
    const res = await createAndSetCurrent({
      projectId: projectId,
      type: item.type,
      title: t("files.tree.copySuffix", { title: item.title }),
    });
    if (!res.ok) {
      return;
    }

    await openDocument({
      projectId: projectId,
      documentId: res.data.documentId,
    });
    setFocusedDocumentId(res.data.documentId);
  }

  async function onSelect(documentId: string): Promise<void> {
    setFocusedDocumentId(documentId);

    const setPromise = setCurrent({
      projectId: projectId,
      documentId,
    });

    await openDocument({
      projectId: projectId,
      documentId,
    });

    await setPromise;
  }

  async function onCommitRename(): Promise<void> {
    if (editing.mode !== "rename") {
      return;
    }

    const res = await rename({
      projectId: projectId,
      documentId: editing.documentId,
      title: editing.title,
    });
    if (!res.ok) {
      return;
    }

    setEditing({ mode: "idle" });
  }

  async function onDelete(documentId: string): Promise<void> {
    const confirmed = await confirm({
      title: t("files.tree.deleteTitle"),
      description: t("files.tree.deleteDescription"),
      primaryLabel: t("files.tree.deleteConfirm"),
      secondaryLabel: t("files.tree.deleteCancel"),
    });
    if (!confirmed) {
      return;
    }

    const res = await deleteDocument({
      projectId: projectId,
      documentId,
    });
    if (!res.ok) {
      return;
    }

    await openCurrentForProject(projectId);
  }

  async function onToggleStatus(args: {
    documentId: string;
    next: "draft" | "final";
  }): Promise<void> {
    const res = await updateStatus({
      projectId: projectId,
      documentId: args.documentId,
      status: args.next,
    });
    if (!res.ok) {
      return;
    }

    if (currentDocumentId === args.documentId) {
      await openDocument({
        projectId: projectId,
        documentId: args.documentId,
      });
    }
  }

  async function onMoveDocumentToFolder(args: {
    documentId: string;
    parentId: string;
  }): Promise<void> {
    const sourceNode = tree.nodeById.get(args.documentId);
    if (!sourceNode) {
      return;
    }

    if (args.documentId === args.parentId) {
      return;
    }

    const descendants = collectDescendantIds(sourceNode);
    if (descendants.has(args.parentId)) {
      return;
    }

    const res = await moveToFolder({
      projectId: projectId,
      documentId: args.documentId,
      parentId: args.parentId,
    });
    if (!res.ok) {
      return;
    }

    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      next.add(args.parentId);
      return next;
    });
  }

  async function onDropOnDocument(targetDocumentId: string): Promise<void> {
    await performDropOnDocument(targetDocumentId, {
      draggingDocumentId,
      dropTarget,
      tree,
      items,
      reorder,
      projectId,
      onMoveDocumentToFolder,
    });
  }

  function onTreeKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    handleTreeKeyDown(event, {
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
    });
  }

  return {
    items,
    currentDocumentId,
    bootstrapStatus,
    lastError,
    clearError,
    editing,
    setEditing,
    expandedFolderIds,
    focusedDocumentId,
    setFocusedDocumentId,
    draggingDocumentId,
    setDraggingDocumentId,
    dropTarget,
    setDropTarget,
    inputRef,
    tree,
    visibleNodes,
    dialogProps,
    toggleFolderExpanded,
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

const FileTreeNodeRow = React.forwardRef<
  HTMLInputElement,
  {
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
>(function FileTreeNodeRow(props, ref) {
  const { t } = useTranslation();
  const { entry, editing, setEditing } = props;
  const item = entry.node;
  const hasChildren = item.children.length > 0;
  const selected =
    item.documentId === (props.focusedDocumentId ?? props.currentDocumentId);
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
  const moveToFolderDisabled = !moveTargetFolderId;

  const contextMenuItems = buildNodeContextMenuItems(item, moveTargetFolderId, {
    t: t,
    setEditing,
    onCopy: props.onCopy,
    onDelete: props.onDelete,
    onToggleStatus: props.onToggleStatus,
    onMoveDocumentToFolder: props.onMoveDocumentToFolder,
    onOpenVersionHistory: props.onOpenVersionHistory,
  });

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
        />
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
          className={`border ${selected ? "border-[var(--color-border-focus)]" : "border-transparent"} group ${dropInto ? "bg-[var(--color-bg-hover)]" : ""} ${isDragging ? "opacity-50" : ""}`}
        >
          {hasChildren ? (
            <button
              type="button"
              data-testid={`file-folder-toggle-${item.documentId}`}
              onClick={(e) => {
                e.stopPropagation();
                props.toggleFolderExpanded(item.documentId);
              }}
              className="shrink-0 w-4 text-[10px] text-[var(--color-fg-muted)]"
              aria-label={
                props.expandedFolderIds.has(item.documentId)
                  ? t("files.tree.collapse")
                  : t("files.tree.expand")
              }
            >
              {props.expandedFolderIds.has(item.documentId) ? "▾" : "▸"}
            </button>
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
                  disabled={moveToFolderDisabled}
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
});

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
        tabIndex={0}
        onKeyDown={state.onTreeKeyDown}
        className="flex-1 overflow-auto min-h-0 focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-ring-focus)]"
      >
        {state.bootstrapStatus !== "ready" ? (
          <Text size="small" color="muted" className="p-3 block">
            {t("files.tree.loading")}
          </Text>
        ) : state.items.length === 0 ? (
          <EmptyState
            title={t("files.tree.emptyTitle")}
            description={t("files.tree.emptyDescription")}
            action={
              <Button
                data-testid="file-create-empty"
                variant="secondary"
                size="sm"
                onClick={() => void state.onCreate("chapter")}
              >
                {t("files.tree.newFile")}
              </Button>
            }
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

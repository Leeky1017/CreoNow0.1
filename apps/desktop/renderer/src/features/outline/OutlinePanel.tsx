import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { SearchInput } from "../../components/composites/SearchInput";

import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Dot,
  File,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

/**
 * Outline heading levels
 */
export type OutlineLevel = "h1" | "h2" | "h3";

/**
 * Drag drop position
 */
export type DropPosition = "before" | "after" | "into";

/**
 * Outline item data structure
 */
export interface OutlineItem {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Heading level (h1, h2, h3) */
  level: OutlineLevel;
  /** Child items (for hierarchical structure) */
  children?: OutlineItem[];
}

/**
 * OutlinePanel props
 */
export interface OutlinePanelProps {
  /** List of outline items */
  items: OutlineItem[];
  /** Currently active item ID */
  activeId?: string | null;
  /** Word counts per item (itemId -> count) */
  wordCounts?: Record<string, number>;
  /** Enable scroll sync with editor */
  scrollSyncEnabled?: boolean;
  /** Callback when an item is clicked */
  onNavigate?: (itemId: string) => void;
  /** Callback when an item is deleted */
  onDelete?: (itemIds: string[]) => void;
  /** Callback when an item is renamed */
  onRename?: (itemId: string, newTitle: string) => void;
  /** Callback when items are reordered via drag-and-drop */
  onReorder?: (
    draggedId: string,
    targetId: string,
    position: DropPosition,
  ) => void;
  /** Callback when editor scrolls to sync active item */
  onScrollSync?: (itemId: string) => void;
  /** Whether drag-and-drop is enabled */
  draggable?: boolean;
}

// ============================================================================
// Icons
// ============================================================================

function ChevronRightIcon() {
  return <ChevronRight size={16} strokeWidth={1.5} />;
}

function ChevronDownIcon() {
  return <ChevronDown size={16} strokeWidth={1.5} />;
}

function DocumentIcon() {
  return (
    <FileText
      className="w-3.5 h-3.5 mr-2 opacity-70 shrink-0"
      size={16}
      strokeWidth={1.5}
    />
  );
}

function DotIcon({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <Dot
      className="w-3.5 h-3.5 mr-2 shrink-0"
      style={{ opacity }}
      size={16}
      strokeWidth={1.5}
    />
  );
}

function EditIcon() {
  return <Pencil size={16} strokeWidth={1.5} />;
}

function DeleteIcon() {
  return <Trash2 size={16} strokeWidth={1.5} />;
}

function ExpandAllIcon() {
  return <ChevronsDownUp size={16} strokeWidth={1.5} className="rotate-180" />;
}

function CollapseAllIcon() {
  return <ChevronsUpDown size={16} strokeWidth={1.5} className="rotate-180" />;
}

function EmptyDocumentIcon() {
  return (
    <File
      className="w-6 h-6 text-[var(--color-fg-placeholder)] mb-2"
      size={24}
      strokeWidth={1.5}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const levelStyles: Record<
  OutlineLevel,
  { paddingLeft: number; fontSize: string; fontWeight: string; color: string }
> = {
  h1: {
    paddingLeft: 16,
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--color-fg-default)",
  },
  h2: {
    paddingLeft: 32,
    fontSize: "13px",
    fontWeight: "400",
    color: "var(--color-fg-default)",
  },
  h3: {
    paddingLeft: 48,
    fontSize: "12px",
    fontWeight: "400",
    color: "var(--color-fg-muted)",
  },
};

const levelOrder = { h1: 1, h2: 2, h3: 3 };

// ============================================================================
// Utilities
// ============================================================================

/**
 * Flatten nested outline structure
 */
function flattenOutline(items: OutlineItem[]): OutlineItem[] {
  const result: OutlineItem[] = [];
  const flatten = (itemList: OutlineItem[]) => {
    for (const item of itemList) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        flatten(item.children);
      }
    }
  };
  flatten(items);
  return result;
}

/**
 * Check if an item has children
 */
function hasChildren(item: OutlineItem, allItems: OutlineItem[]): boolean {
  const itemIndex = allItems.findIndex((i) => i.id === item.id);
  if (itemIndex === -1 || itemIndex >= allItems.length - 1) return false;
  const nextItem = allItems[itemIndex + 1];
  return levelOrder[nextItem.level] > levelOrder[item.level];
}

/**
 * Format word count for display
 */
function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

// ============================================================================
// Sub-components
// ============================================================================

/* SearchInput: replaced by composites/SearchInput */

/**
 * Drag indicator line shown during drag operations
 */
function DragIndicator({ position }: { position: DropPosition | null }) {
  if (!position) return null;

  const topOffset =
    position === "before"
      ? "-1px"
      : position === "after"
        ? "calc(100% - 1px)"
        : "50%";
  const isInto = position === "into";

  return (
    <div
      className="absolute left-4 right-4 z-[var(--z-overlay)] pointer-events-none"
      style={{ top: topOffset }}
    >
      {isInto ? (
        <div className="h-full absolute inset-0 border-2 border-dashed border-[var(--color-info)] rounded-md" />
      ) : (
        <>
          <div className="h-0.5 bg-[var(--color-info)]" />
          <div className="absolute -left-1 -top-[3px] w-1.5 h-1.5 rounded-full bg-[var(--color-info)]" />
        </>
      )}
    </div>
  );
}

/**
 * Active indicator (left white line for current item)
 */
function ActiveIndicator() {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-accent)]" />
  );
}

/**
 * Collapse toggle button
 */
function CollapseToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    // eslint-disable-next-line creonow/no-native-html-element -- specialized button
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="w-4 h-4 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors shrink-0 mr-0.5"
      aria-label={isCollapsed ? t("outline.expand") : t("outline.collapse")}
    >
      {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
    </button>
  );
}

/**
 * Hover action buttons (Edit/Delete)
 */
function HoverActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="ml-auto flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)] shrink-0">
      <Tooltip content={t("outline.editShortcut")}>
        {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
          aria-label={t("outline.edit")}
        >
          <EditIcon />
        </button>
      </Tooltip>
      <Tooltip content={t("outline.deleteShortcut")}>
        {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
          aria-label={t("outline.delete")}
        >
          <DeleteIcon />
        </button>
      </Tooltip>
    </div>
  );
}

/**
 * Word count badge
 */
function WordCountBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto text-[10px] text-[var(--color-fg-placeholder)] font-mono tabular-nums shrink-0 mr-1">
      {formatWordCount(count)}
    </span>
  );
}

/**
 * Single outline item component
 */
function OutlineItemRow({
  item,
  isActive,
  isSelected,
  isDragging,
  dropPosition,
  isEditing,
  editValue,
  wordCount,
  hasChildItems,
  isCollapsed,
  onNavigate,
  onDelete,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onToggleCollapse,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggable,
}: {
  item: OutlineItem;
  isActive: boolean;
  isSelected: boolean;
  isDragging: boolean;
  dropPosition: DropPosition | null;
  isEditing: boolean;
  editValue: string;
  wordCount?: number;
  hasChildItems: boolean;
  isCollapsed: boolean;
  onNavigate: () => void;
  onDelete: () => void;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  onToggleCollapse: () => void;
  onToggleSelect: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  draggable: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const style = levelStyles[item.level];

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const bgStyle = isActive
    ? "bg-[var(--color-bg-raised)]"
    : isSelected
      ? "bg-[var(--color-bg-selected)]"
      : isDragging
        ? "opacity-40"
        : "hover:bg-[var(--color-bg-hover)]";

  const Icon = item.level === "h1" ? DocumentIcon : DotIcon;
  const iconOpacity =
    item.level === "h1" ? undefined : item.level === "h2" ? 0.5 : 0.4;

  return (
    <div className="relative" data-outline-item-id={item.id}>
      {dropPosition && <DragIndicator position={dropPosition} />}
      <div
        ref={rowRef}
        className={`h-7 flex items-center pr-3 cursor-pointer relative transition-colors duration-[var(--duration-fast)] font-normal group ${bgStyle}`}
        style={{
          paddingLeft: style.paddingLeft,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
        }}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            onToggleSelect(e);
          } else {
            onNavigate();
          }
        }}
        onDoubleClick={onEditStart}
        draggable={draggable && !isEditing}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-testid={`outline-item-${item.id}`}
        role="treeitem"
        aria-selected={isActive}
        aria-expanded={hasChildItems ? !isCollapsed : undefined}
        tabIndex={0}
      >
        {isActive && <ActiveIndicator />}

        {/* Selection checkbox indicator (shown when multi-select active) */}
        {isSelected && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-[var(--color-accent)]" />
        )}

        {/* Collapse toggle */}
        {hasChildItems && (
          <CollapseToggle
            isCollapsed={isCollapsed}
            onToggle={onToggleCollapse}
          />
        )}

        <Icon opacity={iconOpacity} />

        {isEditing ? (
          // eslint-disable-next-line creonow/no-native-html-element -- specialized input
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEditCommit();
              }
              if (e.key === "Escape") {
                onEditCancel();
              }
            }}
            onBlur={onEditCommit}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--color-fg-default)] text-inherit font-inherit"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate flex-1 min-w-0">{item.title}</span>
        )}

        {/* Word count */}
        {wordCount !== undefined && !isEditing && !isDragging && (
          <WordCountBadge count={wordCount} />
        )}

        {isDragging && (
          <div className="ml-auto mr-2 text-xs text-[var(--color-info)] font-mono tracking-tighter shrink-0">
            {t("outline.dragging")}
          </div>
        )}

        {!isEditing && !isDragging && (
          <HoverActions onEdit={onEditStart} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)] mx-3 my-3"
      data-testid="outline-empty-state"
    >
      <EmptyDocumentIcon />
      <p className="text-[11px] text-[var(--color-fg-subtle)] leading-tight px-2">
        {t("outline.emptyTitle")}
        <br />
        {t("outline.emptyDescription")}
      </p>
    </div>
  );
}

/**
 * No results state for search
 */
function NoResultsState({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center mx-3">
      <p className="text-[11px] text-[var(--color-fg-subtle)] leading-tight">
        {t("outline.noResults", { query })}
      </p>
    </div>
  );
}
/**
 * Encapsulates drag-and-drop reorder state and handlers for outline items.
 */
function useDragReorder(onReorder: OutlinePanelProps["onReorder"]) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [dropPosition, setDropPosition] = React.useState<DropPosition | null>(
    null,
  );

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    setDropPosition(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    itemId: string,
    itemLevel: OutlineLevel,
  ) => {
    e.preventDefault();
    if (draggingId === itemId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const threshold = height / 4;

    let position: DropPosition;
    if (y < threshold) {
      position = "before";
    } else if (y > height - threshold) {
      position = "after";
    } else {
      // Only allow "into" for items that can have children (h1/h2)
      position = itemLevel !== "h3" ? "into" : "after";
    }

    setDragOverId(itemId);
    setDropPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== targetId && dropPosition) {
      onReorder?.(draggedId, targetId, dropPosition);
    }
    setDraggingId(null);
    setDragOverId(null);
    setDropPosition(null);
  };

  return {
    draggingId,
    dragOverId,
    dropPosition,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

/**
 * Handle keyboard navigation in outline panel.
 * Extracted to reduce OutlinePanel function length.
 */
function handleOutlineArrowNav(
  e: React.KeyboardEvent,
  ctx: {
    visibleItems: OutlineItem[];
    setFocusedIndex: (idx: number) => void;
    onNavigate: ((id: string) => void) | undefined;
    toggleSelect: (
      id: string,
      e: React.KeyboardEvent | React.MouseEvent,
    ) => void;
  },
  nextIdx: number,
): void {
  ctx.setFocusedIndex(nextIdx);
  const item = ctx.visibleItems[nextIdx];
  if (!e.shiftKey) {
    ctx.onNavigate?.(item.id);
  } else {
    ctx.toggleSelect(item.id, e);
  }
}

function handleOutlineKeyDown(
  e: React.KeyboardEvent,
  ctx: {
    focusedIndex: number;
    visibleItems: OutlineItem[];
    activeId: string | null | undefined;
    collapsed: Set<string>;
    flatItems: OutlineItem[];
    selectedIds: Set<string>;
    setFocusedIndex: (idx: number) => void;
    onNavigate: ((id: string) => void) | undefined;
    toggleSelect: (
      id: string,
      e: React.KeyboardEvent | React.MouseEvent,
    ) => void;
    toggleCollapse: (id: string) => void;
    startEditing: (item: OutlineItem) => void;
    handleDelete: (id: string) => void;
    clearSelection: () => void;
  },
): void {
  const currentIdx =
    ctx.focusedIndex >= 0
      ? ctx.focusedIndex
      : ctx.visibleItems.findIndex((i) => i.id === ctx.activeId);

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (currentIdx < ctx.visibleItems.length - 1) {
        handleOutlineArrowNav(e, ctx, currentIdx + 1);
      }
      break;

    case "ArrowUp":
      e.preventDefault();
      if (currentIdx > 0) {
        handleOutlineArrowNav(e, ctx, currentIdx - 1);
      }
      break;

    case "ArrowRight":
      e.preventDefault();
      if (currentIdx >= 0) {
        const item = ctx.visibleItems[currentIdx];
        if (ctx.collapsed.has(item.id)) {
          ctx.toggleCollapse(item.id);
        }
      }
      break;

    case "ArrowLeft":
      e.preventDefault();
      if (currentIdx >= 0) {
        const item = ctx.visibleItems[currentIdx];
        if (!ctx.collapsed.has(item.id) && hasChildren(item, ctx.flatItems)) {
          ctx.toggleCollapse(item.id);
        }
      }
      break;

    case "Enter":
      e.preventDefault();
      if (currentIdx >= 0) {
        ctx.onNavigate?.(ctx.visibleItems[currentIdx].id);
      }
      break;

    case "F2":
      e.preventDefault();
      if (currentIdx >= 0) {
        ctx.startEditing(ctx.visibleItems[currentIdx]);
      }
      break;

    case "Delete":
    case "Backspace":
      e.preventDefault();
      if (currentIdx >= 0) {
        ctx.handleDelete(ctx.visibleItems[currentIdx].id);
      }
      break;

    case "Escape":
      e.preventDefault();
      if (ctx.selectedIds.size > 0) {
        ctx.clearSelection();
      }
      break;

    case "a":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Select all handled by caller
      }
      break;
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * OutlinePanel - Sidebar panel for document outline navigation
 *
 * Features:
 * - Hierarchical outline display with H1/H2/H3 levels
 * - Single node expand/collapse (P0)
 * - Drag-and-drop reordering with before/after/into positions (P0)
 * - Editor scroll sync support (P0)
 * - Word count display per section (P1)
 * - Search/filter functionality (P1)
 * - Multi-select with Ctrl/Cmd+Click (P1)
 * - Full keyboard navigation (P1)
 *
 * Design ref: 13-sidebar-outline.html
 */
export function OutlinePanel({
  items,
  activeId,
  wordCounts,
  scrollSyncEnabled = false,
  onNavigate,
  onDelete,
  onRename,
  onReorder,
  onScrollSync,
  draggable = true,
}: OutlinePanelProps): JSX.Element {
  void onScrollSync;
  const { t } = useTranslation();
  const {
    draggingId,
    dragOverId,
    dropPosition,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragReorder(onReorder);
  // Flatten items for rendering
  const flatItems = React.useMemo(() => flattenOutline(items), [items]);

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Collapse state
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  // Selection state (for multi-select)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(
    null,
  );

  // Editing state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");

  // Focused item for keyboard navigation
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter items by search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return flatItems;
    const query = searchQuery.toLowerCase();
    return flatItems.filter((item) => item.title.toLowerCase().includes(query));
  }, [flatItems, searchQuery]);

  // Filter visible items (respect collapse state, but show all when searching)
  const visibleItems = React.useMemo(() => {
    if (searchQuery.trim()) return filteredItems;

    const visible: OutlineItem[] = [];
    let skipUntilLevel: OutlineLevel | null = null;

    for (const item of flatItems) {
      if (skipUntilLevel) {
        if (levelOrder[item.level] > levelOrder[skipUntilLevel]) {
          continue;
        }
        skipUntilLevel = null;
      }

      visible.push(item);

      if (collapsed.has(item.id)) {
        skipUntilLevel = item.level;
      }
    }

    return visible;
  }, [flatItems, filteredItems, collapsed, searchQuery]);

  // Expand/Collapse all
  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    const parentIds = new Set<string>();
    for (let i = 0; i < flatItems.length - 1; i++) {
      if (hasChildren(flatItems[i], flatItems)) {
        parentIds.add(flatItems[i].id);
      }
    }
    setCollapsed(parentIds);
  };

  // Toggle single item collapse
  const toggleCollapse = (itemId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Multi-select handlers
  const toggleSelect = (
    itemId: string,
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    const isCtrlOrCmd = "ctrlKey" in e ? e.ctrlKey || e.metaKey : false;
    const isShift = "shiftKey" in e ? e.shiftKey : false;

    if (isShift && lastSelectedId) {
      // Range selection
      const startIdx = visibleItems.findIndex((i) => i.id === lastSelectedId);
      const endIdx = visibleItems.findIndex((i) => i.id === itemId);
      if (startIdx !== -1 && endIdx !== -1) {
        const [from, to] =
          startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = visibleItems.slice(from, to + 1).map((i) => i.id);
        setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
      }
    } else if (isCtrlOrCmd) {
      // Toggle single selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return next;
      });
      setLastSelectedId(itemId);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  };

  // Edit handlers
  const startEditing = (item: OutlineItem) => {
    setEditingId(item.id);
    setEditValue(item.title);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename?.(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  // Delete handler (supports multi-select)
  const handleDelete = (itemId: string) => {
    if (selectedIds.size > 0 && selectedIds.has(itemId)) {
      onDelete?.([...selectedIds]);
      clearSelection();
    } else {
      onDelete?.([itemId]);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setSelectedIds(new Set(visibleItems.map((i) => i.id)));
      return;
    }
    handleOutlineKeyDown(e, {
      focusedIndex,
      visibleItems,
      activeId: activeId ?? null,
      collapsed,
      flatItems,
      selectedIds,
      setFocusedIndex,
      onNavigate,
      toggleSelect,
      toggleCollapse,
      startEditing,
      handleDelete,
      clearSelection,
    });
  };

  return (
    <aside
      ref={containerRef}
      className="flex flex-col h-full bg-[var(--color-bg-surface)]"
      data-testid="outline-panel"
      role="tree"
      aria-label={t("outline.ariaLabel")}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="h-12 border-b border-[var(--color-separator)] flex items-center justify-between px-4 shrink-0">
        <span className="text-[10px] font-medium tracking-wider text-[var(--color-fg-muted)] uppercase">
          {t("outline.title")}
        </span>
        <div className="flex gap-2">
          <Tooltip content={t("outline.expandAll")}>
            {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
            <button
              type="button"
              onClick={expandAll}
              className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-default)] transition-colors"
              aria-label={t("outline.expandAllAria")}
            >
              <ExpandAllIcon />
            </button>
          </Tooltip>
          <Tooltip content={t("outline.collapseAll")}>
            {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
            <button
              type="button"
              onClick={collapseAll}
              className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-default)] transition-colors"
              aria-label={t("outline.collapseAllAria")}
            >
              <CollapseAllIcon />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Search Input */}
      <div className="pt-2 px-3 pb-2">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          placeholder={t("outline.filterPlaceholder")}
          data-testid="outline-search-input"
        />
      </div>

      {/* Selection info bar */}
      {selectedIds.size > 0 && (
        <div className="px-3 py-1.5 bg-[var(--color-bg-selected)] border-b border-[var(--color-separator)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-fg-muted)]">
            {t("outline.selectedCount", { count: selectedIds.size })}
          </span>
          <div className="flex gap-2">
            {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
            <button
              type="button"
              onClick={() => onDelete?.([...selectedIds])}
              className="text-[10px] text-[var(--color-error)] hover:underline"
            >
              {t("outline.delete")}
            </button>
            {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
            <button
              type="button"
              onClick={clearSelection}
              className="text-[10px] text-[var(--color-fg-muted)] hover:underline"
            >
              {t("outline.clearSelection")}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea
        data-testid="outline-scroll"
        viewportTestId="outline-scroll-viewport"
        className="flex-1 min-h-0"
        viewportClassName="h-full w-full overflow-y-auto py-2"
      >
        {items.length === 0 ? (
          <EmptyState />
        ) : visibleItems.length === 0 && searchQuery ? (
          <NoResultsState query={searchQuery} />
        ) : (
          <div className="flex flex-col">
            {visibleItems.map((item) => (
              <OutlineItemRow
                key={item.id}
                item={item}
                isActive={activeId === item.id}
                isSelected={selectedIds.has(item.id)}
                isDragging={draggingId === item.id}
                dropPosition={dragOverId === item.id ? dropPosition : null}
                isEditing={editingId === item.id}
                editValue={editValue}
                wordCount={wordCounts?.[item.id]}
                hasChildItems={hasChildren(item, flatItems)}
                isCollapsed={collapsed.has(item.id)}
                onNavigate={() => {
                  clearSelection();
                  onNavigate?.(item.id);
                }}
                onDelete={() => handleDelete(item.id)}
                onEditStart={() => startEditing(item)}
                onEditChange={setEditValue}
                onEditCommit={commitEdit}
                onEditCancel={cancelEdit}
                onToggleCollapse={() => toggleCollapse(item.id)}
                onToggleSelect={(e) => toggleSelect(item.id, e)}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, item.id, item.level)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
                draggable={draggable}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Scroll sync indicator */}
      {scrollSyncEnabled && (
        <div className="px-3 py-1.5 border-t border-[var(--color-separator)] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          <span className="text-[10px] text-[var(--color-fg-muted)]">
            {t("outline.syncWithEditor")}
          </span>
        </div>
      )}
    </aside>
  );
}

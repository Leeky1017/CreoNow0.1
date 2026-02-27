import React from "react";
import { ScrollArea } from "../../components/primitives";

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
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 mr-2 opacity-70 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DotIcon({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <svg
      className="w-3.5 h-3.5 mr-2 shrink-0"
      style={{ opacity }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ExpandAllIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 14 10 20 16 14" />
      <polyline points="4 4 10 10 16 4" />
    </svg>
  );
}

function CollapseAllIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 20 10 14 16 20" />
      <polyline points="4 10 10 4 16 10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function EmptyDocumentIcon() {
  return (
    <svg
      className="w-6 h-6 text-[var(--color-fg-placeholder)] mb-2"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
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
    color: "#d4d4d4",
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

/**
 * Search input component
 */
function SearchInput({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative mx-3 mb-2">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]">
        <SearchIcon />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter outline..."
        className="w-full h-7 pl-7 pr-7 bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-xs text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none focus:border-[var(--color-border-focus)]"
        data-testid="outline-search-input"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
        >
          ×
        </button>
      )}
    </div>
  );
}

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
      className="absolute left-4 right-4 z-10 pointer-events-none"
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
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="w-4 h-4 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors shrink-0 mr-0.5"
      aria-label={isCollapsed ? "Expand" : "Collapse"}
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
  return (
    <div className="ml-auto flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)] shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
        title="Edit (F2)"
      >
        <EditIcon />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
        title="Delete (Del)"
      >
        <DeleteIcon />
      </button>
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
            DRAGGING
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
  return (
    <div
      className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[#0b0b0b] mx-3 my-3"
      data-testid="outline-empty-state"
    >
      <EmptyDocumentIcon />
      <p className="text-[11px] text-[var(--color-fg-subtle)] leading-tight px-2">
        No outline yet.
        <br />
        Headings appear here automatically.
      </p>
    </div>
  );
}

/**
 * No results state for search
 */
function NoResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center mx-3">
      <p className="text-[11px] text-[var(--color-fg-subtle)] leading-tight">
        No results for &ldquo;{query}&rdquo;
      </p>
    </div>
  );
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
interface OutlineDragHandlers {
  handleDragStart: (e: React.DragEvent, itemId: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, itemId: string, itemLevel: OutlineLevel) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, targetId: string) => void;
}

function useOutlineDrag(
  draggingId: string | null,
  dropPosition: DropPosition | null,
  onReorder: OutlinePanelProps["onReorder"],
  setDraggingId: React.Dispatch<React.SetStateAction<string | null>>,
  setDragOverId: React.Dispatch<React.SetStateAction<string | null>>,
  setDropPosition: React.Dispatch<React.SetStateAction<DropPosition | null>>,
): OutlineDragHandlers {
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
  const handleDragOver = (e: React.DragEvent, itemId: string, itemLevel: OutlineLevel) => {
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
  return { handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop };
}

interface OutlineKeyboardParams {
  focusedIndex: number;
  visibleItems: OutlineItem[];
  activeId: string | null | undefined;
  flatItems: OutlineItem[];
  collapsed: Set<string>;
  selectedIds: Set<string>;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  onNavigate: OutlinePanelProps["onNavigate"];
  toggleSelect: (id: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  toggleCollapse: (id: string) => void;
  startEditing: (item: OutlineItem) => void;
  handleDelete: (id: string) => void;
  clearSelection: () => void;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

function handleOutlineArrowNav(
  e: React.KeyboardEvent,
  key: string,
  currentIdx: number,
  p: OutlineKeyboardParams,
): void {
  if (key === "ArrowDown" || key === "ArrowUp") {
    const delta = key === "ArrowDown" ? 1 : -1;
    const nextIdx = currentIdx + delta;
    if (nextIdx >= 0 && nextIdx < p.visibleItems.length) {
      p.setFocusedIndex(nextIdx);
      const item = p.visibleItems[nextIdx];
      if (!e.shiftKey) { p.onNavigate?.(item.id); } else { p.toggleSelect(item.id, e); }
    }
    return;
  }
  const item = currentIdx >= 0 ? p.visibleItems[currentIdx] : null;
  if (!item) return;
  if (key === "ArrowRight" && p.collapsed.has(item.id)) {
    p.toggleCollapse(item.id);
  } else if (key === "ArrowLeft" && !p.collapsed.has(item.id) && hasChildren(item, p.flatItems)) {
    p.toggleCollapse(item.id);
  }
}

function useOutlineKeyboard(p: OutlineKeyboardParams): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    const currentIdx =
      p.focusedIndex >= 0
        ? p.focusedIndex
        : p.visibleItems.findIndex((i) => i.id === p.activeId);
    switch (e.key) {
      case "ArrowDown": case "ArrowUp": case "ArrowRight": case "ArrowLeft":
        e.preventDefault();
        handleOutlineArrowNav(e, e.key, currentIdx, p);
        break;
      case "Enter":
        e.preventDefault();
        if (currentIdx >= 0) { p.onNavigate?.(p.visibleItems[currentIdx].id); }
        break;
      case "F2":
        e.preventDefault();
        if (currentIdx >= 0) { p.startEditing(p.visibleItems[currentIdx]); }
        break;
      case "Delete": case "Backspace":
        e.preventDefault();
        if (currentIdx >= 0) { p.handleDelete(p.visibleItems[currentIdx].id); }
        break;
      case "Escape":
        e.preventDefault();
        if (p.selectedIds.size > 0) { p.clearSelection(); }
        break;
      case "a":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          p.setSelectedIds(new Set(p.visibleItems.map((i) => i.id)));
        }
        break;
    }
  };
}

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

  // Drag state
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [dropPosition, setDropPosition] = React.useState<DropPosition | null>(
    null,
  );

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

  // Drag handlers
  // Drag handlers
  const { handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop } =
    useOutlineDrag(draggingId, dropPosition, onReorder, setDraggingId, setDragOverId, setDropPosition);

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
  const handleKeyDown = useOutlineKeyboard({
    focusedIndex, visibleItems, activeId, flatItems, collapsed, selectedIds,
    setFocusedIndex, onNavigate, toggleSelect, toggleCollapse,
    startEditing, handleDelete, clearSelection, setSelectedIds,
  });

  return (
    <aside
      ref={containerRef}
      className="flex flex-col h-full bg-[var(--color-bg-surface)]"
      data-testid="outline-panel"
      role="tree"
      aria-label="Document outline"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="h-12 border-b border-[var(--color-separator)] flex items-center justify-between px-4 shrink-0">
        <span className="text-[10px] font-medium tracking-wider text-[var(--color-fg-muted)] uppercase">
          Outline
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-default)] transition-colors"
            title="Expand All"
            aria-label="Expand all outline items"
          >
            <ExpandAllIcon />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-default)] transition-colors"
            title="Collapse All"
            aria-label="Collapse all outline items"
          >
            <CollapseAllIcon />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="pt-2">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
      </div>

      {/* Selection info bar */}
      {selectedIds.size > 0 && (
        <div className="px-3 py-1.5 bg-[var(--color-bg-selected)] border-b border-[var(--color-separator)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-fg-muted)]">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDelete?.([...selectedIds])}
              className="text-[10px] text-[var(--color-error)] hover:underline"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[10px] text-[var(--color-fg-muted)] hover:underline"
            >
              Clear
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
            Sync with editor
          </span>
        </div>
      )}
    </aside>
  );
}

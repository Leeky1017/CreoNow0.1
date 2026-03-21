import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "../../components/primitives";
import { EmptyState as EmptyStatePattern } from "../../components/patterns/EmptyState";
import { File } from "lucide-react";
import type { OutlineItem, OutlineLevel, DropPosition } from "./outline-types";
import { hasChildren } from "./outline-types";
import { OutlineItemRow } from "./OutlineNodeItem";

// ============================================================================
// Empty States
// ============================================================================

function EmptyDocumentIcon() {
  return (
    <File
      className="w-6 h-6 text-[var(--color-fg-placeholder)] mb-2"
      size={24}
      strokeWidth={1.5}
    />
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div data-testid="outline-empty-state">
      <EmptyStatePattern
        variant="generic"
        title={t("outline.emptyTitle")}
        description={t("outline.emptyDescription")}
        illustration={<EmptyDocumentIcon />}
        className="mx-3 my-3"
      />
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <EmptyStatePattern
      variant="search"
      title={t("outline.noResults", { query })}
      className="mx-3"
    />
  );
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

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

export function handleOutlineKeyDown(
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
      }
      break;
  }
}

// ============================================================================
// OutlineTree Component
// ============================================================================

export interface OutlineTreeProps {
  items: OutlineItem[];
  visibleItems: OutlineItem[];
  flatItems: OutlineItem[];
  searchQuery: string;
  activeId?: string | null;
  selectedIds: Set<string>;
  editingId: string | null;
  editValue: string;
  wordCounts?: Record<string, number>;
  collapsed: Set<string>;
  draggingId: string | null;
  dragOverId: string | null;
  dropPosition: DropPosition | null;
  draggable: boolean;
  onNavigate: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onEditStart: (item: OutlineItem) => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  onToggleCollapse: (itemId: string) => void;
  onToggleSelect: (
    itemId: string,
    e: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, itemId: string, level: OutlineLevel) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}

export function OutlineTree({
  items,
  visibleItems,
  flatItems,
  searchQuery,
  activeId,
  selectedIds,
  editingId,
  editValue,
  wordCounts,
  collapsed,
  draggingId,
  dragOverId,
  dropPosition,
  draggable,
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
}: OutlineTreeProps) {
  return (
    <ScrollArea
      data-testid="outline-scroll"
      viewportTestId="outline-scroll-viewport"
      className="flex-1 min-h-0"
      viewportClassName="h-full w-full overflow-y-auto scroll-shadow-y py-2"
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
              onNavigate={() => onNavigate(item.id)}
              onDelete={() => onDelete(item.id)}
              onEditStart={() => onEditStart(item)}
              onEditChange={onEditChange}
              onEditCommit={onEditCommit}
              onEditCancel={onEditCancel}
              onToggleCollapse={() => onToggleCollapse(item.id)}
              onToggleSelect={(e) => onToggleSelect(item.id, e)}
              onDragStart={(e) => onDragStart(e, item.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onDragOver(e, item.id, item.level)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, item.id)}
              draggable={draggable}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

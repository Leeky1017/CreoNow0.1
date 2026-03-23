import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Tooltip } from "../../components/primitives/Tooltip";
import { SearchInput } from "../../components/composites/SearchInput";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

import type { OutlineItem, OutlineLevel, DropPosition } from "./outline-types";
import { flattenOutline, hasChildren, levelOrder } from "./outline-types";
import { useDragReorder } from "./useOutlineDrag";
import { OutlineTree, handleOutlineKeyDown } from "./OutlineTree";

export type { OutlineItem, OutlineLevel, DropPosition };

const headerActionCls =
  "!w-auto !h-auto !p-0 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-default)] transition-colors";

export interface OutlinePanelProps {
  items: OutlineItem[];
  activeId?: string | null;
  wordCounts?: Record<string, number>;
  scrollSyncEnabled?: boolean;
  onNavigate?: (itemId: string) => void;
  onDelete?: (itemIds: string[]) => void;
  onRename?: (itemId: string, newTitle: string) => void;
  onReorder?: (
    draggedId: string,
    targetId: string,
    position: DropPosition,
  ) => void;
  onScrollSync?: (itemId: string) => void;
  draggable?: boolean;
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

  const flatItems = React.useMemo(() => flattenOutline(items), [items]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(
    null,
  );
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return flatItems;
    const query = searchQuery.toLowerCase();
    return flatItems.filter((item) => item.title.toLowerCase().includes(query));
  }, [flatItems, searchQuery]);

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

  const toggleCollapse = (itemId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelect = (
    itemId: string,
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    const isCtrlOrCmd = "ctrlKey" in e ? e.ctrlKey || e.metaKey : false;
    const isShift = "shiftKey" in e ? e.shiftKey : false;
    if (isShift && lastSelectedId) {
      const startIdx = visibleItems.findIndex((i) => i.id === lastSelectedId);
      const endIdx = visibleItems.findIndex((i) => i.id === itemId);
      if (startIdx !== -1 && endIdx !== -1) {
        const [from, to] =
          startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = visibleItems.slice(from, to + 1).map((i) => i.id);
        setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
      }
    } else if (isCtrlOrCmd) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
      setLastSelectedId(itemId);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  };

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

  const handleDelete = (itemId: string) => {
    if (selectedIds.size > 0 && selectedIds.has(itemId)) {
      onDelete?.([...selectedIds]);
      clearSelection();
    } else {
      onDelete?.([itemId]);
    }
  };

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
    <div className="flex flex-col h-full bg-[var(--color-bg-surface)]" data-testid="outline-panel">
      <PanelHeader
        title={t("outline.title")}
        actions={
          <>
            <Tooltip content={t("outline.expandAll")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={expandAll}
                className={headerActionCls}
                aria-label={t("outline.expandAllAria")}
              >
                <ChevronsDownUp
                  size={16}
                  strokeWidth={1.5}
                  className="rotate-180"
                />
              </Button>
            </Tooltip>
            <Tooltip content={t("outline.collapseAll")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={collapseAll}
                className={headerActionCls}
                aria-label={t("outline.collapseAllAria")}
              >
                <ChevronsUpDown
                  size={16}
                  strokeWidth={1.5}
                  className="rotate-180"
                />
              </Button>
            </Tooltip>
          </>
        }
      />

      <div className="pt-2 px-3 pb-2">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          placeholder={t("outline.filterPlaceholder")}
          data-testid="outline-search-input"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="px-3 py-1.5 bg-[var(--color-bg-selected)] border-b border-[var(--color-separator)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-fg-muted)]">
            {t("outline.selectedCount", { count: selectedIds.size })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.([...selectedIds])}
              className="!h-auto !px-0 !text-[10px] text-[var(--color-error)] hover:underline"
            >
              {t("outline.delete")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="!h-auto !px-0 !text-[10px] text-[var(--color-fg-muted)] hover:underline"
            >
              {t("outline.clearSelection")}
            </Button>
          </div>
        </div>
      )}

      <OutlineTree
        items={items}
        visibleItems={visibleItems}
        flatItems={flatItems}
        searchQuery={searchQuery}
        treeAriaLabel={t("outline.ariaLabel")}
        activeId={activeId}
        selectedIds={selectedIds}
        editingId={editingId}
        editValue={editValue}
        wordCounts={wordCounts}
        collapsed={collapsed}
        draggingId={draggingId}
        dragOverId={dragOverId}
        dropPosition={dropPosition}
        draggable={draggable}
        onNavigate={(id) => {
          clearSelection();
          onNavigate?.(id);
        }}
        onDelete={handleDelete}
        onEditStart={startEditing}
        onEditChange={setEditValue}
        onEditCommit={commitEdit}
        onEditCancel={cancelEdit}
        onToggleCollapse={toggleCollapse}
        onToggleSelect={toggleSelect}
        onTreeKeyDown={handleKeyDown}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {scrollSyncEnabled && (
        <div className="px-3 py-1.5 border-t border-[var(--color-separator)] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          <span className="text-[10px] text-[var(--color-fg-muted)]">
            {t("outline.syncWithEditor")}
          </span>
        </div>
      )}
    </div>
  );
}

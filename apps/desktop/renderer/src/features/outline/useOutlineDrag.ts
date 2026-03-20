import React from "react";
import type { OutlineLevel, DropPosition } from "./outline-types";

/**
 * Encapsulates drag-and-drop reorder state and handlers for outline items.
 */
export function useDragReorder(
  onReorder:
    | ((draggedId: string, targetId: string, position: DropPosition) => void)
    | undefined,
) {
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

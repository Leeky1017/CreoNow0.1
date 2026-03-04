import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHotkey } from "../../../lib/hotkeys/useHotkey";
import { GraphToolbar } from "./GraphToolbar";
import { GraphCanvas } from "./GraphCanvas";
import { GraphLegend } from "./GraphLegend";
import { NodeDetailCard } from "./NodeDetailCard";
import { NodeEditDialog } from "./NodeEditDialog";
import { zoomAroundCursor } from "../../../features/kg/graphRenderAdapter";
import type {
  KnowledgeGraphProps,
  NodeFilter,
  CanvasTransform,
  GraphNode,
} from "./types";

/**
 * Min/max zoom levels
 */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

/**
 * Container styles
 */
const containerStyles = [
  "flex",
  "flex-col",
  "h-full",
  "w-full",
  "bg-[var(--color-bg-base)]",
  "overflow-hidden",
].join(" ");

const mainStyles = ["flex-1", "relative", "overflow-hidden"].join(" ");

/**
 * Empty state component
 */
function EmptyState({ onAddNode }: { onAddNode: () => void }): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-[var(--color-border-default)] flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--color-fg-subtle)]"
          >
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <line x1="12" y1="8" x2="5" y2="16" />
            <line x1="12" y1="8" x2="19" y2="16" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {t('kg.graph.emptyTitle')}
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)] mt-1">
            {t('kg.graph.emptyHint')}
          </p>
        </div>
        <button
          onClick={onAddNode}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-fg-default)] text-[var(--color-fg-inverse)] text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-fg-muted)] transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('kg.graph.addNode')}
        </button>
      </div>
    </div>
  );
}

/**
 * KnowledgeGraph component
 *
 * A full-featured knowledge graph visualization with:
 * - Multiple node types (character, location, event, item) with distinct shapes/colors
 * - Directed edges with labels
 * - Node dragging for layout adjustment
 * - Canvas panning and zooming
 * - Filtering by node type
 * - Node selection with detail card
 *
 * @example
 * ```tsx
 * <KnowledgeGraph
 *   data={{
 *     nodes: [
 *       { id: "1", label: "Elara", type: "character", position: { x: 300, y: 200 } },
 *       { id: "2", label: "Shadow Keep", type: "location", position: { x: 500, y: 100 } },
 *     ],
 *     edges: [
 *       { id: "e1", source: "1", target: "2", label: "Travels to" },
 *     ],
 *   }}
 *   onNodeSelect={(id) => console.log("Selected:", id)}
 * />
 * ```
 */
export function KnowledgeGraph({
  data,
  selectedNodeId: controlledSelectedId,
  onNodeSelect,
  onNodeMove,
  onAddNode,
  onEditNode,
  onViewDetails,
  onNodeSave,
  onNodeDelete,
  initialTransform,
  onTransformChange,
  enableEditDialog = true,
  className = "",
}: KnowledgeGraphProps): JSX.Element {
  // Internal state for uncontrolled mode
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null,
  );
  const [filter, setFilter] = useState<NodeFilter>("all");
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: initialTransform?.scale ?? 1,
    translateX: initialTransform?.translateX ?? 0,
    translateY: initialTransform?.translateY ?? 0,
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editMode, setEditMode] = useState<"edit" | "create">("edit");

  // Use controlled or uncontrolled selection
  const selectedNodeId =
    controlledSelectedId !== undefined
      ? controlledSelectedId
      : internalSelectedId;

  const handleNodeSelect = useCallback(
    (nodeId: string | null) => {
      if (onNodeSelect) {
        onNodeSelect(nodeId);
      } else {
        setInternalSelectedId(nodeId);
      }
    },
    [onNodeSelect],
  );

  // Get selected node data
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return data.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [data.nodes, selectedNodeId]);

  useEffect(() => {
    onTransformChange?.(transform);
  }, [onTransformChange, transform]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setTransform((prev) =>
      zoomAroundCursor({
        current: prev,
        pointer: { x: 420, y: 260 },
        deltaY: -1,
        minScale: MIN_ZOOM,
        maxScale: MAX_ZOOM,
        step: ZOOM_STEP,
      }),
    );
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) =>
      zoomAroundCursor({
        current: prev,
        pointer: { x: 420, y: 260 },
        deltaY: 1,
        minScale: MIN_ZOOM,
        maxScale: MAX_ZOOM,
        step: ZOOM_STEP,
      }),
    );
  }, []);

  // Pan handler
  const handleCanvasPan = useCallback((deltaX: number, deltaY: number) => {
    setTransform((prev) => ({
      ...prev,
      translateX: prev.translateX + deltaX,
      translateY: prev.translateY + deltaY,
    }));
  }, []);

  const handleCanvasZoom = useCallback(
    (pointer: { x: number; y: number }, deltaY: number) => {
      setTransform((prev) =>
        zoomAroundCursor({
          current: prev,
          pointer,
          deltaY,
          minScale: MIN_ZOOM,
          maxScale: MAX_ZOOM,
          step: ZOOM_STEP,
        }),
      );
    },
    [],
  );

  // Node move handler (for dragging)
  const handleNodeMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (onNodeMove) {
        onNodeMove(nodeId, position);
      }
    },
    [onNodeMove],
  );

  // Add node handler
  const handleAddNode = useCallback(() => {
    if (enableEditDialog) {
      // Open create dialog
      setEditingNode(null);
      setEditMode("create");
      setEditDialogOpen(true);
    }
    if (onAddNode) {
      onAddNode("character"); // Default to character type
    }
  }, [onAddNode, enableEditDialog]);

  // Edit node handler
  const handleEditNode = useCallback(() => {
    if (selectedNode && enableEditDialog) {
      // Open edit dialog with selected node
      setEditingNode(selectedNode);
      setEditMode("edit");
      setEditDialogOpen(true);
    }
    if (selectedNodeId && onEditNode) {
      onEditNode(selectedNodeId);
    }
  }, [selectedNode, selectedNodeId, onEditNode, enableEditDialog]);

  // View details handler (currently shows alert, can be expanded)
  const handleViewDetails = useCallback(() => {
    if (selectedNodeId && onViewDetails) {
      onViewDetails(selectedNodeId);
    }
  }, [selectedNodeId, onViewDetails]);

  // Delete node handler
  const handleDeleteNode = useCallback(() => {
    if (selectedNodeId && onNodeDelete) {
      onNodeDelete(selectedNodeId);
      // Clear selection after delete
      handleNodeSelect(null);
    }
  }, [selectedNodeId, onNodeDelete, handleNodeSelect]);

  // Keyboard shortcuts: Escape to deselect, Delete/Backspace to remove
  // (via unified HotkeyManager)

  /** Guard that prevents shortcut from firing while typing or editing. */
  const isInputFocused = useCallback((): boolean => {
    if (editDialogOpen) return true;
    const active = document.activeElement as HTMLElement | null;
    return (
      !!active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT" ||
        active.isContentEditable)
    );
  }, [editDialogOpen]);

  useHotkey(
    "kg:deselect",
    { key: "Escape" },
    useCallback(() => {
      if (isInputFocused()) return;
      if (selectedNodeId) {
        handleNodeSelect(null);
      }
    }, [isInputFocused, selectedNodeId, handleNodeSelect]),
    "global",
    5,
  );

  useHotkey(
    "kg:delete-node",
    { key: "Delete" },
    useCallback(() => {
      if (isInputFocused()) return;
      if (selectedNodeId && onNodeDelete) {
        handleDeleteNode();
      }
    }, [isInputFocused, selectedNodeId, onNodeDelete, handleDeleteNode]),
    "global",
    5,
  );

  useHotkey(
    "kg:delete-node-backspace",
    { key: "Backspace" },
    useCallback(() => {
      if (isInputFocused()) return;
      if (selectedNodeId && onNodeDelete) {
        handleDeleteNode();
      }
    }, [isInputFocused, selectedNodeId, onNodeDelete, handleDeleteNode]),
    "global",
    5,
  );

  // Save node handler (from edit dialog)
  const handleNodeSave = useCallback(
    (node: GraphNode) => {
      const isNew = editMode === "create";
      if (onNodeSave) {
        onNodeSave(node, isNew);
      }
      // Select the saved node
      handleNodeSelect(node.id);
    },
    [editMode, onNodeSave, handleNodeSelect],
  );

  // Close detail card
  const handleCloseDetailCard = useCallback(() => {
    handleNodeSelect(null);
  }, [handleNodeSelect]);

  const isEmpty = data.nodes.length === 0;

  return (
    <div className={`${containerStyles} ${className}`}>
      {/* Toolbar */}
      <GraphToolbar
        activeFilter={filter}
        onFilterChange={setFilter}
        zoom={transform.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onAddNode={handleAddNode}
      />

      {/* Main canvas area */}
      <main className={mainStyles}>
        {isEmpty ? (
          <EmptyState onAddNode={handleAddNode} />
        ) : (
          <>
            {/* Canvas */}
            <GraphCanvas
              data={data}
              selectedNodeId={selectedNodeId}
              filter={filter}
              transform={transform}
              onNodeSelect={handleNodeSelect}
              onNodeMove={handleNodeMove}
              onCanvasPan={handleCanvasPan}
              onCanvasZoom={handleCanvasZoom}
            />

            {/* Node Detail Card (fixed position, right side of canvas) */}
            {selectedNode && (
              <div className="absolute top-4 right-4 z-[var(--z-popover)]">
                <NodeDetailCard
                  node={selectedNode}
                  onEdit={handleEditNode}
                  onViewDetails={handleViewDetails}
                  onDelete={onNodeDelete ? handleDeleteNode : undefined}
                  onClose={handleCloseDetailCard}
                />
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-6 right-6 z-30">
              <GraphLegend />
            </div>

            {/* Floating add button (bottom-left) */}
            <div className="absolute bottom-6 left-6 z-30">
              <button
                onClick={handleAddNode}
                className="w-10 h-10 rounded-full bg-[var(--color-fg-default)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-muted)] shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                aria-label="Add node"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Node Edit Dialog */}
      {enableEditDialog && (
        <NodeEditDialog
          key={editingNode?.id ?? "new"}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          node={editingNode}
          onSave={handleNodeSave}
          mode={editMode}
        />
      )}
    </div>
  );
}

KnowledgeGraph.displayName = "KnowledgeGraph";

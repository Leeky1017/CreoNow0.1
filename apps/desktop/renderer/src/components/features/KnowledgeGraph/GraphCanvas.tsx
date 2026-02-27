import React, { useCallback, useMemo, useRef, useState } from "react";
import { GraphNode } from "./GraphNode";
import { GraphEdge, EdgeMarkerDefs } from "./GraphEdge";
import type {
  GraphCanvasProps,
  GraphNode as GraphNodeType,
  NodeFilter,
} from "./types";

/**
 * Canvas container styles
 */
const canvasStyles = [
  "absolute",
  "inset-0",
  "w-full",
  "h-full",
  "cursor-grab",
  "active:cursor-grabbing",
].join(" ");

/**
 * Grid background styles
 */
const gridStyles = [
  "absolute",
  "inset-0",
  "pointer-events-none",
  "opacity-20",
].join(" ");

/**
 * Check if a node should be visible based on filter
 */
function isNodeVisible(node: GraphNodeType, filter: NodeFilter): boolean {
  if (filter === "all") return true;
  return node.type === filter;
}

/**
 * GraphCanvas component
 *
 * The main canvas area for the knowledge graph. Handles:
 * - Rendering nodes and edges
 * - Node dragging
 * - Canvas panning
 * - Filtering by node type
 */
export function GraphCanvas({
  data,
  selectedNodeId,
  filter,
  transform,
  onNodeSelect,
  onNodeMove,
  onCanvasPan,
  onCanvasZoom,
}: GraphCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Create a map for quick node lookup
  const nodeMap = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n])),
    [data.nodes],
  );

  const { visibleNodes, visibleEdges } = useMemo(() => {
    const nextVisibleNodes = data.nodes.filter((node) =>
      isNodeVisible(node, filter),
    );
    const visibleNodeIds = new Set(nextVisibleNodes.map((node) => node.id));
    const nextVisibleEdges = data.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
    );

    return {
      visibleNodes: nextVisibleNodes,
      visibleEdges: nextVisibleEdges,
    };
  }, [data.edges, data.nodes, filter]);

  /**
   * Handle node drag start
   */
  const handleNodeDragStart = useCallback(
    (nodeId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setDraggingNodeId(nodeId);
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      // Select the node
      onNodeSelect(nodeId);
    },
    [onNodeSelect],
  );

  /**
   * Handle mouse move for dragging/panning
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!lastMousePos.current) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      if (draggingNodeId) {
        // Dragging a node
        const node = nodeMap.get(draggingNodeId);
        if (node) {
          const newX = node.position.x + deltaX / transform.scale;
          const newY = node.position.y + deltaY / transform.scale;
          onNodeMove(draggingNodeId, { x: newX, y: newY });
        }
      } else if (isPanning) {
        // Panning the canvas
        onCanvasPan(deltaX, deltaY);
      }

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [
      draggingNodeId,
      isPanning,
      nodeMap,
      transform.scale,
      onNodeMove,
      onCanvasPan,
    ],
  );

  /**
   * Handle mouse up - stop dragging/panning
   */
  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setIsPanning(false);
    lastMousePos.current = null;
  }, []);

  /**
   * Handle canvas mouse down - start panning
   */
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if clicking on the canvas itself
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).tagName === "svg"
    ) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  /**
   * Handle canvas click - deselect node
   */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only deselect if clicking on the canvas background
      if (
        e.target === e.currentTarget ||
        (e.target as HTMLElement).classList.contains("bg-grid-dots")
      ) {
        onNodeSelect(null);
      }
    },
    [onNodeSelect],
  );

  /**
   * Handle wheel zoom around the cursor anchor.
   */
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }
      onCanvasZoom(
        {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
        event.deltaY,
      );
    },
    [onCanvasZoom],
  );

  return (
    <div
      ref={containerRef}
      data-testid="knowledge-graph-canvas"
      className={canvasStyles}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {/* Grid background */}
      <div
        className={gridStyles}
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-border-default) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Transform container */}
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
      >
        {/* SVG layer for edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <EdgeMarkerDefs />
          {visibleEdges.map((edge) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <GraphEdge
                key={edge.id}
                edge={edge}
                sourcePosition={sourceNode.position}
                targetPosition={targetNode.position}
                highlighted={
                  selectedNodeId === edge.source ||
                  selectedNodeId === edge.target
                }
              />
            );
          })}
        </svg>

        {/* Nodes layer */}
        {visibleNodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            dragging={draggingNodeId === node.id}
            onClick={() => onNodeSelect(node.id)}
            onDragStart={handleNodeDragStart(node.id)}
          />
        ))}
      </div>
    </div>
  );
}

GraphCanvas.displayName = "GraphCanvas";

/**
 * KnowledgeGraph Types
 *
 * Type definitions for the Knowledge Graph component.
 * Uses design tokens from `design/system/01-tokens.css`:
 * - --color-node-character: #3b82f6 (蓝色)
 * - --color-node-location: #22c55e (绿色)
 * - --color-node-event: #f97316 (橙色)
 * - --color-node-item: #06b6d4 (青色)
 * - --color-node-other: #8b5cf6 (阵营)
 */

/** Node types in the knowledge graph */
export type NodeType = "character" | "location" | "event" | "item" | "faction";

/** Graph node representing an entity */
export interface GraphNode {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Node type determines shape and color */
  type: NodeType;
  /** Optional avatar/image URL (primarily for characters) */
  avatar?: string;
  /** Position on canvas */
  position: { x: number; y: number };
  /** Additional metadata */
  metadata?: {
    /** Character role (Protagonist, Antagonist, etc.) */
    role?: string;
    /** Additional attributes */
    attributes?: Array<{ key: string; value: string }>;
    /** Description text */
    description?: string;
  };
}

/** Edge connecting two nodes */
export interface GraphEdge {
  /** Unique identifier */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Relationship label */
  label: string;
  /** Whether edge is selected/highlighted */
  selected?: boolean;
}

/** Graph data structure */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Node filter state */
export type NodeFilter = NodeType | "all";

/** Canvas transform state for pan/zoom */
export interface CanvasTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

/** Props for the main KnowledgeGraph component */
export interface KnowledgeGraphProps {
  /** Graph data (nodes and edges) */
  data: GraphData;
  /** Currently selected node ID */
  selectedNodeId?: string | null;
  /** Callback when node is selected */
  onNodeSelect?: (nodeId: string | null) => void;
  /** Callback when node position changes (drag) */
  onNodeMove?: (nodeId: string, position: { x: number; y: number }) => void;
  /** Callback when "Add Node" is clicked */
  onAddNode?: (type: NodeType) => void;
  /** Callback when "Edit Node" is clicked in detail card */
  onEditNode?: (nodeId: string) => void;
  /** Callback when "View Details" is clicked in detail card */
  onViewDetails?: (nodeId: string) => void;
  /** Callback when a node is saved (created or edited) */
  onNodeSave?: (node: GraphNode, isNew: boolean) => void;
  /** Callback when a node is deleted */
  onNodeDelete?: (nodeId: string) => void;
  /** Initial transform for persisted graph viewport */
  initialTransform?: CanvasTransform;
  /** Callback when viewport transform changes */
  onTransformChange?: (transform: CanvasTransform) => void;
  /** Enable built-in edit dialog (default: true) */
  enableEditDialog?: boolean;
  /** Optional className for styling */
  className?: string;
}

/** Props for GraphNode component */
export interface GraphNodeProps {
  node: GraphNode;
  selected?: boolean;
  dragging?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

/** Props for GraphEdge component */
export interface GraphEdgeProps {
  edge: GraphEdge;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  highlighted?: boolean;
}

/** Props for NodeDetailCard component */
export interface NodeDetailCardProps {
  node: GraphNode;
  onEdit?: () => void;
  onViewDetails?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

/** Props for GraphToolbar component */
export interface GraphToolbarProps {
  activeFilter: NodeFilter;
  onFilterChange: (filter: NodeFilter) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAddNode: () => void;
  onBack?: () => void;
}

/** Props for GraphLegend component */
export interface GraphLegendProps {
  className?: string;
}

/** Props for NodeEditDialog component */
export interface NodeEditDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Node being edited (null for creating new node) */
  node: GraphNode | null;
  /** Callback when node is saved */
  onSave: (node: GraphNode) => void;
  /** Mode: 'edit' or 'create' */
  mode?: "edit" | "create";
}

/** Props for GraphCanvas component */
export interface GraphCanvasProps {
  data: GraphData;
  selectedNodeId?: string | null;
  filter: NodeFilter;
  transform: CanvasTransform;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onCanvasPan: (deltaX: number, deltaY: number) => void;
  onCanvasZoom: (pointer: { x: number; y: number }, deltaY: number) => void;
}

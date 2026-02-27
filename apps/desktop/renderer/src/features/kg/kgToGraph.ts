/**
 * KG to Graph mapping utilities.
 *
 * Converts KG entities and relations to graph visualization format.
 * This enables the KnowledgeGraph component to visualize KG data.
 */

import type { KgEntity, KgRelation } from "../../stores/kgStore";
import type {
  GraphData,
  GraphNode,
  GraphEdge,
  NodeType,
} from "../../components/features/KnowledgeGraph/types";

/**
 * UI metadata stored in entity's metadataJson for graph visualization.
 */
export interface EntityUiMetadata {
  /** Node position on canvas */
  position?: { x: number; y: number };
  /** Character role (for character entities) */
  role?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Additional attributes */
  attributes?: Array<{ key: string; value: string }>;
}

const METADATA_FAILFAST_LOG_PREFIX =
  "[kgToGraph] metadataJson parse fail-fast:";
const METADATA_LOG_SNIPPET_LIMIT = 80;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metadataSnippet(metadataJson: string): string {
  const condensed = metadataJson.replace(/\s+/g, " ").trim();
  if (condensed.length === 0) {
    return "<empty>";
  }
  if (condensed.length <= METADATA_LOG_SNIPPET_LIMIT) {
    return condensed;
  }
  return `${condensed.slice(0, METADATA_LOG_SNIPPET_LIMIT)}...`;
}

/**
 * Default position for nodes without stored position.
 * Uses a simple grid layout based on entity index.
 */
function defaultPosition(index: number): { x: number; y: number } {
  const cols = 4;
  const spacing = 180;
  const offsetX = 100;
  const offsetY = 100;

  return {
    x: offsetX + (index % cols) * spacing,
    y: offsetY + Math.floor(index / cols) * spacing,
  };
}

/**
 * Map KG entity type to graph node type.
 *
 * Why: KG entity types are free-form strings; we map them to known
 * node types with fallback to "faction".
 */
function mapEntityType(entityType: string | undefined | null): NodeType {
  if (!entityType) {
    return "faction";
  }

  const normalized = entityType.toLowerCase().trim();

  const typeMap: Record<string, NodeType> = {
    character: "character",
    person: "character",
    protagonist: "character",
    antagonist: "character",
    location: "location",
    place: "location",
    setting: "location",
    event: "event",
    scene: "event",
    chapter: "event",
    item: "item",
    object: "item",
    artifact: "item",
    faction: "faction",
  };

  return typeMap[normalized] ?? "faction";
}

/**
 * Parse UI metadata from entity's metadataJson.
 *
 * Why: metadataJson may contain graph-specific UI data (position, etc.)
 * that needs to be extracted safely.
 */
export function parseEntityUiMetadata(
  metadataJson: string | null | undefined,
): EntityUiMetadata {
  if (!metadataJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadataJson) as Record<string, unknown>;

    // Extract UI-specific fields
    const ui = parsed.ui as Record<string, unknown> | undefined;
    const position =
      ui?.position &&
      typeof (ui.position as { x?: number }).x === "number" &&
      typeof (ui.position as { y?: number }).y === "number"
        ? (ui.position as { x: number; y: number })
        : undefined;

    // Extract display fields
    const role = typeof parsed.role === "string" ? parsed.role : undefined;
    const avatarUrl =
      typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : undefined;

    // Extract attributes
    const attributes = Array.isArray(parsed.attributes)
      ? parsed.attributes.filter(
          (a): a is { key: string; value: string } =>
            typeof a === "object" &&
            a !== null &&
            typeof (a as Record<string, unknown>).key === "string" &&
            typeof (a as Record<string, unknown>).value === "string",
        )
      : undefined;

    return { position, role, avatarUrl, attributes };
  } catch (error) {
    console.warn("[kgToGraph] Failed to parse metadataJson:", error);
    return {};
  }
}

/**
 * Convert a KG entity to a graph node.
 *
 * @param entity - KG entity to convert
 * @param index - Entity index for default positioning
 * @returns Graph node for visualization
 */
export function kgEntityToNode(entity: KgEntity, index: number): GraphNode {
  const uiMeta = parseEntityUiMetadata(entity.metadataJson);

  return {
    id: entity.id,
    label: entity.name,
    type: mapEntityType(entity.type),
    avatar: uiMeta.avatarUrl,
    position: uiMeta.position ?? defaultPosition(index),
    metadata: {
      role: uiMeta.role,
      description: entity.description ?? undefined,
      attributes: uiMeta.attributes,
    },
  };
}

/**
 * Convert a KG relation to a graph edge.
 *
 * @param relation - KG relation to convert
 * @returns Graph edge for visualization, or null if invalid
 */
export function kgRelationToEdge(relation: KgRelation): GraphEdge | null {
  // Validate required fields
  if (!relation.sourceEntityId || !relation.targetEntityId) {
    console.warn("[kgToGraph] Relation missing source/target:", relation);
    return null;
  }

  return {
    id: relation.id,
    source: relation.sourceEntityId,
    target: relation.targetEntityId,
    label: relation.relationType || "related",
  };
}

/**
 * Convert KG entities and relations to graph data.
 *
 * Why: The KnowledgeGraph component expects a specific GraphData format;
 * this function handles the complete conversion from KG store data.
 *
 * @param entities - All KG entities
 * @param relations - All KG relations
 * @returns GraphData for visualization
 */
export function kgToGraph(
  entities: KgEntity[],
  relations: KgRelation[],
): GraphData {
  // Convert entities to nodes
  const nodes = entities.map((entity, index) => kgEntityToNode(entity, index));

  // Create a set of valid node IDs for edge filtering
  const validNodeIds = new Set(nodes.map((n) => n.id));

  // Convert relations to edges, filtering out invalid ones
  const edges: GraphEdge[] = [];
  for (const relation of relations) {
    const edge = kgRelationToEdge(relation);
    if (edge) {
      // Only include edges where both source and target exist
      if (validNodeIds.has(edge.source) && validNodeIds.has(edge.target)) {
        edges.push(edge);
      } else {
        console.warn(
          "[kgToGraph] Edge references missing node:",
          edge.source,
          edge.target,
        );
      }
    }
  }

  return { nodes, edges };
}

/**
 * Update node position in metadataJson.
 *
 * Why: When a node is dragged, we need to persist its new position
 * in the entity's metadataJson for reload persistence.
 *
 * @param currentMetadataJson - Current metadataJson string
 * @param position - New position
 * @returns Updated metadataJson string
 */
export function updatePositionInMetadata(
  currentMetadataJson: string | null | undefined,
  position: { x: number; y: number },
): string {
  let metadata: Record<string, unknown> = {};

  if (currentMetadataJson !== null && currentMetadataJson !== undefined) {
    try {
      const parsed = JSON.parse(currentMetadataJson) as unknown;
      if (!isObjectRecord(parsed)) {
        console.warn(
          METADATA_FAILFAST_LOG_PREFIX,
          metadataSnippet(currentMetadataJson),
        );
        return currentMetadataJson;
      }
      metadata = parsed;
    } catch {
      console.warn(
        METADATA_FAILFAST_LOG_PREFIX,
        metadataSnippet(currentMetadataJson),
      );
      return currentMetadataJson;
    }
  }

  // Update the ui.position field
  const ui = (metadata.ui as Record<string, unknown>) ?? {};
  ui.position = position;
  metadata.ui = ui;

  return JSON.stringify(metadata);
}

/**
 * Create new entity metadataJson with position.
 *
 * @param _type - Node type for new entity (reserved for future use)
 * @param position - Initial position
 * @returns metadataJson string for new entity
 */
export function createEntityMetadataWithPosition(
  _type: NodeType,
  position: { x: number; y: number },
): string {
  return JSON.stringify({
    ui: { position },
  });
}

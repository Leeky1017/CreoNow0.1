import type { useTranslation } from "react-i18next";
import type {
  GraphNode,
  NodeType,
} from "../../components/features/KnowledgeGraph/types";
import type { KgEntity, KgActions } from "../../stores/kgStore";
import {
  createEntityMetadataWithPosition,
  updatePositionInMetadata,
} from "./kgToGraph";
import { saveKgViewPreferences } from "./kgViewPreferences";
import { nodeTypeToEntityType, updateTimelineOrderInMetadata } from "./kgUtils";

export interface KgGraphActionsDeps {
  entities: KgEntity[];
  entityCreate: KgActions["entityCreate"];
  entityUpdate: KgActions["entityUpdate"];
  onDeleteEntity: (entityId: string) => Promise<void>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  t: ReturnType<typeof useTranslation>["t"];
  projectId: string;
}

export function createKgGraphActions(deps: KgGraphActionsDeps) {
  /**
   * Handle node position change (drag) in graph view.
   * Persists position to entity metadataJson.
   */
  async function onNodeMove(
    nodeId: string,
    position: { x: number; y: number },
  ): Promise<void> {
    const entity = deps.entities.find((e) => e.id === nodeId);
    if (!entity) {
      return;
    }

    const updatedMetadata = updatePositionInMetadata(
      entity.metadataJson,
      position,
    );
    if (updatedMetadata === entity.metadataJson) {
      return;
    }

    try {
      const res = await deps.entityUpdate({
        id: nodeId,
        patch: { metadataJson: updatedMetadata },
      });
      if (!res.ok) {
        console.warn(
          "[KnowledgeGraphPanel] deps.entityUpdate failed:",
          nodeId,
          res,
        );
        return;
      }
      saveKgViewPreferences(deps.projectId, { lastDraggedNodeId: nodeId });
    } catch (error) {
      console.warn(
        "[KnowledgeGraphPanel] deps.entityUpdate rejected:",
        nodeId,
        error,
      );
      return;
    }
  }

  async function onTimelineOrderChange(orderedIds: string[]): Promise<void> {
    const byId = new Map(deps.entities.map((entity) => [entity.id, entity]));
    const writeResults = await Promise.allSettled(
      orderedIds.map(async (entityId, index) => {
        const entity = byId.get(entityId);
        if (!entity || entity.type !== "event") {
          return { attempted: false as const, failed: false as const };
        }
        const metadataJson = updateTimelineOrderInMetadata(
          entity.metadataJson,
          index + 1,
        );
        if (metadataJson === entity.metadataJson) {
          return { attempted: false as const, failed: false as const };
        }
        try {
          const res = await deps.entityUpdate({
            id: entityId,
            patch: { metadataJson },
          });
          if (!res.ok) {
            return {
              attempted: true as const,
              failed: true as const,
              entityId,
              detail: res,
            };
          }
          return { attempted: true as const, failed: false as const };
        } catch (error) {
          return {
            attempted: true as const,
            failed: true as const,
            entityId,
            detail: error,
          };
        }
      }),
    );

    const failures: unknown[] = [];
    let attemptedCount = 0;

    for (const result of writeResults) {
      if (result.status === "rejected") {
        attemptedCount += 1;
        failures.push(result.reason);
        continue;
      }
      if (result.value.attempted) {
        attemptedCount += 1;
      }
      if (result.value.failed) {
        failures.push(result.value);
      }
    }

    if (failures.length > 0) {
      console.warn(
        `[KnowledgeGraphPanel] timeline reorder partially failed: ${failures.length}/${attemptedCount} entity updates failed`,
        failures,
      );
      return;
    }

    saveKgViewPreferences(deps.projectId, { timelineOrder: orderedIds });
  }

  /**
   * Handle add node from graph view.
   */
  async function onAddNode(nodeType: NodeType): Promise<void> {
    // Calculate position for new node (center of visible area)
    const position = { x: 300, y: 200 };

    const res = await deps.entityCreate({
      name: deps.t("kg.panel.newEntity"),
      type: nodeTypeToEntityType(nodeType),
      description: "",
    });

    if (res.ok) {
      // Update with position metadata
      const metadata = createEntityMetadataWithPosition(nodeType, position);
      await deps.entityUpdate({
        id: res.data.id,
        patch: { metadataJson: metadata },
      });
      deps.setSelectedNodeId(res.data.id);
    }
  }

  /**
   * Handle node save from graph edit dialog.
   */
  async function onNodeSave(node: GraphNode, isNew: boolean): Promise<void> {
    if (isNew) {
      // Create new entity
      const res = await deps.entityCreate({
        name: node.label,
        type: node.type,
        description: node.metadata?.description ?? "",
      });

      if (res.ok) {
        const metadata = createEntityMetadataWithPosition(
          node.type,
          node.position,
        );
        await deps.entityUpdate({
          id: res.data.id,
          patch: { metadataJson: metadata },
        });
        deps.setSelectedNodeId(res.data.id);
      }
    } else {
      // Update existing entity
      const entity = deps.entities.find((e) => e.id === node.id);
      if (!entity) return;

      const updatedMetadata = updatePositionInMetadata(
        entity.metadataJson,
        node.position,
      );
      if (updatedMetadata === entity.metadataJson) {
        return;
      }

      await deps.entityUpdate({
        id: node.id,
        patch: {
          name: node.label,
          type: node.type,
          description: node.metadata?.description ?? "",
          metadataJson: updatedMetadata,
        },
      });
    }
  }

  /**
   * Handle node delete from graph view.
   */
  async function onNodeDeleteFromGraph(nodeId: string): Promise<void> {
    await deps.onDeleteEntity(nodeId);
    deps.setSelectedNodeId(null);
  }

  return {
    onNodeMove,
    onTimelineOrderChange,
    onAddNode,
    onNodeSave,
    onNodeDeleteFromGraph,
  };
}

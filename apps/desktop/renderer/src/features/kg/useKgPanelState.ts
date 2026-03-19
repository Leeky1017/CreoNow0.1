import React from "react";
import type { useTranslation } from "react-i18next";
import type { CanvasTransform } from "../../components/features/KnowledgeGraph/types";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useKgStore } from "../../stores/kgStore";
import type { EditingState, ViewMode } from "./kgTypes";
import type { TimelineEventItem } from "./TimelineView";
import { buildForceDirectedGraph } from "./graphRenderAdapter";
import { kgToGraph } from "./kgToGraph";
import {
  loadKgViewPreferences,
  saveKgViewPreferences,
} from "./kgViewPreferences";
import { createKgGraphActions } from "./kgGraphActions";
import {
  parseAliasesInput,
  parseMetadataJson,
  shouldClearRelationEditingAfterDelete,
} from "./kgUtils";

export function useKgPanelState(
  projectId: string,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const bootstrapStatus = useKgStore((s) => s.bootstrapStatus);
  const entities = useKgStore((s) => s.entities);
  const relations = useKgStore((s) => s.relations);
  const lastError = useKgStore((s) => s.lastError);

  const bootstrapForProject = useKgStore((s) => s.bootstrapForProject);
  const clearError = useKgStore((s) => s.clearError);

  const entityCreate = useKgStore((s) => s.entityCreate);
  const entityUpdate = useKgStore((s) => s.entityUpdate);
  const entityDelete = useKgStore((s) => s.entityDelete);

  const { confirm, dialogProps } = useConfirmDialog();

  const relationCreate = useKgStore((s) => s.relationCreate);
  const relationUpdate = useKgStore((s) => s.relationUpdate);
  const relationDelete = useKgStore((s) => s.relationDelete);

  const [editing, setEditing] = React.useState<EditingState>({ mode: "idle" });
  const [viewMode, setViewMode] = React.useState<ViewMode>("graph");
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null,
  );
  const [graphTransform, setGraphTransform] = React.useState<CanvasTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const [createName, setCreateName] = React.useState("");
  const [createType, setCreateType] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createAliasesInput, setCreateAliasesInput] = React.useState("");

  const [relFromId, setRelFromId] = React.useState("");
  const [relToId, setRelToId] = React.useState("");
  const [relType, setRelType] = React.useState("");

  const isReady = bootstrapStatus === "ready";

  React.useEffect(() => {
    void bootstrapForProject(projectId);
  }, [bootstrapForProject, projectId]);

  React.useEffect(() => {
    const preference = loadKgViewPreferences(projectId);
    setGraphTransform(preference.graphTransform);
  }, [projectId]);

  React.useEffect(() => {
    if (entities.length === 0) {
      setRelFromId("");
      setRelToId("");
      return;
    }
    if (!entities.some((e) => e.id === relFromId)) {
      setRelFromId(entities[0]!.id);
    }
    if (!entities.some((e) => e.id === relToId)) {
      const fallback = entities[1]?.id ?? entities[0]!.id;
      setRelToId(fallback);
    }
  }, [entities, relFromId, relToId]);

  async function onCreateEntity(): Promise<void> {
    const res = await entityCreate({
      name: createName,
      type: createType,
      description: createDescription,
      aliases: parseAliasesInput(createAliasesInput),
    });
    if (!res.ok) {
      return;
    }
    setCreateName("");
    setCreateType("");
    setCreateDescription("");
    setCreateAliasesInput("");
  }

  async function onDeleteEntity(entityId: string): Promise<void> {
    const confirmed = await confirm({
      title: t("kg.panel.deleteEntityTitle"),
      description: t("kg.panel.deleteEntityDescription"),
      primaryLabel: t("kg.panel.delete"),
      secondaryLabel: t("kg.panel.cancel"),
    });
    if (!confirmed) {
      return;
    }
    await entityDelete({ id: entityId });
    if (editing.mode === "entity" && editing.id === entityId) {
      setEditing({ mode: "idle" });
    }
  }

  async function onDeleteRelation(relationId: string): Promise<void> {
    const confirmed = await confirm({
      title: t("kg.panel.deleteRelationTitle"),
      description: t("kg.panel.deleteRelationDescription"),
      primaryLabel: t("kg.panel.delete"),
      secondaryLabel: t("kg.panel.cancel"),
    });
    if (!confirmed) {
      return;
    }
    try {
      const res = await relationDelete({ id: relationId });
      if (!res.ok) {
        console.warn(
          "[KnowledgeGraphPanel] relationDelete failed:",
          relationId,
          res,
        );
        return;
      }
      if (
        shouldClearRelationEditingAfterDelete({
          editing,
          targetRelationId: relationId,
          result: res,
        })
      ) {
        setEditing({ mode: "idle" });
      }
    } catch (error) {
      console.warn(
        "[KnowledgeGraphPanel] relationDelete rejected:",
        relationId,
        error,
      );
      return;
    }
  }

  async function onSaveEdit(): Promise<void> {
    if (editing.mode === "entity") {
      const res = await entityUpdate({
        id: editing.id,
        patch: {
          name: editing.name,
          type: editing.type,
          description: editing.description,
          lastSeenState: editing.lastSeenState,
          aiContextLevel: editing.aiContextLevel,
          aliases: parseAliasesInput(editing.aliasesInput),
        },
      });
      if (!res.ok) {
        return;
      }
      setEditing({ mode: "idle" });
      return;
    }

    if (editing.mode === "relation") {
      const res = await relationUpdate({
        id: editing.id,
        patch: { relationType: editing.relationType },
      });
      if (!res.ok) {
        return;
      }
      setEditing({ mode: "idle" });
      return;
    }
  }

  async function onCreateRelation(): Promise<void> {
    if (entities.length === 0) {
      return;
    }
    const res = await relationCreate({
      sourceEntityId: relFromId,
      targetEntityId: relToId,
      relationType: relType,
    });
    if (!res.ok) {
      return;
    }
    setRelType("");
  }

  function getEntityName(entityId: string): string {
    const e = entities.find((x) => x.id === entityId);
    return e ? e.name : entityId;
  }

  const baseGraphData = React.useMemo(
    () => kgToGraph(entities, relations),
    [entities, relations],
  );
  const graphData = React.useMemo(
    () => buildForceDirectedGraph(baseGraphData),
    [baseGraphData],
  );

  const timelineEvents = React.useMemo<TimelineEventItem[]>(() => {
    return entities
      .filter((entity) => entity.type === "event")
      .map((entity, index) => {
        const metadata = parseMetadataJson(entity.metadataJson);
        const timeline = metadata
          ? ((metadata.timeline as Record<string, unknown>) ?? {})
          : {};
        const chapterValue = timeline.chapter;
        const orderValue = timeline.order;
        return {
          id: entity.id,
          title: entity.name,
          chapter:
            typeof chapterValue === "string" && chapterValue.length > 0
              ? chapterValue
              : `Chapter-${String(index + 1).padStart(2, "0")}`,
          order: typeof orderValue === "number" ? orderValue : index + 1,
          description: entity.description ?? undefined,
        };
      });
  }, [entities]);

  function onGraphTransformChange(transform: CanvasTransform): void {
    setGraphTransform((current) => {
      if (
        current.scale === transform.scale &&
        current.translateX === transform.translateX &&
        current.translateY === transform.translateY
      ) {
        return current;
      }
      return transform;
    });
    saveKgViewPreferences(projectId, { graphTransform: transform });
  }

  const graphActions = createKgGraphActions({
    entities,
    entityCreate,
    entityUpdate,
    onDeleteEntity,
    setSelectedNodeId,
    t,
    projectId,
  });

  return {
    t,
    isReady,
    bootstrapStatus,
    entities,
    relations,
    lastError,
    clearError,
    editing,
    setEditing,
    viewMode,
    setViewMode,
    selectedNodeId,
    setSelectedNodeId,
    graphTransform,
    graphData,
    timelineEvents,
    dialogProps,
    onGraphTransformChange,
    ...graphActions,
    onCreateEntity,
    onDeleteEntity,
    onDeleteRelation,
    onSaveEdit,
    onCreateRelation,
    getEntityName,
    createName,
    setCreateName,
    createType,
    setCreateType,
    createDescription,
    setCreateDescription,
    createAliasesInput,
    setCreateAliasesInput,
    relFromId,
    setRelFromId,
    relToId,
    setRelToId,
    relType,
    setRelType,
  };
}

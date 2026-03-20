import { useTranslation } from "react-i18next";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import { Button, Text } from "../../components/primitives";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { KnowledgeGraph } from "../../components/features/KnowledgeGraph/KnowledgeGraph";
import { TimelineView } from "./TimelineView";
import { formatAliasesInput } from "./kgUtils";
import { ViewModeToggle } from "./ViewModeToggle";
import { KgListView } from "./KgListView";
import { useKgPanelState } from "./useKgPanelState";

// Re-export for external consumers
export { shouldClearRelationEditingAfterDelete } from "./kgUtils";

/**
 * KnowledgeGraphPanel renders the KG CRUD surface with List and Graph views.
 *
 * Why: P0 requires KG discoverability (sidebar entry), CRUD, and predictable
 * data for context injection. Graph view provides visual exploration.
 */
export function KnowledgeGraphPanel(props: { projectId: string }): JSX.Element {
  const { t } = useTranslation();
  const state = useKgPanelState(props.projectId, t);
  const {
    entities,
    lastError,
    clearError,
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
    onNodeMove,
    onAddNode,
    onNodeSave,
    onNodeDeleteFromGraph,
    onTimelineOrderChange,
  } = state;

  const headerActions = (
    <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
  );

  // Render Graph view
  if (viewMode === "graph") {
    return (
      <section
        data-testid="sidebar-kg"
        className="flex flex-col h-full min-h-0"
      >
        <PanelHeader title={t("kg.panel.title")} actions={headerActions} />

        {/* Error display */}
        {lastError ? (
          <div
            role="alert"
            className="p-3 border-b border-[var(--color-separator)] shrink-0"
          >
            <div className="flex gap-2 items-center">
              <Text data-testid="kg-error-code" size="code" color="muted">
                {getHumanErrorMessage(lastError)}
              </Text>
              <Button
                variant="secondary"
                size="sm"
                onClick={clearError}
                className="ml-auto"
              >
                {t("kg.panel.dismiss")}
              </Button>
            </div>
            <Text size="small" className="mt-1.5 block">
              {getHumanErrorMessage(lastError)}
            </Text>
          </div>
        ) : null}

        {/* Graph visualization */}
        <div className="flex-1 min-h-0">
          <KnowledgeGraph
            data={graphData}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            onNodeMove={(nodeId, pos) => void onNodeMove(nodeId, pos)}
            onAddNode={(type) => void onAddNode(type)}
            onNodeSave={(node, isNew) => void onNodeSave(node, isNew)}
            onNodeDelete={(nodeId) => void onNodeDeleteFromGraph(nodeId)}
            initialTransform={graphTransform}
            onTransformChange={onGraphTransformChange}
            enableEditDialog={true}
          />
        </div>

        <SystemDialog {...dialogProps} />
      </section>
    );
  }

  if (viewMode === "timeline") {
    return (
      <section
        data-testid="sidebar-kg"
        className="flex flex-col h-full min-h-0"
      >
        <PanelHeader title={t("kg.panel.title")} actions={headerActions} />

        <div className="flex-1 min-h-0">
          <TimelineView
            events={timelineEvents}
            onOrderChange={(orderedIds) =>
              void onTimelineOrderChange(orderedIds)
            }
            onOpenEvent={(eventId) => {
              const eventEntity = entities.find(
                (entity) => entity.id === eventId,
              );
              if (!eventEntity) {
                return;
              }
              setEditing({
                mode: "entity",
                id: eventEntity.id,
                name: eventEntity.name,
                type: eventEntity.type,
                description: eventEntity.description ?? "",
                lastSeenState: eventEntity.lastSeenState ?? "",
                aiContextLevel: eventEntity.aiContextLevel,
                aliasesInput: formatAliasesInput(eventEntity.aliases),
              });
            }}
          />
        </div>

        <SystemDialog {...dialogProps} />
      </section>
    );
  }

  // Render List view (original)
  return <KgListView state={state} />;
}

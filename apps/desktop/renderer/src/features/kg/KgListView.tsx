import { getHumanErrorMessage } from "../../lib/errorMessages";
import { EmptyState } from "../../components/patterns/EmptyState";
import { ErrorState } from "../../components/patterns/ErrorState";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import { Button, Input, Select, Text } from "../../components/primitives";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { entityLabel } from "./kgUtils";
import { ViewModeToggle } from "./ViewModeToggle";
import { KgEntityCard } from "./KgEntityCard";
import { KgRelationCard } from "./KgRelationCard";
import type { useKgPanelState } from "./useKgPanelState";

export function KgListView(props: {
  state: ReturnType<typeof useKgPanelState>;
}): JSX.Element {
  const {
    t,
    isReady,
    entities,
    relations,
    lastError,
    clearError,
    editing,
    setEditing,
    viewMode,
    setViewMode,
    dialogProps,
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
  } = props.state;

  return (
    <section data-testid="sidebar-kg" className="flex flex-col gap-3 min-h-0">
      <PanelHeader
        title={t("kg.panel.title")}
        actions={
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        }
      />

      {lastError ? (
        <ErrorState
          variant="banner"
          message={getHumanErrorMessage(lastError)}
          dismissible
          onDismiss={clearError}
          className="border-b border-[var(--color-separator)]"
        />
      ) : null}

      <div className="flex-1 overflow-auto scroll-shadow-y min-h-0">
        <div className="p-3">
          <Text size="small" color="muted">
            {t("kg.panel.entities")}
          </Text>

          <div className="flex flex-col gap-2 mt-2 pb-3 border-b border-[var(--color-separator)]">
            <Input
              data-testid="kg-entity-name"
              placeholder={t("kg.panel.namePlaceholder")}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              fullWidth
            />
            <Input
              placeholder={t("kg.panel.typePlaceholder")}
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
              fullWidth
            />
            <Input
              placeholder={t("kg.panel.descriptionPlaceholder")}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              fullWidth
            />
            <Input
              data-testid="kg-entity-aliases"
              placeholder={t("kg.panel.aliasesPlaceholder")}
              value={createAliasesInput}
              onChange={(e) => setCreateAliasesInput(e.target.value)}
              fullWidth
            />
            <Button
              data-testid="kg-entity-create"
              variant="secondary"
              size="sm"
              onClick={() => void onCreateEntity()}
              disabled={!isReady}
              className="self-start"
            >
              {t("kg.panel.createEntity")}
            </Button>
          </div>

          {entities.length === 0 ? (
            <EmptyState
              variant="generic"
              title={t("kg.panel.noEntities")}
              className="mt-3"
            />
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {entities.map((e) => (
                <KgEntityCard
                  key={e.id}
                  entity={e}
                  editing={editing}
                  setEditing={setEditing}
                  onSaveEdit={onSaveEdit}
                  onDeleteEntity={onDeleteEntity}
                  t={t}
                />
              ))}
            </div>
          )}

          <div className="mt-4">
            <Text size="small" color="muted">
              {t("kg.panel.relations")}
            </Text>

            <div className="mt-2 flex flex-col gap-2 pb-3 border-b border-[var(--color-separator)]">
              <Select
                value={relFromId}
                onValueChange={(value) => setRelFromId(value)}
                disabled={!isReady || entities.length === 0}
                options={entities.map((e) => ({
                  value: e.id,
                  label: entityLabel({
                    name: e.name,
                    type: e.type,
                  }),
                }))}
                placeholder={t("kg.panel.selectEntityPlaceholder")}
                fullWidth
              />

              <Select
                value={relToId}
                onValueChange={(value) => setRelToId(value)}
                disabled={!isReady || entities.length === 0}
                options={entities.map((e) => ({
                  value: e.id,
                  label: entityLabel({
                    name: e.name,
                    type: e.type,
                  }),
                }))}
                placeholder={t("kg.panel.selectEntityPlaceholder")}
                fullWidth
              />

              <Input
                data-testid="kg-relation-type"
                placeholder={t("kg.panel.relationTypePlaceholder")}
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                disabled={!isReady}
                fullWidth
              />

              <Button
                data-testid="kg-relation-create"
                variant="secondary"
                size="sm"
                onClick={() => void onCreateRelation()}
                disabled={!isReady}
                className="self-start"
              >
                {t("kg.panel.createRelation")}
              </Button>
            </div>

            {relations.length === 0 ? (
              <Text size="small" color="muted" className="mt-3 block">
                {t("kg.panel.noRelations")}
              </Text>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {relations.map((r) => (
                  <KgRelationCard
                    key={r.id}
                    relation={r}
                    editing={editing}
                    setEditing={setEditing}
                    onSaveEdit={onSaveEdit}
                    onDeleteRelation={onDeleteRelation}
                    getEntityName={getEntityName}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <SystemDialog {...dialogProps} />
    </section>
  );
}

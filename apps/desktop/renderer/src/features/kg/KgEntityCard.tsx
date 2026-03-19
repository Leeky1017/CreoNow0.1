import React from "react";
import type { useTranslation } from "react-i18next";
import { Button, Card, Input, Select, Text } from "../../components/primitives";
import type { KgEntity } from "../../stores/kgStore";
import type { AiContextLevel, EditingState } from "./kgTypes";
import { AI_CONTEXT_LEVEL_OPTIONS } from "./kgTypes";
import { entityLabel, formatAliasesInput } from "./kgUtils";

export function KgEntityCard(props: {
  entity: KgEntity;
  editing: EditingState;
  setEditing: React.Dispatch<React.SetStateAction<EditingState>>;
  onSaveEdit: () => Promise<void>;
  onDeleteEntity: (entityId: string) => Promise<void>;
  t: ReturnType<typeof useTranslation>["t"];
}): JSX.Element {
  const {
    entity: e,
    editing,
    setEditing,
    onSaveEdit,
    onDeleteEntity,
    t,
  } = props;
  const isEditing = editing.mode === "entity" && editing.id === e.id;
  return (
    <Card
      key={e.id}
      data-testid={`kg-entity-row-${e.id}`}
      noPadding
      className="p-2.5 flex flex-col gap-2"
    >
      {isEditing ? (
        <>
          <Input
            value={editing.name}
            onChange={(evt) =>
              setEditing({
                ...editing,
                name: evt.target.value,
              })
            }
            fullWidth
          />
          <Input
            value={editing.type}
            onChange={(evt) =>
              setEditing({
                ...editing,
                type: evt.target.value,
              })
            }
            fullWidth
          />
          <Input
            value={editing.description}
            onChange={(evt) =>
              setEditing({
                ...editing,
                description: evt.target.value,
              })
            }
            fullWidth
          />
          <Input
            data-testid="kg-entity-last-seen-state"
            value={editing.lastSeenState}
            onChange={(evt) =>
              setEditing({
                ...editing,
                lastSeenState: evt.target.value,
              })
            }
            placeholder={t("kg.panel.lastSeenStatePlaceholder")}
            fullWidth
          />
          <Input
            value={editing.aliasesInput}
            onChange={(evt) =>
              setEditing({
                ...editing,
                aliasesInput: evt.target.value,
              })
            }
            fullWidth
          />
          <Select
            data-testid="kg-entity-ai-context-level"
            value={editing.aiContextLevel}
            onValueChange={(value) =>
              setEditing({
                ...editing,
                aiContextLevel: value as AiContextLevel,
              })
            }
            options={AI_CONTEXT_LEVEL_OPTIONS}
            fullWidth
          />
        </>
      ) : (
        <>
          <Text size="small">
            {entityLabel({
              name: e.name,
              type: e.type,
            })}
          </Text>
          {e.description ? (
            <Text size="small" color="muted">
              {e.description}
            </Text>
          ) : null}
        </>
      )}

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onSaveEdit()}
            >
              {t("kg.panel.save")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing({ mode: "idle" })}
            >
              {t("kg.panel.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setEditing({
                  mode: "entity",
                  id: e.id,
                  name: e.name,
                  type: e.type ?? "",
                  description: e.description ?? "",
                  lastSeenState: e.lastSeenState ?? "",
                  aiContextLevel: e.aiContextLevel,
                  aliasesInput: formatAliasesInput(e.aliases),
                })
              }
            >
              {t("kg.panel.edit")}
            </Button>
            <Button
              data-testid={`kg-entity-delete-${e.id}`}
              variant="ghost"
              size="sm"
              onClick={() => void onDeleteEntity(e.id)}
            >
              {t("kg.panel.delete")}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

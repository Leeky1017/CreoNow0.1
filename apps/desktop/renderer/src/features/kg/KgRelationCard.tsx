import React from "react";
import type { useTranslation } from "react-i18next";
import { Button, Card, Input, Text } from "../../components/primitives";
import type { KgRelation } from "../../stores/kgStore";
import type { EditingState } from "./kgTypes";

export function KgRelationCard(props: {
  relation: KgRelation;
  editing: EditingState;
  setEditing: React.Dispatch<React.SetStateAction<EditingState>>;
  onSaveEdit: () => Promise<void>;
  onDeleteRelation: (relationId: string) => Promise<void>;
  getEntityName: (entityId: string) => string;
  t: ReturnType<typeof useTranslation>["t"];
}): JSX.Element {
  const {
    relation: r,
    editing,
    setEditing,
    onSaveEdit,
    onDeleteRelation,
    getEntityName,
    t,
  } = props;
  const isEditing = editing.mode === "relation" && editing.id === r.id;
  return (
    <Card
      key={r.id}
      data-testid={`kg-relation-row-${r.id}`}
      noPadding
      className="p-2.5 flex flex-col gap-2 hover:bg-[var(--color-bg-hover)] transition-default"
    >
      {isEditing ? (
        <Input
          value={editing.relationType}
          onChange={(evt) =>
            setEditing({
              ...editing,
              relationType: evt.target.value,
            })
          }
          fullWidth
        />
      ) : (
        <Text size="small">
          {t("kg.panel.relationFormat", {
            source: getEntityName(r.sourceEntityId),
            type: r.relationType,
            target: getEntityName(r.targetEntityId),
          })}
        </Text>
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
                  mode: "relation",
                  id: r.id,
                  relationType: r.relationType,
                })
              }
            >
              {t("kg.panel.edit")}
            </Button>
            <Button
              data-testid={`kg-relation-delete-${r.id}`}
              variant="ghost"
              size="sm"
              onClick={() => void onDeleteRelation(r.id)}
            >
              {t("kg.panel.delete")}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

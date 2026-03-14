import React from "react";
import { useTranslation } from "react-i18next";

import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useKgStore } from "../../stores/kgStore";
import {
  CharacterCardList,
  type CharacterCardSummary,
} from "./CharacterCardList";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import { characterToMetadataJson, kgToCharacters } from "./characterFromKg";
import type { Character } from "./types";
import { getHumanErrorMessage } from "../../lib/errorMessages";

export interface CharacterCardListContainerProps {
  projectId: string;
}

function toSummary(
  character: Character,
  t: (key: string, options?: Record<string, unknown>) => string,
): CharacterCardSummary {
  const keyAttributes: string[] = [];

  if (typeof character.age === "number") {
    keyAttributes.push(t("character.container.age", { value: character.age }));
  }
  if (character.role) {
    keyAttributes.push(
      t("character.container.role", { value: character.role }),
    );
  }
  if (character.traits.length > 0) {
    keyAttributes.push(
      t("character.container.traits", {
        value: character.traits.slice(0, 2).join(" / "),
      }),
    );
  }
  if (keyAttributes.length === 0) {
    keyAttributes.push(t("character.container.noKeyAttributes"));
  }

  return {
    id: character.id,
    name: character.name,
    typeLabel: t("character.container.typeLabel"),
    avatarUrl: character.avatarUrl,
    keyAttributes: keyAttributes.slice(0, 3),
    relationSummary: t("character.container.relationSummary", {
      count: character.relationships.length,
    }),
  };
}

/**
 * CharacterCardListContainer binds KG entities to the new card list view.
 */
export function CharacterCardListContainer({
  projectId,
}: CharacterCardListContainerProps): JSX.Element {
  const { t } = useTranslation();
  const bootstrapStatus = useKgStore((state) => state.bootstrapStatus);
  const entities = useKgStore((state) => state.entities);
  const relations = useKgStore((state) => state.relations);
  const lastError = useKgStore((state) => state.lastError);

  const bootstrapForProject = useKgStore((state) => state.bootstrapForProject);
  const entityCreate = useKgStore((state) => state.entityCreate);
  const entityUpdate = useKgStore((state) => state.entityUpdate);
  const entityDelete = useKgStore((state) => state.entityDelete);

  const { confirm, dialogProps } = useConfirmDialog();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    void bootstrapForProject(projectId);
  }, [bootstrapForProject, projectId]);

  const characters = React.useMemo(
    () => kgToCharacters(entities, relations),
    [entities, relations],
  );

  const cardSummaries = React.useMemo(
    () => characters.map((c) => toSummary(c, t)),
    [characters, t],
  );

  const selectedCharacter = React.useMemo(
    () => characters.find((character) => character.id === selectedId) ?? null,
    [characters, selectedId],
  );

  const handleCreateCharacter = React.useCallback(async () => {
    const created = await entityCreate({
      name: t("character.container.newCharacter"),
      type: "character",
      description: "",
    });
    if (!created.ok) {
      return;
    }
    setSelectedId(created.data.id);
    setDialogOpen(true);
  }, [entityCreate, t]);

  const handleSaveCharacter = React.useCallback(
    async (character: Character) => {
      await entityUpdate({
        id: character.id,
        patch: {
          name: character.name,
          description: character.description ?? "",
          metadataJson: characterToMetadataJson(character),
        },
      });
    },
    [entityUpdate],
  );

  const handleDeleteCharacter = React.useCallback(
    async (characterId: string) => {
      const target = characters.find(
        (character) => character.id === characterId,
      );
      const label = target?.name ?? t("character.container.thisCharacter");
      const confirmed = await confirm({
        title: t("character.container.deleteTitle"),
        description: t("character.container.deleteDescription", {
          name: label,
        }),
        primaryLabel: t("character.container.delete"),
        secondaryLabel: t("character.container.cancel"),
      });
      if (!confirmed) {
        return;
      }
      await entityDelete({ id: characterId });
      if (selectedId === characterId) {
        setSelectedId(null);
        setDialogOpen(false);
      }
    },
    [characters, confirm, entityDelete, selectedId, t],
  );

  if (bootstrapStatus === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-sm text-[var(--color-fg-muted)]">Loading...</span>
      </div>
    );
  }

  if (bootstrapStatus === "error" && lastError) {
    return (
      <div
        role="alert"
        className="h-full flex flex-col items-center justify-center gap-2 p-4"
      >
        <span className="text-sm text-[var(--color-error-default)]">
          {t("character.panelContainer.loadError")}
        </span>
        <span className="text-xs text-[var(--color-fg-muted)]">
          {getHumanErrorMessage(lastError)}
        </span>
      </div>
    );
  }

  return (
    <>
      <CharacterCardList
        cards={cardSummaries}
        onCreateCharacter={() => void handleCreateCharacter()}
        onSelectCard={(id) => {
          setSelectedId(id);
          setDialogOpen(true);
        }}
      />

      <CharacterDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        character={selectedCharacter}
        onSave={(character) => void handleSaveCharacter(character)}
        onDelete={(characterId) => void handleDeleteCharacter(characterId)}
        availableCharacters={characters}
      />

      <SystemDialog {...dialogProps} />
    </>
  );
}

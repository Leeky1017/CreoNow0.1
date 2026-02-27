import React from "react";

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

export interface CharacterCardListContainerProps {
  projectId: string;
}

function toSummary(character: Character): CharacterCardSummary {
  const keyAttributes: string[] = [];

  if (typeof character.age === "number") {
    keyAttributes.push(`年龄: ${character.age}`);
  }
  if (character.role) {
    keyAttributes.push(`定位: ${character.role}`);
  }
  if (character.traits.length > 0) {
    keyAttributes.push(`特征: ${character.traits.slice(0, 2).join(" / ")}`);
  }
  if (keyAttributes.length === 0) {
    keyAttributes.push("暂无关键属性");
  }

  return {
    id: character.id,
    name: character.name,
    typeLabel: "角色",
    avatarUrl: character.avatarUrl,
    keyAttributes: keyAttributes.slice(0, 3),
    relationSummary: `关系 ${character.relationships.length} 条`,
  };
}

/**
 * CharacterCardListContainer binds KG entities to the new card list view.
 */
export function CharacterCardListContainer({
  projectId,
}: CharacterCardListContainerProps): JSX.Element {
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
    () => characters.map(toSummary),
    [characters],
  );

  const selectedCharacter = React.useMemo(
    () => characters.find((character) => character.id === selectedId) ?? null,
    [characters, selectedId],
  );

  const handleCreateCharacter = React.useCallback(async () => {
    const created = await entityCreate({
      name: "新角色",
      type: "character",
      description: "",
    });
    if (!created.ok) {
      return;
    }
    setSelectedId(created.data.id);
    setDialogOpen(true);
  }, [entityCreate]);

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
      const label = target?.name ?? "该角色";
      const confirmed = await confirm({
        title: "删除角色？",
        description: `删除角色 "${label}" 将移除其关联关系，此操作不可撤销。`,
        primaryLabel: "删除",
        secondaryLabel: "取消",
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
    [characters, confirm, entityDelete, selectedId],
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
      <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
        <span className="text-sm text-[var(--color-error-default)]">
          Failed to load characters
        </span>
        <span className="text-xs text-[var(--color-fg-muted)]">
          {lastError.code}: {lastError.message}
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

/**
 * CharacterPanelContainer - Connects CharacterPanel to KG store.
 *
 * Why: Characters are a view over KG entities (entityType="character").
 * This container handles the mapping and CRUD operations through KG IPC.
 */

import React from "react";
import { useTranslation } from "react-i18next";

import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useDeferredLoading } from "../../lib/useDeferredLoading";
import { useKgStore } from "../../stores/kgStore";
import { CharacterPanelContent } from "./CharacterPanel";
import { CharacterPanelSkeleton } from "./CharacterPanelSkeleton";
import {
  kgToCharacters,
  characterToMetadataJson,
} from "./characterFromKg";
import type { Character } from "./types";
// TODO: A0-20 合并后重命名为 getHumanErrorMessage
import { getUserFacingErrorMessage } from "../../lib/errorMessages";

export interface CharacterPanelContainerProps {
  /** Project ID for KG scope */
  projectId: string;
}

/**
 * CharacterPanelContainer provides character CRUD through KG store.
 *
 * Features:
 * - Bootstraps KG for the project
 * - Maps KG entities to Characters
 * - Provides create/update/delete through KG IPC
 * - Uses SystemDialog for delete confirmation
 */
export function CharacterPanelContainer(
  props: CharacterPanelContainerProps,
): JSX.Element {
  const { t } = useTranslation();
  const { projectId } = props;

  // KG store state
  const bootstrapStatus = useKgStore((s) => s.bootstrapStatus);
  const entities = useKgStore((s) => s.entities);
  const relations = useKgStore((s) => s.relations);
  const lastError = useKgStore((s) => s.lastError);

  // KG store actions
  const bootstrapForProject = useKgStore((s) => s.bootstrapForProject);
  const entityCreate = useKgStore((s) => s.entityCreate);
  const entityUpdate = useKgStore((s) => s.entityUpdate);
  const entityDelete = useKgStore((s) => s.entityDelete);

  // Confirm dialog for delete
  const { confirm, dialogProps } = useConfirmDialog();

  // Local state
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Bootstrap KG on mount
  React.useEffect(() => {
    void bootstrapForProject(projectId);
  }, [bootstrapForProject, projectId]);

  // Convert KG entities to Characters
  const characters = React.useMemo(
    () => kgToCharacters(entities, relations),
    [entities, relations],
  );

  /**
   * Create a new character entity in KG.
   */
  const handleCreate = React.useCallback(async () => {
    const res = await entityCreate({
      name: t('character.panelContainer.newCharacter'),
      type: "character",
      description: "",
    });

    if (res.ok) {
      // Select the newly created character
      setSelectedId(res.data.id);
    }
  }, [entityCreate, t]);

  /**
   * Update a character's KG entity.
   */
  const handleUpdate = React.useCallback(
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

  /**
   * Delete a character with confirmation.
   */
  const handleDelete = React.useCallback(
    async (characterId: string) => {
      const character = characters.find((c) => c.id === characterId);
      const name = character?.name ?? t('character.panelContainer.thisCharacter');

      const confirmed = await confirm({
        title: t('character.panelContainer.deleteTitle'),
        description: t('character.panelContainer.deleteDescription', { name }),
        primaryLabel: t('character.panelContainer.deleteLabel'),
        secondaryLabel: t('character.panelContainer.cancelLabel'),
      });

      if (!confirmed) {
        return;
      }

      await entityDelete({ id: characterId });

      // Clear selection if deleted character was selected
      if (selectedId === characterId) {
        setSelectedId(null);
      }
    },
    [characters, confirm, entityDelete, selectedId, t],
  );

  /**
   * Handle character selection.
   */
  const handleSelect = React.useCallback((characterId: string) => {
    setSelectedId(characterId);
  }, []);

  const showLoading = useDeferredLoading(bootstrapStatus === "loading");

  // Loading state
  if (bootstrapStatus === "loading") {
    return showLoading ? <CharacterPanelSkeleton /> : <></>;
  }

  // Error state
  if (bootstrapStatus === "error" && lastError) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-2 p-4"
        data-testid="character-panel-error"
      >
        <span className="text-sm text-[var(--color-error-default)]">
          {t('character.panelContainer.loadError')}
        </span>
        <span className="text-xs text-[var(--color-error)]" role="alert">
          {getUserFacingErrorMessage(lastError)}
        </span>
      </div>
    );
  }

  // Empty state with guidance
  if (characters.length === 0 && bootstrapStatus === "ready") {
    return (
      <>
        <div
          className="flex flex-col items-center justify-center h-full gap-4 p-4"
          data-testid="character-panel-empty"
        >
          <div className="text-center space-y-2">
            <p className="text-sm text-[var(--color-fg-muted)]">
              {t('character.panelContainer.emptyTitle')}
            </p>
            <p className="text-xs text-[var(--color-fg-placeholder)]">
              {t('character.panelContainer.emptyDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            className="focus-ring px-4 py-2 text-sm font-medium bg-[var(--color-fg-default)] text-[var(--color-fg-inverse)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
          >
            {t('character.panelContainer.createCharacter')}
          </button>
        </div>
        <SystemDialog {...dialogProps} />
      </>
    );
  }

  return (
    <>
      <CharacterPanelContent
        characters={characters}
        selectedId={selectedId}
        onSelect={handleSelect}
        onCreate={() => void handleCreate()}
        onUpdate={(char) => void handleUpdate(char)}
        onDelete={(id) => void handleDelete(id)}
      />
      <SystemDialog {...dialogProps} />
    </>
  );
}

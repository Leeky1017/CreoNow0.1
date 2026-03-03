/**
 * CharacterPanelContainer - Connects CharacterPanel to KG store.
 *
 * Why: Characters are a view over KG entities (entityType="character").
 * This container handles the mapping and CRUD operations through KG IPC.
 */

import React from "react";

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
      name: "New Character",
      type: "character",
      description: "",
    });

    if (res.ok) {
      // Select the newly created character
      setSelectedId(res.data.id);
    }
  }, [entityCreate]);

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
      const name = character?.name ?? "this character";

      const confirmed = await confirm({
        title: "Delete Character?",
        description: `"${name}" and all their relationships will be permanently deleted.`,
        primaryLabel: "Delete",
        secondaryLabel: "Cancel",
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
    [characters, confirm, entityDelete, selectedId],
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
          Failed to load characters
        </span>
        <span className="text-xs text-[var(--color-fg-muted)]">
          {lastError.code}: {lastError.message}
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
              No characters yet
            </p>
            <p className="text-xs text-[var(--color-fg-placeholder)]">
              Create your first character to start building your story&apos;s cast
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            className="focus-ring px-4 py-2 text-sm font-medium bg-[var(--color-fg-default)] text-[var(--color-fg-inverse)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
          >
            Create Character
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

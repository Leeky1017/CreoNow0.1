import React from "react";
import { useTranslation } from "react-i18next";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import type { Character } from "./types";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import {
  groupCharacters,
  CharacterGroupSection,
  AddCharacterButton,
} from "./CharacterPanelSections";

export interface CharacterPanelProps {
  /** List of characters */
  characters: Character[];
  /** Currently selected character ID */
  selectedId?: string | null;
  /** Callback when a character is selected */
  onSelect?: (characterId: string) => void;
  /** Callback when a character is created */
  onCreate?: () => void;
  /** Callback when a character is updated */
  onUpdate?: (character: Character) => void;
  /** Callback when a character is deleted */
  onDelete?: (characterId: string) => void;
  /** Callback when navigating to a chapter */
  onNavigateToChapter?: (chapterId: string) => void;
  /** Panel width in pixels */
  width?: number;
}

/**
 * Props for CharacterPanelContent (without container-specific props)
 */
export interface CharacterPanelContentProps {
  /** List of characters */
  characters: Character[];
  /** Currently selected character ID */
  selectedId?: string | null;
  /** Callback when a character is selected */
  onSelect?: (characterId: string) => void;
  /** Callback when a character is created */
  onCreate?: () => void;
  /** Callback when a character is updated */
  onUpdate?: (character: Character) => void;
  /** Callback when a character is deleted */
  onDelete?: (characterId: string) => void;
  /** Callback when navigating to a chapter */
  onNavigateToChapter?: (chapterId: string) => void;
  /** User-visible warning for navigation degradation */
  navigationWarning?: string | null;
}

/**
 * CharacterPanelContent - Content component without container styles.
 *
 * Use this component inside layout containers (Sidebar/RightPanel) that
 * handle their own container styling (width/border/shadow).
 *
 * Features:
 * - Grouped character list (Main/Supporting/Others)
 * - Character cards with avatar, name, and role
 * - Selection state with detail dialog
 * - Add new character button
 * - Hover states with edit/delete actions
 *
 * @example
 * ```tsx
 * // Inside a layout container
 * <CharacterPanelContent
 *   characters={characters}
 *   selectedId={selectedCharacterId}
 *   onSelect={setSelectedCharacterId}
 *   onUpdate={handleUpdateCharacter}
 * />
 * ```
 */
export function CharacterPanelContent({
  characters,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onNavigateToChapter,
  navigationWarning,
}: CharacterPanelContentProps): JSX.Element {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCharacter, setEditingCharacter] =
    React.useState<Character | null>(null);

  const grouped = groupCharacters(characters);

  const handleCharacterSelect = (characterId: string) => {
    onSelect?.(characterId);
    const character = characters.find((c) => c.id === characterId);
    if (character) {
      setEditingCharacter(character);
      setDialogOpen(true);
    }
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingCharacter(null);
    }
  };

  return (
    <>
      <div
        className="h-full flex flex-col bg-[var(--color-bg-surface)]"
        data-testid="character-panel-content"
      >
        {/* Header */}
        <PanelHeader
          title={t("character.panel.title")}
          actions={<AddCharacterButton onClick={onCreate} />}
        />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-8">
          <CharacterGroupSection
            group="main"
            characters={grouped.main}
            selectedId={selectedId}
            onSelect={handleCharacterSelect}
            onEdit={handleEdit}
            onDelete={onDelete}
            onCreate={onCreate}
          />
          <CharacterGroupSection
            group="supporting"
            characters={grouped.supporting}
            selectedId={selectedId}
            onSelect={handleCharacterSelect}
            onEdit={handleEdit}
            onDelete={onDelete}
            onCreate={onCreate}
          />
          <CharacterGroupSection
            group="others"
            characters={grouped.others}
            selectedId={selectedId}
            onSelect={handleCharacterSelect}
            onEdit={handleEdit}
            onDelete={onDelete}
            onCreate={onCreate}
          />
        </div>
      </div>

      {/* Detail Dialog */}
      <CharacterDetailDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        character={editingCharacter}
        onSave={onUpdate}
        onDelete={onDelete}
        onNavigateToChapter={onNavigateToChapter}
        navigationWarning={navigationWarning}
        availableCharacters={characters}
      />
    </>
  );
}

/**
 * CharacterPanel - A sidebar panel for managing story characters
 *
 * This is the standalone panel component with its own container styles.
 * For use inside layout containers, prefer CharacterPanelContent instead.
 *
 * Features:
 * - Grouped character list (Main/Supporting/Others)
 * - Character cards with avatar, name, and role
 * - Selection state with detail dialog
 * - Add new character button
 * - Hover states with edit/delete actions
 *
 * @example
 * ```tsx
 * <CharacterPanel
 *   characters={characters}
 *   selectedId={selectedCharacterId}
 *   onSelect={setSelectedCharacterId}
 *   onUpdate={handleUpdateCharacter}
 *   onDelete={handleDeleteCharacter}
 * />
 * ```
 */
export function CharacterPanel({
  characters,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onNavigateToChapter,
  width = 300,
}: CharacterPanelProps): JSX.Element {
  return (
    <aside
      className="h-full flex flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] shrink-0"
      style={{ width }}
      data-testid="character-panel"
    >
      <CharacterPanelContent
        characters={characters}
        selectedId={selectedId}
        onSelect={onSelect}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onNavigateToChapter={onNavigateToChapter}
      />
    </aside>
  );
}

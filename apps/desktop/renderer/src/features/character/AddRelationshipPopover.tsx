/**
 * AddRelationshipPopover component
 *
 * A popover component for adding character relationships.
 * Provides a two-step selection flow: select character, then select relationship type.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Popover, Avatar } from "../../components/primitives";
import { Button } from "../../components/primitives/Button";
import type {
  Character,
  CharacterRelationship,
  RelationshipType,
} from "./types";
import { ROLE_DISPLAY, RELATIONSHIP_TYPE_DISPLAY } from "./types";

import { Plus } from "lucide-react";

export interface AddRelationshipPopoverProps {
  /** Available characters to select from (excluding current character) */
  availableCharacters: Character[];
  /** Existing relationships (to filter out already related characters) */
  existingRelationships: CharacterRelationship[];
  /** Callback when a relationship is added */
  onAdd: (
    relationship: Omit<CharacterRelationship, "characterId"> & {
      characterId: string;
    },
  ) => void;
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Optional portal container for popover content */
  portalContainer?: HTMLElement | null;
  /** Z-layer for popover content */
  layer?: "popover" | "modal";
}

/**
 * All available relationship types
 */
const RELATIONSHIP_TYPES: RelationshipType[] = [
  "rival",
  "mentor",
  "ally",
  "enemy",
  "friend",
  "family",
];

/**
 * Plus icon for trigger button
 */
function PlusIcon() {
  return <Plus size={16} strokeWidth={1.5} />;
}

/**
 * AddRelationshipPopover - Popover for adding character relationships
 *
 * Features:
 * - Two-step selection: character first, then relationship type
 * - Filters out already related characters
 * - Shows character avatar and role
 * - Color-coded relationship type buttons
 *
 * @example
 * ```tsx
 * <AddRelationshipPopover
 *   availableCharacters={otherCharacters}
 *   existingRelationships={character.relationships}
 *   onAdd={(rel) => addRelationship(rel)}
 * />
 * ```
 */
export function AddRelationshipPopover({
  availableCharacters,
  existingRelationships,
  onAdd,
  trigger,
  portalContainer,
  layer = "popover",
}: AddRelationshipPopoverProps): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [selectedCharacter, setSelectedCharacter] =
    React.useState<Character | null>(null);
  const [selectedType, setSelectedType] =
    React.useState<RelationshipType | null>(null);
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Filter out characters that already have a relationship
  const existingIds = new Set(existingRelationships.map((r) => r.characterId));
  const selectableCharacters = availableCharacters.filter(
    (c) => !existingIds.has(c.id),
  );

  const handleReset = () => {
    setSelectedCharacter(null);
    setSelectedType(null);
  };

  const scheduleReset = () => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null;
      handleReset();
    }, 150);
  };

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    scheduleReset();
  };

  const handleAdd = () => {
    if (selectedCharacter && selectedType) {
      onAdd({
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
        characterRole: selectedCharacter.role,
        characterAvatar: selectedCharacter.avatarUrl,
        type: selectedType,
      });
      handleClose();
    }
  };

  const canAdd = selectedCharacter !== null && selectedType !== null;

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          scheduleReset();
        }
      }}
      layer={layer}
      portalContainer={portalContainer}
      trigger={
        trigger ?? (
          <Button
            type="button"
            className="text-(--text-label) text-[var(--color-info)] hover:text-[var(--color-info)]/80 flex items-center gap-1 font-medium transition-colors"
          >
            <PlusIcon />
            {t("character.addRelation.triggerLabel")}
          </Button>
        )
      }
      align="end"
      sideOffset={4}
    >
      <div className="w-70 -mx-2 -my-2">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border-default)]">
          <h2 className="text-sm font-medium text-[var(--color-fg-default)]">
            {t("character.addRelation.title")}
          </h2>
        </div>

        {/* Character Selection */}
        <div className="px-4 py-3 border-b border-[var(--color-border-default)]">
          <div className="text-(--text-label) uppercase tracking-(--tracking-wider) text-[var(--color-fg-placeholder)] font-semibold mb-2">
            {t("character.addRelation.selectCharacter")}
          </div>
          {selectableCharacters.length > 0 ? (
            <div className="space-y-1 max-h-40 overflow-y-auto -mx-2 px-2">
              {selectableCharacters.map((character) => {
                const isSelected = selectedCharacter?.id === character.id;
                const roleConfig = ROLE_DISPLAY[character.role];
                return (
                  <Button
                    key={character.id}
                    type="button"
                    onClick={() => setSelectedCharacter(character)}
                    className={[
                      "w-full",
                      "flex",
                      "items-center",
                      "gap-3",
                      "p-2",
                      "rounded",
                      "transition-colors",
                      "text-left",
                      isSelected
                        ? "bg-[var(--color-bg-hover)] border border-[var(--color-border-hover)]"
                        : "hover:bg-[var(--color-bg-hover)] border border-transparent",
                    ].join(" ")}
                  >
                    <Avatar
                      src={character.avatarUrl}
                      fallback={character.name}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--color-fg-default)] truncate">
                        {character.name}
                      </div>
                      <div
                        className={`text-(--text-label) ${roleConfig.color}`}
                      >
                        {roleConfig.label}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-info)] shrink-0" />
                    )}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-[var(--color-fg-placeholder)] py-4 text-center">
              {t("character.addRelation.noCharacters")}
            </div>
          )}
        </div>

        {/* Relationship Type Selection */}
        <div className="px-4 py-3 border-b border-[var(--color-border-default)]">
          <div className="text-(--text-label) uppercase tracking-(--tracking-wider) text-[var(--color-fg-placeholder)] font-semibold mb-2">
            {t("character.addRelation.relationshipType")}
          </div>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_TYPES.map((type) => {
              const config = RELATIONSHIP_TYPE_DISPLAY[type];
              const isSelected = selectedType === type;
              return (
                <Button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={[
                    "px-2.5",
                    "py-1",
                    "text-(--text-status)",
                    "font-medium",
                    "rounded",
                    "border",
                    "transition-colors",
                    isSelected
                      ? `${config.color} border-current text-[var(--color-fg-default)]`
                      : "bg-[var(--color-bg-hover)] border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-hover)]",
                  ].join(" ")}
                >
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            {t("character.addRelation.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            {t("character.addRelation.add")}
          </Button>
        </div>
      </div>
    </Popover>
  );
}

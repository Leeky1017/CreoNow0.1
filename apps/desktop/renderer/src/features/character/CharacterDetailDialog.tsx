import React from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Avatar, Button, Input, Textarea } from "../../components/primitives";
import { Camera, Trash2, X } from "lucide-react";
import { RoleSelector } from "./RoleSelector";
import { GroupSelector } from "./GroupSelector";
import {
  getOverlayStyles,
  getContentStyles,
  getZodiacFromBirthDate,
  labelStyles,
  sectionHeaderStyles,
} from "./character-detail-shared";
import { CharacterBasicInfo } from "./CharacterBasicInfo";
import { CharacterRelationships } from "./CharacterRelationships";
import { CharacterAppearances } from "./CharacterAppearances";
import type { Character } from "./types";
import { ARCHETYPE_OPTIONS, ZODIAC_OPTIONS } from "./types";

export interface CharacterDetailDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Character to display/edit */
  character: Character | null;
  /** Callback when character is saved */
  onSave?: (character: Character) => void;
  /** Callback when character is deleted */
  onDelete?: (characterId: string) => void;
  /** Callback when navigating to a chapter */
  onNavigateToChapter?: (chapterId: string) => void;
  /** User-visible warning shown when chapter navigation degrades or fails */
  navigationWarning?: string | null;
  /** Available characters for adding relationships */
  availableCharacters?: Character[];
  /**
   * Container element for Portal rendering.
   * Use in Storybook to constrain Dialog rendering within the story container.
   * If not provided, Dialog renders to document.body.
   */
  container?: HTMLElement | null;
}

/**
 * CharacterDetailDialog — Modal for viewing and editing character details.
 */
export function CharacterDetailDialog({
  open,
  onOpenChange,
  character,
  onSave,
  onDelete,
  onNavigateToChapter,
  navigationWarning,
  availableCharacters,
  container,
}: CharacterDetailDialogProps): JSX.Element | null {
  const { t } = useTranslation();
  const [editedCharacter, setEditedCharacter] =
    React.useState<Character | null>(null);
  const [newTrait, setNewTrait] = React.useState("");
  const [newFeature, setNewFeature] = React.useState("");
  const [isProfileExpanded, setIsProfileExpanded] = React.useState(false);

  React.useEffect(() => {
    if (character) {
      const computedZodiac = character.birthDate
        ? getZodiacFromBirthDate(character.birthDate)
        : undefined;
      setEditedCharacter({
        ...character,
        features: character.features ?? [],
        zodiac: character.zodiac ?? computedZodiac,
      });
    }
  }, [character]);

  React.useEffect(() => {
    if (!open) {
      setNewTrait("");
      setNewFeature("");
    }
  }, [open]);

  React.useEffect(() => {
    if (open) setIsProfileExpanded(false);
  }, [open, character?.id]);

  if (!editedCharacter) return null;

  const handleFieldChange = <K extends keyof Character>(
    field: K,
    value: Character[K],
  ) => {
    setEditedCharacter((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleAddTrait = () => {
    const trimmed = newTrait.trim();
    if (trimmed && !editedCharacter.traits.includes(trimmed)) {
      handleFieldChange("traits", [...editedCharacter.traits, trimmed]);
      setNewTrait("");
    }
  };

  const handleRemoveTrait = (trait: string) => {
    handleFieldChange(
      "traits",
      editedCharacter.traits.filter((t) => t !== trait),
    );
  };

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    const current = editedCharacter.features ?? [];
    if (current.includes(trimmed)) {
      setNewFeature("");
      return;
    }
    handleFieldChange("features", [...current, trimmed]);
    setNewFeature("");
  };

  const handleRemoveFeature = (feature: string) => {
    const current = editedCharacter.features ?? [];
    handleFieldChange(
      "features",
      current.filter((f) => f !== feature),
    );
  };

  const handleRemoveRelationship = (characterId: string) => {
    handleFieldChange(
      "relationships",
      editedCharacter.relationships.filter(
        (r) => r.characterId !== characterId,
      ),
    );
  };

  const handleSave = () => {
    onSave?.(editedCharacter);
    onOpenChange(false);
  };
  const handleDelete = () => {
    onDelete?.(editedCharacter.id);
    onOpenChange(false);
  };
  const handleTraitKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTrait();
    }
  };
  const handleFeatureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const hasContainer = container !== undefined && container !== null;
  const zodiacLabel =
    editedCharacter.zodiac &&
    ZODIAC_OPTIONS.find((z) => z.value === editedCharacter.zodiac)?.label;
  const archetypeLabel =
    editedCharacter.archetype &&
    ARCHETYPE_OPTIONS.find((a) => a.value === editedCharacter.archetype)?.label;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className={getOverlayStyles(hasContainer)} />
        <DialogPrimitive.Content className={getContentStyles(hasContainer)}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-border-hover)] to-transparent opacity-50" />

          {/* Header: Avatar + Name + Role */}
          <div className="p-6 pb-0 flex items-start gap-6 shrink-0">
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-16 h-16 rounded-full p-[1px] bg-gradient-to-b from-[var(--color-border-hover)] to-[var(--color-bg-surface)]">
                <Avatar
                  src={editedCharacter.avatarUrl}
                  fallback={editedCharacter.name}
                  size="lg"
                  className="w-full h-full group-hover:brightness-75 transition-[filter]"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera
                  className="text-[var(--color-fg-on-accent)] w-5 h-5 drop-shadow-md"
                  size={20}
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between mb-2">
                <Input
                  type="text"
                  value={editedCharacter.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="!bg-transparent !text-xl !font-semibold !border-0 !border-b !border-transparent focus:!border-[var(--color-info)]/30 !pb-0.5 !w-full !mr-4 !h-auto !px-0 !rounded-none focus-visible:!outline-none"
                  placeholder={t("character.detail.namePlaceholder")}
                />
                <DialogPrimitive.Close
                  className="p-2 text-[var(--color-fg-placeholder)] hover:text-[var(--color-fg-default)] transition-colors rounded hover:bg-[var(--color-bg-hover)]"
                  aria-label={t("character.detail.close")}
                >
                  <X size={20} strokeWidth={1.5} />
                </DialogPrimitive.Close>
              </div>
              <div className="flex items-center gap-2">
                <RoleSelector
                  value={editedCharacter.role}
                  onChange={(role) => handleFieldChange("role", role)}
                  layer="modal"
                />
                <div className="h-3 w-[1px] bg-[var(--color-border-hover)]" />
                <GroupSelector
                  value={editedCharacter.group}
                  onChange={(group) => handleFieldChange("group", group)}
                  layer="modal"
                />
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto scroll-shadow-y p-6 space-y-8">
            <CharacterBasicInfo
              character={editedCharacter}
              isExpanded={isProfileExpanded}
              onToggleExpand={() => setIsProfileExpanded((v) => !v)}
              contentId="character-profile-content"
              zodiacLabel={zodiacLabel}
              archetypeLabel={archetypeLabel}
              newTrait={newTrait}
              onNewTraitChange={setNewTrait}
              onAddTrait={handleAddTrait}
              onRemoveTrait={handleRemoveTrait}
              onTraitKeyDown={handleTraitKeyDown}
              newFeature={newFeature}
              onNewFeatureChange={setNewFeature}
              onAddFeature={handleAddFeature}
              onRemoveFeature={handleRemoveFeature}
              onFeatureKeyDown={handleFeatureKeyDown}
              onFieldChange={handleFieldChange}
            />
            <div className="space-y-3">
              <div className={sectionHeaderStyles}>
                {/* eslint-disable-next-line creonow/no-native-html-element -- semantic label, no Label primitive */}
                <label className={labelStyles}>
                  {t("character.detail.appearanceDescription")}
                </label>
              </div>
              <Textarea
                value={editedCharacter.description ?? ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                placeholder={t("character.detail.descriptionPlaceholder")}
                fullWidth
                className="min-h-20 focus:min-h-25 transition-[min-height] resize-none"
              />
            </div>
            <CharacterRelationships
              character={editedCharacter}
              availableCharacters={availableCharacters}
              onFieldChange={handleFieldChange}
              onRemoveRelationship={handleRemoveRelationship}
            />
            <CharacterAppearances
              appearances={editedCharacter.appearances}
              onNavigateToChapter={onNavigateToChapter}
              navigationWarning={navigationWarning}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] flex items-center justify-between shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-[var(--color-error)] opacity-60 hover:opacity-100"
            >
              <span className="inline-flex items-center gap-1.5">
                <Trash2 size={16} strokeWidth={1.5} />
                {t("character.detail.delete")}
              </span>
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                {t("character.detail.cancel")}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSave}>
                {t("character.detail.saveChanges")}
              </Button>
            </div>
          </div>

          <DialogPrimitive.Title className="sr-only">
            {t("character.detail.editCharacterTitle", {
              name: editedCharacter.name,
            })}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t("character.detail.editCharacterDescription")}
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

import { useTranslation } from "react-i18next";
import { Avatar, Button } from "../../components/primitives";
import { X } from "lucide-react";
import { AddRelationshipPopover } from "./AddRelationshipPopover";
import { labelStyles, sectionHeaderStyles } from "./character-detail-shared";
import type { Character, CharacterRelationship } from "./types";
import { ROLE_DISPLAY, RELATIONSHIP_TYPE_DISPLAY } from "./types";

function RelationshipItem({
  relationship,
  onRemove,
}: {
  relationship: CharacterRelationship;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const typeConfig = RELATIONSHIP_TYPE_DISPLAY[relationship.type];
  return (
    <div className="flex items-center justify-between p-3 hover:bg-[var(--color-bg-surface)] transition-colors group">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar
            src={relationship.characterAvatar}
            fallback={relationship.characterName}
            size="sm"
            className="grayscale opacity-60 border border-[var(--color-border-default)]"
          />
          <div className="absolute -bottom-1 -right-1 bg-[var(--color-bg-hover)] rounded-full p-[2px] border border-[var(--color-border-default)]">
            <div className={`w-2 h-2 rounded-full ${typeConfig.color}`} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[var(--color-fg-muted)]">
            {relationship.characterName}
          </span>
          <span className="text-[10px] text-[var(--color-fg-placeholder)]">
            {relationship.characterRole
              ? ROLE_DISPLAY[relationship.characterRole]?.label
              : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-medium text-[var(--color-fg-muted)] bg-[var(--color-bg-hover)] px-2 py-1 rounded border border-[var(--color-border-default)]">
          {typeConfig.label}
        </span>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="!p-0 !h-auto !w-auto !min-h-0 opacity-0 group-hover:opacity-100 text-[var(--color-fg-placeholder)] hover:text-[var(--color-error)] transition-[opacity,color]"
            aria-label={t("character.detail.removeRelationship", {
              name: relationship.characterName,
            })}
          >
            <X size={20} strokeWidth={1.5} />
          </Button>
        )}
      </div>
    </div>
  );
}

export interface CharacterRelationshipsProps {
  character: Character;
  availableCharacters: Character[] | undefined;
  onFieldChange: <K extends keyof Character>(
    field: K,
    value: Character[K],
  ) => void;
  onRemoveRelationship: (characterId: string) => void;
}

export function CharacterRelationships(
  props: CharacterRelationshipsProps,
): JSX.Element {
  const { t } = useTranslation();
  const c = props.character;
  const candidates = (props.availableCharacters ?? []).filter(
    (ch) => ch.id !== c.id,
  );

  return (
    <div className="space-y-3">
      <div className={sectionHeaderStyles}>
        {/* eslint-disable-next-line creonow/no-native-html-element -- semantic label, no Label primitive */}
        <label className={labelStyles}>
          {t("character.detail.relationships")}
        </label>
        {candidates.length > 0 ? (
          <AddRelationshipPopover
            availableCharacters={candidates}
            existingRelationships={c.relationships}
            onAdd={(relationship) =>
              props.onFieldChange("relationships", [
                ...c.relationships,
                relationship,
              ])
            }
            layer="modal"
          />
        ) : (
          <span className="text-[10px] text-[var(--color-fg-placeholder)]">
            {t("character.detail.noOtherCharacters")}
          </span>
        )}
      </div>
      {c.relationships.length > 0 ? (
        <div className="rounded-lg overflow-hidden bg-[var(--color-bg-base)] border border-[var(--color-bg-hover)] divide-y divide-[var(--color-bg-hover)]">
          {c.relationships.map((rel) => (
            <RelationshipItem
              key={rel.characterId}
              relationship={rel}
              onRemove={() => props.onRemoveRelationship(rel.characterId)}
            />
          ))}
        </div>
      ) : (
        <div className="text-xs text-[var(--color-fg-placeholder)] py-4 text-center border border-dashed border-[var(--color-border-default)] rounded-lg">
          {t("character.detail.noRelationships")}
        </div>
      )}
    </div>
  );
}

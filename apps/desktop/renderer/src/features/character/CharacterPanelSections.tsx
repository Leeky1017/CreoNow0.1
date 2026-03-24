import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "../../components/primitives/Button";
import { CharacterCard } from "./CharacterCard";
import type { Character, CharacterGroup } from "./types";

/**
 * Group characters by their group property
 */
export function groupCharacters(
  characters: Character[],
): Record<CharacterGroup, Character[]> {
  return characters.reduce(
    (acc, char) => {
      acc[char.group].push(char);
      return acc;
    },
    {
      main: [] as Character[],
      supporting: [] as Character[],
      others: [] as Character[],
    },
  );
}

/**
 * Group configuration for display
 */
function getGroupConfig(
  t: (key: string) => string,
): Record<CharacterGroup, { label: string }> {
  return {
    main: { label: t("character.panel.groupMain") },
    supporting: { label: t("character.panel.groupSupporting") },
    others: { label: t("character.panel.groupOthers") },
  };
}

/**
 * Plus icon button for adding characters
 */
export function AddCharacterButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={t("character.panel.addCharacter")}
    >
      <Plus size={16} strokeWidth={1.5} />
    </Button>
  );
}

/**
 * Empty state for a group with no characters
 */
function EmptyGroupState({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={[
        "!w-full",
        "!h-auto",
        "!px-4",
        "!py-8",
        "!border",
        "!border-dashed",
        "!border-[var(--color-border-default)]",
        "!rounded-[var(--radius-md)]",
        "!flex",
        "!flex-col",
        "!items-center",
        "!justify-center",
        "!gap-2",
        "!text-[var(--color-fg-placeholder)]",
        "hover:!text-[var(--color-fg-muted)]",
        "hover:!border-[var(--color-border-hover)]",
        "hover:!bg-[var(--color-bg-surface)]",
      ].join(" ")}
    >
      <span className="text-(--text-status)">
        {t("character.panel.noCharacters")}
      </span>
    </Button>
  );
}

/**
 * Character group section
 */
export function CharacterGroupSection({
  group,
  characters,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
}: {
  group: CharacterGroup;
  characters: Character[];
  selectedId?: string | null;
  onSelect?: (characterId: string) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  onCreate?: () => void;
}) {
  const { t } = useTranslation();
  const config = getGroupConfig(t)[group];

  return (
    <div>
      {/* Group header */}
      <div className="px-2 mb-3 flex items-center justify-between group">
        <div className="text-(--text-label) uppercase tracking-[0.1em] text-[var(--color-fg-placeholder)] font-semibold">
          {config.label}
        </div>
        <span className="text-(--text-label) text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-fg-muted)] transition-colors">
          {characters.length}
        </span>
      </div>

      {/* Character list */}
      <div className="space-y-1">
        {characters.length > 0 ? (
          characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              selected={selectedId === character.id}
              onClick={() => onSelect?.(character.id)}
              onEdit={() => onEdit?.(character)}
              onDelete={() => onDelete?.(character.id)}
            />
          ))
        ) : (
          <EmptyGroupState onClick={onCreate} />
        )}
      </div>
    </div>
  );
}

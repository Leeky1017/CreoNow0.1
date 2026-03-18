import { useTranslation } from "react-i18next";

import { EmptyState } from "../../components/patterns/EmptyState";

export interface CharacterCardSummary {
  id: string;
  name: string;
  typeLabel: string;
  avatarUrl?: string;
  keyAttributes: string[];
  relationSummary: string;
}

export interface CharacterCardListProps {
  cards: CharacterCardSummary[];
  onSelectCard?: (id: string) => void;
  onCreateCharacter?: () => void;
  className?: string;
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "?";
  }
  return trimmed.slice(0, 1).toUpperCase();
}

/**
 * CharacterCardList renders a concise card view for character entities.
 *
 * Why: KG2 requires `character` entry to present role summaries with clear CTA.
 */
export function CharacterCardList({
  cards,
  onSelectCard,
  onCreateCharacter,
  className = "",
}: CharacterCardListProps): JSX.Element {
  const { t } = useTranslation();

  if (cards.length === 0) {
    return (
      <section
        data-testid="character-card-list-empty"
        className={`h-full flex items-center justify-center p-4 bg-[var(--color-bg-base)] ${className}`}
      >
        <EmptyState
          variant="characters"
          title={t("character.cardList.emptyTitle")}
          description={t("character.cardList.emptyDescription")}
          actionLabel={t("character.cardList.createCharacter")}
          onAction={onCreateCharacter}
        />
      </section>
    );
  }

  return (
    <section
      data-testid="character-card-list"
      className={`h-full min-h-0 overflow-auto bg-[var(--color-bg-base)] p-3 space-y-3 ${className}`}
    >
      {cards.map((card) => (
        // eslint-disable-next-line creonow/no-native-html-element -- specialized button
        <button
          key={card.id}
          type="button"
          data-testid={`character-card-${card.id}`}
          onClick={() => onSelectCard?.(card.id)}
          className="focus-ring w-full text-left p-3 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)] transition-colors"
        >
          <div className="flex items-start gap-3">
            {card.avatarUrl ? (
              <img
                src={card.avatarUrl}
                alt={card.name}
                className="w-10 h-10 rounded-full object-cover border border-[var(--color-border-default)]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border border-[var(--color-border-default)] text-[var(--color-node-character)] bg-[var(--color-bg-base)]">
                {getInitial(card.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--color-fg-default)] truncate">
                  {card.name}
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-fg-subtle)] border border-[var(--color-border-default)]">
                  {card.typeLabel}
                </span>
              </div>

              <ul className="mt-2 space-y-1">
                {card.keyAttributes.map((attribute) => (
                  <li
                    key={`${card.id}-${attribute}`}
                    className="text-xs text-[var(--color-fg-subtle)]"
                  >
                    {attribute}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
                {card.relationSummary}
              </p>
            </div>
          </div>
        </button>
      ))}
    </section>
  );
}

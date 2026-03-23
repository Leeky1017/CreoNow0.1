import { Avatar } from "../../components/primitives";
import type { Character, CharacterRole } from "./types";
import { ROLE_DISPLAY } from "./types";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/primitives/Button";

export interface CharacterCardProps {
  /** Character data */
  character: Character;
  /** Whether this character is selected */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Edit handler */
  onEdit?: () => void;
  /** Delete handler */
  onDelete?: () => void;
}

/**
 * Get role color class
 */
function getRoleColorClass(role: CharacterRole): string {
  return ROLE_DISPLAY[role]?.color ?? "text-[var(--color-fg-muted)]";
}

/**
 * Edit icon SVG
 */
function EditIcon() {
  return <Pencil size={16} strokeWidth={1.5} />;
}

/**
 * Delete icon SVG
 */
function DeleteIcon() {
  return <Trash2 size={16} strokeWidth={1.5} />;
}

/**
 * CharacterCard - A list item for displaying a character in the sidebar
 *
 * Features:
 * - Avatar with fallback to initials
 * - Role badge with color coding
 * - Hover state with edit/delete actions
 * - Selected state with left border indicator
 *
 * @example
 * ```tsx
 * <CharacterCard
 *   character={elara}
 *   selected={selectedId === elara.id}
 *   onClick={() => setSelectedId(elara.id)}
 *   onEdit={() => openEditDialog(elara)}
 *   onDelete={() => confirmDelete(elara)}
 * />
 * ```
 */
export function CharacterCard({
  character,
  selected = false,
  onClick,
  onEdit,
  onDelete,
}: CharacterCardProps): JSX.Element {
  const roleLabel = ROLE_DISPLAY[character.role]?.label ?? character.role;
  const roleColorClass = getRoleColorClass(character.role);

  return (
    <div className="group relative">
      {/* Selected indicator (blue left border) */}
      {selected && (
        <div
          // eslint-disable-next-line creonow/no-hardcoded-dimension -- 3px has no standard Tailwind utility
          className="absolute left-[-1px] top-1 bottom-1 w-[3px] bg-[var(--color-info)] rounded-r-sm"
          data-testid="character-card-selected-indicator"
        />
      )}
      {/* 审计：v1-13 #1237 KEEP */}
      {/* eslint-disable-next-line creonow/no-native-html-element -- CharacterCard uses a primary native button with sibling actions so edit/delete controls are not nested inside another interactive element */}
      <button
        type="button"
        onClick={onClick}
        className={[
          "flex",
          "w-full",
          "items-center",
          "gap-3",
          "p-2",
          "rounded-[var(--radius-md)]",
          "border",
          "cursor-pointer",
          "relative",
          "transition-colors",
          "duration-[var(--duration-normal)]",
          "focus-visible:outline",
          "focus-visible:outline-[length:var(--ring-focus-width)]",
          "focus-visible:outline-offset-[var(--ring-focus-offset)]",
          "focus-visible:outline-[var(--color-ring-focus)]",
          onEdit || onDelete ? "pr-20" : "",
          selected
            ? [
                "bg-[var(--color-bg-hover)]",
                "border-[var(--color-border-hover)]",
              ].join(" ")
            : [
                "border-transparent",
                "hover:bg-[var(--color-bg-raised)]",
                "hover:border-[var(--color-border-default)]",
              ].join(" "),
        ]
          .filter(Boolean)
          .join(" ")}
        data-testid="character-card"
        aria-pressed={selected}
      >
        <Avatar
          src={character.avatarUrl}
          fallback={character.name}
          size="sm"
          className={[
            "border",
            "border-[var(--color-border-default)]",
            selected
              ? "opacity-90"
              : "opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100",
            "transition-[filter,opacity]",
          ].join(" ")}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={[
              "text-sm",
              "font-medium",
              "leading-none",
              "truncate",
              "transition-colors",
              selected
                ? "text-[var(--color-fg-default)]"
                : "text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)]",
            ].join(" ")}
          >
            {character.name}
          </span>
          <span
            className={[
              "text-(--text-status)",
              "mt-1.5",
              "truncate",
              "transition-colors",
              selected
                ? roleColorClass
                : "text-[var(--color-fg-subtle)] group-hover:text-[var(--color-fg-muted)]",
            ].join(" ")}
          >
            {roleLabel}
          </span>
        </div>
      </button>

      <div
        className={[
          "absolute",
          "right-2",
          "top-1/2",
          "-translate-y-1/2",
          "flex",
          "gap-1",
          "transition-opacity",
          "pl-2",
          selected
            ? "opacity-100 bg-[var(--color-bg-hover)]"
            : "opacity-0 group-hover:opacity-100 bg-[var(--color-bg-raised)]",
          "shadow-[-4px_0_4px_-2px_var(--color-shadow)]",
        ].join(" ")}
      >
        {onEdit && (
          <Button
            type="button"
            onClick={onEdit}
            className={[
              "focus-ring",
              "p-1.5",
              "rounded",
              "text-[var(--color-fg-placeholder)]",
              "hover:text-[var(--color-fg-default)]",
              "hover:bg-[var(--color-bg-hover)]",
              "transition-colors",
            ].join(" ")}
            aria-label={`Edit ${character.name}`}
          >
            <EditIcon />
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            onClick={onDelete}
            className={[
              "focus-ring",
              "p-1.5",
              "rounded",
              "text-[var(--color-fg-placeholder)]",
              "hover:text-[var(--color-error)]",
              "hover:bg-[var(--color-bg-hover)]",
              "transition-colors",
            ].join(" ")}
            aria-label={`Delete ${character.name}`}
          >
            <DeleteIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

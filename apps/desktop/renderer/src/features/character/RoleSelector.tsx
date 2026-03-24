/**
 * RoleSelector component
 *
 * A popover component for selecting character role type.
 * Displays all available roles (Protagonist, Antagonist, etc.) with color-coded options.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Popover } from "../../components/primitives";
import type { CharacterRole } from "./types";
import { ROLE_DISPLAY } from "./types";
import { Button } from "../../components/primitives/Button";

export interface RoleSelectorProps {
  /** Current role value */
  value: CharacterRole;
  /** Callback when role changes */
  onChange: (role: CharacterRole) => void;
  /** Optional portal container for popover content */
  portalContainer?: HTMLElement | null;
  /** Z-layer for popover content */
  layer?: "popover" | "modal";
}

/**
 * All available character roles
 */
const ROLE_OPTIONS: CharacterRole[] = [
  "protagonist",
  "antagonist",
  "deuteragonist",
  "mentor",
  "ally",
];

/**
 * RoleSelector - Popover for selecting character role type
 *
 * Features:
 * - Displays current role as a clickable badge
 * - Opens popover with all role options
 * - Color-coded options matching role colors
 * - Selected state indicator
 *
 * @example
 * ```tsx
 * <RoleSelector
 *   value={character.role}
 *   onChange={(role) => setCharacter({ ...character, role })}
 * />
 * ```
 */
export function RoleSelector({
  value,
  onChange,
  portalContainer,
  layer = "popover",
}: RoleSelectorProps): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const currentRole = ROLE_DISPLAY[value];

  const handleSelect = (role: CharacterRole) => {
    onChange(role);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      layer={layer}
      portalContainer={portalContainer}
      trigger={
        <Button
          type="button"
          className={[
            "bg-[var(--color-info-subtle)]",
            currentRole.color,
            "border",
            "border-[var(--color-info)]/30",
            "px-2",
            "py-0.5",
            "rounded",
            "text-(--text-status)",
            "font-medium",
            "uppercase",
            "tracking-wide",
            "cursor-pointer",
            "hover:border-[var(--color-info)]/50",
            "transition-colors",
          ].join(" ")}
        >
          {currentRole.label}
        </Button>
      }
      align="start"
      sideOffset={4}
    >
      <div className="min-w-40 py-1 -mx-2 -my-2">
        <div className="text-(--text-label) uppercase tracking-(--tracking-wider) text-[var(--color-fg-placeholder)] px-3 py-2 font-semibold">
          {t("character.roleSelector.selectRole")}
        </div>
        {ROLE_OPTIONS.map((role) => {
          const config = ROLE_DISPLAY[role];
          const isSelected = role === value;
          return (
            <Button
              key={role}
              type="button"
              onClick={() => handleSelect(role)}
              className={[
                "w-full",
                "text-left",
                "px-3",
                "py-2",
                "text-sm",
                "rounded-sm",
                "hover:bg-[var(--color-bg-hover)]",
                "transition-colors",
                "flex",
                "items-center",
                "gap-2",
                config.color,
                isSelected ? "bg-[var(--color-bg-hover)]" : "",
              ].join(" ")}
            >
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              )}
              <span className={isSelected ? "" : "ml-[14px]"}>
                {config.label}
              </span>
            </Button>
          );
        })}
      </div>
    </Popover>
  );
}

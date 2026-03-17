/**
 * GroupSelector component
 *
 * A popover component for selecting character group category.
 * Displays all available groups (Main Cast, Supporting, Others).
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Popover } from "../../components/primitives";
import type { CharacterGroup } from "./types";
import { GROUP_OPTIONS } from "./types";

export interface GroupSelectorProps {
  /** Current group value */
  value: CharacterGroup;
  /** Callback when group changes */
  onChange: (group: CharacterGroup) => void;
  /** Optional portal container for popover content */
  portalContainer?: HTMLElement | null;
  /** Z-layer for popover content */
  layer?: "popover" | "modal";
}

/**
 * GroupSelector - Popover for selecting character group
 *
 * Features:
 * - Displays current group as a clickable tag
 * - Opens popover with all group options
 * - Selected state indicator
 *
 * @example
 * ```tsx
 * <GroupSelector
 *   value={character.group}
 *   onChange={(group) => setCharacter({ ...character, group })}
 * />
 * ```
 */
export function GroupSelector({
  value,
  onChange,
  portalContainer,
  layer = "popover",
}: GroupSelectorProps): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const currentGroup = GROUP_OPTIONS.find((g) => g.value === value);

  const handleSelect = (group: CharacterGroup) => {
    onChange(group);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      layer={layer}
      portalContainer={portalContainer}
      trigger={
        // eslint-disable-next-line creonow/no-native-html-element -- specialized button
        <button
          type="button"
          className={[
            "text-[var(--color-fg-placeholder)]",
            "text-xs",
            "px-2",
            "py-0.5",
            "border",
            "border-[var(--color-border-default)]",
            "rounded",
            "cursor-pointer",
            "hover:border-[var(--color-border-hover)]",
            "hover:text-[var(--color-fg-muted)]",
            "transition-colors",
            "bg-[var(--color-bg-base)]",
          ].join(" ")}
        >
          {currentGroup?.label}
        </button>
      }
      align="start"
      sideOffset={4}
    >
      <div className="min-w-35 py-1 -mx-2 -my-2">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-placeholder)] px-3 py-2 font-semibold">
          {t("character.groupSelector.selectGroup")}
        </div>
        {GROUP_OPTIONS.map((group) => {
          const isSelected = group.value === value;
          return (
            // eslint-disable-next-line creonow/no-native-html-element -- specialized button
            <button
              key={group.value}
              type="button"
              onClick={() => handleSelect(group.value)}
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
                isSelected
                  ? "bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]"
                  : "text-[var(--color-fg-muted)]",
              ].join(" ")}
            >
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-info)] shrink-0" />
              )}
              <span className={isSelected ? "" : "ml-[14px]"}>
                {group.label}
              </span>
            </button>
          );
        })}
      </div>
    </Popover>
  );
}

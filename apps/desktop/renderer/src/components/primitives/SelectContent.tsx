/**
 * SelectContent — dropdown content, viewport, items, and icons.
 *
 * Extracted from Select.tsx to satisfy AC-19 (≤200 lines per file).
 */
import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import type { SelectOption, SelectGroup } from "./Select";

/**
 * Check if options are grouped
 */
export function isGrouped(
  options: SelectOption[] | SelectGroup[],
): options is SelectGroup[] {
  return options.length > 0 && "options" in options[0];
}

/**
 * Content styles — dropdown with shadow-md (§3.7, §5.2)
 */
const contentStyles = [
  "pointer-events-auto overflow-hidden",
  "bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]",
  "rounded-[var(--radius-md)] shadow-[var(--shadow-md)]",
  "transition-[opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100 data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
].join(" ");

const viewportStyles = "p-1 max-h-75 overflow-y-auto";

const itemStyles = [
  "relative flex items-center h-8 px-8 pr-3",
  "text-(--text-body) text-[var(--color-fg-default)]",
  "rounded-[var(--radius-sm)] cursor-pointer select-none outline-none",
  "data-[highlighted]:bg-[var(--color-bg-hover)]",
  "data-[state=checked]:text-[var(--color-fg-default)] data-[state=checked]:font-medium",
  "data-[disabled]:text-[var(--color-fg-disabled)] data-[disabled]:pointer-events-none",
].join(" ");

const groupLabelStyles =
  "px-8 py-2 text-xs font-medium text-[var(--color-fg-subtle)] uppercase tracking-[0.1em]";
const separatorStyles = "h-px my-1 bg-[var(--color-separator)]";

function CheckIcon() {
  return (
    <svg
      className="absolute left-2 w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8L6.5 11.5L13 5" />
    </svg>
  );
}

export function getZIndexClass(layer: "dropdown" | "modal"): string {
  return layer === "modal" ? "z-[var(--z-modal)]" : "z-[var(--z-dropdown)]";
}

export interface SelectContentSectionProps {
  options: SelectOption[] | SelectGroup[];
  layer: "dropdown" | "modal";
  portalContainer?: HTMLElement | null;
}

/**
 * SelectContentSection renders the portal + content + viewport + items.
 */
export function SelectContentSection({
  options,
  layer,
  portalContainer,
}: SelectContentSectionProps): JSX.Element {
  const contentClassName = `${getZIndexClass(layer)} ${contentStyles}`;

  return (
    <SelectPrimitive.Portal container={portalContainer ?? undefined}>
      <SelectPrimitive.Content className={contentClassName} position="popper">
        <SelectPrimitive.Viewport className={viewportStyles}>
          {isGrouped(options)
            ? options.map((group, groupIndex) => (
                <React.Fragment key={group.label}>
                  {groupIndex > 0 && (
                    <SelectPrimitive.Separator className={separatorStyles} />
                  )}
                  <SelectPrimitive.Group>
                    <SelectPrimitive.Label className={groupLabelStyles}>
                      {group.label}
                    </SelectPrimitive.Label>
                    {group.options.map((option) => (
                      <SelectPrimitive.Item
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={itemStyles}
                      >
                        <SelectPrimitive.ItemIndicator>
                          <CheckIcon />
                        </SelectPrimitive.ItemIndicator>
                        <SelectPrimitive.ItemText>
                          {option.label}
                        </SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Group>
                </React.Fragment>
              ))
            : options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={itemStyles}
                >
                  <SelectPrimitive.ItemIndicator>
                    <CheckIcon />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useTranslation } from "react-i18next";

/**
 * Select option item
 */
export interface SelectOption {
  /** Unique value for this option */
  value: string;
  /** Display label */
  label: string;
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * Select option group
 */
export interface SelectGroup {
  /** Group label */
  label: string;
  /** Options in this group */
  options: SelectOption[];
}

/**
 * Select component props
 *
 * A dropdown select component built on Radix UI Select primitive.
 * Implements z-index dropdown (200) and shadow-md (§3.7, §5.2).
 */
export interface SelectProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
  "children" | "asChild"
> {
  /** Current value (controlled) */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Options or grouped options */
  options: SelectOption[] | SelectGroup[];
  /** Disabled state */
  disabled?: boolean;
  /** Name for form submission */
  name?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Custom class name for trigger */
  className?: string;
  /**
   * Z-layer for dropdown content.
   * - "dropdown": default layer using `--z-dropdown`
   * - "modal": render above modal overlay/content (`--z-modal`)
   */
  layer?: "dropdown" | "modal";
  /** Optional portal container for rendering dropdown content */
  portalContainer?: HTMLElement | null;
}

/**
 * Check if options are grouped
 */
function isGrouped(
  options: SelectOption[] | SelectGroup[],
): options is SelectGroup[] {
  return options.length > 0 && "options" in options[0];
}

/**
 * Trigger styles - matches Input style (§6.2)
 */
const triggerStyles = [
  "inline-flex",
  "items-center",
  "justify-between",
  "gap-2",
  "h-10",
  "px-3",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-sm)]",
  "text-[13px]",
  "text-[var(--color-fg-default)]",
  "cursor-pointer",
  "select-none",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  // Hover
  "hover:border-[var(--color-border-hover)]",
  // Focus visible
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  "focus-visible:border-[var(--color-border-focus)]",
  // Disabled
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
  // Placeholder
  "data-[placeholder]:text-[var(--color-fg-placeholder)]",
].join(" ");

/**
 * Content styles - dropdown with shadow-md (§3.7, §5.2)
 *
 * Uses CSS transitions for animation (no tailwindcss-animate dependency).
 */
const contentStyles = [
  "pointer-events-auto",
  "overflow-hidden",
  // Visual
  "bg-[var(--color-bg-raised)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-md)]",
  "shadow-[var(--shadow-md)]",
  // Animation via CSS transition
  "transition-[opacity,transform]",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95",
].join(" ");

/**
 * Get z-index class based on layer.
 */
function getZIndexClass(layer: "dropdown" | "modal"): string {
  return layer === "modal" ? "z-[var(--z-modal)]" : "z-[var(--z-dropdown)]";
}

/**
 * Viewport styles
 */
// eslint-disable-next-line creonow/no-hardcoded-dimension -- Design spec §6.6: max dropdown height
const viewportStyles = "p-1 max-h-[300px] overflow-y-auto";

/**
 * Item styles - list item (§6.4)
 */
const itemStyles = [
  "relative",
  "flex",
  "items-center",
  "h-8",
  "px-8",
  "pr-3",
  "text-[13px]",
  "text-[var(--color-fg-default)]",
  "rounded-[var(--radius-sm)]",
  "cursor-pointer",
  "select-none",
  "outline-none",
  // Hover & Focus
  "data-[highlighted]:bg-[var(--color-bg-hover)]",
  // Selected
  "data-[state=checked]:text-[var(--color-fg-default)]",
  "data-[state=checked]:font-medium",
  // Disabled
  "data-[disabled]:text-[var(--color-fg-disabled)]",
  "data-[disabled]:pointer-events-none",
].join(" ");

/**
 * Group label styles
 */
const groupLabelStyles = [
  "px-8",
  "py-2",
  "text-xs",
  "font-medium",
  "text-[var(--color-fg-subtle)]",
  "uppercase",
  "tracking-[0.1em]",
].join(" ");

/**
 * Separator styles
 */
const separatorStyles = "h-px my-1 bg-[var(--color-separator)]";

/**
 * Chevron icon
 */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6L8 10L12 6" />
    </svg>
  );
}

/**
 * Check icon for selected item
 */
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

/**
 * Select component following design spec §5.2, §6.2
 *
 * A dropdown select built on Radix UI Select for proper accessibility and keyboard navigation.
 * Supports flat options or grouped options.
 *
 * @example
 * ```tsx
 * <Select
 *   placeholder="Select a color"
 *   options={[
 *     { value: 'red', label: 'Red' },
 *     { value: 'blue', label: 'Blue' },
 *     { value: 'green', label: 'Green' },
 *   ]}
 *   value={color}
 *   onValueChange={setColor}
 * />
 *
 * // With groups
 * <Select
 *   placeholder="Select a fruit"
 *   options={[
 *     { label: 'Citrus', options: [{ value: 'orange', label: 'Orange' }] },
 *     { label: 'Berries', options: [{ value: 'strawberry', label: 'Strawberry' }] },
 *   ]}
 * />
 * ```
 */
export function Select({
  value,
  onValueChange,
  defaultValue,
  placeholder,
  options,
  disabled = false,
  name,
  fullWidth = false,
  className = "",
  layer = "dropdown",
  portalContainer,
  ...triggerProps
}: SelectProps): JSX.Element {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("primitives.select.placeholder");
  const contentClassName = [getZIndexClass(layer), contentStyles].join(" ");
  const triggerClasses = [triggerStyles, fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        {...triggerProps}
        disabled={disabled}
        className={triggerClasses}
      >
        <SelectPrimitive.Value placeholder={resolvedPlaceholder} />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="text-[var(--color-fg-muted)]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

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
    </SelectPrimitive.Root>
  );
}

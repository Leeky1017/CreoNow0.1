/**
 * Select — trigger + root wrapper.
 *
 * Dropdown content extracted to SelectContent.tsx (AC-19).
 */
import * as SelectPrimitive from "@radix-ui/react-select";
import { useTranslation } from "react-i18next";
import { SelectContentSection } from "./SelectContent";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
  "children" | "asChild"
> {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  options: SelectOption[] | SelectGroup[];
  disabled?: boolean;
  name?: string;
  fullWidth?: boolean;
  className?: string;
  layer?: "dropdown" | "modal";
  portalContainer?: HTMLElement | null;
}

const triggerStyles = [
  "inline-flex items-center justify-between gap-2 h-10 px-3",
  "bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]",
  "rounded-[var(--radius-sm)] text-[13px] text-[var(--color-fg-default)]",
  "cursor-pointer select-none transition-colors duration-[var(--duration-fast)]",
  "hover:border-[var(--color-border-hover)]",
  "focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
  "focus-visible:border-[var(--color-border-focus)]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "data-[placeholder]:text-[var(--color-fg-placeholder)]",
].join(" ");

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
 * Select component following design spec §5.2, §6.2
 *
 * @example
 * ```tsx
 * <Select
 *   placeholder="Select a color"
 *   options={[
 *     { value: 'red', label: 'Red' },
 *     { value: 'blue', label: 'Blue' },
 *   ]}
 *   value={color}
 *   onValueChange={setColor}
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
  const resolvedAriaLabel =
    triggerProps["aria-label"] ??
    (!triggerProps["aria-labelledby"] ? resolvedPlaceholder : undefined);
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
        aria-label={resolvedAriaLabel}
      >
        <SelectPrimitive.Value placeholder={resolvedPlaceholder} />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="text-[var(--color-fg-muted)]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectContentSection
        options={options}
        layer={layer}
        portalContainer={portalContainer}
      />
    </SelectPrimitive.Root>
  );
}

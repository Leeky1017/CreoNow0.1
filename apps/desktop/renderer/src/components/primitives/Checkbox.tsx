import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

/**
 * Checkbox component props
 *
 * A checkbox component built on Radix UI Checkbox primitive.
 * Supports checked, unchecked, and indeterminate states.
 */
export interface CheckboxProps extends Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  "children" | "asChild"
> {
  /** Optional label text */
  label?: string;
}

/**
 * Checkbox root styles
 *
 * Uses "group" class to allow child icons to respond to data-state
 */
const checkboxStyles = [
  "group",
  "peer",
  "shrink-0",
  "inline-flex",
  "items-center",
  "justify-center",
  "w-5",
  "h-5",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-sm)]",
  "cursor-pointer",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  // Hover
  "hover:border-[var(--color-border-hover)]",
  // Checked state
  "data-[state=checked]:bg-[var(--color-fg-default)]",
  "data-[state=checked]:border-[var(--color-fg-default)]",
  "data-[state=indeterminate]:bg-[var(--color-fg-default)]",
  "data-[state=indeterminate]:border-[var(--color-fg-default)]",
  // Focus visible
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  // Disabled
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
].join(" ");

/**
 * Indicator styles (the check mark container)
 */
const indicatorStyles = [
  "flex",
  "items-center",
  "justify-center",
  "text-[var(--color-fg-inverse)]",
].join(" ");

/**
 * Label styles
 */
const labelStyles = [
  "text-(--text-body)",
  "text-[var(--color-fg-default)]",
  "select-none",
  "cursor-pointer",
  // Disabled peer state
  "peer-disabled:opacity-50",
  "peer-disabled:cursor-not-allowed",
].join(" ");

/**
 * Check icon (for checked state)
 *
 * Hidden when parent has data-state="indeterminate"
 */
function CheckIcon() {
  return (
    <svg
      className="hidden group-data-[state=checked]:block"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7L6 10L11 4" />
    </svg>
  );
}

/**
 * Minus icon (for indeterminate state)
 *
 * Hidden when parent has data-state="checked"
 */
function MinusIcon() {
  return (
    <svg
      className="hidden group-data-[state=indeterminate]:block"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 7H11" />
    </svg>
  );
}

/**
 * Checkbox component
 *
 * A checkbox built on Radix UI Checkbox for proper accessibility and keyboard support.
 * Supports checked, unchecked, and indeterminate states.
 *
 * @example
 * ```tsx
 * // Simple checkbox
 * <Checkbox label="Accept terms" />
 *
 * // Controlled checkbox
 * <Checkbox
 *   checked={accepted}
 *   onCheckedChange={setAccepted}
 *   label="I agree to the terms"
 * />
 *
 * // Indeterminate state (useful for "select all")
 * <Checkbox
 *   checked={allSelected ? true : someSelected ? 'indeterminate' : false}
 *   onCheckedChange={(checked) => setAll(checked === true)}
 *   label="Select all"
 * />
 * ```
 */
export function Checkbox({
  id,
  label,
  className = "",
  ...rootProps
}: CheckboxProps): JSX.Element {
  const generatedId = React.useId();
  const checkboxId = id ?? generatedId;

  const checkboxElement = (
    <CheckboxPrimitive.Root
      {...rootProps}
      id={checkboxId}
      className={`${checkboxStyles} ${className}`}
    >
      <CheckboxPrimitive.Indicator className={indicatorStyles} forceMount>
        <CheckIcon />
        <MinusIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (label) {
    return (
      <div className="flex items-center gap-2">
        {checkboxElement}
        {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: no Label primitive exists */}
        <label htmlFor={checkboxId} className={labelStyles}>
          {label}
        </label>
      </div>
    );
  }

  return checkboxElement;
}

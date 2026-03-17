import React from "react";

/**
 * Toggle component props
 *
 * A toggle switch component for boolean settings.
 * Based on design spec toggle style from 10-settings.html
 */
export interface ToggleProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Unique ID for label association */
  id?: string;
  /** Optional label text */
  label?: string;
  /** Optional description text */
  description?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Toggle track styles
 *
 * Uses design spec style:
 * - Off: bg-[#1a1a1a] border-[#333]
 * - On: bg-white border-white
 */
const trackStyles = [
  "relative",
  "inline-flex",
  "items-center",
  "w-11",
  "h-6",
  "rounded-full",
  "border",
  "cursor-pointer",
  "transition-all",
  "duration-[var(--duration-slow)]",
  "ease-[var(--ease-default)]",
  "shrink-0",
  // Focus visible
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

/**
 * Toggle thumb styles
 *
 * Uses design spec style:
 * - Off: bg-[#666]
 * - On: bg-black, translate-x-[20px]
 */
const thumbStyles = [
  "absolute",
  "left-[3px]",
  "w-[18px]",
  "h-[18px]",
  "rounded-full",
  "transition-all",
  "duration-[var(--duration-slow)]",
  "pointer-events-none",
].join(" ");

/**
 * Label styles
 */
const labelStyles = [
  "text-[14px]",
  "text-[var(--color-fg-default)]",
  "font-medium",
  "select-none",
].join(" ");

/**
 * Description styles
 */
const descriptionStyles = [
  "text-[13px]",
  "text-[var(--color-fg-subtle)]",
  "leading-relaxed",
].join(" ");

/**
 * Toggle component for boolean settings
 *
 * A styled toggle switch based on the settings dialog design.
 * Supports controlled and uncontrolled usage.
 *
 * @example
 * ```tsx
 * // Simple toggle
 * <Toggle checked={enabled} onCheckedChange={setEnabled} />
 *
 * // With label and description
 * <Toggle
 *   label="Focus Mode"
 *   description="Dims all interface elements except the editor"
 *   checked={focusMode}
 *   onCheckedChange={setFocusMode}
 * />
 * ```
 */
export function Toggle({
  checked,
  onCheckedChange,
  defaultChecked = false,
  disabled = false,
  id,
  label,
  description,
  className = "",
}: ToggleProps): JSX.Element {
  const generatedId = React.useId();
  const toggleId = id ?? generatedId;

  // Internal state for uncontrolled usage
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);

  // Use controlled value if provided, otherwise use internal state
  const isChecked = checked !== undefined ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;

    const newChecked = !isChecked;

    // Update internal state for uncontrolled usage
    if (checked === undefined) {
      setInternalChecked(newChecked);
    }

    // Call callback if provided
    onCheckedChange?.(newChecked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  const trackClasses = [
    trackStyles,
    isChecked
      ? "bg-[var(--color-fg-default)] border-[var(--color-fg-default)]"
      : "bg-[var(--color-bg-hover)] border-[var(--color-border-default)]",
    disabled ? "opacity-50 cursor-not-allowed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const thumbClasses = [
    thumbStyles,
    isChecked
      ? "translate-x-[20px] bg-[var(--color-fg-inverse)]"
      : "translate-x-0 bg-[var(--color-fg-subtle)]",
  ].join(" ");

  const toggleElement = (
    // eslint-disable-next-line creonow/no-native-html-element -- Primitive: Toggle wraps native <button> for switch semantics
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      id={toggleId}
      disabled={disabled}
      className={trackClasses}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <span className={thumbClasses} />
    </button>
  );

  if (label || description) {
    return (
      <div className="flex items-start justify-between gap-4 group">
        <div className="flex flex-col gap-1">
          {label && (
            // eslint-disable-next-line creonow/no-native-html-element -- Primitive: no Label primitive exists
            <label
              htmlFor={toggleId}
              className={`${labelStyles} ${disabled ? "opacity-50" : ""} cursor-pointer`}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              className={`${descriptionStyles} ${disabled ? "opacity-50" : ""}`}
            >
              {description}
            </p>
          )}
        </div>
        {toggleElement}
      </div>
    );
  }

  return toggleElement;
}

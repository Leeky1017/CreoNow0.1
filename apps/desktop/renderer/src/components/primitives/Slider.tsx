import React from "react";

/**
 * Slider component props
 *
 * A range slider component for numeric values.
 * Based on design spec style from 10-settings.html
 */
export interface SliderProps {
  /** Current value (controlled) */
  value?: number;
  /** Callback when value changes */
  onValueChange?: (value: number) => void;
  /** Default value (uncontrolled) */
  defaultValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Show min/max labels */
  showLabels?: boolean;
  /** Format function for labels */
  formatLabel?: (value: number) => string;
  /** Custom class name */
  className?: string;
  /** Accessible label for the slider */
  "aria-label"?: string;
  /** ID of element that labels this slider */
  "aria-labelledby"?: string;
}

/**
 * Track styles
 */
const trackStyles = [
  "relative",
  "flex-1",
  "h-0.5",
  "bg-[var(--color-border-default)]",
  "rounded-full",
].join(" ");

/**
 * Thumb styles (design spec: 12px round white thumb with black border)
 */
const thumbStyles = [
  "absolute",
  "top-1/2",
  "-translate-y-1/2",
  "w-3",
  "h-3",
  "rounded-full",
  "bg-[var(--color-fg-default)]",
  "border",
  "border-[var(--color-fg-inverse)]",
  "cursor-pointer",
  "transition-shadow",
  "duration-[var(--duration-fast)]",
  // Hover and focus
  // 审计：v1-18i #1255 KEEP
  // eslint-disable-next-line creonow/no-raw-tailwind-tokens -- 技术原因：滑块轨道需要使用特殊 focus ring shadow 实现焦点视觉反馈，无法用标准 shadow token 替代
  "hover:shadow-[0_0_0_4px_var(--color-bg-surface)]",
  // Focus visible
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

/**
 * Label styles
 */
const labelStyles = [
  "text-(--text-status)",
  "text-[var(--color-fg-placeholder)]",
].join(" ");

/**
 * Default format function for percentage
 */
const defaultFormatLabel = (value: number) => `${value}%`;

/**
 * Slider component for numeric range values
 *
 * A styled range slider based on the settings dialog design.
 *
 * @example
 * ```tsx
 * <Slider
 *   min={80}
 *   max={120}
 *   step={10}
 *   value={scale}
 *   onValueChange={setScale}
 *   showLabels
 * />
 * ```
 */
export function Slider({
  value,
  onValueChange,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showLabels = false,
  formatLabel = defaultFormatLabel,
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SliderProps): JSX.Element {
  // Internal state for uncontrolled usage
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? min);

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const newValue = Number(e.target.value);

    // Update internal state for uncontrolled usage
    if (value === undefined) {
      setInternalValue(newValue);
    }

    // Call callback if provided
    onValueChange?.(newValue);
  };

  // Calculate thumb position percentage
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const containerClasses = [
    "flex",
    "items-center",
    "gap-3",
    disabled ? "opacity-50 cursor-not-allowed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {showLabels && <span className={labelStyles}>{formatLabel(min)}</span>}

      <div className="relative flex-1 h-5 flex items-center">
        {/* Track background */}
        <div className={trackStyles}>
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-fg-subtle)] rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: Slider uses native <input type="range"> for a11y */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
        />

        {/* Custom thumb */}
        <div
          className={thumbStyles}
          style={{
            left: `calc(${percentage}% - 6px)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {showLabels && <span className={labelStyles}>{formatLabel(max)}</span>}
    </div>
  );
}

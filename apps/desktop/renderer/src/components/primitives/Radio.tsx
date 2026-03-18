/**
 * RadioGroup — group container for radio buttons.
 *
 * Refactored: RadioItem, RadioCardGroup, RadioCardItem → RadioItem.tsx
 *             Shared types & styles → useRadioGroup.ts
 */
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import {
  type RadioOption,
  type RadioSize,
  sizeStyles,
  radioItemStyles,
} from "./useRadioGroup";
import { RadioIndicator } from "./RadioItem";

// Re-export everything consumers need
export type { RadioOption, RadioCardOption, RadioSize } from "./useRadioGroup";
export type {
  RadioProps,
  RadioCardGroupProps,
  RadioCardItemProps,
} from "./RadioItem";
export { Radio, RadioCardGroup, RadioCardItem } from "./RadioItem";

// =============================================================================
// RadioGroupProps
// =============================================================================

export interface RadioGroupProps {
  /** Array of radio options */
  options: RadioOption[];
  /** Current selected value */
  value?: string;
  /** Default selected value */
  defaultValue?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Name attribute for form submission */
  name?: string;
  /** Whether the group is disabled */
  disabled?: boolean;
  /** Orientation of the radio group */
  orientation?: "horizontal" | "vertical";
  /** Additional className for root */
  className?: string;
  /** Size of the radio buttons */
  size?: RadioSize;
}

// =============================================================================
// RadioGroup
// =============================================================================

/**
 * RadioGroup component using Radix UI
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { value: "light", label: "Light" },
 *     { value: "dark", label: "Dark" },
 *   ]}
 *   value={theme}
 *   onValueChange={setTheme}
 * />
 * ```
 */
export function RadioGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  orientation = "vertical",
  className = "",
  size = "md",
}: RadioGroupProps): JSX.Element {
  const styles = sizeStyles[size];

  const rootClasses = [
    "flex",
    orientation === "horizontal" ? "flex-row gap-6" : "flex-col gap-3",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const radioStyles = [styles.radio, ...radioItemStyles].join(" ");

  return (
    <RadioGroupPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
      orientation={orientation}
      className={rootClasses}
    >
      {options.map((option) => (
        <div key={option.value} className={`flex items-start ${styles.gap}`}>
          <RadioGroupPrimitive.Item
            value={option.value}
            disabled={option.disabled}
            id={`radio-${name || "group"}-${option.value}`}
            className={radioStyles}
          >
            <RadioIndicator size={size} />
          </RadioGroupPrimitive.Item>
          <div className="flex flex-col">
            {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: no Label primitive exists */}
            <label
              htmlFor={`radio-${name || "group"}-${option.value}`}
              className={`${styles.label} text-[var(--color-fg-default)] cursor-pointer ${
                option.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {option.label}
            </label>
            {option.description && (
              <span
                className={`${styles.description} text-[var(--color-fg-muted)] mt-0.5`}
              >
                {option.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

/**
 * Re-export RadioGroup Root for custom layouts
 */
export const RadioGroupRoot = RadioGroupPrimitive.Root;

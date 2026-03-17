import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

export interface RadioOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

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
  size?: "sm" | "md";
}

/**
 * Radio indicator icon
 */
function RadioIndicator({ size }: { size: "sm" | "md" }) {
  const indicatorSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span
        className={`${indicatorSize} rounded-[var(--radius-full)] bg-[var(--color-fg-default)]`}
      />
    </RadioGroupPrimitive.Indicator>
  );
}

/**
 * Size-specific styles
 */
const sizeStyles = {
  sm: {
    radio: "w-4 h-4",
    label: "text-xs",
    description: "text-[10px]",
    gap: "gap-2",
  },
  md: {
    radio: "w-5 h-5",
    label: "text-sm",
    description: "text-xs",
    gap: "gap-3",
  },
};

/**
 * RadioGroup component using Radix UI
 *
 * Displays a group of radio buttons for single selection.
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { value: "light", label: "Light" },
 *     { value: "dark", label: "Dark" },
 *     { value: "system", label: "System" },
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

  const radioStyles = [
    styles.radio,
    "rounded-[var(--radius-full)]",
    "border",
    "border-[var(--color-border-default)]",
    "bg-transparent",
    "flex",
    "items-center",
    "justify-center",
    "transition-colors",
    "duration-[var(--duration-fast)]",
    "hover:border-[var(--color-border-hover)]",
    "focus-visible:outline",
    "focus-visible:outline-[length:var(--ring-focus-width)]",
    "focus-visible:outline-offset-[var(--ring-focus-offset)]",
    "focus-visible:outline-[var(--color-ring-focus)]",
    "data-[state=checked]:border-[var(--color-fg-default)]",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
  ].join(" ");

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
 * Single Radio component for custom layouts
 */
export interface RadioProps {
  /** Value of the radio */
  value: string;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Size of the radio */
  size?: "sm" | "md";
}

export function Radio({
  value,
  disabled,
  className = "",
  size = "md",
}: RadioProps): JSX.Element {
  const styles = sizeStyles[size];

  const radioStyles = [
    styles.radio,
    "rounded-[var(--radius-full)]",
    "border",
    "border-[var(--color-border-default)]",
    "bg-transparent",
    "flex",
    "items-center",
    "justify-center",
    "transition-colors",
    "duration-[var(--duration-fast)]",
    "hover:border-[var(--color-border-hover)]",
    "focus-visible:outline",
    "focus-visible:outline-[length:var(--ring-focus-width)]",
    "focus-visible:outline-offset-[var(--ring-focus-offset)]",
    "focus-visible:outline-[var(--color-ring-focus)]",
    "data-[state=checked]:border-[var(--color-fg-default)]",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <RadioGroupPrimitive.Item
      value={value}
      disabled={disabled}
      className={radioStyles}
    >
      <RadioIndicator size={size} />
    </RadioGroupPrimitive.Item>
  );
}

/**
 * Re-export RadioGroup Root for custom layouts
 */
export const RadioGroupRoot = RadioGroupPrimitive.Root;

// =============================================================================
// RadioCardGroup - Card-style radio selection
// =============================================================================

export interface RadioCardOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface RadioCardGroupProps {
  /** Array of card options */
  options: RadioCardOption[];
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
  /** Number of columns in grid */
  columns?: 2 | 3 | 4;
  /** Additional className for root */
  className?: string;
}

/**
 * Check icon for selected state
 */
function CheckIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--color-accent)]"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * RadioCardGroup component
 *
 * Displays a grid of card-style radio buttons for single selection.
 * Used for template/type selection in dialogs.
 *
 * @example
 * ```tsx
 * <RadioCardGroup
 *   options={[
 *     { value: "novel", label: "Novel" },
 *     { value: "short", label: "Short Story" },
 *     { value: "script", label: "Screenplay" },
 *     { value: "other", label: "Other" },
 *   ]}
 *   value={type}
 *   onValueChange={setType}
 *   columns={2}
 * />
 * ```
 */
export function RadioCardGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  columns = 2,
  className = "",
}: RadioCardGroupProps): JSX.Element {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  const rootClasses = ["grid", "gap-3", gridCols[columns], className]
    .filter(Boolean)
    .join(" ");

  const cardBaseStyles = [
    "relative",
    "h-10",
    "px-3",
    "flex",
    "items-center",
    "justify-center",
    "border",
    "rounded-[var(--radius-sm)]",
    "text-sm",
    "cursor-pointer",
    "transition-all",
    "duration-[var(--duration-fast)]",
    // Default state
    "border-[var(--color-border-default)]",
    "text-[var(--color-fg-muted)]",
    "bg-transparent",
    // Hover state
    "hover:border-[var(--color-border-hover)]",
    // Focus visible
    "focus-visible:outline",
    "focus-visible:outline-[length:var(--ring-focus-width)]",
    "focus-visible:outline-offset-[var(--ring-focus-offset)]",
    "focus-visible:outline-[var(--color-ring-focus)]",
    // Checked state
    "data-[state=checked]:border-[var(--color-accent)]",
    "data-[state=checked]:bg-[var(--color-accent-subtle)]",
    "data-[state=checked]:text-[var(--color-fg-default)]",
    // Disabled state
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
  ].join(" ");

  return (
    <RadioGroupPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
      className={rootClasses}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          id={`radio-card-${name || "group"}-${option.value}`}
          className={cardBaseStyles}
        >
          {option.icon && <span className="mr-2">{option.icon}</span>}
          <span>{option.label}</span>
          <RadioGroupPrimitive.Indicator className="absolute right-2">
            <CheckIcon />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

// =============================================================================
// RadioCardItem - Single card for custom layouts (e.g., "+ Create Template")
// =============================================================================

export interface RadioCardItemProps {
  /** Value of the card */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Whether this is a special action card (e.g., "+ Create") */
  isAction?: boolean;
  /** Click handler for action cards */
  onAction?: () => void;
}

/**
 * Single RadioCard component for custom layouts
 *
 * Can be used as a regular radio option or as an action button.
 */
export function RadioCardItem({
  value,
  label,
  icon,
  disabled,
  className = "",
  isAction = false,
  onAction,
}: RadioCardItemProps): JSX.Element {
  const cardStyles = [
    "relative",
    "h-10",
    "px-3",
    "flex",
    "items-center",
    "justify-center",
    "border",
    "rounded-[var(--radius-sm)]",
    "text-sm",
    "cursor-pointer",
    "transition-all",
    "duration-[var(--duration-fast)]",
    isAction
      ? [
          "border-dashed",
          "border-[var(--color-border-default)]",
          "text-[var(--color-fg-muted)]",
          "hover:border-[var(--color-border-hover)]",
          "hover:text-[var(--color-fg-default)]",
        ].join(" ")
      : [
          "border-[var(--color-border-default)]",
          "text-[var(--color-fg-muted)]",
          "hover:border-[var(--color-border-hover)]",
          "data-[state=checked]:border-[var(--color-accent)]",
          "data-[state=checked]:bg-[var(--color-accent-subtle)]",
          "data-[state=checked]:text-[var(--color-fg-default)]",
        ].join(" "),
    "focus-visible:outline",
    "focus-visible:outline-[length:var(--ring-focus-width)]",
    "focus-visible:outline-offset-[var(--ring-focus-offset)]",
    "focus-visible:outline-[var(--color-ring-focus)]",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isAction && onAction) {
    return (
      // eslint-disable-next-line creonow/no-native-html-element -- Primitive: RadioCard action variant uses native button internally
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={cardStyles}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <RadioGroupPrimitive.Item
      value={value}
      disabled={disabled}
      className={cardStyles}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span>{label}</span>
      <RadioGroupPrimitive.Indicator className="absolute right-2">
        <CheckIcon />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

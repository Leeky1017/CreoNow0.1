/** Extracted from Radio.tsx to satisfy AC-18 (≤200 lines per file). */
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import {
  type RadioSize,
  type RadioCardOption,
  sizeStyles,
  radioItemStyles,
} from "./useRadioGroup";

export function RadioIndicator({ size }: { size: RadioSize }) {
  const s = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span
        className={`${s} rounded-[var(--radius-full)] bg-[var(--color-fg-default)]`}
      />
    </RadioGroupPrimitive.Indicator>
  );
}

export interface RadioProps {
  value: string;
  disabled?: boolean;
  className?: string;
  size?: RadioSize;
}

export function Radio({
  value,
  disabled,
  className = "",
  size = "md",
}: RadioProps): JSX.Element {
  const classes = [sizeStyles[size].radio, ...radioItemStyles, className]
    .filter(Boolean)
    .join(" ");
  return (
    <RadioGroupPrimitive.Item
      value={value}
      disabled={disabled}
      className={classes}
    >
      <RadioIndicator size={size} />
    </RadioGroupPrimitive.Item>
  );
}

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

const cardBaseStyles =
  "relative h-10 px-3 flex items-center justify-center border rounded-[var(--radius-sm)] text-sm cursor-pointer transition-all duration-[var(--duration-fast)] border-[var(--color-border-default)] text-[var(--color-fg-muted)] bg-transparent hover:border-[var(--color-border-hover)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] data-[state=checked]:border-[var(--color-accent)] data-[state=checked]:bg-[var(--color-accent-subtle)] data-[state=checked]:text-[var(--color-fg-default)] disabled:opacity-50 disabled:cursor-not-allowed";

export interface RadioCardGroupProps {
  options: RadioCardOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

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
  const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
  const rootClasses = ["grid", "gap-3", gridCols[columns], className]
    .filter(Boolean)
    .join(" ");

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

export interface RadioCardItemProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  isAction?: boolean;
  onAction?: () => void;
}

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
    "relative h-10 px-3 flex items-center justify-center border",
    "rounded-[var(--radius-sm)] text-sm cursor-pointer transition-all duration-[var(--duration-fast)]",
    isAction
      ? "border-dashed border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-fg-default)]"
      : "border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-hover)] data-[state=checked]:border-[var(--color-accent)] data-[state=checked]:bg-[var(--color-accent-subtle)] data-[state=checked]:text-[var(--color-fg-default)]",
    "focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
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

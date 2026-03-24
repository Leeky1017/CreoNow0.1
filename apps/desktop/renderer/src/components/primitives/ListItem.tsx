import React from "react";

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Item is selected/active */
  selected?: boolean;
  /** Use compact height (32px) instead of standard (40px) */
  compact?: boolean;
  /** Make item clickable with proper hover states */
  interactive?: boolean;
  /** Disable the item */
  disabled?: boolean;
  /** List item content */
  children: React.ReactNode;
}

/**
 * Base list item styles (design spec §6.4)
 *
 * - Standard height: 40px
 * - Compact height: 32px
 * - Padding: 0 12px
 * - Border radius: --radius-sm (4px)
 */
const baseStyles = [
  "flex",
  "items-center",
  "gap-2",
  "px-3",
  "rounded-[var(--radius-sm)]",
  "text-(--text-body)",
  "text-[var(--color-fg-default)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  // Prevent content overflow
  "overflow-hidden",
  "min-w-0",
].join(" ");

/**
 * Height variants
 */
const heightStyles = {
  compact: "h-8",
  standard: "h-10",
};

/**
 * Interactive (hoverable) styles
 */
const interactiveStyles = [
  "cursor-pointer",
  "select-none",
  "hover:bg-[var(--color-bg-hover)]",
  "active:bg-[var(--color-bg-active)]",
  // Focus-visible state
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[-2px]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

/**
 * Selected state styles
 */
const selectedStyles = "bg-[var(--color-bg-selected)]";

/**
 * Disabled state styles
 */
const disabledStyles = [
  "opacity-50",
  "cursor-not-allowed",
  "pointer-events-none",
].join(" ");

/**
 * ListItem component following design spec §6.4
 *
 * Used in lists, trees, and menus. Supports selected and compact modes.
 *
 * @example
 * ```tsx
 * <ListItem>Default item</ListItem>
 * <ListItem compact>Compact item</ListItem>
 * <ListItem selected interactive onClick={handleClick}>
 *   Selected clickable item
 * </ListItem>
 * ```
 */
export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  function ListItem(
    {
      selected = false,
      compact = false,
      interactive = false,
      disabled = false,
      className = "",
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ): JSX.Element {
    const classes = [
      baseStyles,
      compact ? heightStyles.compact : heightStyles.standard,
      interactive && !disabled ? interactiveStyles : "",
      selected ? selectedStyles : "",
      disabled ? disabledStyles : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    function onInteractiveKeyDown(
      e: React.KeyboardEvent<HTMLDivElement>,
    ): void {
      onKeyDown?.(e);
      if (e.defaultPrevented) {
        return;
      }
      if (!interactive || disabled) {
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.currentTarget.click();
      }
    }

    return (
      <div
        ref={ref}
        role={interactive ? "button" : undefined}
        tabIndex={interactive && !disabled ? 0 : undefined}
        className={classes}
        onClick={onClick}
        onKeyDown={interactive && !disabled ? onInteractiveKeyDown : onKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ListItem.displayName = "ListItem";

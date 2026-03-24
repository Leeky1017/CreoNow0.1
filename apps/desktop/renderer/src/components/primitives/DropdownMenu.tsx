import React from "react";
import * as Popover from "@radix-ui/react-popover";

/**
 * DropdownMenu component props
 *
 * A click-triggered dropdown menu built on Radix UI Popover primitive.
 * Uses the same styling as ContextMenu for consistency.
 */
export interface DropdownMenuProps {
  /** Trigger element (typically a button) */
  trigger: React.ReactNode;
  /** Menu items to display */
  items: DropdownMenuItem[];
  /** Alignment relative to trigger */
  align?: "start" | "center" | "end";
  /** Side relative to trigger */
  side?: "top" | "right" | "bottom" | "left";
  /** Optional test ID for the menu content */
  testId?: string;
}

export interface DropdownMenuItem {
  /** Unique key for the item */
  key: string;
  /** Display label */
  label: string;
  /** Click handler */
  onSelect: () => void;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Whether this is a destructive action (shown in error color) */
  destructive?: boolean;
  /** Optional icon element */
  icon?: React.ReactNode;
}

/**
 * Content styles - consistent with ContextMenu
 */
const contentStyles = [
  "z-[var(--z-popover)]",
  // Visual
  "bg-[var(--color-bg-raised)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-md)]",
  "shadow-md",
  // Sizing
  "min-w-40",
  "max-w-60",
  "py-1",
  // Animation via CSS transition
  "transition-[opacity,transform]",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95",
  // Focus
  "outline-none",
].join(" ");

/**
 * Item styles
 */
const itemBaseStyles = [
  "relative",
  "flex",
  "items-center",
  "gap-2",
  "px-3",
  "py-2",
  "text-sm",
  "cursor-pointer",
  "select-none",
  "outline-none",
  "transition-colors",
  "duration-[var(--duration-fast)]",
].join(" ");

const normalItemStyles = [
  itemBaseStyles,
  "text-[var(--color-fg-default)]",
  "hover:bg-[var(--color-bg-surface)]",
].join(" ");

const destructiveItemStyles = [
  itemBaseStyles,
  "text-[var(--color-error)]",
  "hover:bg-[var(--color-bg-surface)]",
].join(" ");

const disabledItemStyles = [
  itemBaseStyles,
  "text-[var(--color-fg-subtle)]",
  "pointer-events-none",
  "cursor-not-allowed",
].join(" ");

/**
 * DropdownMenu component
 *
 * A click-triggered dropdown menu using Radix UI Popover for proper
 * positioning and accessibility. Styled consistently with ContextMenu.
 *
 * @example
 * ```tsx
 * <DropdownMenu
 *   trigger={<button>Menu</button>}
 *   items={[
 *     { key: "rename", label: "Rename", onSelect: handleRename },
 *     { key: "delete", label: "Delete", onSelect: handleDelete, destructive: true },
 *   ]}
 * />
 * ```
 */
export function DropdownMenu({
  trigger,
  items,
  align = "end",
  side = "bottom",
  testId,
}: DropdownMenuProps): JSX.Element {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback((onSelect: () => void) => {
    setOpen(false);
    onSelect();
  }, []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={contentStyles}
          align={align}
          side={side}
          sideOffset={4}
          data-testid={testId}
        >
          {items.map((item) => {
            const className = item.disabled
              ? disabledItemStyles
              : item.destructive
                ? destructiveItemStyles
                : normalItemStyles;

            return (
              // eslint-disable-next-line creonow/no-native-html-element -- Primitive: DropdownMenu items use native button internally
              <button
                key={item.key}
                type="button"
                className={className}
                onClick={() => !item.disabled && handleSelect(item.onSelect)}
                disabled={item.disabled}
                data-testid={`dropdown-item-${item.key}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

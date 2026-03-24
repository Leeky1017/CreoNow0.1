import React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";

/**
 * ContextMenu component props
 *
 * A right-click context menu built on Radix UI ContextMenu primitive.
 * Implements z-index popover (300) and shadow-md (§3.7, §5.2).
 */
export interface ContextMenuProps {
  /** Trigger element that receives the right-click */
  children: React.ReactNode;
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Callback when menu open state changes */
  onOpenChange?: (open: boolean) => void;
}

export interface ContextMenuItem {
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
  /** Optional keyboard shortcut label (e.g. "F2", "Del") */
  shortcut?: string;
}

/**
 * Content styles - context menu with shadow-md (§3.7, §5.2)
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
  "focus:outline-none",
].join(" ");

/**
 * Item styles
 */
const itemStyles = [
  "relative",
  "flex",
  "items-center",
  "gap-2",
  "px-3",
  "py-2",
  "text-sm",
  "cursor-default",
  "select-none",
  "outline-none",
  // Normal state
  "text-[var(--color-fg-default)]",
  // Hover/focus state
  "data-[highlighted]:bg-[var(--color-bg-surface)]",
  // Disabled state
  "data-[disabled]:text-[var(--color-fg-subtle)]",
  "data-[disabled]:pointer-events-none",
].join(" ");

const destructiveItemStyles = [
  "relative",
  "flex",
  "items-center",
  "gap-2",
  "px-3",
  "py-2",
  "text-sm",
  "cursor-default",
  "select-none",
  "outline-none",
  // Destructive color
  "text-[var(--color-error)]",
  // Hover/focus state
  "data-[highlighted]:bg-[var(--color-bg-surface)]",
  // Disabled state
  "data-[disabled]:text-[var(--color-fg-subtle)]",
  "data-[disabled]:pointer-events-none",
].join(" ");

/**
 * ContextMenu component following design spec §5.2
 *
 * A right-click context menu built on Radix UI ContextMenu for proper
 * positioning and focus management. Uses z-index popover (300) and shadow-md.
 *
 * @example
 * ```tsx
 * <ContextMenu
 *   items={[
 *     { key: "rename", label: "Rename", onSelect: handleRename },
 *     { key: "delete", label: "Delete", onSelect: handleDelete, destructive: true },
 *   ]}
 * >
 *   <div>Right click me</div>
 * </ContextMenu>
 * ```
 */
export function ContextMenu({
  children,
  items,
  onOpenChange,
}: ContextMenuProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Root onOpenChange={onOpenChange}>
      <ContextMenuPrimitive.Trigger asChild>
        {children}
      </ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className={contentStyles}>
          {items.map((item) => (
            <ContextMenuPrimitive.Item
              key={item.key}
              data-testid={`context-menu-item-${item.key}`}
              className={item.destructive ? destructiveItemStyles : itemStyles}
              onSelect={item.onSelect}
              disabled={item.disabled}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.shortcut ? (
                <span
                  aria-hidden="true"
                  className="ml-auto pl-4 text-(--text-status) text-[var(--color-fg-muted)]"
                >
                  {item.shortcut}
                </span>
              ) : null}
            </ContextMenuPrimitive.Item>
          ))}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}

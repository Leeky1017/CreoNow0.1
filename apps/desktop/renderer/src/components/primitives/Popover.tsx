import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

/**
 * Popover component props
 *
 * A floating popover component built on Radix UI Popover primitive.
 * Implements z-index popover (300) and shadow-md (§3.7, §5.2).
 */
export interface PopoverProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /**
   * Z-layer for popover content.
   * - "popover": default layer using `--z-popover`
   * - "modal": render above modal overlay/content (`--z-modal`)
   */
  layer?: "popover" | "modal";
  /** Optional portal container for rendering content */
  portalContainer?: HTMLElement | null;
  /** Trigger element */
  trigger: React.ReactNode;
  /** Popover content */
  children: React.ReactNode;
  /** Accessible name for popover content when it behaves like a dialog */
  contentLabel?: string;
  /** Preferred side of the trigger to render. Default: "bottom" */
  side?: "top" | "right" | "bottom" | "left";
  /** Offset from trigger in pixels. Default: 8 */
  sideOffset?: number;
  /** Alignment relative to trigger. Default: "center" */
  align?: "start" | "center" | "end";
}

/**
 * Content styles - popover with shadow-md (§3.7, §5.2)
 *
 * Uses CSS transitions for animation (no tailwindcss-animate dependency).
 */
const contentStyles = [
  "pointer-events-auto",
  // Visual
  "bg-[var(--color-bg-raised)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-md)]",
  "shadow-[var(--shadow-md)]",
  // Sizing
  "min-w-50",
  "max-w-80",
  "p-4",
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
 * Get z-index class based on layer.
 */
function getZIndexClass(layer: "popover" | "modal"): string {
  return layer === "modal" ? "z-[var(--z-modal)]" : "z-[var(--z-popover)]";
}

/**
 * Popover component following design spec §5.2
 *
 * A floating popover built on Radix UI Popover for proper positioning and focus management.
 * Uses z-index popover (300) and shadow-md.
 *
 * @example
 * ```tsx
 * <Popover trigger={<Button variant="ghost">Open Menu</Button>}>
 *   <div>Popover content here</div>
 * </Popover>
 * ```
 */
export function Popover({
  open,
  onOpenChange,
  defaultOpen,
  layer = "popover",
  portalContainer,
  trigger,
  children,
  contentLabel,
  side = "bottom",
  sideOffset = 8,
  align = "center",
}: PopoverProps): JSX.Element {
  const contentClassName = [getZIndexClass(layer), contentStyles].join(" ");

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
    >
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
        <PopoverPrimitive.Content
          className={contentClassName}
          aria-label={contentLabel ?? "Popover"}
          side={side}
          sideOffset={sideOffset}
          align={align}
          collisionPadding={8}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/**
 * PopoverClose - Wraps an element that closes the popover
 */
export const PopoverClose = PopoverPrimitive.Close;

/**
 * PopoverAnchor - Anchors the popover to a different element than the trigger
 */
export const PopoverAnchor = PopoverPrimitive.Anchor;

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export interface TooltipProps {
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** The content to display in the tooltip */
  content: React.ReactNode;
  /** Side where tooltip appears */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment of tooltip */
  align?: "start" | "center" | "end";
  /** Delay in ms before showing tooltip */
  delayDuration?: number;
  /** Whether the tooltip is open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Skip delay when moving between tooltips */
  skipDelayDuration?: number;
}

/**
 * Tooltip content styles
 */
const contentStyles = [
  "z-[var(--z-tooltip)]",
  "px-3",
  "py-2",
  "text-xs",
  "font-normal",
  "leading-tight",
  "max-w-50",
  "rounded-[var(--radius-md)]",
  "bg-[var(--color-fg-default)]",
  "text-[var(--color-fg-inverse)]",
  "shadow-[var(--shadow-md)]",
  // Animation
  "animate-in",
  "fade-in-0",
  "zoom-in-95",
  "data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0",
  "data-[state=closed]:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2",
  "data-[side=left]:slide-in-from-right-2",
  "data-[side=right]:slide-in-from-left-2",
  "data-[side=top]:slide-in-from-bottom-2",
].join(" ");

/**
 * Arrow styles
 */
const arrowStyles = "fill-[var(--color-fg-default)]";

/**
 * Tooltip Provider - wrap your app with this
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Tooltip component using Radix UI
 *
 * Displays additional information when hovering over an element.
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <Tooltip content="This is a tooltip">
 *     <button>Hover me</button>
 *   </Tooltip>
 * </TooltipProvider>
 * ```
 */
export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  delayDuration = 400,
  open,
  onOpenChange,
  skipDelayDuration = 300,
}: TooltipProps): JSX.Element {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
    >
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={5}
            className={contentStyles}
          >
            {content}
            <TooltipPrimitive.Arrow className={arrowStyles} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

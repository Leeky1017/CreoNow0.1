import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";

/**
 * Dialog component props as defined in design spec §11.5
 *
 * A modal dialog component built on Radix UI Dialog primitive.
 * Implements proper z-index (modal: 400), shadows (xl), and scrim overlay.
 */
export interface DialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title (required for accessibility) */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Optional footer (typically action buttons) */
  footer?: React.ReactNode;
  /** Close on Escape key press. Default: true */
  closeOnEscape?: boolean;
  /** Close on overlay click. Default: true */
  closeOnOverlayClick?: boolean;
}

/**
 * Overlay styles - scrim with z-index modal (§5.1)
 *
 * Uses CSS transitions for animation (no tailwindcss-animate dependency).
 * Radix handles the mounting/unmounting, we just style opacity.
 */
const overlayStyles = [
  "fixed",
  "inset-0",
  "z-[var(--z-modal)]",
  "bg-[var(--color-scrim)]",
  // Animation via CSS transition
  "transition-opacity",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=closed]:opacity-0",
].join(" ");

/**
 * Content styles - modal with shadow-xl (§3.7, §5.2)
 *
 * Uses CSS transitions for animation (no tailwindcss-animate dependency).
 */
const contentStyles = [
  "fixed",
  "left-1/2",
  "top-1/2",
  "-translate-x-1/2",
  "-translate-y-1/2",
  "z-[var(--z-modal)]",
  // Visual
  "bg-[var(--color-bg-raised)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-lg)]",
  "shadow-xl",
  // Sizing
  "w-full",
  "max-w-md",
  // eslint-disable-next-line creonow/no-hardcoded-dimension -- viewport-relative height; no design token available
  "max-h-[85vh]",
  "overflow-hidden",
  // Animation via CSS transition
  "transition-[opacity,transform]",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95",
  // Focus
  "focus:outline-none",
].join(" ");

/**
 * Title styles - card title typography (§4.2)
 */
const titleStyles = [
  "text-base",
  "font-semibold",
  "text-[var(--color-fg-default)]",
  "leading-[1.3]",
  "tracking-[-0.01em]",
].join(" ");

/**
 * Description styles - muted text
 */
const descriptionStyles = [
  "text-(--text-body)",
  "text-[var(--color-fg-muted)]",
  "leading-[1.5]",
  "mt-2",
].join(" ");

/**
 * Close button styles
 */
const closeButtonStyles = [
  "absolute",
  "right-4",
  "top-4",
  "w-8",
  "h-8",
  "inline-flex",
  "items-center",
  "justify-center",
  "rounded-[var(--radius-sm)]",
  "text-[var(--color-fg-muted)]",
  "hover:text-[var(--color-fg-default)]",
  "hover:bg-[var(--color-bg-hover)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  // Focus visible
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

/**
 * Dialog component following design spec §11.5
 *
 * A modal dialog built on Radix UI Dialog for proper accessibility and focus management.
 * Uses z-index modal (400), shadow-xl, and scrim overlay.
 *
 * Radix UI Dialog provides built-in focus management (WCAG 2.4.3):
 * - Focus trap: Tab/Shift+Tab cycle stays within the dialog content
 * - Esc key: Closes the dialog (configurable via `closeOnEscape`)
 * - Focus restoration: Focus returns to the trigger element after close
 *
 * @example
 * ```tsx
 * <Dialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Confirm Delete"
 *   description="This action cannot be undone."
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="danger">Delete</Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure you want to delete this item?</p>
 * </Dialog>
 * ```
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: DialogProps): JSX.Element {
  const { t } = useTranslation();

  // Manual focus restoration: Radix Dialog's built-in restoration relies on
  // Dialog.Trigger. For controlled dialogs opened via external state, we
  // track the previously focused element ourselves (WCAG 2.4.3).
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (open && !wasOpenRef.current) {
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;
    } else if (!open && wasOpenRef.current && previouslyFocusedRef.current) {
      const el = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (el.isConnected) {
        el.focus();
      }
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayStyles} />
        <DialogPrimitive.Content
          className={contentStyles}
          onEscapeKeyDown={
            closeOnEscape ? undefined : (e) => e.preventDefault()
          }
          onPointerDownOutside={
            closeOnOverlayClick ? undefined : (e) => e.preventDefault()
          }
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <DialogPrimitive.Title className={titleStyles}>
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className={descriptionStyles}>
                {description}
              </DialogPrimitive.Description>
            )}
          </div>

          {/* Body */}
          <div className="px-6 pb-4 overflow-y-auto max-h-[calc(85vh-160px)]">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[var(--color-separator)] flex justify-end gap-3">
              {footer}
            </div>
          )}

          {/* Close button */}
          <DialogPrimitive.Close className={closeButtonStyles}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
            <span className="sr-only">{t("primitives.dialog.close")}</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * DialogTrigger - Wraps a button that opens the dialog
 *
 * Use when you need an uncontrolled trigger button.
 */
export const DialogTrigger = DialogPrimitive.Trigger;

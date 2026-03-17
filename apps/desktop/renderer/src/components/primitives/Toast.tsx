import React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { useTranslation } from "react-i18next";

/**
 * Toast variants
 *
 * - default: 默认样式
 * - success: 成功状态
 * - error: 错误状态
 * - warning: 警告状态
 */
export type ToastVariant = "default" | "success" | "error" | "warning";

export interface ToastProps {
  /** Toast title */
  title: string;
  /** Toast description (optional) */
  description?: string;
  /** Visual variant */
  variant?: ToastVariant;
  /** Whether the toast is open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Duration in ms before auto-close (0 to disable) */
  duration?: number;
  /** Action button (optional) */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Variant-specific styles
 */
const variantStyles: Record<ToastVariant, { border: string; icon: string }> = {
  default: {
    border: "border-[var(--color-border-default)]",
    icon: "text-[var(--color-fg-muted)]",
  },
  success: {
    border: "border-[var(--color-success)]",
    icon: "text-[var(--color-success)]",
  },
  error: {
    border: "border-[var(--color-error)]",
    icon: "text-[var(--color-error)]",
  },
  warning: {
    border: "border-[var(--color-warning)]",
    icon: "text-[var(--color-warning)]",
  },
};

/**
 * Toast viewport styles
 */
const viewportStyles = [
  "fixed",
  "bottom-4",
  "right-4",
  "z-[var(--z-toast)]",
  "flex",
  "flex-col",
  "gap-2",
  // eslint-disable-next-line creonow/no-hardcoded-dimension -- Design spec §6.12: Toast viewport width
  "w-[360px]",
  "max-w-[calc(100vw-32px)]",
  "outline-none",
].join(" ");

/**
 * Toast root styles
 */
const toastStyles = [
  "bg-[var(--color-bg-raised)]",
  "rounded-[var(--radius-lg)]",
  "shadow-[var(--shadow-lg)]",
  "border",
  "p-4",
  "flex",
  "gap-3",
  "items-start",
  // Animation
  "data-[state=open]:animate-in",
  "data-[state=open]:slide-in-from-right-full",
  "data-[state=open]:fade-in-0",
  "data-[state=closed]:animate-out",
  "data-[state=closed]:slide-out-to-right-full",
  "data-[state=closed]:fade-out-0",
  "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
  "data-[swipe=cancel]:translate-x-0",
  "data-[swipe=cancel]:transition-transform",
  "data-[swipe=end]:animate-out",
  "data-[swipe=end]:slide-out-to-right-full",
].join(" ");

/**
 * Toast Provider - wrap your app with this
 */
export const ToastProvider = ToastPrimitive.Provider;

/**
 * Toast Viewport - place this at the root of your app
 */
export function ToastViewport(): JSX.Element {
  return <ToastPrimitive.Viewport className={viewportStyles} />;
}

/**
 * Toast component using Radix UI
 *
 * Displays a temporary notification message.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <Toast
 *     title="File saved"
 *     description="Your changes have been saved."
 *     variant="success"
 *     open={open}
 *     onOpenChange={setOpen}
 *   />
 *   <ToastViewport />
 * </ToastProvider>
 * ```
 */
export function Toast({
  title,
  description,
  variant = "default",
  open,
  onOpenChange,
  duration = 5000,
  action,
}: ToastProps): JSX.Element {
  const { t } = useTranslation();
  const variantStyle = variantStyles[variant];

  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className={`${toastStyles} ${variantStyle.border}`}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-sm font-medium text-[var(--color-fg-default)]">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="mt-1 text-xs text-[var(--color-fg-muted)]">
            {description}
          </ToastPrimitive.Description>
        )}
        {action && (
          <ToastPrimitive.Action
            altText={action.label}
            onClick={action.onClick}
            className="mt-2 text-xs font-medium text-[var(--color-accent)] hover:underline cursor-pointer"
          >
            {action.label}
          </ToastPrimitive.Action>
        )}
      </div>
      <ToastPrimitive.Close
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-default)] transition-colors cursor-pointer"
        aria-label={t("primitives.toast.close")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

/**
 * Hook to create toasts imperatively
 *
 * Note: This is a simplified implementation.
 * For production, consider using a context-based approach.
 */
export interface ToastState {
  open: boolean;
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ToastProps["action"];
}

export function useToast() {
  const [toast, setToast] = React.useState<ToastState>({
    open: false,
    title: "",
  });

  const showToast = React.useCallback((props: Omit<ToastState, "open">) => {
    setToast({ ...props, open: true });
  }, []);

  const hideToast = React.useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
    setOpen: (open: boolean) => setToast((prev) => ({ ...prev, open })),
  };
}

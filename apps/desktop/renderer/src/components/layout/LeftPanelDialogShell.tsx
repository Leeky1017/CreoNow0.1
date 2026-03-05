import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";

type LeftPanelDialogShellProps = {
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  testId?: string;
};

const overlayStyles = [
  "fixed",
  "inset-0",
  "z-[var(--z-modal)]",
  "bg-[var(--color-scrim)]",
  "backdrop-blur-sm",
  "transition-opacity",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=closed]:opacity-0",
].join(" ");

const contentStyles = [
  "fixed",
  "left-1/2",
  "top-1/2",
  "-translate-x-1/2",
  "-translate-y-1/2",
  "z-[var(--z-modal)]",
  "w-[min(1100px,calc(100vw-64px))]",
  "h-[min(780px,calc(100vh-64px))]",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-lg)]",
  "shadow-[var(--shadow-xl)]",
  "flex",
  "flex-col",
  "overflow-hidden",
  "transition-[opacity,transform]",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95",
  "focus:outline-none",
].join(" ");

const closeButtonStyles = [
  "inline-flex",
  "h-8",
  "w-8",
  "items-center",
  "justify-center",
  "rounded-full",
  "text-[var(--color-fg-muted)]",
  "hover:bg-[var(--color-bg-hover)]",
  "hover:text-[var(--color-fg-default)]",
  "transition-colors",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

export function LeftPanelDialogShell(
  props: LeftPanelDialogShellProps,
): JSX.Element {
  const { t } = useTranslation();
  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayStyles} />
        <DialogPrimitive.Content className={contentStyles} data-testid={props.testId}>
          <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-4">
            <DialogPrimitive.Title className="text-sm font-semibold tracking-wide text-[var(--color-fg-default)]">
              {props.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className={closeButtonStyles} data-testid="leftpanel-dialog-close">
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
              <span className="sr-only">{t("workbench.leftPanel.close")}</span>
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-6">{props.children}</div>
          <DialogPrimitive.Description className="sr-only">
            {t("workbench.leftPanel.dialogPanelDescription", { title: props.title })}
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import type { SystemDialogProps } from "./types";
import { Button } from "../../primitives/Button";
import {
  Spinner,
  getDefaultContent,
  getIconByType,
  getIconColorsByType,
  iconContainerStyles,
  titleStyles,
  descriptionStyles,
  keyboardHintStyles,
  kbdStyles,
  buttonContainerStyles,
  cancelButtonStyles,
  deleteButtonStyles,
  discardButtonStyles,
  saveButtonStyles,
  doneButtonStyles,
  openFileButtonStyles,
} from "./SystemDialogContent";

type ActionState = "idle" | "loading" | "success";
const overlayStyles = [
  "fixed inset-0 z-[var(--z-modal)] bg-[var(--color-scrim)]",
  "transition-opacity duration-[var(--duration-normal)] ease-[var(--ease-default)] data-[state=open]:opacity-100",
  "data-[state=closed]:opacity-0",
].join(" ");
const contentStyles = [
  "fixed left-1/2 top-1/2 -translate-x-1/2",
  "-translate-y-1/2 z-[var(--z-modal)] bg-[var(--color-bg-surface)] border",
  "border-[var(--color-border-default)] rounded-xl shadow-xl w-full",
  "max-w-sm p-6 flex flex-col",
  "items-center text-center transition-[opacity,transform] duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)] data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95 focus:outline-none",
].join(" ");

/** SystemDialog - System confirmation dialog with keyboard shortcuts and loading states.
 * @example `<SystemDialog open={isOpen} onOpenChange={setIsOpen} type="delete" onPrimaryAction={fn} onSecondaryAction={fn} />`
 */
export function SystemDialog({
  open,
  onOpenChange,
  type,
  title,
  description,
  onPrimaryAction,
  onSecondaryAction,
  onTertiaryAction,
  primaryLabel,
  secondaryLabel,
  tertiaryLabel,
  simulateDelay = 0,
  showKeyboardHints = true,
}: SystemDialogProps): JSX.Element {
  const { t } = useTranslation();
  const [actionState, setActionState] = useState<ActionState>("idle");
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const defaultContentForType = getDefaultContent(t)[type];
  const displayTitle = title || defaultContentForType.title;
  const displayDescription = description || defaultContentForType.description;
  const displayPrimaryLabel =
    primaryLabel || defaultContentForType.primaryLabel;
  const displaySecondaryLabel =
    secondaryLabel || defaultContentForType.secondaryLabel;
  const displayTertiaryLabel =
    tertiaryLabel || defaultContentForType.tertiaryLabel;
  const iconColors = getIconColorsByType(type);
  const isLoading = actionState === "loading";
  useEffect(() => {
    if (open && primaryButtonRef.current) {
      const timer = setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);
  const handlePrimaryAction = useCallback(async () => {
    if (isLoading) return;
    setActionState("loading");
    await new Promise((resolve) => setTimeout(resolve, simulateDelay));
    setActionState("success");
    onPrimaryAction();
    setTimeout(() => {
      setActionState("idle");
      onOpenChange(false);
    }, 300);
  }, [isLoading, simulateDelay, onPrimaryAction, onOpenChange]);
  const handleSecondaryAction = useCallback(() => {
    if (isLoading) return;
    setActionState("idle");
    onSecondaryAction?.();
    onOpenChange(false);
  }, [isLoading, onSecondaryAction, onOpenChange]);
  const handleTertiaryAction = useCallback(() => {
    if (isLoading) return;
    setActionState("idle");
    onTertiaryAction?.();
    onOpenChange(false);
  }, [isLoading, onTertiaryAction, onOpenChange]);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !isLoading) {
        event.preventDefault();
        handlePrimaryAction();
      }
    },
    [handlePrimaryAction, isLoading],
  );
  const renderPrimaryButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Spinner />
          <span>{t("systemDialog.processing")}</span>
        </>
      );
    }
    if (actionState === "success") {
      return <span>{t("systemDialog.done")}</span>;
    }
    return <span>{displayPrimaryLabel}</span>;
  };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayStyles} />
        <DialogPrimitive.Content
          className={contentStyles}
          data-testid={`system-dialog-${type}`}
          onKeyDown={handleKeyDown}
        >
          <div
            className={`${iconContainerStyles} ${iconColors.bg} ${iconColors.text} ${iconColors.border}`}
          >
            {getIconByType(type)}
          </div>
          <DialogPrimitive.Title className={titleStyles}>
            {displayTitle}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className={descriptionStyles}>
            {displayDescription}
          </DialogPrimitive.Description>
          <div className={buttonContainerStyles}>
            {type === "delete" && (
              <>
                <Button
                  type="button"
                  data-testid="system-dialog-secondary"
                  className={cancelButtonStyles}
                  onClick={handleSecondaryAction}
                  disabled={isLoading}
                >
                  {displaySecondaryLabel}
                </Button>
                <Button
                  ref={primaryButtonRef}
                  type="button"
                  data-testid="system-dialog-primary"
                  className={deleteButtonStyles}
                  onClick={handlePrimaryAction}
                  disabled={isLoading}
                >
                  {renderPrimaryButtonContent()}
                </Button>
              </>
            )}
            {type === "unsaved_changes" && (
              <>
                <Button
                  type="button"
                  className={discardButtonStyles}
                  onClick={handleTertiaryAction}
                  disabled={isLoading}
                >
                  {displayTertiaryLabel}
                </Button>
                <div className="flex-1" />
                <Button
                  type="button"
                  className={cancelButtonStyles}
                  onClick={handleSecondaryAction}
                  disabled={isLoading}
                >
                  {displaySecondaryLabel}
                </Button>
                <Button
                  ref={primaryButtonRef}
                  type="button"
                  className={saveButtonStyles}
                  onClick={handlePrimaryAction}
                  disabled={isLoading}
                >
                  {renderPrimaryButtonContent()}
                </Button>
              </>
            )}
            {type === "export_complete" && (
              <>
                <Button
                  type="button"
                  className={doneButtonStyles}
                  onClick={handleSecondaryAction}
                  disabled={isLoading}
                >
                  {displaySecondaryLabel}
                </Button>
                <Button
                  ref={primaryButtonRef}
                  type="button"
                  className={openFileButtonStyles}
                  onClick={handlePrimaryAction}
                  disabled={isLoading}
                >
                  {renderPrimaryButtonContent()}
                </Button>
              </>
            )}
          </div>
          {showKeyboardHints && (
            <div className={keyboardHintStyles}>
              <span>
                <kbd className={kbdStyles}>
                  {t("systemDialog.keyboard.enterKey")}
                </kbd>{" "}
                {t("systemDialog.keyboard.toConfirm")}
              </span>
              <span>
                <kbd className={kbdStyles}>
                  {t("systemDialog.keyboard.escKey")}
                </kbd>{" "}
                {t("systemDialog.keyboard.toCancel")}
              </span>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

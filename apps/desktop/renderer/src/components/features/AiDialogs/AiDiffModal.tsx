import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { AiDiffModalProps } from "./types";
import { useAiDiffActions } from "./useAiDiffActions";
import { AiDiffContent, DiffText as DiffTextComponent } from "./AiDiffContent";
import { AiDiffSummary } from "./AiDiffSummary";

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
  </svg>
);
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
  </svg>
);
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
  </svg>
);
const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
  </svg>
);
const overlayStyles = [
  "fixed inset-0 z-[var(--z-modal)] bg-[var(--color-scrim)]",
  "transition-opacity duration-[var(--duration-normal)] ease-[var(--ease-default)] data-[state=open]:opacity-100",
  "data-[state=closed]:opacity-0",
].join(" ");
const contentStyles = [
  "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "z-[var(--z-modal)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]",
  "rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] w-full max-w-4xl",
  // eslint-disable-next-line creonow/no-hardcoded-dimension -- dialog content height per design spec
  "h-[500px] overflow-hidden flex flex-col",
  "transition-[opacity,transform] duration-[var(--duration-normal)] ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
  "focus:outline-none",
].join(" ");
const headerStyles = [
  "h-14 border-b border-[var(--color-separator)] px-6",
  "flex items-center justify-between bg-[var(--color-bg-raised)]",
  "shrink-0",
].join(" ");
const navContainerStyles = [
  "flex items-center gap-3 bg-[var(--color-bg-base)]",
  "rounded-[var(--radius-sm)] px-2 py-1 border",
  "border-[var(--color-separator)]",
].join(" ");
const navButtonStyles = [
  "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors duration-[var(--duration-fast)]",
  "p-0.5 focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)] disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");
const navTextStyles = ["text-xs font-mono text-[var(--color-fg-muted)]"].join(
  " ",
);
const closeButtonStyles = [
  "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] p-1 transition-colors",
  "duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");
const changeActionButtonStyles = [
  "h-6 w-6 flex items-center",
  "justify-center rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)]",
  "focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");
const acceptChangeButtonStyles = [
  changeActionButtonStyles,
  "text-[var(--color-fg-muted)] hover:bg-[var(--color-success-subtle)] hover:text-[var(--color-success)]",
].join(" ");
const rejectChangeButtonStyles = [
  changeActionButtonStyles,
  "text-[var(--color-fg-muted)] hover:bg-[var(--color-error-subtle)] hover:text-[var(--color-error)]",
].join(" ");
interface AiDiffModalBodyProps extends Omit<AiDiffModalProps, "open"> {
  currentIndex: number;
  initialChangeStates: Record<string, "pending" | "accepted" | "rejected">;
}

function AiDiffModalBody({
  onOpenChange,
  changes,
  currentIndex,
  onCurrentIndexChange,
  onAcceptAll,
  onRejectAll,
  onApplyChanges,
  onEditManually,
  simulateDelay = 1000,
  initialChangeStates,
}: AiDiffModalBodyProps): JSX.Element {
  const { t } = useTranslation();
  const {
    currentChange,
    currentState,
    totalChanges,
    stats,
    acceptedCount,
    rejectedCount,
    isApplying,
    isApplied,
    handlePrev,
    handleNext,
    handleAcceptChange,
    handleRejectChange,
    handleAcceptAll,
    handleRejectAll,
    handleApplyChanges,
  } = useAiDiffActions({
    changes,
    currentIndex,
    onCurrentIndexChange,
    onAcceptAll,
    onRejectAll,
    onApplyChanges,
    onOpenChange,
    simulateDelay,
    initialChangeStates,
  });

  return (
    <>
      {/* Header */}
      <div className={headerStyles}>
        <div className="flex items-center gap-4">
          <DialogPrimitive.Title className="font-medium text-sm text-[var(--color-fg-default)]">
            {t("ai.diff.reviewChanges")}
          </DialogPrimitive.Title>
          <span className="text-xs text-[var(--color-fg-muted)]">
            {t("ai.diff.modifyCount", { count: totalChanges })}
          </span>
        </div>
        {/* Navigation */}
        <div className="flex items-center gap-3">
          {totalChanges > 1 && (
            <div className={navContainerStyles}>
              {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
              <button
                type="button"
                className={navButtonStyles}
                onClick={handlePrev}
                disabled={currentIndex === 0 || isApplying}
              >
                <ChevronLeftIcon />
              </button>
              <span className={navTextStyles}>
                {t("ai.diff.changeNav", {
                  current: currentIndex + 1,
                  total: totalChanges,
                })}
              </span>
              {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
              <button
                type="button"
                className={navButtonStyles}
                onClick={handleNext}
                disabled={currentIndex === totalChanges - 1 || isApplying}
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
          {currentState === "pending" && !isApplying && (
            <div className="flex items-center gap-1">
              {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
              <button
                type="button"
                className={acceptChangeButtonStyles}
                onClick={() => handleAcceptChange(currentChange.id)}
                title={t("ai.diff.acceptThisChange")}
              >
                <CheckIcon />
              </button>
              {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
              <button
                type="button"
                className={rejectChangeButtonStyles}
                onClick={() => handleRejectChange(currentChange.id)}
                title={t("ai.diff.rejectThisChange")}
              >
                <XIcon />
              </button>
            </div>
          )}
        </div>
        <DialogPrimitive.Close
          className={closeButtonStyles}
          disabled={isApplying}
        >
          <CloseIcon />
        </DialogPrimitive.Close>
      </div>
      <AiDiffContent
        currentChange={currentChange}
        currentState={currentState}
      />
      <AiDiffSummary
        stats={stats}
        acceptedCount={acceptedCount}
        rejectedCount={rejectedCount}
        isApplying={isApplying}
        isApplied={isApplied}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
        onApplyChanges={handleApplyChanges}
        onEditManually={onEditManually}
      />
    </>
  );
}

/** AiDiffModal - Side-by-side diff modal with per-change accept/reject.
 * @example `<AiDiffModal open={isOpen} onOpenChange={setIsOpen} changes={[...]} onAcceptAll={fn} onRejectAll={fn} onApplyChanges={fn} />`
 */
export function AiDiffModal({
  open,
  onOpenChange,
  changes,
  currentIndex = 0,
  onCurrentIndexChange,
  onAcceptAll,
  onRejectAll,
  onApplyChanges,
  onEditManually,
  simulateDelay = 1000,
  initialChangeStates = {},
}: AiDiffModalProps): JSX.Element {
  const dialogSessionKey = useMemo(
    () =>
      JSON.stringify(
        changes.map((change) => ({
          id: change.id,
          before: change.before,
          after: change.after,
          state: initialChangeStates[change.id] || "pending",
        })),
      ),
    [changes, initialChangeStates],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayStyles} />
        <DialogPrimitive.Content className={contentStyles}>
          {open ? (
            <AiDiffModalBody
              key={dialogSessionKey}
              onOpenChange={onOpenChange}
              changes={changes}
              currentIndex={currentIndex}
              onCurrentIndexChange={onCurrentIndexChange}
              onAcceptAll={onAcceptAll}
              onRejectAll={onRejectAll}
              onApplyChanges={onApplyChanges}
              onEditManually={onEditManually}
              simulateDelay={simulateDelay}
              initialChangeStates={initialChangeStates}
            />
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { DiffTextComponent as DiffText };

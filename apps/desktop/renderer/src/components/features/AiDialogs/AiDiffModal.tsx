import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { AiDiffModalProps, DiffChange, DiffChangeState } from "./types";

/**
 * Modal state for tracking overall operation
 */
type ModalState = "reviewing" | "applying" | "applied";

/**
 * Icon components
 */
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

/**
 * Loading spinner component
 */
const Spinner = ({ className = "" }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

/**
 * Overlay styles
 */
const overlayStyles = [
  "fixed",
  "inset-0",
  "z-[var(--z-modal)]",
  "bg-[var(--color-scrim)]",
  "transition-opacity",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=closed]:opacity-0",
].join(" ");

/**
 * Content styles - larger modal for diff view
 */
const contentStyles = [
  "fixed",
  "left-1/2",
  "top-1/2",
  "-translate-x-1/2",
  "-translate-y-1/2",
  "z-[var(--z-modal)]",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-lg)]",
  "shadow-[var(--shadow-xl)]",
  "w-full",
  "max-w-4xl",
  "h-[500px]",
  "overflow-hidden",
  "flex",
  "flex-col",
  "transition-[opacity,transform]",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95",
  "focus:outline-none",
].join(" ");

/**
 * Header styles
 */
const headerStyles = [
  "h-14",
  "border-b",
  "border-[var(--color-separator)]",
  "px-6",
  "flex",
  "items-center",
  "justify-between",
  "bg-[var(--color-bg-raised)]",
  "shrink-0",
].join(" ");

/**
 * Navigation styles
 */
const navContainerStyles = [
  "flex",
  "items-center",
  "gap-3",
  "bg-[var(--color-bg-base)]",
  "rounded-[var(--radius-sm)]",
  "px-2",
  "py-1",
  "border",
  "border-[var(--color-separator)]",
].join(" ");

const navButtonStyles = [
  "text-[var(--color-fg-muted)]",
  "hover:text-[var(--color-fg-default)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "p-0.5",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
].join(" ");

const navTextStyles = [
  "text-xs",
  "font-mono",
  "text-[var(--color-fg-muted)]",
].join(" ");

/**
 * Close button styles
 */
const closeButtonStyles = [
  "text-[var(--color-fg-muted)]",
  "hover:text-[var(--color-fg-default)]",
  "p-1",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

/**
 * Diff panel styles
 */
const diffContainerStyles = ["flex-1", "flex", "overflow-hidden"].join(" ");

const diffPanelStyles = ["flex-1", "overflow-y-auto", "p-6"].join(" ");

const beforePanelStyles = [
  diffPanelStyles,
  "border-r",
  "border-[var(--color-separator)]",
  "bg-[var(--color-bg-base)]",
].join(" ");

const afterPanelStyles = [diffPanelStyles, "bg-[var(--color-bg-surface)]"].join(
  " ",
);

const labelStyles = [
  "uppercase",
  "text-[10px]",
  "font-bold",
  "tracking-wider",
  "mb-4",
].join(" ");

const beforeLabelStyles = [
  labelStyles,
  "text-[var(--color-error)]",
  "opacity-70",
].join(" ");

const afterLabelStyles = [
  labelStyles,
  "text-[var(--color-success)]",
  "opacity-70",
].join(" ");

const textStyles = ["text-sm", "leading-relaxed", "font-mono"].join(" ");

const beforeTextStyles = [textStyles, "text-[var(--color-fg-muted)]"].join(" ");

const afterTextStyles = [textStyles, "text-[var(--color-fg-default)]"].join(
  " ",
);

/**
 * Diff highlight styles
 */
const removedStyles = [
  "bg-[var(--color-error-subtle)]",
  "text-[var(--color-error)]",
  "line-through",
  "px-0.5",
  "rounded-sm",
].join(" ");

const addedStyles = [
  "bg-[var(--color-success-subtle)]",
  "text-[var(--color-success)]",
  "px-0.5",
  "rounded-sm",
].join(" ");

/**
 * Change state indicator styles
 */
const stateIndicatorStyles = [
  "absolute",
  "top-2",
  "right-2",
  "flex",
  "items-center",
  "gap-1",
  "text-[10px]",
  "font-medium",
  "px-2",
  "py-0.5",
  "rounded-full",
].join(" ");

const pendingIndicatorStyles = [
  stateIndicatorStyles,
  "bg-[var(--color-info-subtle)]",
  "text-[var(--color-info)]",
].join(" ");

const acceptedIndicatorStyles = [
  stateIndicatorStyles,
  "bg-[var(--color-success-subtle)]",
  "text-[var(--color-success)]",
].join(" ");

const rejectedIndicatorStyles = [
  stateIndicatorStyles,
  "bg-[var(--color-error-subtle)]",
  "text-[var(--color-error)]",
].join(" ");

/**
 * Footer styles
 */
const footerStyles = [
  "h-16",
  "border-t",
  "border-[var(--color-separator)]",
  "px-6",
  "flex",
  "items-center",
  "justify-between",
  "bg-[var(--color-bg-raised)]",
  "shrink-0",
].join(" ");

/**
 * Stats styles
 */
const statsStyles = [
  "flex",
  "items-center",
  "gap-4",
  "text-xs",
  "text-[var(--color-fg-muted)]",
].join(" ");

const addedStatsStyles = ["text-[var(--color-success)]"].join(" ");

const removedStatsStyles = ["text-[var(--color-error)]"].join(" ");

/**
 * Button styles
 */
const textButtonStyles = [
  "px-3",
  "py-1.5",
  "rounded-[var(--radius-sm)]",
  "text-xs",
  "font-medium",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
].join(" ");

const rejectAllStyles = [
  textButtonStyles,
  "text-[var(--color-error)]",
  "hover:bg-[var(--color-error-subtle)]",
].join(" ");

const acceptAllStyles = [
  textButtonStyles,
  "text-[var(--color-success)]",
  "hover:bg-[var(--color-success-subtle)]",
].join(" ");

const changeActionButtonStyles = [
  "h-6",
  "w-6",
  "flex",
  "items-center",
  "justify-center",
  "rounded-[var(--radius-sm)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

const acceptChangeButtonStyles = [
  changeActionButtonStyles,
  "text-[var(--color-fg-muted)]",
  "hover:bg-[var(--color-success-subtle)]",
  "hover:text-[var(--color-success)]",
].join(" ");

const rejectChangeButtonStyles = [
  changeActionButtonStyles,
  "text-[var(--color-fg-muted)]",
  "hover:bg-[var(--color-error-subtle)]",
  "hover:text-[var(--color-error)]",
].join(" ");

const editManuallyStyles = [
  "px-4",
  "py-2",
  "rounded-[var(--radius-sm)]",
  "text-xs",
  "font-medium",
  "text-[var(--color-fg-default)]",
  "border",
  "border-[var(--color-separator)]",
  "hover:bg-[var(--color-bg-hover)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
].join(" ");

const applyChangesStyles = [
  "px-4",
  "py-2",
  "rounded-[var(--radius-sm)]",
  "text-xs",
  "font-medium",
  "bg-[var(--color-fg-default)]",
  "text-[var(--color-fg-inverse)]",
  "hover:bg-[var(--color-fg-muted)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
  "flex",
  "items-center",
  "gap-2",
].join(" ");

/**
 * Calculate line count diff statistics
 */
function calculateStats(changes: DiffChange[]): {
  added: number;
  removed: number;
} {
  let added = 0;
  let removed = 0;

  for (const change of changes) {
    const beforeLines = change.before.split("\n").length;
    const afterLines = change.after.split("\n").length;

    if (afterLines > beforeLines) {
      added += afterLines - beforeLines;
    } else if (beforeLines > afterLines) {
      removed += beforeLines - afterLines;
    }

    // Count word-level changes for same-line modifications
    const beforeWords = change.before.split(/\s+/).length;
    const afterWords = change.after.split(/\s+/).length;

    if (afterWords > beforeWords) {
      added += 1;
    } else if (beforeWords > afterWords) {
      removed += 1;
    } else if (change.before !== change.after) {
      // If same word count but different content, count as 1 change each
      added += 1;
      removed += 1;
    }
  }

  return { added, removed };
}

/**
 * Simple word-diff algorithm for highlighting changes
 */
function computeWordDiff(
  before: string,
  after: string,
): {
  beforeParts: Array<{ text: string; type: "unchanged" | "removed" }>;
  afterParts: Array<{ text: string; type: "unchanged" | "added" }>;
} {
  const beforeWords = before.split(/(\s+)/);
  const afterWords = after.split(/(\s+)/);

  const beforeParts: Array<{ text: string; type: "unchanged" | "removed" }> =
    [];
  const afterParts: Array<{ text: string; type: "unchanged" | "added" }> = [];

  // Simple LCS-based diff
  const lcs = new Set<string>();
  const beforeSet = new Set(beforeWords);
  for (const word of afterWords) {
    if (beforeSet.has(word)) {
      lcs.add(word);
    }
  }

  // Mark before words
  for (const word of beforeWords) {
    const isInAfter = afterWords.includes(word);
    beforeParts.push({
      text: word,
      type: isInAfter ? "unchanged" : "removed",
    });
  }

  // Mark after words
  const beforeWordsSet = new Set(beforeWords);
  for (const word of afterWords) {
    afterParts.push({
      text: word,
      type: beforeWordsSet.has(word) ? "unchanged" : "added",
    });
  }

  return { beforeParts, afterParts };
}

/**
 * AiDiffModal - Side-by-side diff comparison modal
 *
 * Displays before/after comparison of AI-suggested changes with:
 * - Real diff highlighting (added/removed text)
 * - Individual change accept/reject states
 * - Statistics footer (+/- lines, accepted/rejected counts)
 * - Loading state for Apply Changes
 *
 * @example
 * ```tsx
 * <AiDiffModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   changes={[{ id: '1', before: 'old text', after: 'new text' }]}
 *   onAcceptAll={() => applyAllChanges()}
 *   onRejectAll={() => rejectAllChanges()}
 *   onApplyChanges={() => applyChanges()}
 * />
 * ```
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
  const { t } = useTranslation();
  const [modalState, setModalState] = useState<ModalState>("reviewing");
  const [changeStates, setChangeStates] = useState<
    Record<string, DiffChangeState>
  >(() => {
    const states: Record<string, DiffChangeState> = {};
    for (const change of changes) {
      states[change.id] = initialChangeStates[change.id] || "pending";
    }
    return states;
  });

  const totalChanges = changes.length;
  const currentChange = changes[currentIndex] || {
    id: "",
    before: "",
    after: "",
  };
  const currentState = changeStates[currentChange.id] || "pending";

  // Calculate statistics
  const stats = useMemo(() => calculateStats(changes), [changes]);
  const acceptedCount = useMemo(
    () => Object.values(changeStates).filter((s) => s === "accepted").length,
    [changeStates],
  );
  const rejectedCount = useMemo(
    () => Object.values(changeStates).filter((s) => s === "rejected").length,
    [changeStates],
  );

  // Compute word diff for current change
  const { beforeParts, afterParts } = useMemo(
    () => computeWordDiff(currentChange.before, currentChange.after),
    [currentChange.before, currentChange.after],
  );

  const handlePrev = useCallback(() => {
    if (currentIndex > 0 && onCurrentIndexChange) {
      onCurrentIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onCurrentIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalChanges - 1 && onCurrentIndexChange) {
      onCurrentIndexChange(currentIndex + 1);
    }
  }, [currentIndex, totalChanges, onCurrentIndexChange]);

  const handleAcceptChange = useCallback((changeId: string) => {
    setChangeStates((prev) => ({ ...prev, [changeId]: "accepted" }));
  }, []);

  const handleRejectChange = useCallback((changeId: string) => {
    setChangeStates((prev) => ({ ...prev, [changeId]: "rejected" }));
  }, []);

  const handleAcceptAll = useCallback(() => {
    const newStates: Record<string, DiffChangeState> = {};
    for (const change of changes) {
      newStates[change.id] = "accepted";
    }
    setChangeStates(newStates);
    onAcceptAll();
  }, [changes, onAcceptAll]);

  const handleRejectAll = useCallback(() => {
    const newStates: Record<string, DiffChangeState> = {};
    for (const change of changes) {
      newStates[change.id] = "rejected";
    }
    setChangeStates(newStates);
    onRejectAll();
  }, [changes, onRejectAll]);

  const handleApplyChanges = useCallback(async () => {
    setModalState("applying");

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, simulateDelay));

    setModalState("applied");
    onApplyChanges();

    // Auto-close after success
    setTimeout(() => {
      onOpenChange(false);
      setModalState("reviewing");
    }, 500);
  }, [simulateDelay, onApplyChanges, onOpenChange]);

  const isApplying = modalState === "applying";
  const isApplied = modalState === "applied";

  // Render state indicator
  const renderStateIndicator = () => {
    if (currentState === "accepted") {
      return (
        <div className={acceptedIndicatorStyles}>
          <CheckIcon />
          <span>{t('ai.diff.accepted')}</span>
        </div>
      );
    }
    if (currentState === "rejected") {
      return (
        <div className={rejectedIndicatorStyles}>
          <XIcon />
          <span>{t('ai.diff.rejected')}</span>
        </div>
      );
    }
    return (
      <div className={pendingIndicatorStyles}>
        <span>{t('ai.diff.pending')}</span>
      </div>
    );
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayStyles} />
        <DialogPrimitive.Content className={contentStyles}>
          {/* Header */}
          <div className={headerStyles}>
            <div className="flex items-center gap-4">
              <DialogPrimitive.Title className="font-medium text-sm text-[var(--color-fg-default)]">
                {t('ai.diff.reviewChanges')}
              </DialogPrimitive.Title>
              <span className="text-xs text-[var(--color-fg-muted)]">
                {t('ai.diff.modifyCount', { count: totalChanges })}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              {totalChanges > 1 && (
                <div className={navContainerStyles}>
                  <button
                    type="button"
                    className={navButtonStyles}
                    onClick={handlePrev}
                    disabled={currentIndex === 0 || isApplying}
                  >
                    <ChevronLeftIcon />
                  </button>
                  <span className={navTextStyles}>
                    {t('ai.diff.changeNav', { current: currentIndex + 1, total: totalChanges })}
                  </span>
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

              {/* Per-change accept/reject buttons */}
              {currentState === "pending" && !isApplying && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={acceptChangeButtonStyles}
                    onClick={() => handleAcceptChange(currentChange.id)}
                    title={t('ai.diff.acceptThisChange')}
                  >
                    <CheckIcon />
                  </button>
                  <button
                    type="button"
                    className={rejectChangeButtonStyles}
                    onClick={() => handleRejectChange(currentChange.id)}
                    title={t('ai.diff.rejectThisChange')}
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

          {/* Diff panels */}
          <div className={diffContainerStyles}>
            {/* Before panel */}
            <div className={`${beforePanelStyles} relative`}>
              <div className={beforeLabelStyles}>{t('ai.diff.before')}</div>
              <p className={beforeTextStyles}>
                {beforeParts.map((part, idx) => (
                  <span
                    key={idx}
                    className={
                      part.type === "removed" ? removedStyles : undefined
                    }
                  >
                    {part.text}
                  </span>
                ))}
              </p>
            </div>

            {/* After panel */}
            <div className={`${afterPanelStyles} relative`}>
              {renderStateIndicator()}
              <div className={afterLabelStyles}>{t('ai.diff.after')}</div>
              <p className={afterTextStyles}>
                {afterParts.map((part, idx) => (
                  <span
                    key={idx}
                    className={part.type === "added" ? addedStyles : undefined}
                  >
                    {part.text}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={footerStyles}>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="ai-reject-all"
                  className={rejectAllStyles}
                  onClick={handleRejectAll}
                  disabled={isApplying}
                >
                  {t('ai.diff.rejectAll')}
                </button>
                <button
                  type="button"
                  data-testid="ai-accept-all"
                  className={acceptAllStyles}
                  onClick={handleAcceptAll}
                  disabled={isApplying}
                >
                  {t('ai.diff.acceptAll')}
                </button>
              </div>

              {/* Statistics */}
              <div className={statsStyles}>
                <span className={addedStatsStyles}>{t('ai.diff.statsAdded', { count: stats.added })}</span>
                <span className={removedStatsStyles}>
                  {t('ai.diff.statsRemoved', { count: stats.removed })}
                </span>
                {(acceptedCount > 0 || rejectedCount > 0) && (
                  <>
                    <span className="text-[var(--color-separator)]">|</span>
                    <span className="text-[var(--color-success)]">
                      {t('ai.diff.statsAccepted', { count: acceptedCount })}
                    </span>
                    <span className="text-[var(--color-error)]">
                      {t('ai.diff.statsRejected', { count: rejectedCount })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {onEditManually && (
                <button
                  type="button"
                  className={editManuallyStyles}
                  onClick={onEditManually}
                  disabled={isApplying}
                >
                  {t('ai.diff.editManually')}
                </button>
              )}
              <button
                type="button"
                className={applyChangesStyles}
                onClick={handleApplyChanges}
                disabled={isApplying || isApplied}
              >
                {isApplying && <Spinner />}
                {isApplied
                  ? t('ai.diff.applied')
                  : isApplying
                    ? t('ai.diff.applying')
                    : t('ai.diff.applyChanges')}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Helper component to highlight diff text with added/removed styling
 */
export function DiffText({
  text,
  type,
}: {
  text: string;
  type: "added" | "removed";
}): JSX.Element {
  const styles = type === "added" ? addedStyles : removedStyles;
  return <span className={styles}>{text}</span>;
}

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { AiInlineConfirmProps, InlineConfirmState } from "./types";
import { AiInlinePreview } from "./AiInlinePreview";
import { Button } from "../../primitives/Button";

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
const DiffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path
      d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200Z"
      opacity="0.2"
    />
    <path d="M192,120H152V80a8,8,0,0,0-16,0v40H96a8,8,0,0,0,0,16h40v40a8,8,0,0,0,16,0V136h40a8,8,0,0,0,0-16ZM208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Z" />
  </svg>
);
const Spinner = () => (
  <svg
    className="animate-spin"
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
const containerStyles = ["relative", "group"].join(" ");
const toolbarStyles = [
  "absolute -top-12 right-0 flex",
  "items-center gap-1 bg-[var(--color-bg-raised)] border",
  "border-[var(--color-separator)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] p-1",
  "z-[var(--z-popover)] transition-opacity duration-[var(--duration-normal)]",
].join(" ");
const actionButtonBaseStyles = [
  "h-7 px-2 flex items-center",
  "gap-1.5 rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] transition-colors",
  "duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)] disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");
const acceptButtonStyles = [
  actionButtonBaseStyles,
  "hover:bg-[var(--color-success-subtle)] hover:text-[var(--color-success)]",
].join(" ");
const rejectButtonStyles = [
  actionButtonBaseStyles,
  "hover:bg-[var(--color-error-subtle)] hover:text-[var(--color-error)]",
].join(" ");
const diffButtonStyles = [
  "h-7 w-7 flex items-center",
  "justify-center rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)]",
  "hover:text-[var(--color-fg-default)] transition-colors duration-[var(--duration-fast)] focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");
const separatorStyles = ["w-px h-4 bg-[var(--color-separator)] mx-0.5"].join(
  " ",
);
const labelStyles = ["text-[11px]", "font-medium"].join(" ");

/** AiInlineConfirm - Inline confirmation component for AI suggestions Displays an AI-suggested text modification with Accept/Reject actions. Features: - Shows original text (strikethrough) and suggested text (highlighted) - Internal state machine: pending → applying → accepted/rejected - Smooth animations for all state transitions - Loading spinner during applying state
 * @example
 * ```tsx
 * <AiInlineConfirm
 *   originalText="The castle stood majestically on the hill"
 *   suggestedText="The ancient fortress loomed atop the windswept ridge"
 *   onAccept={() => applyChange()}
 *   onReject={() => cancelChange()}
 *   onViewDiff={() => openDiffModal()}
 * />
 * ```
 */
export function AiInlineConfirm({
  originalText,
  suggestedText,
  onAccept,
  onReject,
  onViewDiff,
  className = "",
  showComparison = true,
}: AiInlineConfirmProps): JSX.Element {
  const { t } = useTranslation();
  const [state, setState] = useState<InlineConfirmState>("pending");
  const handleAccept = useCallback(async () => {
    if (state === "applying") {
      return;
    }
    setState("applying");
    try {
      await onAccept();
      setState("accepted");
    } catch {
      setState("pending");
    }
  }, [onAccept, state]);

  const handleReject = useCallback(async () => {
    if (state === "applying") {
      return;
    }
    setState("applying");
    try {
      await onReject();
      setState("rejected");
    } catch {
      setState("pending");
    }
  }, [onReject, state]);

  const isApplying = state === "applying";
  const isAccepted = state === "accepted";
  const isRejected = state === "rejected";
  const isFinished = isAccepted || isRejected;

  // Determine toolbar visibility
  const isPending = state === "pending";
  const toolbarVisible = isPending || isApplying;
  const toolbarOpacity = toolbarVisible
    ? "opacity-0 group-hover:opacity-100"
    : "opacity-0 pointer-events-none";

  return (
    <div className={`${containerStyles} ${className}`}>
      <AiInlinePreview
        state={state}
        originalText={originalText}
        suggestedText={suggestedText}
        showComparison={showComparison}
      />

      {/* Action toolbar */}
      {!isFinished && (
        <div className={`${toolbarStyles} ${toolbarOpacity}`}>
          <Button
            type="button"
            className={acceptButtonStyles}
            onClick={handleAccept}
            disabled={isApplying}
            title={t("ai.inlineConfirm.accept")}
          >
            {isApplying ? <Spinner /> : <CheckIcon />}
            <span className={labelStyles}>
              {isApplying
                ? t("ai.inlineConfirm.applying")
                : t("ai.inlineConfirm.accept")}
            </span>
          </Button>

          <div className={separatorStyles} />

          <Button
            type="button"
            className={rejectButtonStyles}
            onClick={handleReject}
            disabled={isApplying}
            title={t("ai.inlineConfirm.reject")}
          >
            <XIcon />
            <span className={labelStyles}>{t("ai.inlineConfirm.reject")}</span>
          </Button>

          {onViewDiff && (
            <>
              <div className={separatorStyles} />
              <Button
                type="button"
                className={diffButtonStyles}
                onClick={onViewDiff}
                disabled={isApplying}
                title={t("ai.inlineConfirm.viewDiff")}
              >
                <DiffIcon />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

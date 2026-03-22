import type { InlineConfirmState } from "./types";

/**
 * Styles for the content wrapper with transitions
 */
const contentWrapperStyles = [
  "transition-all",
  "duration-[var(--duration-slow)]",
  "ease-[var(--ease-default)]",
].join(" ");

/**
 * Styles for the original text (strikethrough)
 */
const originalTextStyles = [
  "text-(--color-fg-muted)",
  "line-through",
  "decoration-[var(--color-error)]/50",
  "bg-[var(--color-error-subtle)]",
  "px-1",
  "-mx-1",
  "rounded",
  "transition-opacity",
  "duration-[var(--duration-normal)]",
].join(" ");

/**
 * Styles for the suggested text (highlighted)
 */
const suggestedTextStyles = [
  "relative",
  "bg-[var(--color-success-subtle)]",
  "px-1",
  "-mx-1",
  "rounded",
  "border-l-2",
  "border-[var(--color-success)]",
  "py-0.5",
  "transition-all",
  "duration-[var(--duration-normal)]",
].join(" ");

/**
 * Styles for the pending state highlight (blue)
 */
const pendingHighlightStyles = [
  "relative",
  "bg-[var(--color-info-subtle)]",
  "px-1",
  "-mx-1",
  "rounded",
  "border-l-2",
  "border-[var(--color-info)]",
  "py-0.5",
  "transition-all",
  "duration-[var(--duration-normal)]",
].join(" ");

/**
 * Styles for accepted final state (no highlight)
 */
const acceptedTextStyles = [
  "text-(--color-fg-default)",
  "transition-all",
  "duration-[var(--duration-normal)]",
].join(" ");

/**
 * Styles for rejected final state (original text restored)
 */
const rejectedTextStyles = [
  "text-(--color-fg-default)",
  "transition-all",
  "duration-[var(--duration-normal)]",
].join(" ");

interface AiInlinePreviewProps {
  state: InlineConfirmState;
  originalText: string;
  suggestedText: string;
  showComparison: boolean;
}

/**
 * AiInlinePreview - Before/after text preview for inline AI suggestions
 *
 * Renders original and suggested text with state-dependent styling.
 */
export function AiInlinePreview({
  state,
  originalText,
  suggestedText,
  showComparison,
}: AiInlinePreviewProps): JSX.Element {
  const isPending = state === "pending";
  const isApplying = state === "applying";
  const isAccepted = state === "accepted";
  const isRejected = state === "rejected";

  return (
    <div className={contentWrapperStyles}>
      {/* Pending state: show comparison or just suggested */}
      {isPending && (
        <>
          {showComparison && (
            <span className={`${originalTextStyles} mr-2`}>{originalText}</span>
          )}
          <span className={pendingHighlightStyles}>
            <span className="text-(--color-fg-default)">
              {suggestedText}
            </span>
          </span>
        </>
      )}

      {/* Applying state: show suggested with loading indicator */}
      {isApplying && (
        <span className={suggestedTextStyles}>
          <span className="text-(--color-fg-default) opacity-70">
            {suggestedText}
          </span>
        </span>
      )}

      {/* Accepted state: show suggested text without highlight */}
      {isAccepted && (
        <span className={acceptedTextStyles}>{suggestedText}</span>
      )}

      {/* Rejected state: show original text restored */}
      {isRejected && <span className={rejectedTextStyles}>{originalText}</span>}
    </div>
  );
}

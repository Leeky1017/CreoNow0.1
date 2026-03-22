import { useTranslation } from "react-i18next";
import { Button } from "../../primitives/Button";

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
const footerStyles = [
  "h-16 border-t border-[var(--color-separator)] px-6",
  "flex items-center justify-between bg-[var(--color-bg-raised)]",
  "shrink-0",
].join(" ");
const statsStyles = [
  "flex items-center gap-4 text-xs",
  "text-(--color-fg-muted)",
].join(" ");
const addedStatsStyles = ["text-(--color-success)"].join(" ");
const removedStatsStyles = ["text-(--color-error)"].join(" ");
const textButtonStyles = [
  "px-3 py-1.5 rounded-sm text-xs",
  "font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] disabled:opacity-50",
  "disabled:cursor-not-allowed",
].join(" ");
const rejectAllStyles = [
  textButtonStyles,
  "text-(--color-error) hover:bg-[var(--color-error-subtle)]",
].join(" ");
const acceptAllStyles = [
  textButtonStyles,
  "text-(--color-success) hover:bg-[var(--color-success-subtle)]",
].join(" ");
const editManuallyStyles = [
  "px-4 py-2 rounded-sm text-xs",
  "font-medium text-(--color-fg-default) border border-[var(--color-separator)]",
  "hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--duration-fast)] focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] disabled:opacity-50",
  "disabled:cursor-not-allowed",
].join(" ");
const applyChangesStyles = [
  "px-4 py-2 rounded-sm text-xs",
  "font-medium bg-[var(--color-fg-default)] text-(--color-fg-inverse) hover:bg-[var(--color-fg-muted)]",
  "transition-colors duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] disabled:opacity-50 disabled:cursor-not-allowed",
  "flex items-center gap-2",
].join(" ");

interface AiDiffSummaryProps {
  stats: { added: number; removed: number };
  acceptedCount: number;
  rejectedCount: number;
  isApplying: boolean;
  isApplied: boolean;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApplyChanges: () => Promise<void>;
  onEditManually?: () => void;
}

export function AiDiffSummary({
  stats,
  acceptedCount,
  rejectedCount,
  isApplying,
  isApplied,
  onAcceptAll,
  onRejectAll,
  onApplyChanges,
  onEditManually,
}: AiDiffSummaryProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={footerStyles}>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            data-testid="ai-reject-all"
            className={rejectAllStyles}
            onClick={onRejectAll}
            disabled={isApplying}
          >
            {t("ai.diff.rejectAll")}
          </Button>
          <Button
            type="button"
            data-testid="ai-accept-all"
            className={acceptAllStyles}
            onClick={onAcceptAll}
            disabled={isApplying}
          >
            {t("ai.diff.acceptAll")}
          </Button>
        </div>

        {/* Statistics */}
        <div className={statsStyles}>
          <span className={addedStatsStyles}>
            {t("ai.diff.statsAdded", { count: stats.added })}
          </span>
          <span className={removedStatsStyles}>
            {t("ai.diff.statsRemoved", { count: stats.removed })}
          </span>
          {(acceptedCount > 0 || rejectedCount > 0) && (
            <>
              <span className="text-(--color-separator)">|</span>
              <span className="text-(--color-success)">
                {t("ai.diff.statsAccepted", { count: acceptedCount })}
              </span>
              <span className="text-(--color-error)">
                {t("ai.diff.statsRejected", { count: rejectedCount })}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {onEditManually && (
          <Button
            type="button"
            className={editManuallyStyles}
            onClick={onEditManually}
            disabled={isApplying}
          >
            {t("ai.diff.editManually")}
          </Button>
        )}
        <Button
          type="button"
          className={applyChangesStyles}
          onClick={onApplyChanges}
          disabled={isApplying || isApplied}
        >
          {isApplying && <Spinner />}
          {isApplied
            ? t("ai.diff.applied")
            : isApplying
              ? t("ai.diff.applying")
              : t("ai.diff.applyChanges")}
        </Button>
      </div>
    </div>
  );
}

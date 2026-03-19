/**
 * Badge and metadata sub-components for version history cards.
 */
import { Bot, Columns2, Eye, RotateCcw, Shield, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { VersionAuthorType, WordChange } from "./versionHistoryTypes";

// ============================================================================
// Icons
// ============================================================================

export function UserIcon() {
  return <User size={16} strokeWidth={1.5} />;
}

export function AiIcon() {
  return <Bot size={16} strokeWidth={1.5} />;
}

export function AutoSaveIcon() {
  return <Shield size={16} strokeWidth={1.5} />;
}

export function RestoreIcon() {
  return <RotateCcw size={16} strokeWidth={1.5} />;
}

export function CompareIcon() {
  return <Columns2 size={16} strokeWidth={1.5} />;
}

export function PreviewIcon() {
  return <Eye size={16} strokeWidth={1.5} />;
}

// ============================================================================
// Badges
// ============================================================================

/**
 * Author badge component
 */
export function AuthorBadge({
  type,
  name,
}: {
  type: VersionAuthorType;
  name: string;
}) {
  const baseClasses = [
    "h-5",
    "px-1.5",
    "rounded",
    "flex",
    "items-center",
    "gap-1.5",
    "text-[10px]",
    "font-medium",
    "leading-none",
  ].join(" ");

  switch (type) {
    case "ai":
      return (
        <div
          className={`${baseClasses} bg-[var(--color-info-subtle)] border border-[var(--color-info)]/20 text-[var(--color-info)]`}
        >
          <AiIcon />
          <span className="mt-px">{name}</span>
        </div>
      );
    case "auto-save":
      return (
        <div
          className={`${baseClasses} bg-[var(--color-zen-hover)] border border-[var(--color-zen-hover)] text-[var(--color-fg-muted)]`}
        >
          <AutoSaveIcon />
          <span className="mt-px">{name}</span>
        </div>
      );
    default:
      return (
        <div
          className={`${baseClasses} bg-[var(--color-bg-overlay)] border border-[var(--color-zen-hover)] text-[var(--color-fg-default)]`}
        >
          <UserIcon />
          <span className="mt-px">{name}</span>
        </div>
      );
  }
}

/**
 * Explicit AI modification marker shown only when user enables the preference.
 */
export function AiMarkTag(props: { versionId: string }): JSX.Element {
  const { t } = useTranslation();
  return (
    <span
      data-testid={`ai-mark-tag-${props.versionId}`}
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none bg-[var(--color-info)] text-[var(--color-bg-surface)]"
    >
      {t("versionHistory.panel.aiModify")}
    </span>
  );
}

/**
 * Version metadata display (reason + affected paragraphs)
 */
export function VersionMeta({
  reason,
  affectedParagraphs,
}: {
  reason?: string;
  affectedParagraphs?: number;
}) {
  const { t } = useTranslation();
  if (!reason && affectedParagraphs === undefined) {
    return null;
  }

  const getReasonText = (r: string): string => {
    if (r === "autosave") return t("versionHistory.panel.autosave");
    if (r === "manual-save") return t("versionHistory.panel.manualSave");
    if (r === "status-change") return t("versionHistory.panel.statusChange");
    if (r === "ai-accept") return t("versionHistory.panel.aiModify");
    if (r.startsWith("ai-apply:")) return t("versionHistory.panel.aiModify");
    return r;
  };

  return (
    <div className="flex items-center gap-2 text-[10px] text-[var(--color-fg-placeholder)] mt-1">
      {reason && (
        <span className="flex items-center gap-1">
          <span className="opacity-60">{t("versionHistory.panel.reason")}</span>
          <span>{getReasonText(reason)}</span>
        </span>
      )}
      {affectedParagraphs !== undefined && affectedParagraphs > 0 && (
        <>
          {reason && <span className="opacity-40">·</span>}
          <span>
            {t("versionHistory.panel.affectedParagraphs", {
              count: affectedParagraphs,
            })}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Diff summary preview
 */
export function DiffSummaryPreview({ summary }: { summary?: string }) {
  const { t } = useTranslation();
  if (!summary) return null;

  return (
    <div className="mt-2 p-2 bg-[var(--color-bg-raised)] rounded border border-[var(--color-separator)] text-[11px] text-[var(--color-fg-muted)] font-mono leading-relaxed">
      <span className="text-[var(--color-fg-placeholder)] text-[9px] uppercase tracking-wider block mb-1">
        {t("versionHistory.panel.changePreview")}
      </span>
      <span className="line-clamp-2">{summary}</span>
    </div>
  );
}

/**
 * Word change badge component
 */
export function WordChangeBadge({ change }: { change: WordChange }) {
  const { t } = useTranslation();
  if (change.type === "none") {
    return (
      <span className="text-[10px] text-[var(--color-fg-muted)] font-mono bg-[var(--color-zen-hover)] px-1 rounded">
        {t("versionHistory.panel.noChanges")}
      </span>
    );
  }

  const isAdded = change.type === "added";
  const colorClasses = isAdded
    ? "text-[var(--color-success)] bg-[var(--color-success-subtle)]"
    : "text-[var(--color-error)] bg-[var(--color-error-subtle)]";
  const sign = isAdded ? "+" : "-";

  return (
    <span className={`text-[10px] font-mono px-1 rounded ${colorClasses}`}>
      {t("versionHistory.panel.wordsCount", { sign, count: change.count })}
    </span>
  );
}

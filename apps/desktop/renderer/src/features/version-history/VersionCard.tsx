/**
 * VersionCard — single version entry rendering with hover actions.
 */
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Tooltip } from "../../components/primitives/Tooltip";
import {
  AuthorBadge,
  AiMarkTag,
  VersionMeta,
  DiffSummaryPreview,
  WordChangeBadge,
  RestoreIcon,
  CompareIcon,
  PreviewIcon,
} from "./VersionBadges";
import type { VersionEntry, TimeGroup } from "./versionHistoryTypes";

// ============================================================================
// HoverActions
// ============================================================================

function HoverActions({
  versionId,
  onRestore,
  onCompare,
  onPreview,
}: {
  versionId: string;
  onRestore?: (id: string) => void;
  onCompare?: (id: string) => void;
  onPreview?: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={[
        "absolute",
        "inset-0",
        "bg-[var(--color-bg-hover)]/95",
        "backdrop-blur-sm",
        "rounded-lg",
        "flex",
        "items-center",
        "justify-center",
        "gap-2",
        "z-[var(--z-overlay)]",
        "opacity-0",
        "pointer-events-none",
        "group-hover:opacity-100",
        "group-hover:pointer-events-auto",
        "transition-opacity",
        "duration-[var(--duration-fast)]",
      ].join(" ")}
    >
      <Tooltip content={t("versionHistory.panel.restore")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRestore?.(versionId)}
          className="focus-ring p-1.5 rounded-md hover:bg-[var(--color-bg-overlay)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
        >
          <RestoreIcon />
        </Button>
      </Tooltip>
      <Tooltip content={t("versionHistory.panel.compare")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCompare?.(versionId)}
          className="focus-ring p-1.5 rounded-md hover:bg-[var(--color-bg-overlay)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
        >
          <CompareIcon />
        </Button>
      </Tooltip>
      <Tooltip content={t("versionHistory.panel.preview")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPreview?.(versionId)}
          className="focus-ring p-1.5 rounded-md hover:bg-[var(--color-bg-overlay)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
        >
          <PreviewIcon />
        </Button>
      </Tooltip>
    </div>
  );
}

// ============================================================================
// VersionCard
// ============================================================================

export function VersionCard({
  version,
  isSelected,
  onSelect,
  onRestore,
  onCompare,
  onPreview,
  showAiMarks,
}: {
  version: VersionEntry;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  onRestore?: (id: string) => void;
  onCompare?: (id: string) => void;
  onPreview?: (id: string) => void;
  showAiMarks?: boolean;
}) {
  const { t } = useTranslation();
  const baseCardStyles = [
    "group",
    "relative",
    "p-3",
    "transition-colors",
    "duration-[var(--duration-fast)]",
  ].join(" ");

  if (isSelected) {
    return (
      <div
        className={`${baseCardStyles} rounded-r-lg rounded-l-none pl-[10px] bg-[var(--color-bg-raised)] border-l-2 border-[var(--color-accent)] border-t border-r border-b border-t-[var(--color-separator)] border-b-[var(--color-separator)] border-r-[var(--color-separator)]`}
        onClick={() => onSelect?.(version.id)}
        data-testid={`version-card-${version.id}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-[var(--color-fg-muted)] font-medium">
            {version.timestamp}
          </span>
          <WordChangeBadge change={version.wordChange} />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <AuthorBadge type={version.authorType} name={version.authorName} />
          {showAiMarks && version.authorType === "ai" ? (
            <AiMarkTag versionId={version.id} />
          ) : null}
        </div>
        <VersionMeta
          reason={version.reason}
          affectedParagraphs={version.affectedParagraphs}
        />
        <p className="text-[13px] text-[var(--color-fg-default)] leading-snug mt-2 mb-2">
          {version.description}
        </p>
        <DiffSummaryPreview summary={version.diffSummary} />
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Tooltip content={t("versionHistory.panel.restore")}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRestore?.(version.id)}
              className="!h-7 !text-[10px] !px-0 !bg-[var(--color-bg-active)] hover:!bg-[var(--color-bg-selected)]"
            >
              {t("versionHistory.panel.restore")}
            </Button>
          </Tooltip>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onCompare?.(version.id)}
            className="!h-7 !text-[10px] !px-0 !bg-[var(--color-bg-active)] hover:!bg-[var(--color-bg-selected)]"
          >
            {t("versionHistory.panel.compare")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPreview?.(version.id)}
            className="!h-7 !text-[10px] !px-0 !bg-[var(--color-bg-active)] hover:!bg-[var(--color-bg-selected)]"
          >
            {t("versionHistory.panel.preview")}
          </Button>
        </div>
      </div>
    );
  }

  if (version.isCurrent) {
    return (
      <div
        className={`${baseCardStyles} rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-separator)] hover:bg-[var(--color-bg-hover)] cursor-pointer`}
        onClick={() => onSelect?.(version.id)}
        data-testid={`version-card-${version.id}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-1.5 py-0.5 rounded">
              {t("versionHistory.panel.current")}
            </span>
            <span className="text-xs text-[var(--color-fg-placeholder)]">
              {version.timestamp}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <AuthorBadge type={version.authorType} name={version.authorName} />
          {showAiMarks && version.authorType === "ai" ? (
            <AiMarkTag versionId={version.id} />
          ) : null}
        </div>
        <p className="text-[13px] text-[var(--color-fg-muted)] leading-snug mb-2 font-light">
          {version.description}
        </p>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--color-fg-placeholder)] font-medium">
            {version.wordChange.count === 0
              ? t("versionHistory.panel.wordsChanged", { value: "0" })
              : t("versionHistory.panel.wordsChanged", {
                  value: `${version.wordChange.type === "added" ? "+" : "-"}${version.wordChange.count}`,
                })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseCardStyles} rounded-lg border border-transparent hover:border-[var(--color-separator)] hover:bg-[var(--color-bg-hover)] cursor-pointer`}
      onClick={() => onSelect?.(version.id)}
      data-testid={`version-card-${version.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-fg-muted)]">
          {version.timestamp}
        </span>
        <WordChangeBadge change={version.wordChange} />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <AuthorBadge type={version.authorType} name={version.authorName} />
        {showAiMarks && version.authorType === "ai" ? (
          <AiMarkTag versionId={version.id} />
        ) : null}
      </div>
      {version.affectedParagraphs !== undefined &&
        version.affectedParagraphs > 0 && (
          <div className="text-[10px] text-[var(--color-fg-placeholder)] mt-1 mb-1">
            {t("versionHistory.panel.affectedParagraphs", {
              count: version.affectedParagraphs,
            })}
          </div>
        )}
      <p className="text-[13px] text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-fg-muted)] leading-snug mb-1">
        {version.description}
      </p>
      <HoverActions
        versionId={version.id}
        onRestore={onRestore}
        onCompare={onCompare}
        onPreview={onPreview}
      />
    </div>
  );
}

// ============================================================================
// TimeGroupSection
// ============================================================================

export function TimeGroupSection({
  group,
  selectedId,
  onSelect,
  onRestore,
  onCompare,
  onPreview,
  showAiMarks,
}: {
  group: TimeGroup;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRestore?: (id: string) => void;
  onCompare?: (id: string) => void;
  onPreview?: (id: string) => void;
  showAiMarks?: boolean;
}) {
  const showLabel = group.label !== "";

  return (
    <>
      {showLabel && (
        <div className="px-2 py-1">
          <span className="text-[10px] font-medium text-[var(--color-fg-placeholder)] uppercase tracking-wider">
            {group.label}
          </span>
        </div>
      )}
      {group.versions.map((version) => (
        <VersionCard
          key={version.id}
          version={version}
          isSelected={selectedId === version.id}
          onSelect={onSelect}
          onRestore={onRestore}
          onCompare={onCompare}
          onPreview={onPreview}
          showAiMarks={showAiMarks}
        />
      ))}
    </>
  );
}

import { Bot, Columns2, Eye, RotateCcw, Shield, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";

/**
 * Version author types
 */
export type VersionAuthorType = "user" | "ai" | "auto-save";

/**
 * Word change indicator
 */
export interface WordChange {
  type: "added" | "removed" | "none";
  count: number;
}

/**
 * Version entry data
 */
export interface VersionEntry {
  id: string;
  /** Display timestamp (e.g., "10:42 AM" or "Just now") */
  timestamp: string;
  /** Author type for badge styling */
  authorType: VersionAuthorType;
  /** Author display name */
  authorName: string;
  /** Description of the change */
  description: string;
  /** Word change indicator */
  wordChange: WordChange;
  /** Whether this is the current version */
  isCurrent?: boolean;
  /** Modification reason (e.g., "autosave", "manual-save", "ai-accept") */
  reason?: string;
  /** Number of affected paragraphs */
  affectedParagraphs?: number;
  /** Brief diff summary (first ~50 chars of change) */
  diffSummary?: string;
}

/**
 * Time group for organizing versions
 */
export interface TimeGroup {
  label: string;
  versions: VersionEntry[];
}

/**
 * VersionHistoryPanel props
 */
export interface VersionHistoryPanelProps {
  /** Document title */
  documentTitle?: string;
  /** Grouped versions by time */
  timeGroups: TimeGroup[];
  /** Currently selected version ID */
  selectedId?: string | null;
  /** Callback when a version is selected */
  onSelect?: (versionId: string) => void;
  /** Callback when restore is clicked */
  onRestore?: (versionId: string) => void;
  /** Callback when compare is clicked */
  onCompare?: (versionId: string) => void;
  /** Callback when preview is clicked */
  onPreview?: (versionId: string) => void;
  /** Callback when close is clicked */
  onClose?: () => void;
  /** Callback when configure auto-save is clicked */
  onConfigureAutoSave?: () => void;
  /** Last saved time text */
  lastSavedText?: string;
  /** Auto-save enabled */
  autoSaveEnabled?: boolean;
  /** Whether to show explicit AI modification markers */
  showAiMarks?: boolean;
  /** Panel width in pixels */
  width?: number;
}

// ============================================================================
// Icons
// ============================================================================

function CloseIcon() {
  return <X size={16} strokeWidth={1.5} />;
}

function UserIcon() {
  return <User size={16} strokeWidth={1.5} />;
}

function AiIcon() {
  return <Bot size={16} strokeWidth={1.5} />;
}

function AutoSaveIcon() {
  return <Shield size={16} strokeWidth={1.5} />;
}

function RestoreIcon() {
  return <RotateCcw size={16} strokeWidth={1.5} />;
}

function CompareIcon() {
  return <Columns2 size={16} strokeWidth={1.5} />;
}

function PreviewIcon() {
  return <Eye size={16} strokeWidth={1.5} />;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Panel content styles - used by VersionHistoryPanelContent
 * Does NOT include container styles (aside/width/border/shadow).
 */
const panelContentStyles = [
  "bg-[var(--color-bg-surface)]",
  "flex",
  "flex-col",
  "h-full",
].join(" ");

/**
 * Legacy panel styles - includes container styles for standalone use.
 * @deprecated Use VersionHistoryPanelContent with layout containers instead.
 */
const panelStyles = [
  "bg-[var(--color-bg-surface)]",
  "border-l",
  "border-[var(--color-separator)]",
  "flex",
  "flex-col",
  "h-full",
  "shadow-[var(--shadow-xl)]",
  "shrink-0",
].join(" ");

const headerStyles = [
  "px-5",
  "py-5",
  "border-b",
  "border-[var(--color-separator)]",
  "flex",
  "justify-between",
  "items-start",
  "bg-[var(--color-bg-surface)]",
].join(" ");

const closeButtonStyles = [
  "text-[var(--color-fg-muted)]",
  "hover:text-[var(--color-fg-default)]",
  "transition-colors",
  "p-1",
  "-mr-1",
  "rounded-md",
  "hover:bg-[var(--color-zen-hover)]",
].join(" ");

const scrollAreaStyles = ["flex-1", "overflow-y-auto", "p-3", "space-y-2"].join(
  " ",
);

const footerStyles = [
  "px-5",
  "py-4",
  "border-t",
  "border-[var(--color-separator)]",
  "bg-[var(--color-bg-surface)]",
].join(" ");

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Author badge component
 */
function AuthorBadge({
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
function AiMarkTag(props: { versionId: string }): JSX.Element {
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
function VersionMeta({
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

  // Map raw reason to human-readable text
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
          <span>{t("versionHistory.panel.affectedParagraphs", { count: affectedParagraphs })}</span>
        </>
      )}
    </div>
  );
}

/**
 * Diff summary preview
 */
function DiffSummaryPreview({ summary }: { summary?: string }) {
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
function WordChangeBadge({ change }: { change: WordChange }) {
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

/**
 * Hover actions overlay
 */
function HoverActions({
  versionId,
  onRestore: _onRestore,
  onCompare,
  onPreview,
}: {
  versionId: string;
  onRestore?: (id: string) => void;
  onCompare?: (id: string) => void;
  onPreview?: (id: string) => void;
}) {
  const { t } = useTranslation();
  void _onRestore; // Reserved for future use
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
      <Tooltip content={t('versionHistory.panel.restoreComingSoon')}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="focus-ring p-1.5 rounded-md text-[var(--color-fg-muted)] opacity-50 cursor-not-allowed"
        >
          <RestoreIcon />
        </button>
      </Tooltip>
      <Tooltip content="Compare">
        <button
          type="button"
          onClick={() => onCompare?.(versionId)}
          className="focus-ring p-1.5 rounded-md hover:bg-[var(--color-bg-overlay)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
        >
          <CompareIcon />
        </button>
      </Tooltip>
      <Tooltip content="Preview">
        <button
          type="button"
          onClick={() => onPreview?.(versionId)}
          className="focus-ring p-1.5 rounded-md hover:bg-[var(--color-bg-overlay)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
        >
          <PreviewIcon />
        </button>
      </Tooltip>
    </div>
  );
}

/**
 * Version card component
 */
function VersionCard({
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

        {/* Version metadata */}
        <VersionMeta
          reason={version.reason}
          affectedParagraphs={version.affectedParagraphs}
        />

        <p className="text-[13px] text-[var(--color-fg-default)] leading-snug mt-2 mb-2">
          {version.description}
        </p>

        {/* Diff summary preview */}
        <DiffSummaryPreview summary={version.diffSummary} />

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Tooltip content={t('versionHistory.panel.restoreComingSoon')}>
            <Button
              variant="secondary"
              size="sm"
              disabled
              aria-disabled="true"
              className="!h-7 !text-[10px] !px-0 !bg-[var(--color-bg-active)]"
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
              : t("versionHistory.panel.wordsChanged", { value: `${version.wordChange.type === "added" ? "+" : "-"}${version.wordChange.count}` })}
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

      {/* Version metadata - shows affected paragraphs if available */}
      {version.affectedParagraphs !== undefined &&
        version.affectedParagraphs > 0 && (
          <div className="text-[10px] text-[var(--color-fg-placeholder)] mt-1 mb-1">
            {t("versionHistory.panel.affectedParagraphs", { count: version.affectedParagraphs })}
          </div>
        )}

      <p className="text-[13px] text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-fg-muted)] leading-snug mb-1">
        {version.description}
      </p>

      {/* Hover actions */}
      <HoverActions
        versionId={version.id}
        onRestore={onRestore}
        onCompare={onCompare}
        onPreview={onPreview}
      />
    </div>
  );
}

/**
 * Time group section
 */
function TimeGroupSection({
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
  // Don't render label if it's empty (for "Just now" group)
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

// ============================================================================
// Main Components
// ============================================================================

/**
 * Props for VersionHistoryPanelContent (without container-specific props)
 */
export interface VersionHistoryPanelContentProps {
  /** Document title */
  documentTitle?: string;
  /** Grouped versions by time */
  timeGroups: TimeGroup[];
  /** Currently selected version ID */
  selectedId?: string | null;
  /** Callback when a version is selected */
  onSelect?: (versionId: string) => void;
  /** Callback when restore is clicked */
  onRestore?: (versionId: string) => void;
  /** Callback when compare is clicked */
  onCompare?: (versionId: string) => void;
  /** Callback when preview is clicked */
  onPreview?: (versionId: string) => void;
  /** Callback when close is clicked */
  onClose?: () => void;
  /** Callback when configure auto-save is clicked */
  onConfigureAutoSave?: () => void;
  /** Last saved time text */
  lastSavedText?: string;
  /** Auto-save enabled */
  autoSaveEnabled?: boolean;
  /** Whether to show explicit AI modification markers */
  showAiMarks?: boolean;
  /** Whether to show the close button */
  showCloseButton?: boolean;
}

/**
 * VersionHistoryPanelContent - Content component without container styles.
 *
 * Use this component inside layout containers (Sidebar/RightPanel) that
 * handle their own container styling (width/border/shadow).
 *
 * Features:
 * - Grouped version list by time (Just now, Earlier Today, Yesterday)
 * - Version cards with author type badges (User/AI/Auto-Save)
 * - Word change indicators (+124 words / -12 words / No changes)
 * - Selected version with action buttons (Restore/Compare/Preview)
 * - Hover actions for quick access
 * - Auto-save status footer
 *
 * Design ref: 23-version-history.html
 *
 * @example
 * ```tsx
 * // Inside a layout container
 * <VersionHistoryPanelContent
 *   documentTitle="Project Requirements.docx"
 *   timeGroups={timeGroups}
 *   selectedId={selectedVersionId}
 *   onSelect={setSelectedVersionId}
 *   onRestore={handleRestore}
 *   showCloseButton={false}
 * />
 * ```
 */
export function VersionHistoryPanelContent({
  documentTitle = "Untitled Document",
  timeGroups,
  selectedId,
  onSelect,
  onRestore,
  onCompare,
  onPreview,
  onClose,
  onConfigureAutoSave,
  lastSavedText = "2m ago",
  autoSaveEnabled = true,
  showAiMarks = false,
  showCloseButton = true,
}: VersionHistoryPanelContentProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      className={panelContentStyles}
      data-testid="version-history-panel-content"
    >
      {/* Header */}
      <div className={headerStyles}>
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-fg-default)] tracking-tight">
            {t("versionHistory.panel.title")}
          </h2>
          <p className="text-xs text-[var(--color-fg-muted)] mt-1 font-medium truncate max-w-[200px]">
            {documentTitle}
          </p>
        </div>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className={`focus-ring ${closeButtonStyles}`}
            aria-label={t('versionHistory.panel.closeAriaLabel')}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className={scrollAreaStyles}>
        {timeGroups.map((group, index) => (
          <TimeGroupSection
            key={group.label || `group-${index}`}
            group={group}
            selectedId={selectedId}
            onSelect={onSelect}
            onRestore={onRestore}
            onCompare={onCompare}
            onPreview={onPreview}
            showAiMarks={showAiMarks}
          />
        ))}
        <div className="h-2" />
      </div>

      {/* Footer */}
      <div className={footerStyles}>
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${autoSaveEnabled ? "bg-[var(--color-success)]" : "bg-[var(--color-fg-placeholder)]"}`}
          />
          <span className="text-xs text-[var(--color-fg-muted)]">
            {autoSaveEnabled
              ? t("versionHistory.panel.autoSaveOn", { time: lastSavedText })
              : t("versionHistory.panel.autoSaveOff")}
          </span>
        </div>
        <button
          type="button"
          onClick={onConfigureAutoSave}
          className="focus-ring text-[11px] text-[var(--color-accent-muted)] hover:text-[var(--color-accent)] transition-colors hover:underline"
        >
          {t("versionHistory.panel.configureAutoSave")}
        </button>
      </div>
    </div>
  );
}

/**
 * VersionHistoryPanel - Right-side panel for viewing and managing document version history
 *
 * This is the standalone panel component with its own container styles.
 * For use inside layout containers, prefer VersionHistoryPanelContent instead.
 *
 * Features:
 * - Grouped version list by time (Just now, Earlier Today, Yesterday)
 * - Version cards with author type badges (User/AI/Auto-Save)
 * - Word change indicators (+124 words / -12 words / No changes)
 * - Selected version with action buttons (Restore/Compare/Preview)
 * - Hover actions for quick access
 * - Auto-save status footer
 *
 * Design ref: 23-version-history.html
 *
 * @example
 * ```tsx
 * <VersionHistoryPanel
 *   documentTitle="Project Requirements.docx"
 *   timeGroups={timeGroups}
 *   selectedId={selectedVersionId}
 *   onSelect={setSelectedVersionId}
 *   onRestore={handleRestore}
 *   onCompare={handleCompare}
 *   onPreview={handlePreview}
 * />
 * ```
 */
export function VersionHistoryPanel({
  documentTitle = "Untitled Document",
  timeGroups,
  selectedId,
  onSelect,
  onRestore,
  onCompare,
  onPreview,
  onClose,
  onConfigureAutoSave,
  lastSavedText = "2m ago",
  autoSaveEnabled = true,
  showAiMarks = false,
  width = 320,
}: VersionHistoryPanelProps): JSX.Element {
  return (
    <aside
      className={panelStyles}
      style={{ width }}
      data-testid="version-history-panel"
    >
      <VersionHistoryPanelContent
        documentTitle={documentTitle}
        timeGroups={timeGroups}
        selectedId={selectedId}
        onSelect={onSelect}
        onRestore={onRestore}
        onCompare={onCompare}
        onPreview={onPreview}
        onClose={onClose}
        onConfigureAutoSave={onConfigureAutoSave}
        lastSavedText={lastSavedText}
        autoSaveEnabled={autoSaveEnabled}
        showAiMarks={showAiMarks}
        showCloseButton={true}
      />
    </aside>
  );
}

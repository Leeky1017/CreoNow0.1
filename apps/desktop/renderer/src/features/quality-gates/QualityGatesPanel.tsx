import { ChevronDown, CircleCheck, CircleX, Loader2, MapPin, Play, Settings, TriangleAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives";

// ============================================================================
// Types
// ============================================================================

/**
 * Check status
 */
export type CheckStatus = "passed" | "warning" | "error" | "running";

/**
 * Issue severity
 */
export type IssueSeverity = "warning" | "error";

/**
 * Individual issue within a check
 */
export interface CheckIssue {
  id: string;
  /** Issue description */
  description: string;
  /** Location in document (e.g., "Chapter 3, Paragraph 5") */
  location?: string;
  /** Severity level */
  severity: IssueSeverity;
  /** Whether this issue has been ignored */
  ignored?: boolean;
}

/**
 * Individual quality check item
 */
export interface CheckItem {
  id: string;
  /** Check name (e.g., "Passive Voice", "Character Names") */
  name: string;
  /** Description of what this check does */
  description: string;
  /** Current status */
  status: CheckStatus;
  /** Result value (e.g., "8%", "76%") */
  resultValue?: string;
  /** Issues found by this check */
  issues?: CheckIssue[];
  /** Number of ignored issues */
  ignoredCount?: number;
  /** Whether this check is enabled */
  enabled?: boolean;
}

/**
 * Group of related checks
 */
export interface CheckGroup {
  id: string;
  /** Group name (e.g., "Style", "Consistency") */
  name: string;
  /** Checks in this group */
  checks: CheckItem[];
}

/**
 * Overall panel status
 */
export type PanelStatus = "all-passed" | "issues-found" | "errors" | "running";

/**
 * Check frequency options
 */
export type CheckFrequency = "on-demand" | "after-edit" | "every-5-minutes";

/**
 * Settings for quality checks
 */
export interface QualitySettings {
  /** Run checks on save */
  runOnSave: boolean;
  /** Block save on errors */
  blockOnErrors: boolean;
  /** Check frequency */
  frequency: CheckFrequency;
}

/**
 * QualityGatesPanel props
 */
export interface QualityGatesPanelProps {
  /** Groups of quality checks */
  checkGroups: CheckGroup[];
  /** Overall panel status */
  panelStatus: PanelStatus;
  /** Total issues count */
  issuesCount?: number;
  /** Currently expanded check ID */
  expandedCheckId?: string | null;
  /** Callback when check is expanded/collapsed */
  onToggleCheck?: (checkId: string) => void;
  /** Callback when Fix Issue is clicked */
  onFixIssue?: (checkId: string, issueId: string) => void;
  /** Callback when Ignore is clicked */
  onIgnoreIssue?: (checkId: string, issueId: string) => void;
  /** Callback when View in Editor is clicked */
  onViewInEditor?: (checkId: string, issueId: string) => void;
  /** Callback when Run All Checks is clicked */
  onRunAllChecks?: () => void;
  /** Callback when close is clicked */
  onClose?: () => void;
  /** Settings configuration */
  settings?: QualitySettings;
  /** Callback when settings change */
  onSettingsChange?: (settings: QualitySettings) => void;
  /** Whether settings section is expanded */
  settingsExpanded?: boolean;
  /** Callback when settings section is toggled */
  onToggleSettings?: () => void;
  /** Panel width in pixels */
  width?: number;
  /** Fix in progress for issue */
  fixingIssueId?: string | null;
}

// ============================================================================
// Icons
// ============================================================================

function CloseIcon() {
  return <X size={16} strokeWidth={1.5} />;
}

function CheckCircleIcon() {
  return <CircleCheck size={16} strokeWidth={1.5} />;
}

function WarningIcon() {
  return <TriangleAlert size={16} strokeWidth={1.5} />;
}

function ErrorIcon() {
  return <CircleX size={16} strokeWidth={1.5} />;
}

function SpinnerIcon() {
  return <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      size={16}
      strokeWidth={1.5}
      className={`transition-transform duration-[var(--duration-fast)] ${expanded ? "rotate-180" : ""}`}
    />
  );
}

function SettingsIcon() {
  return <Settings size={16} strokeWidth={1.5} />;
}

function PlayIcon() {
  return <Play size={16} strokeWidth={1.5} />;
}

function LocationIcon() {
  return <MapPin size={16} strokeWidth={1.5} />;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Panel content styles - used by QualityGatesPanelContent
 * Does NOT include container styles (aside/width/border/shadow).
 */
const panelContentStyles = [
  "bg-[var(--color-bg-surface)]",
  "flex",
  "flex-col",
  "h-full",
].join(" ");

const panelContainerStyles = [
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

const scrollAreaStyles = ["flex-1", "overflow-y-auto", "p-3", "space-y-3"].join(
  " ",
);

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Status indicator at the top of the panel
 */
function PanelStatusIndicator({
  status,
  issuesCount,
}: {
  status: PanelStatus;
  issuesCount?: number;
}) {
  const { t } = useTranslation();
  const statusConfig = {
    "all-passed": {
      color: "bg-[var(--color-success)]",
      text: t('qualityGates.statusAllPassed'),
      textColor: "text-[var(--color-success)]",
    },
    "issues-found": {
      color: "bg-[var(--color-warning)]",
      text: t('qualityGates.statusIssuesFound', { count: issuesCount ?? 0 }),
      textColor: "text-[var(--color-warning)]",
    },
    errors: {
      color: "bg-[var(--color-error)]",
      text: t('qualityGates.statusErrors', { count: issuesCount ?? 0 }),
      textColor: "text-[var(--color-error)]",
    },
    running: {
      color: "bg-[var(--color-info)]",
      text: t('qualityGates.statusRunning'),
      textColor: "text-[var(--color-info)]",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      {status === "running" ? (
        <SpinnerIcon />
      ) : (
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
      )}
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
}

/**
 * Check status icon
 */
function CheckStatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case "passed":
      return (
        <span className="text-[var(--color-success)]">
          <CheckCircleIcon />
        </span>
      );
    case "warning":
      return (
        <span className="text-[var(--color-warning)]">
          <WarningIcon />
        </span>
      );
    case "error":
      return (
        <span className="text-[var(--color-error)]">
          <ErrorIcon />
        </span>
      );
    case "running":
      return (
        <span className="text-[var(--color-info)]">
          <SpinnerIcon />
        </span>
      );
    default:
      return null;
  }
}

/**
 * Toggle switch component for settings
 */
function SettingsToggle({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={id}
        className={`text-[13px] text-[var(--color-fg-default)] select-none cursor-pointer ${disabled ? "opacity-50" : ""}`}
      >
        {label}
      </label>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center w-11 h-6 rounded-full border shrink-0 cursor-pointer transition-colors duration-[var(--duration-slow)] ease-[var(--ease-default)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] ${
          checked
            ? "bg-[var(--color-fg-default)] border-[var(--color-fg-default)]"
            : "bg-[var(--color-bg-hover)] border-[var(--color-border-default)]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute left-[3px] w-[18px] h-[18px] rounded-full transition-transform duration-[var(--duration-slow)] pointer-events-none ${
            checked
              ? "translate-x-[20px] bg-[var(--color-fg-inverse)]"
              : "translate-x-0 bg-[var(--color-fg-subtle)]"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Issue detail card
 */
function IssueCard({
  issue,
  checkId,
  onFix,
  onIgnore,
  onViewInEditor,
  isFixing,
}: {
  issue: CheckIssue;
  checkId: string;
  onFix?: (checkId: string, issueId: string) => void;
  onIgnore?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  isFixing?: boolean;
}) {
  const { t } = useTranslation();

  if (issue.ignored) {
    return (
      <div className="p-3 bg-[var(--color-bg-raised)] rounded-lg border border-[var(--color-separator)] opacity-50">
        <p className="text-[12px] text-[var(--color-fg-muted)] line-through">
          {issue.description}
        </p>
        <span className="text-[10px] text-[var(--color-fg-placeholder)] mt-1 inline-block">
          {t('qualityGates.ignored')}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border ${
        issue.severity === "error"
          ? "bg-[var(--color-error-subtle)] border-[var(--color-error)]/20"
          : "bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/20"
      }`}
      data-testid={`issue-card-${issue.id}`}
    >
      <p className="text-[12px] text-[var(--color-fg-default)] leading-relaxed">
        {issue.description}
      </p>
      {issue.location && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--color-fg-muted)]">
          <LocationIcon />
          <button
            type="button"
            onClick={() => onViewInEditor?.(checkId, issue.id)}
            className="hover:text-[var(--color-fg-default)] hover:underline transition-colors"
          >
            {issue.location}
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onFix?.(checkId, issue.id)}
          loading={isFixing}
          className="!h-6 !text-[10px] !px-2"
        >
          {t('qualityGates.fixIssue')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onIgnore?.(checkId, issue.id)}
          className="!h-6 !text-[10px] !px-2"
        >
          {t('qualityGates.ignore')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewInEditor?.(checkId, issue.id)}
          className="!h-6 !text-[10px] !px-2"
        >
          {t('qualityGates.viewInEditor')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Individual check item
 */
function CheckItemRow({
  check,
  isExpanded,
  onToggle,
  onFix,
  onIgnore,
  onViewInEditor,
  fixingIssueId,
}: {
  check: CheckItem;
  isExpanded: boolean;
  onToggle?: (checkId: string) => void;
  onFix?: (checkId: string, issueId: string) => void;
  onIgnore?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  fixingIssueId?: string | null;
}) {
  const { t } = useTranslation();
  const hasIssues = check.issues && check.issues.length > 0;
  const activeIssues = check.issues?.filter((i) => !i.ignored) ?? [];
  const issueCount = activeIssues.length;

  return (
    <div
      className="border-b border-[var(--color-separator)] last:border-b-0"
      data-testid={`check-item-${check.id}`}
    >
      <button
        type="button"
        onClick={() => hasIssues && onToggle?.(check.id)}
        disabled={!hasIssues}
        className={`w-full px-3 py-3 flex items-start gap-3 text-left transition-colors duration-[var(--duration-fast)] ${
          hasIssues
            ? "hover:bg-[var(--color-bg-hover)] cursor-pointer"
            : "cursor-default"
        }`}
      >
        <div className="mt-0.5">
          <CheckStatusIcon status={check.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--color-fg-default)]">
              {check.name}
            </span>
            {issueCount > 0 && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  check.status === "error"
                    ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]"
                    : "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                }`}
              >
                {issueCount}
              </span>
            )}
            {check.ignoredCount && check.ignoredCount > 0 && (
              <span className="text-[10px] text-[var(--color-fg-placeholder)]">
                {t('qualityGates.ignoredCount', { count: check.ignoredCount })}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-fg-muted)] mt-0.5 leading-relaxed">
            {check.description}
          </p>
          {check.resultValue && check.status === "passed" && (
            <span className="text-[11px] text-[var(--color-success)] mt-1 inline-block">
              {check.resultValue}
            </span>
          )}
        </div>
        {hasIssues && (
          <div className="mt-1">
            <ChevronIcon expanded={isExpanded} />
          </div>
        )}
      </button>

      {/* Expanded issue details */}
      {isExpanded && hasIssues && (
        <div className="px-3 pb-3 space-y-2">
          {check.issues?.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              checkId={check.id}
              onFix={onFix}
              onIgnore={onIgnore}
              onViewInEditor={onViewInEditor}
              isFixing={fixingIssueId === issue.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Check group accordion
 */
function CheckGroupAccordion({
  group,
  expandedCheckId,
  onToggleCheck,
  onFix,
  onIgnore,
  onViewInEditor,
  fixingIssueId,
}: {
  group: CheckGroup;
  expandedCheckId?: string | null;
  onToggleCheck?: (checkId: string) => void;
  onFix?: (checkId: string, issueId: string) => void;
  onIgnore?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  fixingIssueId?: string | null;
}) {
  const { t } = useTranslation();
  const checkCount = group.checks.length;
  const passedCount = group.checks.filter((c) => c.status === "passed").length;

  return (
    <div
      className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] overflow-hidden"
      data-testid={`check-group-${group.id}`}
    >
      <div className="px-4 py-3 bg-[var(--color-bg-raised)] border-b border-[var(--color-separator)]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--color-fg-default)]">
            {group.name}
          </span>
          <span className="text-[11px] text-[var(--color-fg-muted)]">
            {t('qualityGates.checksCount', { passed: passedCount, total: checkCount })}
          </span>
        </div>
      </div>
      <div>
        {group.checks.map((check) => (
          <CheckItemRow
            key={check.id}
            check={check}
            isExpanded={expandedCheckId === check.id}
            onToggle={onToggleCheck}
            onFix={onFix}
            onIgnore={onIgnore}
            onViewInEditor={onViewInEditor}
            fixingIssueId={fixingIssueId}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Settings section
 */
function SettingsSection({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: {
  settings: QualitySettings;
  onSettingsChange?: (settings: QualitySettings) => void;
  expanded: boolean;
  onToggle?: () => void;
}) {
  const { t } = useTranslation();
  const frequencyOptions: { value: CheckFrequency; label: string }[] = [
    { value: "on-demand", label: t('qualityGates.frequencyOnDemand') },
    { value: "after-edit", label: t('qualityGates.frequencyAfterEdit') },
    { value: "every-5-minutes", label: t('qualityGates.frequencyEvery5Min') },
  ];

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--duration-fast)]"
      >
        <div className="flex items-center gap-2">
          <SettingsIcon />
          <span className="text-[13px] font-medium text-[var(--color-fg-default)]">
            {t('qualityGates.settings')}
          </span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--color-separator)]">
          <div className="pt-4 space-y-4">
            <SettingsToggle
              id="run-on-save"
              label={t('qualityGates.runOnSave')}
              checked={settings.runOnSave}
              onChange={(checked) =>
                onSettingsChange?.({ ...settings, runOnSave: checked })
              }
            />
            <SettingsToggle
              id="block-on-errors"
              label={t('qualityGates.blockOnErrors')}
              checked={settings.blockOnErrors}
              onChange={(checked) =>
                onSettingsChange?.({ ...settings, blockOnErrors: checked })
              }
            />
            <div className="flex items-center justify-between">
              <label
                htmlFor="check-frequency"
                className="text-[13px] text-[var(--color-fg-default)]"
              >
                {t('qualityGates.checkFrequency')}
              </label>
              <select
                id="check-frequency"
                value={settings.frequency}
                onChange={(e) =>
                  onSettingsChange?.({
                    ...settings,
                    frequency: e.target.value as CheckFrequency,
                  })
                }
                className="text-[12px] bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-fg-default)] focus:outline-none focus:border-[var(--color-border-focus)]"
              >
                {frequencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Components
// ============================================================================

/**
 * Props for QualityGatesPanelContent (without container-specific props)
 */
export interface QualityGatesPanelContentProps {
  /** Groups of quality checks */
  checkGroups: CheckGroup[];
  /** Overall panel status */
  panelStatus: PanelStatus;
  /** Total issues count */
  issuesCount?: number;
  /** Currently expanded check ID */
  expandedCheckId?: string | null;
  /** Callback when check is expanded/collapsed */
  onToggleCheck?: (checkId: string) => void;
  /** Callback when Fix Issue is clicked */
  onFixIssue?: (checkId: string, issueId: string) => void;
  /** Callback when Ignore is clicked */
  onIgnoreIssue?: (checkId: string, issueId: string) => void;
  /** Callback when View in Editor is clicked */
  onViewInEditor?: (checkId: string, issueId: string) => void;
  /** Callback when Run All Checks is clicked */
  onRunAllChecks?: () => void;
  /** Callback when close is clicked */
  onClose?: () => void;
  /** Settings configuration */
  settings?: QualitySettings;
  /** Callback when settings change */
  onSettingsChange?: (settings: QualitySettings) => void;
  /** Whether settings section is expanded */
  settingsExpanded?: boolean;
  /** Callback when settings section is toggled */
  onToggleSettings?: () => void;
  /** Fix in progress for issue */
  fixingIssueId?: string | null;
  /** Whether to show the close button */
  showCloseButton?: boolean;
}

/**
 * QualityGatesPanelContent - Content component without container styles.
 *
 * Use this component inside layout containers (Sidebar/RightPanel) that
 * handle their own container styling (width/border/shadow).
 *
 * Features:
 * - Grouped quality checks (Style, Consistency, Completeness)
 * - Check items with status indicators (passed/warning/error/running)
 * - Expandable issue details with Fix/Ignore/View actions
 * - Settings toggles for check configuration
 * - Run All Checks button
 *
 * Design ref: 35-constraints-panel.html
 *
 * @example
 * ```tsx
 * // Inside a layout container
 * <QualityGatesPanelContent
 *   checkGroups={checkGroups}
 *   panelStatus="issues-found"
 *   issuesCount={2}
 *   expandedCheckId={expandedId}
 *   onToggleCheck={setExpandedId}
 *   showCloseButton={false}
 * />
 * ```
 */
export function QualityGatesPanelContent({
  checkGroups,
  panelStatus,
  issuesCount,
  expandedCheckId,
  onToggleCheck,
  onFixIssue,
  onIgnoreIssue,
  onViewInEditor,
  onRunAllChecks,
  onClose,
  settings = {
    runOnSave: true,
    blockOnErrors: false,
    frequency: "on-demand",
  },
  onSettingsChange,
  settingsExpanded = false,
  onToggleSettings,
  fixingIssueId,
  showCloseButton = true,
}: QualityGatesPanelContentProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      className={panelContentStyles}
      data-testid="quality-gates-panel-content"
    >
      {/* Header */}
      <div className={headerStyles}>
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-fg-default)] tracking-tight">
            {t('qualityGates.title')}
          </h2>
          <div className="mt-2">
            <PanelStatusIndicator
              status={panelStatus}
              issuesCount={issuesCount}
            />
          </div>
        </div>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className={closeButtonStyles}
            aria-label={t('qualityGates.closeAriaLabel')}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className={scrollAreaStyles}>
        {/* Run All Checks button */}
        <Button
          data-testid="quality-run-all-checks"
          variant="secondary"
          size="sm"
          onClick={onRunAllChecks}
          loading={panelStatus === "running"}
          fullWidth
          className="!justify-center !gap-2"
        >
          <PlayIcon />
          {t('qualityGates.runAllChecks')}
        </Button>

        {/* Success message when all passed */}
        {panelStatus === "all-passed" && (
          <div className="p-4 bg-[var(--color-success-subtle)] border border-[var(--color-success)]/20 rounded-[var(--radius-lg)] text-center">
            <CheckCircleIcon />
            <p className="text-[13px] text-[var(--color-success)] mt-2">
              {t('qualityGates.allPassedMessage')}
            </p>
          </div>
        )}

        {/* Check groups */}
        {checkGroups.map((group) => (
          <CheckGroupAccordion
            key={group.id}
            group={group}
            expandedCheckId={expandedCheckId}
            onToggleCheck={onToggleCheck}
            onFix={onFixIssue}
            onIgnore={onIgnoreIssue}
            onViewInEditor={onViewInEditor}
            fixingIssueId={fixingIssueId}
          />
        ))}

        {/* Settings */}
        <SettingsSection
          settings={settings}
          onSettingsChange={onSettingsChange}
          expanded={settingsExpanded}
          onToggle={onToggleSettings}
        />
      </div>
    </div>
  );
}

/**
 * QualityGatesPanel - Right-side panel for quality checks and constraints
 *
 * This is the standalone panel component with its own container styles.
 * For use inside layout containers, prefer QualityGatesPanelContent instead.
 *
 * Features:
 * - Grouped quality checks (Style, Consistency, Completeness)
 * - Check items with status indicators (passed/warning/error/running)
 * - Expandable issue details with Fix/Ignore/View actions
 * - Settings toggles for check configuration
 * - Run All Checks button
 *
 * Design ref: 35-constraints-panel.html
 *
 * @example
 * ```tsx
 * <QualityGatesPanel
 *   checkGroups={checkGroups}
 *   panelStatus="issues-found"
 *   issuesCount={2}
 *   expandedCheckId={expandedId}
 *   onToggleCheck={setExpandedId}
 *   onFixIssue={handleFix}
 *   onIgnoreIssue={handleIgnore}
 *   onRunAllChecks={handleRunAll}
 * />
 * ```
 */
export function QualityGatesPanel({
  checkGroups,
  panelStatus,
  issuesCount,
  expandedCheckId,
  onToggleCheck,
  onFixIssue,
  onIgnoreIssue,
  onViewInEditor,
  onRunAllChecks,
  onClose,
  settings = {
    runOnSave: true,
    blockOnErrors: false,
    frequency: "on-demand",
  },
  onSettingsChange,
  settingsExpanded = false,
  onToggleSettings,
  width = 320,
  fixingIssueId,
}: QualityGatesPanelProps): JSX.Element {
  return (
    <aside
      className={panelContainerStyles}
      style={{ width }}
      data-testid="quality-gates-panel"
    >
      <QualityGatesPanelContent
        checkGroups={checkGroups}
        panelStatus={panelStatus}
        issuesCount={issuesCount}
        expandedCheckId={expandedCheckId}
        onToggleCheck={onToggleCheck}
        onFixIssue={onFixIssue}
        onIgnoreIssue={onIgnoreIssue}
        onViewInEditor={onViewInEditor}
        onRunAllChecks={onRunAllChecks}
        onClose={onClose}
        settings={settings}
        onSettingsChange={onSettingsChange}
        settingsExpanded={settingsExpanded}
        onToggleSettings={onToggleSettings}
        fixingIssueId={fixingIssueId}
        showCloseButton={true}
      />
    </aside>
  );
}

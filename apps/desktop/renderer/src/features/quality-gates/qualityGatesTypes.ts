// Quality Gates — Types, interfaces, and style constants
export type CheckStatus = "passed" | "warning" | "error" | "running";
export type IssueSeverity = "warning" | "error";

export interface CheckIssue {
  id: string;
  description: string;
  location?: string;
  severity: IssueSeverity;
  ignored?: boolean;
}

export interface CheckItem {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  resultValue?: string;
  issues?: CheckIssue[];
  ignoredCount?: number;
  enabled?: boolean;
}

export interface CheckGroup {
  id: string;
  name: string;
  checks: CheckItem[];
}

export type PanelStatus = "all-passed" | "issues-found" | "errors" | "running";
export type CheckFrequency = "on-demand" | "after-edit" | "every-5-minutes";

export interface QualitySettings {
  runOnSave: boolean;
  blockOnErrors: boolean;
  frequency: CheckFrequency;
}

export interface QualityGatesPanelProps {
  checkGroups: CheckGroup[];
  panelStatus: PanelStatus;
  issuesCount?: number;
  expandedCheckId?: string | null;
  onToggleCheck?: (checkId: string) => void;
  onFixIssue?: (checkId: string, issueId: string) => void;
  onIgnoreIssue?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  onRunAllChecks?: () => void;
  onClose?: () => void;
  settings?: QualitySettings;
  onSettingsChange?: (settings: QualitySettings) => void;
  settingsExpanded?: boolean;
  onToggleSettings?: () => void;
  width?: number;
  fixingIssueId?: string | null;
}

export interface QualityGatesPanelContentProps {
  checkGroups: CheckGroup[];
  panelStatus: PanelStatus;
  issuesCount?: number;
  expandedCheckId?: string | null;
  onToggleCheck?: (checkId: string) => void;
  onFixIssue?: (checkId: string, issueId: string) => void;
  onIgnoreIssue?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  onRunAllChecks?: () => void;
  onClose?: () => void;
  settings?: QualitySettings;
  onSettingsChange?: (settings: QualitySettings) => void;
  settingsExpanded?: boolean;
  onToggleSettings?: () => void;
  fixingIssueId?: string | null;
  showCloseButton?: boolean;
}

export const panelContentStyles = "bg-[var(--color-bg-surface)] flex flex-col h-full";

export const panelContainerStyles = [
  "bg-[var(--color-bg-surface)]",
  "border-l border-[var(--color-separator)]",
  "flex flex-col h-full",
  "shadow-[var(--shadow-xl)] shrink-0",
].join(" ");

export const headerStyles = [
  "px-5 py-5",
  "border-b border-[var(--color-separator)]",
  "flex justify-between items-start",
  "bg-[var(--color-bg-surface)]",
].join(" ");

export const closeButtonStyles = [
  "text-[var(--color-fg-muted)]",
  "hover:text-[var(--color-fg-default)]",
  "transition-colors p-1 -mr-1 rounded-md",
  "hover:bg-[var(--color-zen-hover)]",
].join(" ");

export const scrollAreaStyles = "flex-1 overflow-y-auto p-3 space-y-3";

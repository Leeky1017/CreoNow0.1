/**
 * Shared types for the VersionHistory feature module.
 */

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

/**
 * Diff feature module
 *
 * Provides components for displaying and comparing text differences:
 * - DiffView: Unified diff display with line highlighting
 * - SplitDiffView: Side-by-side diff comparison
 * - DiffViewPanel: Complete diff viewer with header, navigation, and footer
 * - MultiVersionCompare: Compare 2-4 versions simultaneously
 * - DiffHeader: Version selection and navigation controls
 * - DiffFooter: Statistics and action buttons
 * - VersionPane: Single version display for multi-version compare
 */

export {
  DiffView,
  UnifiedDiffView,
  parseDiffLines,
  getChangePositions,
} from "./DiffView";
export type { DiffLine, DiffStats } from "./DiffView";

export { SplitDiffView } from "./SplitDiffView";

export { DiffViewPanel } from "./DiffViewPanel";
export type { DiffViewMode, VersionInfo } from "./DiffHeader";

export { DiffHeader } from "./DiffHeader";
export { DiffFooter } from "./DiffFooter";

export { MultiVersionCompare } from "./MultiVersionCompare";
export type { VersionContent } from "./VersionPane";

export { VersionPane } from "./VersionPane";

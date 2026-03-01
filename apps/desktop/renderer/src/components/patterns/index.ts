/**
 * Patterns - Common UI Patterns
 *
 * This module exports reusable UI patterns that combine primitives
 * into higher-level components for common scenarios:
 *
 * - EmptyState: Placeholder for empty content (§12.1)
 * - LoadingState: Loading indicators and skeletons (§12.2)
 * - ErrorState: Error, warning, and info displays (§12.3)
 *
 * These patterns follow the design spec in `design/DESIGN_DECISIONS.md`
 * and provide consistent UX across the application.
 *
 * @example
 * ```tsx
 * import { EmptyState, LoadingState, ErrorState, Skeleton } from '@/components/patterns';
 *
 * // Empty content
 * <EmptyState variant="files" onAction={createFile} />
 *
 * // Loading states
 * <LoadingState variant="spinner" text="加载中..." />
 * <Skeleton type="card" />
 *
 * // Error handling
 * <ErrorState variant="banner" message="保存失败" onAction={retry} />
 * ```
 */

// Empty state
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps, EmptyStateVariant } from "./EmptyState";

// Loading state
export { LoadingState, Skeleton, ProgressBar } from "./LoadingState";
export type {
  LoadingStateProps,
  LoadingVariant,
  SkeletonProps,
  SkeletonType,
  ProgressBarProps,
} from "./LoadingState";

// Error state
export { ErrorState } from "./ErrorState";
export type {
  ErrorStateProps,
  ErrorVariant,
  ErrorSeverity,
} from "./ErrorState";

// Region error boundary
export { RegionErrorBoundary } from "./RegionErrorBoundary";
export { RegionFallback } from "./RegionFallback";
export type { RegionFallbackProps } from "./RegionFallback";

// Error boundary
export { ErrorBoundary } from "./ErrorBoundary";

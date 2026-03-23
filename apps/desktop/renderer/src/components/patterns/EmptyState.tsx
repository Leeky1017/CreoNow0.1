import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Text, Heading } from "../primitives";
import {
  ProjectIllustration,
  SearchIllustration,
  CharacterIllustration,
} from "../../assets/illustrations/BrandIllustrations";

/**
 * Empty state variants based on design spec §12.1
 *
 * Each variant represents a different empty scenario with appropriate
 * illustration, message, and action.
 */
export type EmptyStateVariant =
  | "project"
  | "files"
  | "search"
  | "characters"
  | "generic";

export interface EmptyStateProps {
  /** Predefined variant for common scenarios */
  variant?: EmptyStateVariant;
  /** Custom illustration (SVG or image element) */
  illustration?: React.ReactNode;
  /** Main title text */
  title?: string;
  /** Description text (optional) */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action callback */
  onAction?: () => void;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Build variant defaults using i18n translations (design spec §12.1)
 */
function getVariantDefaults(
  t: (key: string) => string,
): Record<
  EmptyStateVariant,
  { title: string; description: string; actionLabel: string }
> {
  return {
    project: {
      title: t("patterns.emptyState.firstFileTitle"),
      description: t("patterns.emptyState.firstFileDescription"),
      actionLabel: t("patterns.emptyState.firstFileAction"),
    },
    files: {
      title: t("patterns.emptyState.noFiles"),
      description: t("patterns.emptyState.noFilesDescription"),
      actionLabel: t("patterns.emptyState.noFilesAction"),
    },
    search: {
      title: t("patterns.emptyState.noSearchResults"),
      description: t("patterns.emptyState.noSearchResultsDescription"),
      actionLabel: t("patterns.emptyState.noSearchResultsAction"),
    },
    characters: {
      title: t("patterns.emptyState.noCharacters"),
      description: t("patterns.emptyState.noCharactersDescription"),
      actionLabel: t("patterns.emptyState.noCharactersAction"),
    },
    generic: {
      title: t("patterns.emptyState.noContent"),
      description: t("patterns.emptyState.noContentDescription"),
      actionLabel: t("patterns.emptyState.noContentAction"),
    },
  };
}

/**
 * Default illustration component
 *
 * Uses brand SVG illustrations for each variant (design spec §12.1).
 * Renders 120×120 themed illustrations with accent color highlights.
 */
function DefaultIllustration({
  variant,
}: {
  variant: EmptyStateVariant;
}): JSX.Element {
  const illustrationClass = "h-24 w-24 text-[var(--color-fg-muted)]";

  const getIllustration = (): React.ReactNode => {
    switch (variant) {
      case "project":
      case "files":
        return <ProjectIllustration className={illustrationClass} />;
      case "search":
        return <SearchIllustration className={illustrationClass} />;
      case "characters":
        return <CharacterIllustration className={illustrationClass} />;
      default:
        return (
          <svg
            className="h-8 w-8 text-[var(--color-fg-muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        );
    }
  };

  return (
    <div
      data-testid="empty-state-illustration"
      className="mb-4 flex items-center justify-center"
    >
      {getIllustration()}
    </div>
  );
}

/**
 * EmptyState component following design spec §12.1
 *
 * Displays a placeholder when content is empty. Supports predefined variants
 * for common scenarios (empty project, empty files, no search results, etc.)
 * or fully customizable content.
 *
 * @example
 * ```tsx
 * // Using a predefined variant
 * <EmptyState variant="files" onAction={() => createNewFile()} />
 *
 * // Using custom content
 * <EmptyState
 *   title="No items"
 *   description="Add items to get started"
 *   actionLabel="Add Item"
 *   onAction={handleAdd}
 * />
 * ```
 */
export function EmptyState({
  variant = "generic",
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps): JSX.Element {
  const { t } = useTranslation();
  const defaults = getVariantDefaults(t)[variant];

  // Use provided values or fall back to variant defaults
  const displayTitle = title ?? defaults.title;
  const displayDescription = description ?? defaults.description;
  const displayActionLabel = actionLabel ?? defaults.actionLabel;

  return (
    <div
      className={[
        "flex flex-col items-center justify-center",
        "py-12 px-6",
        "text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Illustration */}
      {illustration ?? <DefaultIllustration variant={variant} />}

      {/* Title */}
      <Heading level="h2" className="mb-2">
        {displayTitle}
      </Heading>

      {/* Description */}
      {displayDescription && (
        <Text size="body" color="muted" as="p" className="mb-6 max-w-xs">
          {displayDescription}
        </Text>
      )}

      {/* Actions */}
      {(onAction || onSecondaryAction) && (
        <div className="flex items-center gap-3">
          {onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {displayActionLabel}
            </Button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <Button variant="ghost" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

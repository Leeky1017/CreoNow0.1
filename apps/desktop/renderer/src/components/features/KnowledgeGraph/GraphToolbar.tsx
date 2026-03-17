import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Button } from "../../primitives/Button";
import type { GraphToolbarProps, NodeFilter } from "./types";

/* eslint-disable creonow/no-native-html-element -- specialized toolbar filter and action buttons */

/**
 * Filter button configuration
 */
function getFilterButtons(t: TFunction): Array<{
  filter: NodeFilter;
  label: string;
  colorClass: string;
}> {
  return [
    { filter: "all", label: t('kg.toolbar.all'), colorClass: "bg-[var(--color-fg-muted)]" },
    {
      filter: "character",
      label: t('kg.toolbar.roles'),
      colorClass: "bg-[var(--color-node-character)]",
    },
    {
      filter: "location",
      label: t('kg.toolbar.locations'),
      colorClass: "bg-[var(--color-node-location)]",
    },
    {
      filter: "event",
      label: t('kg.toolbar.events'),
      colorClass: "bg-[var(--color-node-event)]",
    },
    { filter: "item", label: t('kg.toolbar.items'), colorClass: "bg-[var(--color-node-item)]" },
    {
      filter: "faction",
      label: t('kg.toolbar.factions'),
      colorClass: "bg-[var(--color-node-other)]",
    },
  ];
}

/**
 * Filter button styles
 */
const filterButtonBase = [
  "px-3",
  "py-1",
  "rounded-full",
  "text-xs",
  "font-medium",
  "border",
  "transition-all",
  "duration-[var(--duration-fast)]",
  "flex",
  "items-center",
  "gap-2",
  "cursor-pointer",
].join(" ");

const filterButtonInactive = [
  "text-[var(--color-fg-muted)]",
  "border-transparent",
  "hover:text-[var(--color-fg-default)]",
  "hover:border-[var(--color-border-hover)]",
].join(" ");

const filterButtonActive = [
  "bg-[var(--color-bg-raised)]",
  "text-[var(--color-fg-default)]",
  "border-[var(--color-border-hover)]",
].join(" ");

/**
 * Toolbar container styles
 */
const toolbarStyles = [
  "h-12",
  "flex-shrink-0",
  "bg-[var(--color-bg-surface)]",
  "border-b",
  "border-[var(--color-border-default)]",
  "flex",
  "items-center",
  "justify-between",
  "px-4",
  "z-30",
].join(" ");

/**
 * GraphToolbar component
 *
 * Header toolbar for the knowledge graph with:
 * - Back button
 * - Title
 * - Filter buttons (by node type)
 * - Zoom controls
 * - Add node button
 */
export function GraphToolbar({
  activeFilter,
  onFilterChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onAddNode,
  onBack,
}: GraphToolbarProps): JSX.Element {
  const { t } = useTranslation();
  const filterButtons = getFilterButtons(t);

  return (
    <header className={toolbarStyles}>
      {/* Left section: Back button + Title */}
      <div className="flex items-center gap-4 w-60">
        {onBack && (
          <>
            <button
              onClick={onBack}
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
              aria-label={t('kg.toolbar.goBack')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="h-4 w-px bg-[var(--color-border-hover)]" />
          </>
        )}
        <h1 className="text-sm font-medium tracking-wide text-[var(--color-fg-default)]">
          {t('kg.toolbar.title')}
        </h1>
      </div>

      {/* Center section: Filter buttons */}
      <div className="flex items-center gap-2">
        {filterButtons.map(({ filter, label, colorClass }) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`${filterButtonBase} ${
              activeFilter === filter
                ? filterButtonActive
                : filterButtonInactive
            }`}
          >
            {filter !== "all" && (
              <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Right section: Zoom + Add Node */}
      <div className="flex items-center gap-3 w-60 justify-end">
        {/* Zoom controls */}
        <div className="flex items-center bg-[var(--color-bg-raised)] rounded border border-[var(--color-border-default)]">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-label={t('kg.toolbar.zoomOut')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="text-[10px] w-8 text-center text-[var(--color-fg-subtle)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-label={t('kg.toolbar.zoomIn')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Add Node button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onAddNode}
          className="whitespace-nowrap flex-shrink-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('kg.toolbar.addNode')}
        </Button>
      </div>
    </header>
  );
}

GraphToolbar.displayName = "GraphToolbar";

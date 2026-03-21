import { ArrowRight, ChevronDown, ChevronUp, Clock, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "../../components/primitives/Tooltip";
import { Button } from "../../components/primitives/Button";

/**
 * View mode for diff display.
 */
export type DiffViewMode = "split" | "unified";

/**
 * Version info for diff comparison.
 */
export type VersionInfo = {
  id: string;
  label: string;
  timestamp?: Date;
  type?: "auto" | "manual" | "current";
};

type DiffHeaderProps = {
  /** List of available versions */
  versions: VersionInfo[];
  /** Currently selected "before" version */
  selectedBeforeVersion: string;
  /** Currently selected "after" version (usually "current") */
  selectedAfterVersion: string;
  /** Callback when before version changes */
  onBeforeVersionChange: (versionId: string) => void;
  /** Callback when after version changes */
  onAfterVersionChange: (versionId: string) => void;
  /** Current view mode */
  viewMode: DiffViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: DiffViewMode) => void;
  /** Current change index (0-based) */
  currentChangeIndex: number;
  /** Total number of changes */
  totalChanges: number;
  /** Callback for previous change */
  onPreviousChange: () => void;
  /** Callback for next change */
  onNextChange: () => void;
  /** Callback for close */
  onClose: () => void;
};

/**
 * DiffHeader provides version selection, view mode toggle, and change navigation.
 */
export function DiffHeader(props: DiffHeaderProps): JSX.Element {
  const { t } = useTranslation();
  const [beforeDropdownOpen, setBeforeDropdownOpen] = React.useState(false);

  const selectedBefore = props.versions.find(
    (v) => v.id === props.selectedBeforeVersion,
  );
  const selectedAfter = props.versions.find(
    (v) => v.id === props.selectedAfterVersion,
  );

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-separator)] bg-[var(--color-bg-raised)] shrink-0">
      {/* Left: Version selectors */}
      <div className="flex items-center gap-4">
        {/* Before version selector */}
        <div className="relative">
          <Button
            type="button"
            onClick={() => setBeforeDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-hover)] rounded border border-[var(--color-border-default)] text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors whitespace-nowrap"
          >
            {/* Clock icon */}
            <Clock size={16} strokeWidth={1.5} />
            <span>
              {selectedBefore?.label ?? t("diff.header.selectVersion")}
            </span>
            {/* Caret down */}
            <ChevronDown
              size={16}
              strokeWidth={1.5}
              className="text-[var(--color-fg-subtle)]"
            />
          </Button>

          {/* Dropdown */}
          {beforeDropdownOpen && (
            <>
              <div
                role="presentation"
                className="fixed inset-0 z-[var(--z-dropdown)]"
                onClick={() => setBeforeDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-lg shadow-[0_18px_48px_var(--color-shadow)] z-[var(--z-popover)] p-1 overflow-hidden">
                <div className="px-3 py-2 text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wider font-medium">
                  {t("diff.header.history")}
                </div>
                {props.versions
                  .filter((v) => v.id !== "current")
                  .map((version) => {
                    const isSelected =
                      version.id === props.selectedBeforeVersion;
                    return (
                      <Button
                        key={version.id}
                        type="button"
                        onClick={() => {
                          props.onBeforeVersionChange(version.id);
                          setBeforeDropdownOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors
                          ${isSelected ? "bg-[var(--color-bg-hover)]" : "hover:bg-[var(--color-bg-hover)]"}
                        `}
                      >
                        <div
                          className={`
                            w-1.5 h-1.5 rounded-full
                            ${isSelected ? "bg-[var(--color-accent)]" : "bg-transparent"}
                          `}
                        />
                        <div className="flex-1 text-left">
                          <div
                            className={`text-xs ${isSelected ? "text-[var(--color-fg-default)]" : "text-[var(--color-fg-muted)]"}`}
                          >
                            {version.label}
                          </div>
                          <div className="text-[10px] text-[var(--color-fg-subtle)]">
                            {version.type === "auto"
                              ? t("diff.header.autoSaved")
                              : t("diff.header.manualSave")}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        {/* Arrow */}
        <ArrowRight
          size={16}
          strokeWidth={1.5}
          className="text-[var(--color-fg-subtle)]"
        />

        {/* After version (current) */}
        <Button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-hover)] rounded border border-[var(--color-border-default)] text-xs text-[var(--color-fg-default)] hover:border-[var(--color-border-hover)] transition-colors whitespace-nowrap"
        >
          {/* Green dot */}
          <div className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success-subtle)]" />
          <span>{selectedAfter?.label ?? t("diff.header.currentVersion")}</span>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="text-[var(--color-fg-subtle)]"
          />
        </Button>
      </div>

      {/* Right: View toggle + Navigation + Close */}
      <div className="flex items-center gap-6">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-base)] p-1 rounded-lg border border-[var(--color-border-default)]">
          <Button
            type="button"
            onClick={() => props.onViewModeChange("split")}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors
              ${
                props.viewMode === "split"
                  ? "bg-[var(--color-bg-raised)] shadow-[var(--shadow-sm)] text-[var(--color-fg-default)] border border-[var(--color-border-default)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
              }
            `}
          >
            {t("diff.header.split")}
          </Button>
          <Button
            type="button"
            onClick={() => props.onViewModeChange("unified")}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors
              ${
                props.viewMode === "unified"
                  ? "bg-[var(--color-bg-raised)] shadow-[var(--shadow-sm)] text-[var(--color-fg-default)] border border-[var(--color-border-default)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
              }
            `}
          >
            {t("diff.header.unified")}
          </Button>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-[var(--color-separator)]" />

        {/* Change navigation */}
        <div className="flex items-center gap-2">
          <Tooltip content={t("diff.header.previousChange")}>
            <Button
              type="button"
              onClick={props.onPreviousChange}
              disabled={props.currentChangeIndex <= 0}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t("diff.header.previousChange")}
            >
              <ChevronUp size={16} strokeWidth={1.5} />
            </Button>
          </Tooltip>
          <span className="text-xs font-[var(--font-family-mono)] text-[var(--color-fg-muted)] px-2">
            {t("diff.header.changeLabel")}{" "}
            <span className="text-[var(--color-fg-default)]">
              {props.totalChanges > 0 ? props.currentChangeIndex + 1 : 0}
            </span>{" "}
            {t("diff.header.of")}{" "}
            <span className="text-[var(--color-fg-default)]">
              {props.totalChanges}
            </span>
          </span>
          <Tooltip content={t("diff.header.nextChange")}>
            <Button
              type="button"
              onClick={props.onNextChange}
              disabled={props.currentChangeIndex >= props.totalChanges - 1}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t("diff.header.nextChange")}
            >
              <ChevronDown size={16} strokeWidth={1.5} />
            </Button>
          </Tooltip>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-[var(--color-separator)]" />

        {/* Close button */}
        <Button
          type="button"
          onClick={props.onClose}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors p-2 rounded hover:bg-[var(--color-bg-hover)]"
        >
          <X size={20} strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}

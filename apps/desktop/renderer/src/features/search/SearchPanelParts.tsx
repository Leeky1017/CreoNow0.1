import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, CornerDownLeft } from "lucide-react";

import { Button } from "../../components/primitives/Button";
import { Toggle } from "../../components/primitives/Toggle";
import type { SearchScope } from "../../stores/searchStore";

/**
 * Category filter button component matching design spec.
 */
export function CategoryButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={props.onClick}
      className={`!px-3 !py-1 !h-auto !text-xs !font-medium !rounded-full whitespace-nowrap ${
        props.active
          ? "!bg-[var(--color-info)] !text-[var(--color-fg-on-accent)] shadow-sm shadow-[var(--color-info-subtle)]"
          : "!bg-[var(--color-separator)] !text-[var(--color-fg-muted)] !border !border-transparent hover:!border-[var(--color-bg-overlay)] hover:!text-[var(--color-fg-default)] hover:!bg-[var(--color-bg-overlay)]"
      }`}
    >
      {props.label}
    </Button>
  );
}

/**
 * Result group section component.
 */
export function ResultGroup(props: {
  title: string;
  count: number;
  children: React.ReactNode;
  hasBorderTop?: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      className={`py-2 ${props.hasBorderTop ? "border-t border-[var(--color-separator)]" : ""}`}
    >
      <div className="px-4 py-1.5 flex items-center justify-between">
        <span className="text-(--text-label) font-semibold text-[var(--color-fg-placeholder)] uppercase tracking-widest">
          {props.title}
        </span>
        <span className="text-(--text-label) font-mono text-[var(--color-fg-placeholder)]">
          {t("search.results.match", { count: props.count })}
        </span>
      </div>
      {props.children}
    </div>
  );
}

/**
 * Keyboard shortcut hint component.
 */
export function KeyHint(props: {
  icon?: React.ReactNode;
  text?: string;
  label: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded bg-[var(--color-bg-overlay)] border border-[var(--color-separator)] text-(--text-label) text-[var(--color-fg-muted)] font-mono">
        {props.icon || props.text}
      </span>
      <span className="text-(--text-label) text-[var(--color-fg-placeholder)] ml-1">
        {props.label}
      </span>
    </div>
  );
}

/**
 * Filter bar with semantic search and archive toggles.
 */
export function SearchFilterBar(props: {
  semanticSearch: boolean;
  includeArchived: boolean;
  scope: SearchScope;
  onSemanticChange: (v: boolean) => void;
  onArchivedChange: (v: boolean) => void;
  onScopeChange: (scope: SearchScope) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const scopeLabel =
    props.scope === "all"
      ? t("search.filters.allProjects")
      : t("search.filters.currentProject");
  return (
    <div className="px-4 py-3 border-t border-[var(--color-separator)] flex items-center justify-between bg-[var(--color-bg-raised)]">
      <div className="flex items-center gap-6">
        <Toggle
          id="semantic-toggle"
          label={t("search.filters.semanticSearch")}
          checked={props.semanticSearch}
          onCheckedChange={props.onSemanticChange}
        />
        <Toggle
          id="archived-toggle"
          label={t("search.filters.includeArchived")}
          checked={props.includeArchived}
          onCheckedChange={props.onArchivedChange}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-(--text-label) text-[var(--color-fg-placeholder)] uppercase tracking-wider font-medium">
          {t("search.filters.scope")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="!flex !items-center !gap-1.5 !px-2 !py-1 !h-auto !rounded !bg-[var(--color-separator)] !border !border-[var(--color-separator)] !text-xs !text-[var(--color-fg-muted)] hover:!text-[var(--color-fg-default)] hover:!border-[var(--color-bg-overlay)]"
          onClick={() =>
            props.onScopeChange(props.scope === "all" ? "current" : "all")
          }
        >
          <span>{scopeLabel}</span>
          <ChevronDown className="w-2.5 h-2.5" size={16} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Footer with result count and keyboard navigation hints.
 */
export function SearchFooter(props: {
  hasResults: boolean;
  totalResults: number;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="border-t border-[var(--color-separator)] px-4 py-3 flex items-center justify-between shrink-0 bg-[var(--color-bg-raised)]">
      <div className="flex items-center gap-4">
        {props.hasResults && (
          <span className="text-xs text-[var(--color-fg-muted)] font-medium">
            {t("search.results.result", { count: props.totalResults })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <KeyHint
          icon={
            <span className="flex gap-0.5">
              <ChevronUp className="w-2.5 h-2.5" size={16} strokeWidth={1.5} />
            </span>
          }
          label=""
        />
        <KeyHint
          icon={
            <ChevronDown className="w-2.5 h-2.5" size={16} strokeWidth={1.5} />
          }
          label={t("search.footer.toNavigate")}
        />
        <KeyHint
          icon={
            <CornerDownLeft className="w-3 h-3" size={16} strokeWidth={1.5} />
          }
          label={t("search.footer.toOpen")}
        />
        <KeyHint text="esc" label={t("search.footer.toClose")} />
      </div>
    </div>
  );
}

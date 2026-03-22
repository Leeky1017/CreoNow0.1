import React from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  FileText,
  Folder,
  Lightbulb,
  Share2,
  Sparkles,
} from "lucide-react";

import { ListItem } from "../../components/primitives/ListItem";
import type { SearchResultItem } from "./searchPanelTypes";

/**
 * Highlight matching text in a snippet using the search query.
 */
export function HighlightText(props: {
  text: string;
  query: string;
}): JSX.Element {
  const { text, query } = props;

  if (!query.trim()) {
    return <>{text}</>;
  }

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span
            key={index}
            className="bg-[var(--color-info-subtle)] text-[var(--color-info)] rounded-sm px-0.5"
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Document result item component.
 */
export const DocumentResultItem = React.memo(
  function DocumentResultItem(props: {
    item: SearchResultItem;
    query: string;
    isActive: boolean;
    isFlashing: boolean;
    onClick: () => void;
  }): JSX.Element {
    const { item, query, isActive, isFlashing, onClick } = props;
    const { t } = useTranslation();

    return (
      <ListItem
        interactive
        onClick={onClick}
        data-testid={`search-result-item-${item.documentId ?? item.id}`}
        className={`group w-full text-left mx-2 !p-2 !h-auto !rounded-lg !items-start !gap-3 relative ${
          isActive
            ? "!bg-[var(--color-separator)] border border-[var(--color-separator)]"
            : "border border-transparent hover:!bg-[var(--color-separator)] hover:border-[var(--color-separator)]"
        } ${isFlashing ? "ring-1 ring-[var(--color-info)] motion-safe:animate-pulse" : ""}`}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-info)]" />
        )}

        {/* Icon */}
        <div
          className={`mt-1 w-8 h-8 rounded flex items-center justify-center border border-[var(--color-separator)] shrink-0 transition-colors ${
            isActive
              ? "bg-[var(--color-separator)] text-[var(--color-fg-default)]"
              : "bg-[var(--color-separator)] text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)]"
          }`}
        >
          <FileText className="w-4 h-4" size={16} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4
              className={`text-sm font-medium truncate transition-colors ${
                isActive
                  ? "text-[var(--color-fg-default)]"
                  : "text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)]"
              }`}
            >
              <HighlightText text={item.title} query={query} />
            </h4>
            {item.matchScore && (
              <span className="text-[10px] font-mono text-[var(--color-info)] bg-[var(--color-info-subtle)] px-1.5 py-0.5 rounded border border-[var(--color-info-subtle)] shrink-0">
                {t("search.matchScore", { score: item.matchScore })}
              </span>
            )}
          </div>
          <p
            className={`text-xs leading-relaxed transition-colors ${
              isActive
                ? "text-[var(--color-fg-muted)] line-clamp-2"
                : "text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-fg-muted)] line-clamp-1"
            }`}
          >
            <HighlightText text={item.snippet || ""} query={query} />
          </p>
          {item.path && (
            <div className="flex items-center gap-2 mt-2">
              <Folder
                className="w-3 h-3 text-[var(--color-fg-placeholder)]"
                size={16}
                strokeWidth={1.5}
              />
              <span className="text-[10px] text-[var(--color-fg-placeholder)]">
                {item.path}
              </span>
              {item.editedTime && (
                <>
                  <span className="text-[10px] text-[var(--color-fg-placeholder)] mx-1">
                    {/* 审计：v1-13 #006 KEEP */}
                    {/* eslint-disable-next-line i18next/no-literal-string -- 技术原因：decorative separator dot, not user-facing translatable text */}
                    •
                  </span>
                  <span className="text-[10px] text-[var(--color-fg-placeholder)]">
                    {item.editedTime}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hover arrow */}
        <div className="hidden group-hover:flex items-center self-center pr-2">
          <ArrowRight
            className="w-4 h-4 text-[var(--color-fg-muted)]"
            size={16}
            strokeWidth={1.5}
          />
        </div>
      </ListItem>
    );
  },
);

/**
 * Memory result item component.
 */
export const MemoryResultItem = React.memo(function MemoryResultItem(props: {
  item: SearchResultItem;
  query: string;
  onClick: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const { item, query, onClick } = props;

  return (
    <ListItem
      interactive
      onClick={onClick}
      data-testid={`search-result-item-${item.documentId ?? item.id}`}
      className="group w-full text-left mx-2 mt-1 !p-2 !h-auto !rounded-lg border border-transparent hover:!bg-[var(--color-separator)] hover:border-[var(--color-separator)] !items-start !gap-3"
    >
      <div className="mt-1 w-8 h-8 rounded flex items-center justify-center text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] border border-[var(--color-separator)] shrink-0 transition-colors">
        <Lightbulb className="w-4 h-4" size={16} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className="text-sm font-medium text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] transition-colors truncate">
            <HighlightText text={item.title} query={query} />
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-[var(--color-success)] bg-[var(--color-success-subtle)] px-1.5 py-0.5 rounded border border-[var(--color-success-subtle)] opacity-0 group-hover:opacity-100 transition-opacity">
              {t("search.resultTypes.highRelevance")}
            </span>
          </div>
        </div>
        <p className="text-xs text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-fg-muted)] transition-colors leading-relaxed line-clamp-1">
          <HighlightText text={item.snippet || ""} query={query} />
        </p>
        {item.meta && (
          <div className="flex items-center gap-2 mt-2">
            <Sparkles
              className="w-3 h-3 text-[var(--color-fg-placeholder)]"
              size={16}
              strokeWidth={1.5}
            />
            <span className="text-[10px] text-[var(--color-fg-placeholder)]">
              {item.meta}
            </span>
          </div>
        )}
      </div>
    </ListItem>
  );
});

/**
 * Knowledge graph result item component.
 */
export const KnowledgeResultItem = React.memo(
  function KnowledgeResultItem(props: {
    item: SearchResultItem;
    query: string;
    onClick: () => void;
  }): JSX.Element {
    const { t } = useTranslation();
    const { item, query, onClick } = props;

    return (
      <ListItem
        interactive
        onClick={onClick}
        data-testid={`search-result-item-${item.documentId ?? item.id}`}
        className="group w-full text-left mx-2 !p-2 !h-auto !rounded-lg border border-transparent hover:!bg-[var(--color-separator)] hover:border-[var(--color-separator)] !items-start !gap-3"
      >
        <div className="mt-1 w-8 h-8 rounded bg-[var(--color-separator)] flex items-center justify-center text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] border border-[var(--color-separator)] shrink-0 transition-colors">
          <Share2 className="w-4 h-4" size={16} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] transition-colors truncate mb-1">
            <HighlightText text={item.title} query={query} />
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-fg-placeholder)] border border-[var(--color-separator)] px-1.5 py-0.5 rounded">
              {t("search.resultTypes.entity")}
            </span>
            {item.meta ? (
              <span className="text-[10px] text-[var(--color-fg-placeholder)]">
                {item.meta}
              </span>
            ) : null}
          </div>
        </div>
      </ListItem>
    );
  },
);

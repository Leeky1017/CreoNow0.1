import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Button } from "../../components/primitives/Button";
import { EmptyState } from "../../components/patterns/EmptyState";
import { LoadingState } from "../../components/patterns/LoadingState";
import { ErrorState } from "../../components/patterns/ErrorState";
import type { SearchStatus } from "../../stores/searchStore";

import type { SearchCategory, SearchResultItem } from "./searchPanelTypes";
import {
  DocumentResultItem,
  MemoryResultItem,
  KnowledgeResultItem,
} from "./SearchResultItems";
import { ResultGroup } from "./SearchPanelParts";

/**
 * Renders the appropriate search results view based on the current state.
 */
export function SearchResultsArea(props: {
  hasQuery: boolean;
  hasResults: boolean;
  hasError: boolean;
  effectiveQuery: string;
  effectiveStatus: SearchStatus;
  effectiveIndexState: "ready" | "rebuilding";
  lastError: { message: string } | null;
  category: SearchCategory;
  activeIndex: number;
  flashKey: string | null;
  totalResults: number;
  documentItems: SearchResultItem[];
  memoryItems: SearchResultItem[];
  knowledgeItems: SearchResultItem[];
  onItemClick: (itemId: string) => void;
  onRetrySearch: () => void;
  onClearQuery: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  if (!props.hasQuery && !props.hasResults) {
    return (
      <EmptyState
        variant="search"
        title={t("search.emptyStateHint")}
        illustration={
          <Search
            className="w-16 h-16 text-[var(--color-fg-placeholder)]"
            size={24}
            strokeWidth={1.5}
          />
        }
        className="py-16 px-8"
      />
    );
  }

  if (props.hasQuery && props.effectiveIndexState === "rebuilding") {
    return (
      <LoadingState
        variant="spinner"
        text={`${t("search.rebuildingIndex")}\n${t("search.rebuildingQuery", { query: props.effectiveQuery })}`}
        className="py-16 px-8"
      />
    );
  }

  if (props.hasQuery && props.hasError) {
    return (
      <ErrorState
        variant="card"
        severity="error"
        title={t("search.errorTitle")}
        message={props.lastError?.message ?? ""}
        actionLabel={t("search.retrySearch")}
        onAction={props.onRetrySearch}
        className="py-16 px-8"
      />
    );
  }

  if (props.hasQuery && !props.hasResults && props.effectiveStatus !== "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <EmptyState
          variant="search"
          title={t("search.noResults.title")}
          description={t("search.noResultsQuery", { query: props.effectiveQuery })}
        />
        <div className="mt-6 p-4 bg-[var(--color-separator)] rounded-lg border border-[var(--color-separator)]">
          <p className="text-[10px] text-[var(--color-fg-placeholder)] font-medium uppercase tracking-wider mb-2">
            {t("search.suggestionsTitle")}
          </p>
          <p className="text-xs text-[var(--color-fg-muted)]">
            {t("search.noResults.suggestion")}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={props.onClearQuery}
          className="mt-3 !h-auto !text-xs !text-[var(--color-fg-muted)] hover:!text-[var(--color-fg-default)]"
        >
          {t("search.clearSearch")}
        </Button>
      </div>
    );
  }

  return (
    <>
      {props.documentItems.length > 0 &&
        (props.category === "all" || props.category === "documents") && (
          <ResultGroup
            title={t("search.resultTypes.documents")}
            count={props.documentItems.length}
          >
            {props.documentItems.map((item, index) => (
              <DocumentResultItem
                key={item.id}
                item={item}
                query={props.effectiveQuery}
                isActive={index === 0 && props.activeIndex === 0}
                isFlashing={
                  props.flashKey?.startsWith(
                    `${item.documentId ?? item.id}:${item.anchor?.start ?? 0}:${item.anchor?.end ?? 0}:`,
                  ) ?? false
                }
                onClick={() => props.onItemClick(item.id)}
              />
            ))}
          </ResultGroup>
        )}

      {props.memoryItems.length > 0 &&
        (props.category === "all" || props.category === "memories") && (
          <ResultGroup
            title={t("search.resultTypes.memories")}
            count={props.memoryItems.length}
            hasBorderTop={props.documentItems.length > 0}
          >
            {props.memoryItems.map((item) => (
              <MemoryResultItem
                key={item.id}
                item={item}
                query={props.effectiveQuery}
                onClick={() => props.onItemClick(item.id)}
              />
            ))}
          </ResultGroup>
        )}

      {props.knowledgeItems.length > 0 &&
        (props.category === "all" || props.category === "knowledge") && (
          <ResultGroup
            title={t("search.resultTypes.knowledgeGraph")}
            count={props.knowledgeItems.length}
            hasBorderTop={
              props.documentItems.length > 0 || props.memoryItems.length > 0
            }
          >
            {props.knowledgeItems.map((item) => (
              <KnowledgeResultItem
                key={item.id}
                item={item}
                query={props.effectiveQuery}
                onClick={() => props.onItemClick(item.id)}
              />
            ))}
          </ResultGroup>
        )}
    </>
  );
}

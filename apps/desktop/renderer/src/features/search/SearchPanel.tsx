/** SearchPanel — 搜索面板组件（薄壳）。设计稿：25-search-panel.html */
import React from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

import { useHotkey } from "../../lib/hotkeys/useHotkey";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { Spinner } from "../../components/primitives/Spinner";
import { useFileStore } from "../../stores/fileStore";
import { useSearchStore, type SearchStatus } from "../../stores/searchStore";

import type { SearchCategory, SearchResultItem } from "./searchPanelTypes";
import { navigateSearchResult } from "./searchPanelTypes";
import {
  CategoryButton,
  SearchFilterBar,
  SearchFooter,
} from "./SearchPanelParts";
import { SearchResultsArea } from "./SearchResultsArea";

// Re-export for external consumers
export type {
  SearchResultItem,
  NavigateSearchResultArgs,
} from "./searchPanelTypes";
export { navigateSearchResult } from "./searchPanelTypes";

export function SearchPanel(props: {
  projectId: string;
  open: boolean;
  focusNonce?: number;
  onClose?: () => void;
  mockResults?: SearchResultItem[];
  mockQuery?: string;
  mockStatus?: SearchStatus;
  mockIndexState?: "ready" | "rebuilding";
}): JSX.Element | null {
  const {
    projectId,
    open,
    onClose,
    mockResults,
    mockQuery,
    mockStatus,
    mockIndexState,
    focusNonce = 0,
  } = props;
  const { t } = useTranslation();

  const query = useSearchStore((s) => s.query);
  const storeItems = useSearchStore((s) => s.items);
  const status = useSearchStore((s) => s.status);
  const indexState = useSearchStore((s) => s.indexState);
  const lastError = useSearchStore((s) => s.lastError);
  const setQuery = useSearchStore((s) => s.setQuery);
  const runFulltext = useSearchStore((s) => s.runFulltext);
  const clearError = useSearchStore((s) => s.clearError);
  const setCurrent = useFileStore((s) => s.setCurrent);

  const [category, setCategory] = React.useState<SearchCategory>("all");
  const [semanticSearch, setSemanticSearch] = React.useState(false);
  const [includeArchived, setIncludeArchived] = React.useState(false);
  const searchScope = useSearchStore((s) => s.scope);
  const setSearchScope = useSearchStore((s) => s.setScope);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [flashKey, setFlashKey] = React.useState<string | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const effectiveQuery = mockQuery ?? query;
  const effectiveStatus = mockStatus ?? status;
  const effectiveIndexState = mockIndexState ?? indexState;

  const items: SearchResultItem[] =
    mockResults ||
    storeItems.map((item) => ({
      id: item.documentId,
      documentId: item.documentId,
      type: "document" as const,
      title: item.documentTitle,
      snippet: item.snippet,
      anchor: item.anchor,
    }));

  const documentItems = items.filter((item) => item.type === "document");
  const memoryItems = items.filter((item) => item.type === "memory");
  const knowledgeItems = items.filter((item) => item.type === "knowledge");
  const totalResults = items.length;
  const hasResults = totalResults > 0;
  const hasQuery = effectiveQuery.trim().length > 0;
  const hasError = effectiveStatus === "error" && lastError !== null;

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [focusNonce, open]);

  function handleInputKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Enter") {
      void runFulltext({ projectId, limit: 20, scope: searchScope });
    }
  }

  const handleItemClick = React.useCallback(
    (itemId: string): void => {
      const result = items.find((item) => item.id === itemId);
      if (!result) {
        onClose?.();
        return;
      }
      const targetDocumentId =
        result.documentId ?? (result.type === "document" ? result.id : null);
      if (!targetDocumentId) {
        onClose?.();
        return;
      }
      void navigateSearchResult({
        projectId,
        result: { documentId: targetDocumentId, anchor: result.anchor },
        setCurrent,
        setFlashKey,
        onClose,
      });
    },
    [items, projectId, setCurrent, onClose],
  );

  function handleRetrySearch(): void {
    clearError();
    void runFulltext({ projectId, limit: 20, scope: searchScope });
  }

  useHotkey(
    "search:close",
    { key: "Escape" },
    React.useCallback(() => {
      if (effectiveQuery.trim().length > 0) setQuery("");
      else onClose?.();
    }, [effectiveQuery, setQuery, onClose]),
    "global",
    25,
    open,
  );

  useHotkey(
    "search:nav-down",
    { key: "ArrowDown" },
    React.useCallback(
      (e: KeyboardEvent) => {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, totalResults - 1));
      },
      [totalResults],
    ),
    "global",
    25,
    open,
  );

  useHotkey(
    "search:nav-up",
    { key: "ArrowUp" },
    React.useCallback((e: KeyboardEvent) => {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }, []),
    "global",
    25,
    open,
  );

  useHotkey(
    "search:activate",
    { key: "Enter" },
    React.useCallback(() => {
      if (hasResults && activeIndex >= 0 && activeIndex < items.length) {
        handleItemClick(items[activeIndex].id);
      }
    }, [hasResults, activeIndex, items, handleItemClick]),
    "global",
    25,
    open && hasResults,
  );

  if (!open) return null;

  return (
    <div
      data-testid="search-panel"
      className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[10vh]"
    >
      <div
        data-testid="search-backdrop"
        className="absolute inset-0 bg-[var(--color-scrim)] backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 审计：v1-13 #007 KEEP */}
      {/* eslint-disable-next-line creonow/no-hardcoded-dimension -- 技术原因：search modal width per design spec (w-[640px]) */}
      <div className="relative w-[640px] max-h-[80vh] flex flex-col rounded-xl overflow-hidden z-[var(--z-modal)] bg-[var(--color-bg-surface)] border border-[var(--color-separator)] shadow-[0_24px_48px_-12px_var(--color-shadow)] motion-safe:animate-[slideDown_0.3s_ease-out]">
        {/* Header */}
        <div className="flex flex-col border-b border-[var(--color-separator)] bg-[var(--color-bg-surface)]">
          <div className="flex items-center px-4 py-4 gap-3">
            <Search
              className="w-5 h-5 text-[var(--color-fg-muted)]"
              size={20}
              strokeWidth={1.5}
            />
            <Input
              ref={inputRef}
              data-testid="search-input"
              type="text"
              role="searchbox"
              aria-label={t("search.input.ariaLabel")}
              value={effectiveQuery}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t("search.placeholder")}
              className="flex-1 !bg-transparent !border-none !outline-none !text-lg !text-[var(--color-fg-default)] !placeholder-[var(--color-fg-placeholder)] !font-[var(--font-family-ui)] !font-light !h-8 !px-0 !rounded-none"
            />
            {effectiveStatus === "loading" && <Spinner size="sm" />}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="!p-1 !h-auto !rounded-md !text-[var(--color-fg-placeholder)] hover:!text-[var(--color-fg-default)] hover:!bg-[var(--color-separator)]"
              >
                <X className="w-5 h-5" size={20} strokeWidth={1.5} />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto">
            <CategoryButton
              label={t("search.categories.all")}
              active={category === "all"}
              onClick={() => setCategory("all")}
            />
            <CategoryButton
              label={t("search.categories.documents")}
              active={category === "documents"}
              onClick={() => setCategory("documents")}
            />
            <CategoryButton
              label={t("search.categories.memories")}
              active={category === "memories"}
              onClick={() => setCategory("memories")}
            />
            <CategoryButton
              label={t("search.categories.knowledge")}
              active={category === "knowledge"}
              onClick={() => setCategory("knowledge")}
            />
            <CategoryButton
              label={t("search.categories.assets")}
              active={category === "assets"}
              onClick={() => setCategory("assets")}
            />
          </div>
          <SearchFilterBar
            semanticSearch={semanticSearch}
            includeArchived={includeArchived}
            scope={searchScope}
            onSemanticChange={setSemanticSearch}
            onArchivedChange={setIncludeArchived}
            onScopeChange={setSearchScope}
          />
        </div>
        <div
          aria-live="polite"
          className="flex-1 overflow-y-auto scroll-shadow-y bg-[var(--color-bg-surface)]"
        >
          <SearchResultsArea
            hasQuery={hasQuery}
            hasResults={hasResults}
            hasError={hasError}
            effectiveQuery={effectiveQuery}
            effectiveStatus={effectiveStatus}
            effectiveIndexState={effectiveIndexState}
            lastError={lastError}
            category={category}
            activeIndex={activeIndex}
            flashKey={flashKey}
            totalResults={totalResults}
            documentItems={documentItems}
            memoryItems={memoryItems}
            knowledgeItems={knowledgeItems}
            onItemClick={handleItemClick}
            onRetrySearch={handleRetrySearch}
            onClearQuery={() => setQuery("")}
          />
        </div>
        <SearchFooter hasResults={hasResults} totalResults={totalResults} />
      </div>
    </div>
  );
}

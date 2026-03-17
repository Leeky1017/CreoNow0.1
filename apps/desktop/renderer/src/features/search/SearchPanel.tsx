import React from "react";
import { useTranslation } from "react-i18next";

import { useHotkey } from "../../lib/hotkeys/useHotkey";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { ListItem } from "../../components/primitives/ListItem";
import { Spinner } from "../../components/primitives/Spinner";
import { Toggle } from "../../components/primitives/Toggle";
import { useFileStore } from "../../stores/fileStore";
import {
  useSearchStore,
  type SearchScope,
  type SearchStatus,
} from "../../stores/searchStore";

import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  FileText,
  Folder,
  Frown,
  Lightbulb,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
/**
 * Search category filter options.
 */
type SearchCategory = "all" | "documents" | "memories" | "knowledge" | "assets";

/**
 * Result item data structure for different types.
 */
export interface SearchResultItem {
  id: string;
  documentId?: string;
  type: "document" | "memory" | "knowledge";
  title: string;
  snippet?: string;
  anchor?: { start: number; end: number };
  path?: string;
  matchScore?: number;
  editedTime?: string;
  meta?: string;
}

export type NavigateSearchResultArgs = {
  projectId: string;
  result: { documentId: string; anchor?: { start: number; end: number } };
  setCurrent: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<unknown>;
  setFlashKey: (value: string | null) => void;
  onClose?: () => void;
  setTimeoutFn?: (callback: () => void, delayMs: number) => unknown;
  /** Optional injection point for deterministic timestamps in tests. */
  now?: number;
};

/**
 * Navigate to a selected search result and trigger a temporary visual flash key.
 *
 * Why: SR1-R1-S2 requires deterministic jump + short-lived feedback after click.
 */
export async function navigateSearchResult(
  args: NavigateSearchResultArgs,
): Promise<void> {
  await args.setCurrent({
    projectId: args.projectId,
    documentId: args.result.documentId,
  });

  const anchor = args.result.anchor ?? { start: 0, end: 0 };
  const flashKey = `${args.result.documentId}:${anchor.start}:${anchor.end}:${args.now ?? Date.now()}`;
  args.setFlashKey(flashKey);

  const schedule = args.setTimeoutFn ?? setTimeout;
  schedule(() => {
    args.setFlashKey(null);
  }, 1500);

  args.onClose?.();
}

/**
 * Highlight matching text in a snippet using the search query.
 */
function HighlightText(props: { text: string; query: string }): JSX.Element {
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
 * Category filter button component matching design spec.
 */
function CategoryButton(props: {
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
          ? "!bg-[var(--color-info)] !text-[var(--color-fg-on-accent)] shadow-[var(--shadow-lg)] shadow-[var(--color-info-subtle)]"
          : "!bg-[var(--color-separator)] !text-[var(--color-fg-muted)] !border !border-transparent hover:!border-[var(--color-bg-overlay)] hover:!text-[var(--color-fg-default)] hover:!bg-[var(--color-bg-overlay)]"
      }`}
    >
      {props.label}
    </Button>
  );
}

/**
 * Document result item component.
 */
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
}

/**
 * Memory result item component.
 */
function MemoryResultItem(props: {
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
      {/* Icon */}
      <div className="mt-1 w-8 h-8 rounded flex items-center justify-center text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] border border-[var(--color-separator)] shrink-0 transition-colors">
        <Lightbulb className="w-4 h-4" size={16} strokeWidth={1.5} />
      </div>

      {/* Content */}
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
}

/**
 * Knowledge graph result item component.
 */
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
      {/* Icon */}
      <div className="mt-1 w-8 h-8 rounded bg-[var(--color-separator)] flex items-center justify-center text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] border border-[var(--color-separator)] shrink-0 transition-colors">
        <Share2 className="w-4 h-4" size={16} strokeWidth={1.5} />
      </div>

      {/* Content */}
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
}

/**
 * Result group section component.
 */
function ResultGroup(props: {
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
        <span className="text-[10px] font-semibold text-[var(--color-fg-placeholder)] uppercase tracking-widest">
          {props.title}
        </span>
        <span className="text-[10px] font-mono text-[var(--color-fg-placeholder)]">
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
function KeyHint(props: {
  icon?: React.ReactNode;
  text?: string;
  label: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-[var(--color-bg-overlay)] border border-[var(--color-separator)] text-[10px] text-[var(--color-fg-muted)] font-mono">
        {props.icon || props.text}
      </span>
      <span className="text-[10px] text-[var(--color-fg-placeholder)] ml-1">
        {props.label}
      </span>
    </div>
  );
}
/**
 * Renders the appropriate search results view based on the current state.
 * Handles empty, rebuilding, error, no results, and results states.
 */
function SearchResultsArea(props: {
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
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <Search
          className="w-16 h-16 text-[var(--color-fg-placeholder)] mb-4"
          size={24}
          strokeWidth={1.5}
        />
        <p className="text-sm text-[var(--color-fg-muted)] text-center">
          {t("search.emptyStateHint")}
        </p>
      </div>
    );
  }

  if (props.hasQuery && props.effectiveIndexState === "rebuilding") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <RefreshCw
          className="w-16 h-16 text-[var(--color-info)] mb-4 motion-safe:animate-pulse"
          size={24}
          strokeWidth={1.5}
        />
        <p className="text-sm font-medium text-[var(--color-fg-default)] text-center mb-2">
          {t("search.rebuildingIndex")}
        </p>
        <p className="text-xs text-[var(--color-fg-muted)] text-center">
          {t("search.rebuildingQuery", { query: props.effectiveQuery })}
        </p>
      </div>
    );
  }

  if (props.hasQuery && props.hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <TriangleAlert
          className="w-16 h-16 text-[var(--color-error)] mb-4"
          size={24}
          strokeWidth={1.5}
        />
        <p className="text-sm font-medium text-[var(--color-fg-default)] text-center mb-2">
          {t("search.errorTitle")}
        </p>
        <p className="text-xs text-[var(--color-fg-muted)] text-center">
          {props.lastError?.message}
        </p>
        <Button
          variant="primary"
          onClick={props.onRetrySearch}
          className="mt-6 !px-4 !py-2 !h-auto !bg-[var(--color-info)] !text-[var(--color-fg-on-accent)] !text-sm !font-medium !rounded-lg hover:!bg-[var(--color-info)] hover:!brightness-110"
        >
          {t("search.retrySearch")}
        </Button>
      </div>
    );
  }

  if (
    props.hasQuery &&
    !props.hasResults &&
    props.effectiveStatus !== "loading"
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <Frown
          className="w-16 h-16 text-[var(--color-fg-placeholder)] mb-4"
          size={24}
          strokeWidth={1.5}
        />
        <p className="text-sm font-medium text-[var(--color-fg-default)] text-center mb-2">
          {t("search.noResults.title")}
        </p>
        <p className="text-xs text-[var(--color-fg-muted)] text-center">
          {t("search.noResultsQuery", { query: props.effectiveQuery })}
        </p>
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

/**
 * Filter bar with semantic search and archive toggles.
 */
function SearchFilterBar(props: {
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
        <span className="text-[10px] text-[var(--color-fg-placeholder)] uppercase tracking-wider font-medium">
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
function SearchFooter(props: {
  hasResults: boolean;
  totalResults: number;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="border-t border-[var(--color-separator)] px-4 py-3 flex items-center justify-between shrink-0 bg-[var(--color-bg-raised)]">
      <div className="flex items-center gap-4">
        {props.hasResults && (
          <>
            <span className="text-xs text-[var(--color-fg-muted)] font-medium">
              {t("search.results.result", { count: props.totalResults })}
            </span>
          </>
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

/**
 * SearchPanel provides a modal search interface across documents, memories, and knowledge.
 *
 * Design: Follows design/Variant/designs/25-search-panel.html
 * Tokens: Uses design/system/01-tokens.css
 *
 * Features:
 * - Glass panel modal with slide-down animation
 * - Category filters (All/Documents/Memories/Knowledge/Assets)
 * - Semantic search and archive toggles
 * - Grouped search results with highlighting
 * - Keyboard navigation hints
 */
export function SearchPanel(props: {
  projectId: string;
  open: boolean;
  focusNonce?: number;
  onClose?: () => void;
  /** Mock results for storybook demonstration */
  mockResults?: SearchResultItem[];
  /** Mock query for storybook demonstration */
  mockQuery?: string;
  /** Mock status for storybook demonstration */
  mockStatus?: SearchStatus;
  /** Mock index state for storybook demonstration */
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

  // Use mock results if provided, otherwise use store items
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

  // Group items by type
  const documentItems = items.filter((item) => item.type === "document");
  const memoryItems = items.filter((item) => item.type === "memory");
  const knowledgeItems = items.filter((item) => item.type === "knowledge");

  const totalResults = items.length;
  const hasResults = totalResults > 0;
  const hasQuery = effectiveQuery.trim().length > 0;
  const hasError = effectiveStatus === "error" && lastError !== null;

  // Auto-focus input when opened
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
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
        result: {
          documentId: targetDocumentId,
          anchor: result.anchor,
        },
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

  // Handle keyboard shortcuts — only when panel is open
  useHotkey(
    "search:close",
    { key: "Escape" },
    React.useCallback(() => {
      if (effectiveQuery.trim().length > 0) {
        setQuery("");
      } else if (onClose) {
        onClose();
      }
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
      {/* Backdrop with blur */}
      <div
        data-testid="search-backdrop"
        className="absolute inset-0 bg-[var(--color-scrim)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Glass Panel Modal */}
        {/* eslint-disable-next-line creonow/no-hardcoded-dimension -- search modal width per design spec */}
        <div className="relative w-[640px] max-h-[80vh] flex flex-col rounded-xl overflow-hidden z-[var(--z-modal)] bg-[var(--color-bg-surface)] border border-[var(--color-separator)] shadow-[0_24px_48px_-12px_var(--color-shadow)] motion-safe:animate-[slideDown_0.3s_ease-out]">
        {/* Header */}
        <div className="flex flex-col border-b border-[var(--color-separator)] bg-[var(--color-bg-surface)]">
          {/* Search input row */}
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

          {/* Category filters */}
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

          {/* Filter options bar */}
          <SearchFilterBar
            semanticSearch={semanticSearch}
            includeArchived={includeArchived}
            scope={searchScope}
            onSemanticChange={setSemanticSearch}
            onArchivedChange={setIncludeArchived}
            onScopeChange={setSearchScope}
          />
        </div>

        {/* Results container */}
        <div
          aria-live="polite"
          className="flex-1 overflow-y-auto bg-[var(--color-bg-surface)]"
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

        {/* Footer */}
        <SearchFooter hasResults={hasResults} totalResults={totalResults} />
      </div>
    </div>
  );
}

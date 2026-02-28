import React from "react";

import { Spinner } from "../../components/primitives/Spinner";
import { useFileStore } from "../../stores/fileStore";
import { useSearchStore, type SearchStatus } from "../../stores/searchStore";

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
  const flashKey = `${args.result.documentId}:${anchor.start}:${anchor.end}:${Date.now()}`;
  args.setFlashKey(flashKey);

  const schedule = args.setTimeoutFn ?? setTimeout;
  schedule(() => {
    args.setFlashKey(null);
  }, 900);

  args.onClose?.();
}

/**
 * Mock data for demonstrating search results.
 */
export const MOCK_SEARCH_RESULTS: SearchResultItem[] = [
  {
    id: "doc-1",
    type: "document",
    title: "The Architecture of Silence",
    snippet:
      "...visual noise. In design theory, this absence of clutter allows the user to focus purely on function. The aesthetic of silence is not empty...",
    path: "Essays / Theory / Drafts",
    matchScore: 98,
    editedTime: "Edited 2m ago",
  },
  {
    id: "doc-2",
    type: "document",
    title: "Minimalism in Digital Spaces",
    snippet:
      "...exploring the roots of design theory through the lens of early 20th century functionalism...",
    path: "Research / Historical",
  },
  {
    id: "mem-1",
    type: "memory",
    title: "Concept: Negative Space",
    snippet: "Memory generated from design theory discussion on Jan 12.",
    meta: "Generated Insight",
  },
  {
    id: "mem-2",
    type: "memory",
    title: "User Preference: Typography",
    snippet: "User prefers serif fonts for design essays.",
    meta: "Implicit Preference",
  },
  {
    id: "kg-1",
    type: "knowledge",
    title: "Bauhaus Movement",
    meta: "Connected to 14 documents",
  },
];

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
            className="bg-[rgba(59,130,246,0.2)] text-[#60a5fa] rounded-sm px-0.5"
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
    <button
      type="button"
      onClick={props.onClick}
      className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
        props.active
          ? "bg-[#3b82f6] text-white shadow-lg shadow-[rgba(59,130,246,0.2)]"
          : "bg-[rgba(255,255,255,0.05)] text-[#888888] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:text-white hover:bg-[rgba(255,255,255,0.1)]"
      }`}
    >
      {props.label}
    </button>
  );
}

/**
 * Toggle switch component matching design spec.
 */
function ToggleSwitch(props: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}): JSX.Element {
  return (
    <label
      htmlFor={props.id}
      className="flex items-center gap-2 cursor-pointer group"
    >
      <div className="relative inline-block w-7 h-4 align-middle select-none">
        <input
          id={props.id}
          type="checkbox"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
          className="peer absolute block w-3 h-3 rounded-full bg-white appearance-none cursor-pointer top-0.5 left-0.5 checked:translate-x-3 transition-transform duration-200"
        />
        <div className="block overflow-hidden h-4 rounded-full bg-[rgba(255,255,255,0.1)] peer-checked:bg-[#3b82f6] transition-colors duration-200" />
      </div>
      <span className="text-xs text-[#888888] group-hover:text-white transition-colors">
        {props.label}
      </span>
    </label>
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

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`search-result-item-${item.documentId ?? item.id}`}
      className={`group w-full text-left mx-2 p-2 rounded-lg flex items-start gap-3 transition-all relative overflow-hidden ${
        isActive
          ? "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]"
          : "border border-transparent hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.05)]"
      } ${isFlashing ? "ring-1 ring-[#3b82f6] animate-pulse" : ""}`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#3b82f6]" />
      )}

      {/* Icon */}
      <div
        className={`mt-1 w-8 h-8 rounded flex items-center justify-center border border-[rgba(255,255,255,0.05)] shrink-0 transition-colors ${
          isActive
            ? "bg-[rgba(255,255,255,0.05)] text-white"
            : "bg-[rgba(255,255,255,0.05)] text-[#888888] group-hover:text-white"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4
            className={`text-sm font-medium truncate transition-colors ${
              isActive ? "text-white" : "text-[#888888] group-hover:text-white"
            }`}
          >
            <HighlightText text={item.title} query={query} />
          </h4>
          {item.matchScore && (
            <span className="text-[10px] font-mono text-[#3b82f6] bg-[rgba(59,130,246,0.1)] px-1.5 py-0.5 rounded border border-[rgba(59,130,246,0.2)] shrink-0">
              {item.matchScore}% match
            </span>
          )}
        </div>
        <p
          className={`text-xs leading-relaxed transition-colors ${
            isActive
              ? "text-[#888888] line-clamp-2"
              : "text-[#444444] group-hover:text-[#888888] line-clamp-1"
          }`}
        >
          <HighlightText text={item.snippet || ""} query={query} />
        </p>
        {item.path && (
          <div className="flex items-center gap-2 mt-2">
            <svg
              className="w-3 h-3 text-[#444444]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
            <span className="text-[10px] text-[#444444]">{item.path}</span>
            {item.editedTime && (
              <>
                <span className="text-[10px] text-[#444444] mx-1">•</span>
                <span className="text-[10px] text-[#444444]">
                  {item.editedTime}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hover arrow */}
      <div className="hidden group-hover:flex items-center self-center pr-2">
        <svg
          className="w-4 h-4 text-[#888888]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </div>
    </button>
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
  const { item, query, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left mx-2 mt-1 p-2 rounded-lg border border-transparent hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.05)] flex items-start gap-3 transition-all"
    >
      {/* Icon */}
      <div className="mt-1 w-8 h-8 rounded flex items-center justify-center text-[#888888] group-hover:text-white border border-[rgba(255,255,255,0.05)] shrink-0 transition-colors">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className="text-sm font-medium text-[#888888] group-hover:text-white transition-colors truncate">
            <HighlightText text={item.title} query={query} />
          </h4>
          <span className="text-[10px] font-mono text-[rgba(16,185,129,0.7)] bg-[rgba(16,185,129,0.1)] px-1.5 py-0.5 rounded border border-[rgba(16,185,129,0.1)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            High Relevance
          </span>
        </div>
        <p className="text-xs text-[#444444] group-hover:text-[#888888] transition-colors leading-relaxed line-clamp-1">
          <HighlightText text={item.snippet || ""} query={query} />
        </p>
        {item.meta && (
          <div className="flex items-center gap-2 mt-2">
            <svg
              className="w-3 h-3 text-[#444444]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
            <span className="text-[10px] text-[#444444]">{item.meta}</span>
          </div>
        )}
      </div>
    </button>
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
  const { item, query, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left mx-2 p-2 rounded-lg border border-transparent hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.05)] flex items-start gap-3 transition-all"
    >
      {/* Icon */}
      <div className="mt-1 w-8 h-8 rounded bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#888888] group-hover:text-white border border-[rgba(255,255,255,0.05)] shrink-0 transition-colors">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[#888888] group-hover:text-white transition-colors truncate mb-1">
          <HighlightText text={item.title} query={query} />
        </h4>
        {item.meta && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#444444] border border-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded">
              Entity
            </span>
            <span className="text-[10px] text-[#444444]">{item.meta}</span>
          </div>
        )}
      </div>
    </button>
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
  return (
    <div
      className={`py-2 ${props.hasBorderTop ? "border-t border-[rgba(255,255,255,0.04)]" : ""}`}
    >
      <div className="px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#444444] uppercase tracking-widest">
          {props.title}
        </span>
        <span className="text-[10px] font-mono text-[#444444]">
          {props.count} {props.count === 1 ? "match" : "matches"}
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
      <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.05)] text-[10px] text-[#888888] font-mono">
        {props.icon || props.text}
      </span>
      <span className="text-[10px] text-[#444444] ml-1">{props.label}</span>
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
  } = props;

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
  }, [open]);

  // Handle keyboard shortcuts — only when panel is open
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, totalResults - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, totalResults, open]);

  function handleInputKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Enter") {
      void runFulltext({ projectId, limit: 20 });
    }
  }

  function handleItemClick(documentId: string): void {
    const result = items.find((item) => item.id === documentId);
    if (!result || result.type !== "document") {
      onClose?.();
      return;
    }

    const targetDocumentId = result.documentId ?? result.id;
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
  }

  function handleRetrySearch(): void {
    clearError();
    void runFulltext({ projectId, limit: 20 });
  }

  if (!open) return null;

  return (
    <div
      data-testid="search-panel"
      className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[10vh]"
    >
      {/* Backdrop with blur */}
      <div
        data-testid="search-backdrop"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Glass Panel Modal */}
      <div
        className="relative w-[640px] max-h-[80vh] flex flex-col rounded-xl overflow-hidden z-50"
        style={{
          background: "#0f0f0f",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow:
            "0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.02) inset",
          animation: "slideDown 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col border-b border-[rgba(255,255,255,0.06)]"
          style={{ background: "#0f0f0f" }}
        >
          {/* Search input row */}
          <div className="flex items-center px-4 py-4 gap-3">
            <svg
              className="w-5 h-5 text-[#888888]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              data-testid="search-input"
              type="text"
              value={effectiveQuery}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search documents, memories, knowledge..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-[#444444] font-light h-8"
              style={{ fontFamily: "var(--font-family-ui)" }}
            />
            {effectiveStatus === "loading" && <Spinner size="sm" />}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-[#444444] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto">
            <CategoryButton
              label="All"
              active={category === "all"}
              onClick={() => setCategory("all")}
            />
            <CategoryButton
              label="Documents"
              active={category === "documents"}
              onClick={() => setCategory("documents")}
            />
            <CategoryButton
              label="Memories"
              active={category === "memories"}
              onClick={() => setCategory("memories")}
            />
            <CategoryButton
              label="Knowledge"
              active={category === "knowledge"}
              onClick={() => setCategory("knowledge")}
            />
            <CategoryButton
              label="Assets"
              active={category === "assets"}
              onClick={() => setCategory("assets")}
            />
          </div>

          {/* Filter options bar */}
          <div
            className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between"
            style={{ background: "#121212" }}
          >
            <div className="flex items-center gap-6">
              <ToggleSwitch
                id="semantic-toggle"
                label="Semantic Search"
                checked={semanticSearch}
                onChange={setSemanticSearch}
              />
              <ToggleSwitch
                id="archived-toggle"
                label="Include Archived"
                checked={includeArchived}
                onChange={setIncludeArchived}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#444444] uppercase tracking-wider font-medium">
                Scope
              </span>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] text-xs text-[#888888] hover:text-white hover:border-[rgba(255,255,255,0.1)] transition-all"
              >
                <span>Current Project</span>
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results container */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: "#0f0f0f" }}
        >
          {!hasQuery && !hasResults ? (
            /* Empty state - no query */
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <svg
                className="w-16 h-16 text-[#444444] mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm text-[#888888] text-center">
                Enter a search term to find documents
              </p>
            </div>
          ) : hasQuery && effectiveIndexState === "rebuilding" ? (
            /* Reindex rebuilding state */
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <svg
                className="w-16 h-16 text-[#3b82f6] mb-4 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12a7.5 7.5 0 0112.306-5.761M19.5 12a7.5 7.5 0 01-12.306 5.761M19.5 4.5v4.5H15M4.5 19.5V15H9"
                />
              </svg>
              <p className="text-sm font-medium text-white text-center mb-2">
                正在重建索引，请稍后重试
              </p>
              <p className="text-xs text-[#888888] text-center">
                查询词：&ldquo;{effectiveQuery}&rdquo;
              </p>
            </div>
          ) : hasQuery && hasError ? (
            /* Search error state */
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <svg
                className="w-16 h-16 text-[#ef4444] mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9.303 3.376l-7.884-13.645a1.65 1.65 0 00-2.838 0L2.697 16.126A1.65 1.65 0 004.116 18.6h15.768a1.65 1.65 0 001.419-2.474zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-medium text-white text-center mb-2">
                搜索失败，请重试
              </p>
              <p className="text-xs text-[#888888] text-center">
                {lastError.message}
              </p>
              <button
                type="button"
                onClick={handleRetrySearch}
                className="mt-6 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
              >
                重试搜索
              </button>
            </div>
          ) : hasQuery && !hasResults && effectiveStatus !== "loading" ? (
            /* No results state */
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <svg
                className="w-16 h-16 text-[#444444] mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                />
              </svg>
              <p className="text-sm font-medium text-white text-center mb-2">
                未找到匹配结果
              </p>
              <p className="text-xs text-[#888888] text-center">
                查询词：&ldquo;{effectiveQuery}&rdquo;
              </p>
              <div className="mt-6 p-4 bg-[rgba(255,255,255,0.03)] rounded-lg border border-[rgba(255,255,255,0.06)]">
                <p className="text-[10px] text-[#444444] font-medium uppercase tracking-wider mb-2">
                  建议
                </p>
                <p className="text-xs text-[#888888]">
                  建议检查拼写或使用不同关键词
                </p>
              </div>
              <button
                type="button"
                className="mt-6 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                  />
                </svg>
                Search in all projects
              </button>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 text-xs text-[#888888] hover:text-white transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            /* Results */
            <>
              {/* Documents group */}
              {documentItems.length > 0 &&
                (category === "all" || category === "documents") && (
                  <ResultGroup title="Documents" count={documentItems.length}>
                    {documentItems.map((item, index) => (
                      <DocumentResultItem
                        key={item.id}
                        item={item}
                        query={effectiveQuery}
                        isActive={index === 0 && activeIndex === 0}
                        isFlashing={
                          flashKey?.startsWith(
                            `${item.documentId ?? item.id}:${item.anchor?.start ?? 0}:${item.anchor?.end ?? 0}:`,
                          ) ?? false
                        }
                        onClick={() => handleItemClick(item.id)}
                      />
                    ))}
                  </ResultGroup>
                )}

              {/* Memories group */}
              {memoryItems.length > 0 &&
                (category === "all" || category === "memories") && (
                  <ResultGroup
                    title="Memories"
                    count={memoryItems.length}
                    hasBorderTop={documentItems.length > 0}
                  >
                    {memoryItems.map((item) => (
                      <MemoryResultItem
                        key={item.id}
                        item={item}
                        query={effectiveQuery}
                        onClick={() => handleItemClick(item.id)}
                      />
                    ))}
                  </ResultGroup>
                )}

              {/* Knowledge group */}
              {knowledgeItems.length > 0 &&
                (category === "all" || category === "knowledge") && (
                  <ResultGroup
                    title="Knowledge Graph"
                    count={knowledgeItems.length}
                    hasBorderTop={
                      documentItems.length > 0 || memoryItems.length > 0
                    }
                  >
                    {knowledgeItems.map((item) => (
                      <KnowledgeResultItem
                        key={item.id}
                        item={item}
                        query={effectiveQuery}
                        onClick={() => handleItemClick(item.id)}
                      />
                    ))}
                  </ResultGroup>
                )}

              {/* View more */}
              {totalResults > 5 && (
                <div className="p-2 text-center border-t border-[rgba(255,255,255,0.04)] mt-2">
                  <button
                    type="button"
                    className="text-xs text-[#888888] hover:text-[#3b82f6] transition-colors py-2 w-full"
                  >
                    View {totalResults - 5} more results
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t border-[rgba(255,255,255,0.06)] px-4 py-3 flex items-center justify-between shrink-0"
          style={{ background: "#121212" }}
        >
          <div className="flex items-center gap-4">
            {hasResults && (
              <>
                <span className="text-xs text-[#888888] font-medium">
                  {totalResults} {totalResults === 1 ? "result" : "results"}
                </span>
                <div className="h-3 w-px bg-[rgba(255,255,255,0.1)]" />
                <span className="text-[10px] text-[#444444]">
                  Search took 0.04s
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <KeyHint
              icon={
                <span className="flex gap-0.5">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 15.75l7.5-7.5 7.5 7.5"
                    />
                  </svg>
                </span>
              }
              label=""
            />
            <KeyHint
              icon={
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              }
              label="to navigate"
            />
            <KeyHint
              icon={
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                  />
                </svg>
              }
              label="to open"
            />
            <KeyHint text="esc" label="to close" />
          </div>
        </div>
      </div>

      {/* CSS for animation */}
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

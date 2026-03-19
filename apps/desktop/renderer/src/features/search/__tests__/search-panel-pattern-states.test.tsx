/**
 * SearchPanel — pattern state rendering tests
 *
 * Verifies that SearchPanel delegates to patterns/EmptyState, LoadingState,
 * and ErrorState in the correct conditions, instead of hand-rolling state UI.
 *
 * Spec: v1-01 §S1 — all features must use unified pattern components.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchPanel } from "../SearchPanel";
import type { SearchStore } from "../../../stores/searchStore";

let mockSearchState: SearchStore;

function createSearchState(overrides: Partial<SearchStore> = {}): SearchStore {
  return {
    query: "",
    scope: "current" as const,
    items: [],
    status: "idle",
    indexState: "ready",
    total: 0,
    hasMore: false,
    lastError: null,
    setQuery: vi.fn(),
    setScope: vi.fn(),
    runFulltext: vi.fn().mockResolvedValue(undefined),
    clearResults: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
}

vi.mock("../../../stores/searchStore", () => ({
  useSearchStore: vi.fn((selector: (state: SearchStore) => unknown) =>
    selector(mockSearchState),
  ),
}));

vi.mock("../../../stores/fileStore", () => ({
  useFileStore: vi.fn(
    (selector: (state: { setCurrent: () => Promise<unknown> }) => unknown) =>
      selector({
        setCurrent: vi.fn().mockResolvedValue({ ok: true }),
      }),
  ),
}));

describe("SearchPanel pattern state rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchState = createSearchState();
  });

  it("renders patterns/EmptyState when no query and no results", () => {
    mockSearchState = createSearchState({ query: "", items: [], status: "idle" });
    render(<SearchPanel projectId="proj_1" open={true} />);

    // SearchPanel passes a custom illustration, so EmptyState renders
    // the search hint title (from i18n search.emptyStateHint)
    expect(screen.getByText("Enter a search term to find documents")).toBeInTheDocument();
  });

  it("renders patterns/LoadingState when index is rebuilding", () => {
    mockSearchState = createSearchState({
      query: "test",
      items: [],
      status: "loading",
      indexState: "rebuilding",
    });
    render(<SearchPanel projectId="proj_1" open={true} />);

    // LoadingState spinner uses role="status" — use getAllByRole since
    // SearchPanel may render additional status elements
    const statusElements = screen.getAllByRole("status");
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders patterns/ErrorState (variant=card) when search fails", () => {
    mockSearchState = createSearchState({
      query: "test",
      items: [],
      status: "error",
      lastError: { code: "INTERNAL_ERROR", message: "fts query failed" },
    });
    render(<SearchPanel projectId="proj_1" open={true} />);

    // ErrorState with actionLabel renders a retry button
    expect(
      screen.getByRole("button", { name: "Retry Search" }),
    ).toBeInTheDocument();
  });

  it("renders patterns/EmptyState for no-results on valid query", () => {
    mockSearchState = createSearchState({
      query: "nonexistent",
      items: [],
      status: "ready",
      total: 0,
    });
    render(<SearchPanel projectId="proj_1" open={true} />);

    expect(screen.getByText("No matching results")).toBeInTheDocument();
  });
});

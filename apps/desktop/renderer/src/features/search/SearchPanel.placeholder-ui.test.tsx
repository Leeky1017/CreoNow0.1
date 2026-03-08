import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { SearchPanel, type SearchResultItem } from "./SearchPanel";

vi.mock("../../stores/searchStore", () => ({
  useSearchStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      query: "",
      items: [],
      status: "idle" as const,
      indexState: "ready" as const,
      total: 0,
      hasMore: false,
      lastError: null,
      setQuery: vi.fn(),
      runFulltext: vi.fn().mockResolvedValue({ ok: true }),
      clearResults: vi.fn(),
      clearError: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  }),
}));

const mockResults: SearchResultItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: `doc-${i}`,
  documentId: `doc-${i}`,
  type: "document" as const,
  title: `Document ${i}`,
  snippet: `Snippet for document ${i}`,
}));

describe("SearchPanel placeholder UI closure", () => {
  it("Scenario: Search 面板隐藏 View More 链接", () => {
    render(
      <SearchPanel
        projectId="p1"
        open
        mockResults={mockResults}
        mockQuery="test"
        mockStatus="idle"
        mockIndexState="ready"
      />,
    );

    expect(screen.queryByText(/view more/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/View More/)).not.toBeInTheDocument();
  });

  it("Scenario: Search 面板隐藏 Search All Projects 链接", () => {
    render(
      <SearchPanel
        projectId="p1"
        open
        mockResults={[]}
        mockQuery="nonexistent"
        mockStatus="idle"
        mockIndexState="ready"
      />,
    );

    expect(
      screen.queryByText(/search.+all.+projects/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Search in all projects"),
    ).not.toBeInTheDocument();
  });

  it("Scenario: 搜索结果列表正常渲染", () => {
    render(
      <SearchPanel
        projectId="p1"
        open
        mockResults={mockResults.slice(0, 3)}
        mockQuery="test"
        mockStatus="idle"
        mockIndexState="ready"
      />,
    );

    expect(screen.getByTestId("search-result-item-doc-0")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-item-doc-1")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-item-doc-2")).toBeInTheDocument();
  });
});

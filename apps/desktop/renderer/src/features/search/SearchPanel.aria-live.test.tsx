import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchPanel } from "./SearchPanel";

// Mock stores (same pattern as SearchPanel.test.tsx)
vi.mock("../../stores/searchStore", () => ({
  useSearchStore: vi.fn((selector) => {
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
  useFileStore: vi.fn((selector) => {
    const state = {
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  }),
}));

describe("SearchPanel aria-live (WB-FE-ARIA-S2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("搜索结果容器应包含 aria-live='polite'", () => {
    render(<SearchPanel projectId="test-project" open={true} />);

    const resultsContainer = screen
      .getByTestId("search-panel")
      .querySelector(".flex-1.overflow-y-auto");
    expect(resultsContainer).toHaveAttribute("aria-live", "polite");
  });
});

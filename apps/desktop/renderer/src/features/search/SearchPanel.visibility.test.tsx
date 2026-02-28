import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchPanel } from "./SearchPanel";

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
    const state = { setCurrent: vi.fn().mockResolvedValue({ ok: true }) };
    return selector(state);
  }),
}));

// WB-FE-HF-SP-S1
describe("SearchPanel visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render overlay when open is false", () => {
    render(<SearchPanel projectId="test-project" open={false} />);
    expect(screen.queryByTestId("search-panel")).not.toBeInTheDocument();
  });

  it("renders overlay when open is true", () => {
    render(<SearchPanel projectId="test-project" open={true} />);
    expect(screen.getByTestId("search-panel")).toBeInTheDocument();
  });
});

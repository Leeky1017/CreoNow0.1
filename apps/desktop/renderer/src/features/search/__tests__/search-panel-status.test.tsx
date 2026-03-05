import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchPanel } from "../SearchPanel";
import type { SearchStore } from "../../../stores/searchStore";

let mockSearchState: SearchStore;

function createSearchState(overrides: Partial<SearchStore> = {}): SearchStore {
  return {
    query: "missing",
    items: [],
    status: "ready",
    indexState: "ready",
    total: 0,
    hasMore: false,
    lastError: null,
    setQuery: vi.fn(),
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

describe("Search Panel status rendering (S3-SEARCH-PANEL-S3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchState = createSearchState();
  });

  it("renders distinct empty and error states", async () => {
    const { rerender } = render(<SearchPanel projectId="proj_1" open={true} />);

    expect(screen.getByText("No matching results")).toBeInTheDocument();
    expect(screen.queryByText("Search failed, please retry")).not.toBeInTheDocument();

    mockSearchState = createSearchState({
      status: "error",
      lastError: {
        code: "INTERNAL_ERROR",
        message: "fts query failed",
      },
    });
    rerender(<SearchPanel projectId="proj_1" open={true} />);

    expect(screen.queryByText("No matching results")).not.toBeInTheDocument();
    expect(screen.getByText("Search failed, please retry")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "Retry Search" });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockSearchState.clearError).toHaveBeenCalledTimes(1);
      expect(mockSearchState.runFulltext).toHaveBeenCalledWith({
        projectId: "proj_1",
        limit: 20,
      });
    });
  });
});

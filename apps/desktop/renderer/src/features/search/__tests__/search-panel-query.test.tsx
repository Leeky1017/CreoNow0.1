import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchPanel } from "../SearchPanel";
import type { SearchItem, SearchStore } from "../../../stores/searchStore";

const mockSetCurrent = vi.fn().mockResolvedValue({ ok: true });
let mockSearchState: SearchStore;

function makeSearchItem(overrides: Partial<SearchItem> = {}): SearchItem {
  return {
    projectId: "proj_1",
    documentId: "doc_1",
    documentTitle: "Default title",
    documentType: "chapter",
    snippet: "Default snippet",
    score: 0.9,
    updatedAt: 1,
    anchor: { start: 0, end: 7 },
    highlights: [{ start: 0, end: 7 }],
    ...overrides,
  };
}

function createSearchState(overrides: Partial<SearchStore> = {}): SearchStore {
  return {
    query: "",
    items: [],
    status: "idle",
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
    (selector: (state: { setCurrent: typeof mockSetCurrent }) => unknown) =>
      selector({
        setCurrent: mockSetCurrent,
      }),
  ),
}));

describe("Search Panel query rendering (S3-SEARCH-PANEL-S1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchState = createSearchState();
  });

  it("shows full-text hits after query input", () => {
    mockSearchState = createSearchState({
      query: "design",
      status: "ready",
      items: [
        makeSearchItem({
          documentId: "doc-zeta",
          documentTitle: "Zeta Draft",
          snippet: "Design systems organize interface language.",
        }),
        makeSearchItem({
          documentId: "doc-alpha",
          documentTitle: "Alpha Notes",
          snippet: "Design thinking improves iteration speed.",
        }),
      ],
      total: 2,
    });

    render(<SearchPanel projectId="proj_1" open={true} />);

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "design systems" },
    });
    expect(mockSearchState.setQuery).toHaveBeenCalledWith("design systems");

    const results = screen.getAllByTestId(/^search-result-item-/);
    expect(results).toHaveLength(2);
    expect(within(results[0]).getByText("Zeta Draft")).toBeInTheDocument();
    expect(
      within(results[0]).getByText(/systems organize interface language\./),
    ).toBeInTheDocument();
    expect(within(results[1]).getByText("Alpha Notes")).toBeInTheDocument();
  });
});

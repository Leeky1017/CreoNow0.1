import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchPanel } from "../SearchPanel";
import type { SearchItem, SearchStore } from "../../../stores/searchStore";

const mockSetCurrent = vi.fn().mockResolvedValue({ ok: true });
let mockSearchState: SearchStore;

function makeSearchItem(overrides: Partial<SearchItem> = {}): SearchItem {
  return {
    projectId: "proj_1",
    documentId: "doc_target",
    documentTitle: "Target Document",
    documentType: "chapter",
    snippet: "Target snippet for navigation.",
    score: 0.95,
    updatedAt: 1,
    anchor: { start: 12, end: 24 },
    highlights: [{ start: 12, end: 24 }],
    ...overrides,
  };
}

function createSearchState(overrides: Partial<SearchStore> = {}): SearchStore {
  return {
    query: "target",
    scope: "current" as const,
    items: [],
    status: "ready",
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
    (selector: (state: { setCurrent: typeof mockSetCurrent }) => unknown) =>
      selector({
        setCurrent: mockSetCurrent,
      }),
  ),
}));

describe("Search Panel navigation (S3-SEARCH-PANEL-S2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchState = createSearchState({
      items: [
        makeSearchItem({
          documentId: "doc_target",
          documentTitle: "Target Document",
        }),
      ],
      total: 1,
    });
  });

  it("navigates editor to selected search hit", async () => {
    const onClose = vi.fn();
    render(<SearchPanel projectId="proj_1" open={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("search-result-item-doc_target"));

    await waitFor(() => {
      expect(mockSetCurrent).toHaveBeenCalledWith({
        projectId: "proj_1",
        documentId: "doc_target",
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates when clicking memory and knowledge items with linked documentId", async () => {
    const onClose = vi.fn();
    render(
      <SearchPanel
        projectId="proj_1"
        open={true}
        onClose={onClose}
        mockResults={[
          {
            id: "mem-1",
            documentId: "doc_from_memory",
            type: "memory",
            title: "Memory Insight",
            snippet: "Memory linked snippet",
          },
          {
            id: "kg-1",
            documentId: "doc_from_knowledge",
            type: "knowledge",
            title: "Knowledge Entity",
            meta: "Character",
          },
        ]}
        mockQuery="insight"
      />,
    );

    fireEvent.click(screen.getByTestId("search-result-item-doc_from_memory"));
    await waitFor(() => {
      expect(mockSetCurrent).toHaveBeenCalledWith({
        projectId: "proj_1",
        documentId: "doc_from_memory",
      });
    });

    fireEvent.click(
      screen.getByTestId("search-result-item-doc_from_knowledge"),
    );
    await waitFor(() => {
      expect(mockSetCurrent).toHaveBeenCalledWith({
        projectId: "proj_1",
        documentId: "doc_from_knowledge",
      });
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

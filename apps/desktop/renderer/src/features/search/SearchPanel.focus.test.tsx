import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { SearchPanel } from "./SearchPanel";

vi.mock("../../stores/searchStore", () => ({
  useSearchStore: vi.fn((selector) => selector({
    query: "",
    items: [],
    status: "idle",
    indexState: "ready",
    total: 0,
    hasMore: false,
    lastError: null,
    setQuery: vi.fn(),
    runFulltext: vi.fn().mockResolvedValue({ ok: true }),
    clearResults: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector) => selector({ setCurrent: vi.fn().mockResolvedValue({ ok: true }) })),
}));

describe("SearchPanel focus refresh", () => {
  it("re-focuses the search input when focusNonce changes while panel stays open", () => {
    const { rerender } = render(
      <>
        <button data-testid="outside">Outside</button>
        <SearchPanel projectId="test-project" open={true} focusNonce={0} />
      </>,
    );

    const input = screen.getByTestId("search-input");
    expect(input).toHaveFocus();

    screen.getByTestId("outside").focus();
    expect(screen.getByTestId("outside")).toHaveFocus();

    rerender(
      <>
        <button data-testid="outside">Outside</button>
        <SearchPanel projectId="test-project" open={true} focusNonce={1} />
      </>,
    );

    expect(screen.getByTestId("search-input")).toHaveFocus();
  });
});

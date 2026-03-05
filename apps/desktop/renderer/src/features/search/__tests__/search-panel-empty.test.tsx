import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchPanel } from "../SearchPanel";

vi.mock("../../../stores/searchStore", () => ({
  useSearchStore: vi.fn((selector) => {
    const state = {
      query: "不存在关键词",
      items: [],
      status: "ready" as const,
      indexState: "ready" as const,
      lastError: null,
      setQuery: vi.fn(),
      runFulltext: vi.fn().mockResolvedValue(undefined),
      clearResults: vi.fn(),
      clearError: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("../../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector) => {
    const state = {
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  }),
}));

describe("search panel empty state (SR1-R1-S3)", () => {
  it("should render empty hint when no fts match exists", () => {
    render(<SearchPanel projectId="proj_1" open={true} />);

    expect(screen.getByText("No matching results")).toBeInTheDocument();
    expect(
      screen.getByText("Try checking your spelling or using different keywords"),
    ).toBeInTheDocument();
  });
});

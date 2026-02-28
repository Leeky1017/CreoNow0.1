import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
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

// 验证 open=false 时全局 keydown 监听器不触发（#789）
describe("SearchPanel keydown guard when closed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call onClose on Escape when open is false", () => {
    const onClose = vi.fn();
    render(
      <SearchPanel projectId="test-project" open={false} onClose={onClose} />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not preventDefault on ArrowDown when open is false", () => {
    render(<SearchPanel projectId="test-project" open={false} />);
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("still calls onClose on Escape when open is true", () => {
    const onClose = vi.fn();
    render(
      <SearchPanel projectId="test-project" open={true} onClose={onClose} />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

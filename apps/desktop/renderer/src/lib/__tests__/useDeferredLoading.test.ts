import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDeferredLoading } from "../useDeferredLoading";

describe("useDeferredLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false before threshold and true after", () => {
    const { result } = renderHook(() => useDeferredLoading(true, 200));

    // Before threshold
    expect(result.current).toBe(false);

    // After threshold
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(true);
  });

  it("returns false when not loading", () => {
    const { result } = renderHook(() => useDeferredLoading(false, 200));
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(false);
  });

  it("resets to false when loading becomes false", () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDeferredLoading(loading, 200),
      { initialProps: { loading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(true);

    rerender({ loading: false });
    expect(result.current).toBe(false);
  });
});

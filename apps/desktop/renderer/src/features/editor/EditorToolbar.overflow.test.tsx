import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useOverflowDetection } from "./useOverflowDetection";

/* ------------------------------------------------------------------ */
/* Mock ResizeObserver                                                 */
/* ------------------------------------------------------------------ */
type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

let resizeCallback: ResizeObserverCallback | null = null;

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    resizeCallback = null;
  }
}

/* ------------------------------------------------------------------ */
/* Helper component that uses the hook and exposes state via data attr */
/* ------------------------------------------------------------------ */
function OverflowHarness(props: {
  scrollWidth: number;
  clientWidth: number;
}): JSX.Element {
  const { containerRef, isOverflowing } = useOverflowDetection();

  return (
    <div
      ref={(el) => {
        // Monkey-patch the fake dimensions onto the element
        if (el) {
          Object.defineProperty(el, "scrollWidth", {
            get: () => props.scrollWidth,
            configurable: true,
          });
          Object.defineProperty(el, "clientWidth", {
            get: () => props.clientWidth,
            configurable: true,
          });
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      }}
      data-testid="overflow-container"
      data-overflowing={String(isOverflowing)}
    >
      content
    </div>
  );
}

describe("EditorToolbar overflow detection", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resizeCallback = null;
  });

  it("[ED-FE-ADV-S3] detects overflow when scrollWidth > clientWidth", () => {
    const { getByTestId } = render(
      <OverflowHarness scrollWidth={600} clientWidth={400} />,
    );

    // Trigger resize observer callback
    act(() => {
      resizeCallback?.([] as ResizeObserverEntry[]);
    });

    const container = getByTestId("overflow-container");
    expect(container.getAttribute("data-overflowing")).toBe("true");
  });

  it("[ED-FE-ADV-S3b] does not detect overflow when content fits", () => {
    const { getByTestId } = render(
      <OverflowHarness scrollWidth={300} clientWidth={400} />,
    );

    act(() => {
      resizeCallback?.([] as ResizeObserverEntry[]);
    });

    const container = getByTestId("overflow-container");
    expect(container.getAttribute("data-overflowing")).toBe("false");
  });

  it("[ED-FE-ADV-S3c] defaults to not overflowing when no ref", () => {
    // Render without the harness — use the hook directly with no element
    function BareHarness(): JSX.Element {
      const { isOverflowing } = useOverflowDetection();
      return <div data-testid="bare" data-overflowing={String(isOverflowing)} />;
    }
    const { getByTestId } = render(<BareHarness />);
    expect(getByTestId("bare").getAttribute("data-overflowing")).toBe("false");
  });
});

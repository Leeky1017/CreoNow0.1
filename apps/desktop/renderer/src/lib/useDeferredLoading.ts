import { useState, useEffect } from "react";

/**
 * Defers showing a loading indicator until after a threshold.
 *
 * Why: Prevents skeleton flash for sub-200ms loads. Loading indicators
 * should only appear when the wait is noticeable.
 *
 * @param isLoading - Whether data is currently loading
 * @param thresholdMs - Delay before showing loading state (default: 200ms)
 * @returns true when loading has exceeded the threshold
 */
export function useDeferredLoading(
  isLoading: boolean,
  thresholdMs = 200,
): boolean {
  const safeThreshold = Math.max(0, thresholdMs);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, safeThreshold);

    return () => clearTimeout(timer);
  }, [isLoading, thresholdMs]);

  return showLoading;
}

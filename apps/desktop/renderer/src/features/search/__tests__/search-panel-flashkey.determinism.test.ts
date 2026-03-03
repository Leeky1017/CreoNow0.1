/**
 * S3: SearchPanel flashKey determinism test
 *
 * Verifies that navigateSearchResult generates a deterministic flashKey
 * when a `now` value is provided in the args.
 *
 * Red: The `now` field on NavigateSearchResultArgs does not exist yet.
 *      The function uses Date.now() internally → flashKey contains a
 *      non-deterministic timestamp → assertion fails.
 */
import { describe, it, expect } from "vitest";

import { navigateSearchResult } from "../SearchPanel";

describe("navigateSearchResult — deterministic flashKey", () => {
  const fixedNow = 1_700_000_000_000;

  it("generates flashKey using injected now instead of Date.now()", async () => {
    let capturedKey: string | null = null;

    await navigateSearchResult({
      projectId: "p1",
      result: { documentId: "doc1", anchor: { start: 10, end: 20 } },
      setCurrent: async () => {},
      setFlashKey: (v) => {
        capturedKey = v;
      },
      setTimeoutFn: () => {},
      now: fixedNow,
    } as Parameters<typeof navigateSearchResult>[0]);

    expect(capturedKey).toBe(`doc1:10:20:${fixedNow}`);
  });

  it("produces the same flashKey across repeated calls with the same now", async () => {
    const keys: string[] = [];

    for (let i = 0; i < 3; i++) {
      await navigateSearchResult({
        projectId: "p1",
        result: { documentId: "doc1", anchor: { start: 10, end: 20 } },
        setCurrent: async () => {},
        setFlashKey: (v) => {
          if (v) keys.push(v);
        },
        setTimeoutFn: () => {},
        now: fixedNow,
      } as Parameters<typeof navigateSearchResult>[0]);
    }

    expect(keys[0]).toBe(keys[1]);
    expect(keys[1]).toBe(keys[2]);
  });
});

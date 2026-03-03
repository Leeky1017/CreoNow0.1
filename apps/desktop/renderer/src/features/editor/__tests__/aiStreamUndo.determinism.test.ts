/**
 * S6: aiStreamUndo checkpoint timestamp determinism test
 *
 * Verifies that buildAiStreamUndoCheckpoint accepts an optional `now`
 * parameter so that the checkpoint timestamp is deterministic in tests.
 *
 * Red: The `now` field is not in the args type and is ignored by the
 *      function → checkpoint.timestamp !== fixedNow → assertion fails.
 */
import { describe, it, expect } from "vitest";

import { buildAiStreamUndoCheckpoint } from "../aiStreamUndo";

describe("buildAiStreamUndoCheckpoint — deterministic timestamp", () => {
  const fixedNow = 1_700_000_000_000;

  it("uses injected now for checkpoint timestamp", () => {
    const cp = buildAiStreamUndoCheckpoint({
      preStreamContent: "hello world",
      docJson: { type: "doc", content: [] },
      cursorPos: 5,
      now: fixedNow,
    } as Parameters<typeof buildAiStreamUndoCheckpoint>[0]);

    expect(cp.timestamp).toBe(fixedNow);
  });

  it("produces identical timestamps across calls with same now", () => {
    const args = {
      preStreamContent: "test",
      docJson: { type: "doc" },
      cursorPos: 0,
      now: fixedNow,
    } as Parameters<typeof buildAiStreamUndoCheckpoint>[0];

    const cp1 = buildAiStreamUndoCheckpoint(args);
    const cp2 = buildAiStreamUndoCheckpoint(args);

    expect(cp1.timestamp).toBe(cp2.timestamp);
    expect(cp1.timestamp).toBe(fixedNow);
  });
});

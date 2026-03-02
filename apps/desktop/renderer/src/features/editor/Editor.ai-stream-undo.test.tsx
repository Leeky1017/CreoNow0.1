import { describe, it, expect } from "vitest";
import {
  buildAiStreamUndoCheckpoint,
  type AiStreamCheckpoint,
} from "./aiStreamUndo";

describe("AI stream atomic undo", () => {
  it("[ED-FE-ADV-S2] buildAiStreamUndoCheckpoint creates a checkpoint from pre-stream state", () => {
    const preStreamContent = "Hello world";
    const checkpoint = buildAiStreamUndoCheckpoint({
      preStreamContent,
      cursorPos: 11,
    });
    expect(checkpoint).toEqual({
      preStreamContent: "Hello world",
      cursorPos: 11,
      timestamp: expect.any(Number) as number,
    });
  });

  it("[ED-FE-ADV-S2b] checkpoint preserves empty document state", () => {
    const checkpoint = buildAiStreamUndoCheckpoint({
      preStreamContent: "",
      cursorPos: 0,
    });
    expect(checkpoint.preStreamContent).toBe("");
    expect(checkpoint.cursorPos).toBe(0);
  });

  it("[ED-FE-ADV-S2c] checkpoint includes monotonic timestamp", () => {
    const c1 = buildAiStreamUndoCheckpoint({
      preStreamContent: "a",
      cursorPos: 1,
    });
    const c2 = buildAiStreamUndoCheckpoint({
      preStreamContent: "b",
      cursorPos: 1,
    });
    expect(c2.timestamp).toBeGreaterThanOrEqual(c1.timestamp);
  });
});

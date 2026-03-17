import { describe, it, expect, vi } from "vitest";
import { buildAiStreamUndoCheckpoint, undoAiStream } from "./aiStreamUndo";
import type { UndoableEditor } from "./aiStreamUndo";

describe("AI stream atomic undo", () => {
  const sampleDocJson = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Hello world" }] },
    ],
  };

  it("[ED-FE-ADV-S2] buildAiStreamUndoCheckpoint creates a checkpoint from pre-stream state", () => {
    const preStreamContent = "Hello world";
    const checkpoint = buildAiStreamUndoCheckpoint({
      preStreamContent,
      docJson: sampleDocJson,
      cursorPos: 11,
    });
    expect(checkpoint).toEqual({
      preStreamContent: "Hello world",
      docJson: sampleDocJson,
      cursorPos: 11,
      timestamp: expect.any(Number) as number,
    });
  });

  it("[ED-FE-ADV-S2b] checkpoint preserves empty document state", () => {
    const emptyDocJson = { type: "doc", content: [] };
    const checkpoint = buildAiStreamUndoCheckpoint({
      preStreamContent: "",
      docJson: emptyDocJson,
      cursorPos: 0,
    });
    expect(checkpoint.preStreamContent).toBe("");
    expect(checkpoint.docJson).toEqual(emptyDocJson);
    expect(checkpoint.cursorPos).toBe(0);
  });

  it("[ED-FE-ADV-S2c] checkpoint includes monotonic timestamp", () => {
    const c1 = buildAiStreamUndoCheckpoint({
      preStreamContent: "a",
      docJson: sampleDocJson,
      cursorPos: 1,
    });
    const c2 = buildAiStreamUndoCheckpoint({
      preStreamContent: "b",
      docJson: sampleDocJson,
      cursorPos: 1,
    });
    expect(c2.timestamp).toBeGreaterThanOrEqual(c1.timestamp);
  });

  it("[ED-FE-ADV-S2d] undoAiStream restores document from checkpoint", () => {
    const mockEditor: UndoableEditor = {
      commands: {
        setContent: vi.fn().mockReturnValue(true),
        focus: vi.fn().mockReturnValue(true),
      },
    };
    const checkpoint = buildAiStreamUndoCheckpoint({
      preStreamContent: "Hello world",
      docJson: sampleDocJson,
      cursorPos: 11,
    });

    const result = undoAiStream(mockEditor, checkpoint);

    expect(result).toBe(true);
    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(sampleDocJson);
    expect(mockEditor.commands.focus).toHaveBeenCalledWith(11);
  });

  it("[ED-FE-ADV-S2e] undoAiStream returns false when no checkpoint", () => {
    const mockEditor: UndoableEditor = {
      commands: {
        setContent: vi.fn(),
        focus: vi.fn(),
      },
    };

    const result = undoAiStream(mockEditor, null);

    expect(result).toBe(false);
    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
  });
});

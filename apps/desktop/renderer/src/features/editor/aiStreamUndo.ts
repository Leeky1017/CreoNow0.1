/**
 * AI Stream Undo — checkpoint helper for atomic undo of streamed AI output.
 *
 * When an AI stream writes incrementally into the editor, each chunk
 * creates a separate history entry. This module provides helpers to
 * checkpoint the pre-stream state so that a single Ctrl+Z can revert
 * the entire streamed round.
 *
 * Usage:
 *   1. Before streaming starts → buildAiStreamUndoCheckpoint(...)
 *   2. During streaming → editor transactions use `addToHistory: false`
 *   3. After streaming ends → commit a single history entry
 */

export type AiStreamCheckpoint = {
  /** Editor text content before the AI stream began */
  preStreamContent: string;
  /** Cursor position before the stream */
  cursorPos: number;
  /** Monotonic timestamp (Date.now()) when the checkpoint was created */
  timestamp: number;
};

/**
 * Build a checkpoint that captures the pre-stream editor state.
 *
 * This checkpoint can later be used to restore the document if the
 * user triggers undo after a stream completes.
 */
export function buildAiStreamUndoCheckpoint(args: {
  preStreamContent: string;
  cursorPos: number;
}): AiStreamCheckpoint {
  return {
    preStreamContent: args.preStreamContent,
    cursorPos: args.cursorPos,
    timestamp: Date.now(),
  };
}

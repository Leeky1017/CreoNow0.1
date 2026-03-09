import { describe, expect, it } from "vitest";

import {
  createInlineAiStore,
  hashText,
  type InlineAiSelectionRef,
} from "../../../stores/inlineAiStore";

/**
 * Simulate the accept-time conflict detection logic.
 *
 * Why: When user clicks Accept, we need to verify the selection content
 * hasn't changed since the Inline AI session started. If the hash differs,
 * the accept is aborted to prevent overwriting concurrent edits.
 */
function checkConflict(
  selRef: InlineAiSelectionRef,
  currentText: string,
): boolean {
  return selRef.textHash !== hashText(currentText);
}

describe("Inline AI accept conflict detection", () => {
  it("should not detect conflict when selection text is unchanged", () => {
    const text = "原始选中文本";
    const selRef: InlineAiSelectionRef = {
      from: 0,
      to: text.length,
      text,
      textHash: hashText(text),
    };
    expect(checkConflict(selRef, text)).toBe(false);
  });

  it("should detect conflict when selection text has been modified", () => {
    const originalText = "原始选中文本";
    const selRef: InlineAiSelectionRef = {
      from: 0,
      to: originalText.length,
      text: originalText,
      textHash: hashText(originalText),
    };
    expect(checkConflict(selRef, "已被修改的文本")).toBe(true);
  });

  it("accept should reset store to idle", () => {
    const store = createInlineAiStore();
    const text = "test";
    const selRef = {
      from: 0,
      to: 4,
      text,
      textHash: hashText(text),
    };

    store.getState().openInlineAi(selRef);
    store.getState().submitInstruction("改写");
    store.getState().completeGeneration("结果");
    store.getState().acceptResult();

    expect(store.getState().state).toBe("idle");
    expect(store.getState().selectionRef).toBeNull();
    expect(store.getState().result).toBe("");
  });

  it("reject should reset store to idle and preserve no result", () => {
    const store = createInlineAiStore();
    const text = "test";
    const selRef = {
      from: 0,
      to: 4,
      text,
      textHash: hashText(text),
    };

    store.getState().openInlineAi(selRef);
    store.getState().submitInstruction("改写");
    store.getState().completeGeneration("结果");
    store.getState().rejectResult();

    expect(store.getState().state).toBe("idle");
    expect(store.getState().result).toBe("");
  });
});

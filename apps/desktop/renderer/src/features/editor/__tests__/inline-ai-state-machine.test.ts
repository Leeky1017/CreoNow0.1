import { describe, expect, it, beforeEach } from "vitest";

import { createInlineAiStore, hashText, type InlineAiStore } from "../../../stores/inlineAiStore";
import type { StoreApi } from "zustand";

describe("Inline AI State Machine", () => {
  let store: StoreApi<InlineAiStore>;

  const mockSelectionRef = {
    from: 10,
    to: 30,
    text: "selected text",
    textHash: hashText("selected text"),
  };

  beforeEach(() => {
    store = createInlineAiStore();
  });

  it("should start in idle state", () => {
    expect(store.getState().state).toBe("idle");
  });

  // idle → input
  it("idle → openInlineAi → input", () => {
    store.getState().openInlineAi(mockSelectionRef);
    expect(store.getState().state).toBe("input");
    expect(store.getState().selectionRef).toEqual(mockSelectionRef);
  });

  // input → streaming
  it("input → submitInstruction → streaming", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("润色这段文字");
    expect(store.getState().state).toBe("streaming");
    expect(store.getState().instruction).toBe("润色这段文字");
    expect(store.getState().executionId).toBeTruthy();
  });

  // input → idle (cancel via Escape)
  it("input → cancel → idle", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().cancel();
    expect(store.getState().state).toBe("idle");
    expect(store.getState().selectionRef).toBeNull();
  });

  // streaming → ready
  it("streaming → completeGeneration → ready", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("改写");
    store.getState().appendChunk("修改后");
    store.getState().appendChunk("的文字");
    store.getState().completeGeneration("修改后的文字");
    expect(store.getState().state).toBe("ready");
    expect(store.getState().result).toBe("修改后的文字");
  });

  // streaming → idle (error)
  it("streaming → failGeneration → idle with error", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("改写");
    store.getState().failGeneration("AI 执行失败");
    expect(store.getState().state).toBe("idle");
    expect(store.getState().error).toBe("AI 执行失败");
  });

  // streaming → idle (cancel/Escape)
  it("streaming → cancel → idle", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("改写");
    store.getState().cancel();
    expect(store.getState().state).toBe("idle");
  });

  // streaming chunks accumulate
  it("streaming chunks should accumulate result", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("改写");
    store.getState().appendChunk("第一");
    store.getState().appendChunk("第二");
    expect(store.getState().result).toBe("第一第二");
  });

  // ready → idle (accept)
  it("ready → acceptResult → idle", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("改写");
    store.getState().completeGeneration("结果");
    store.getState().acceptResult();
    expect(store.getState().state).toBe("idle");
  });

  // ready → idle (reject)
  it("ready → rejectResult → idle", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("改写");
    store.getState().completeGeneration("结果");
    store.getState().rejectResult();
    expect(store.getState().state).toBe("idle");
  });

  // ready → streaming (regenerate)
  it("ready → regenerate → streaming", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().submitInstruction("改写");
    store.getState().completeGeneration("结果");
    const prevExecId = store.getState().executionId;
    store.getState().regenerate();
    expect(store.getState().state).toBe("streaming");
    expect(store.getState().result).toBe("");
    expect(store.getState().executionId).not.toBe(prevExecId);
  });

  // Guard: cannot open when not idle
  it("should not transition from non-idle state on openInlineAi", () => {
    store.getState().openInlineAi(mockSelectionRef);
    expect(store.getState().state).toBe("input");
    store.getState().openInlineAi(mockSelectionRef);
    expect(store.getState().state).toBe("input"); // unchanged
  });

  // Guard: cannot submit when not in input state
  it("should not transition from idle on submitInstruction", () => {
    store.getState().submitInstruction("test");
    expect(store.getState().state).toBe("idle");
  });

  // Guard: cannot append chunks when not streaming
  it("should not append chunks when not streaming", () => {
    store.getState().appendChunk("test");
    expect(store.getState().result).toBe("");
  });

  // Guard: cannot regenerate when not ready
  it("should not regenerate when not ready", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().regenerate();
    expect(store.getState().state).toBe("input"); // unchanged
  });

  // Guard: cannot accept when not ready
  it("should not accept when not ready", () => {
    store.getState().openInlineAi(mockSelectionRef);
    store.getState().acceptResult();
    expect(store.getState().state).toBe("input"); // unchanged
  });
});

describe("hashText", () => {
  it("should produce consistent hashes for same input", () => {
    expect(hashText("hello world")).toBe(hashText("hello world"));
  });

  it("should produce different hashes for different inputs", () => {
    expect(hashText("hello")).not.toBe(hashText("world"));
  });
});

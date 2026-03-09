/**
 * Inline AI State Machine
 *
 * 状态流转：idle → input → streaming → ready → idle
 * 独立于 editorStore，避免耦合。
 */
import { create } from "zustand";

export type InlineAiState = "idle" | "input" | "streaming" | "ready";

export type InlineAiSelectionRef = {
  from: number;
  to: number;
  text: string;
  textHash: string;
};

export type InlineAiStoreState = {
  state: InlineAiState;
  instruction: string;
  selectionRef: InlineAiSelectionRef | null;
  result: string;
  executionId: string | null;
  error: string | null;
};

export type InlineAiStoreActions = {
  openInlineAi: (selectionRef: InlineAiSelectionRef) => void;
  submitInstruction: (instruction: string) => void;
  appendChunk: (chunk: string) => void;
  completeGeneration: (finalResult: string) => void;
  failGeneration: (error: string) => void;
  acceptResult: () => void;
  rejectResult: () => void;
  regenerate: () => void;
  cancel: () => void;
  reset: () => void;
};

export type InlineAiStore = InlineAiStoreState & InlineAiStoreActions;

const initialState: InlineAiStoreState = {
  state: "idle",
  instruction: "",
  selectionRef: null,
  result: "",
  executionId: null,
  error: null,
};

let executionCounter = 0;

export function createInlineAiStore() {
  return create<InlineAiStore>((set, get) => ({
    ...initialState,

    openInlineAi: (selectionRef) => {
      if (get().state !== "idle") return;
      set({
        state: "input",
        selectionRef,
        instruction: "",
        result: "",
        error: null,
        executionId: null,
      });
    },

    submitInstruction: (instruction) => {
      if (get().state !== "input") return;
      const executionId = `inline-ai-${++executionCounter}`;
      set({
        state: "streaming",
        instruction,
        result: "",
        executionId,
      });
    },

    appendChunk: (chunk) => {
      if (get().state !== "streaming") return;
      set((s) => ({ result: s.result + chunk }));
    },

    completeGeneration: (finalResult) => {
      if (get().state !== "streaming") return;
      set({ state: "ready", result: finalResult });
    },

    failGeneration: (error) => {
      if (get().state !== "streaming") return;
      set({ ...initialState, error });
    },

    acceptResult: () => {
      if (get().state !== "ready") return;
      set(initialState);
    },

    rejectResult: () => {
      const { state } = get();
      if (state !== "ready" && state !== "streaming") return;
      set(initialState);
    },

    regenerate: () => {
      const current = get();
      if (current.state !== "ready") return;
      const executionId = `inline-ai-${++executionCounter}`;
      set({
        state: "streaming",
        result: "",
        executionId,
      });
    },

    cancel: () => {
      const { state } = get();
      if (state === "idle") return;
      set(initialState);
    },

    reset: () => set(initialState),
  }));
}

/**
 * Simple hash for selection conflict detection.
 */
export function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash.toString(36);
}

import { create } from "zustand";

export type InlineAiPhase = "idle" | "input" | "streaming" | "ready";

export type SelectionRef = {
  from: number;
  to: number;
  text: string;
  selectionTextHash: string;
};

export type InlineAiState = {
  phase: InlineAiPhase;
  instruction: string | null;
  selectionRef: SelectionRef | null;
  result: string | null;
  executionId: string | null;
};

export type InlineAiActions = {
  openInput: (selectionRef: SelectionRef) => void;
  dismiss: () => void;
  submitInstruction: (instruction: string) => void;
  setStreaming: (executionId: string) => void;
  appendChunk: (chunk: string) => void;
  setReady: (result: string) => void;
  setError: () => void;
  accept: () => void;
  reject: () => void;
  regenerate: () => void;
};

export type InlineAiStore = InlineAiState & InlineAiActions;

const INITIAL_STATE: InlineAiState = {
  phase: "idle",
  instruction: null,
  selectionRef: null,
  result: null,
  executionId: null,
};

export function createInlineAiStore() {
  return create<InlineAiStore>((set) => ({
    ...INITIAL_STATE,

    openInput: (selectionRef) =>
      set({
        phase: "input",
        selectionRef,
        instruction: null,
        result: null,
        executionId: null,
      }),

    dismiss: () => set(INITIAL_STATE),

    submitInstruction: (instruction) =>
      set((state) => ({
        ...state,
        phase: "streaming",
        instruction,
        result: "",
      })),

    setStreaming: (executionId) => set({ executionId }),

    appendChunk: (chunk) =>
      set((state) => ({
        result: (state.result ?? "") + chunk,
      })),

    setReady: (result) => set({ phase: "ready", result }),

    setError: () => set(INITIAL_STATE),

    accept: () => set(INITIAL_STATE),

    reject: () => set(INITIAL_STATE),

    regenerate: () =>
      set((state) => ({
        ...state,
        phase: "streaming",
        result: "",
        executionId: null,
      })),
  }));
}

export type UseInlineAiStore = ReturnType<typeof createInlineAiStore>;

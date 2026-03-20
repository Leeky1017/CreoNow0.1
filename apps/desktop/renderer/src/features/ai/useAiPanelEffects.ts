import React from "react";
import type { Editor } from "@tiptap/react";
import type {
  AiApplyStatus,
  AiCandidate,
  AiProposal,
  AiStatus,
  SelectionRef,
} from "../../stores/aiStore";
import type { AiModel, AiModelOption } from "./ModelPicker";
import type { AiMode } from "./ModePicker";
import type { JudgeResultEvent } from "@shared/types/judge";
import type { IpcError } from "@shared/types/ipc-generated";
import { invoke } from "../../lib/ipcClient";
import { onAiModelCatalogUpdated } from "./modelCatalogEvents";
import { applySelection, captureSelectionRef } from "./applySelection";
import {
  createInlineDiffDecorations,
  type InlineDiffDecoration,
} from "../editor/extensions/inlineDiff";
import { JUDGE_RESULT_CHANNEL } from "@shared/types/judge";
import { runFireAndForget } from "../../lib/fireAndForget";
import { isContinueSkill } from "./aiPanelFormatting";
import type { ModelsListError } from "./aiPanelHelpers";

const RECENT_MODELS_STORAGE_KEY = "creonow.ai.recentModels";
const CANDIDATE_COUNT_STORAGE_KEY = "creonow.ai.candidateCount";

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function isRunning(status: AiStatus): boolean {
  return status === "running" || status === "streaming";
}

type UnknownRecord = Record<string, unknown>;

function isRecord(x: unknown): x is UnknownRecord {
  return typeof x === "object" && x !== null;
}

function isJudgeResultEvent(x: unknown): x is JudgeResultEvent {
  if (!isRecord(x)) return false;
  const severity = x.severity;
  if (severity !== "high" && severity !== "medium" && severity !== "low")
    return false;
  return (
    typeof x.projectId === "string" &&
    typeof x.traceId === "string" &&
    Array.isArray(x.labels) &&
    x.labels.every((label) => typeof label === "string") &&
    typeof x.summary === "string" &&
    typeof x.partialChecksSkipped === "boolean" &&
    typeof x.ts === "number"
  );
}

function updateInlineDiffDecorations(
  editor: Editor,
  diffs: InlineDiffDecoration[],
): void {
  const editorStorage = (editor as { storage?: unknown }).storage;
  if (!editorStorage || typeof editorStorage !== "object") return;
  const inlineDiffStorage = (editorStorage as UnknownRecord).inlineDiff as
    | UnknownRecord
    | undefined;
  if (!inlineDiffStorage || !Array.isArray(inlineDiffStorage.diffs)) return;
  inlineDiffStorage.diffs = diffs;
  editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));
}

// ---------------------------------------------------------------------------
// useAiPanelEffects
// ---------------------------------------------------------------------------

export type AiPanelEffectsDeps = {
  refreshSkills: () => Promise<void>;
  selectedModel: string;
  setModelsStatus: React.Dispatch<
    React.SetStateAction<"idle" | "loading" | "ready" | "error">
  >;
  setModelsLastError: React.Dispatch<
    React.SetStateAction<ModelsListError | null>
  >;
  setAvailableModels: React.Dispatch<React.SetStateAction<AiModelOption[]>>;
  setSelectedModel: React.Dispatch<React.SetStateAction<AiModel>>;
  setRecentModelIds: React.Dispatch<React.SetStateAction<string[]>>;
  setCandidateCount: React.Dispatch<React.SetStateAction<number>>;
  candidateCount: number;
  editor: Editor | null;
  bootstrapStatus: string;
  setSelectionSnapshot: (
    snapshot: { selectionRef: SelectionRef; selectionText: string } | null,
  ) => void;
  lastCandidates: AiCandidate[];
  selectedCandidateId: string | null;
  setSelectedCandidateId: (id: string | null) => void;
  status: AiStatus;
  proposal: AiProposal | null;
  activeRunId: string | null;
  activeOutputText: string;
  selectionRef: SelectionRef | null;
  selectionText: string;
  setProposal: (p: AiProposal | null) => void;
  setCompareMode: (enabled: boolean, versionId?: string | null) => void;
  pendingSelectionSnapshotRef: React.MutableRefObject<{
    selectionRef: SelectionRef;
    selectionText: string;
  } | null>;
  inlineDiffConfirmOpen: boolean;
  setInlineDiffConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lastRunId: string | null;
  projectId: string | null;
  outputText: string;
  lastRequest: string | null;
  evaluatedRunIdRef: React.MutableRefObject<string | null>;
  setJudgeResult: React.Dispatch<React.SetStateAction<JudgeResultEvent | null>>;
  handleNewChatRef: React.MutableRefObject<() => void>;
  lastHandledNewChatSignalRef: React.MutableRefObject<number>;
  newChatSignal: number | undefined;
  t: (key: string, args?: Record<string, unknown>) => string;
};

export function useAiPanelEffects(d: AiPanelEffectsDeps): void {
  const {
    activeOutputText,
    activeRunId,
    bootstrapStatus,
    candidateCount,
    editor,
    inlineDiffConfirmOpen,
    evaluatedRunIdRef,
    handleNewChatRef,
    lastCandidates,
    lastHandledNewChatSignalRef,
    lastRequest,
    lastRunId,
    newChatSignal,
    outputText,
    pendingSelectionSnapshotRef,
    projectId,
    proposal,
    refreshSkills,
    selectedCandidateId,
    selectedModel,
    selectionRef,
    selectionText,
    setAvailableModels,
    setCandidateCount,
    setCompareMode,
    setInlineDiffConfirmOpen,
    setJudgeResult,
    setModelsLastError,
    setModelsStatus,
    setProposal,
    setRecentModelIds,
    setSelectedCandidateId,
    setSelectedModel,
    setSelectionSnapshot,
    status,
    t,
  } = d;

  const refreshModels = React.useCallback(async () => {
    setModelsStatus("loading");
    setModelsLastError(null);
    try {
      const res = await invoke("ai:models:list", {});
      if (!res.ok) {
        setModelsStatus("error");
        setModelsLastError({
          code: res.error.code,
          message: res.error.message,
        });
        return;
      }
      setAvailableModels(res.data.items);
      setModelsStatus("ready");
      if (res.data.items.length === 0) return;
      const selectedExists = res.data.items.some(
        (item) => item.id === selectedModel,
      );
      if (!selectedExists) setSelectedModel(res.data.items[0].id);
    } catch (error) {
      const cause =
        error instanceof Error ? error.message : String(error ?? "unknown");
      setModelsStatus("error");
      setModelsLastError({ code: "INTERNAL", message: cause });
    }
  }, [
    selectedModel,
    setAvailableModels,
    setModelsLastError,
    setModelsStatus,
    setSelectedModel,
  ]);

  React.useEffect(() => {
    void refreshSkills();
    void refreshModels();
  }, [refreshModels, refreshSkills]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_MODELS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const items = parsed
        .filter((item): item is string => typeof item === "string")
        .slice(0, 8);
      setRecentModelIds(items);
    } catch (error) {
      console.error("AiPanel localStorage read failed", {
        operation: "read",
        key: RECENT_MODELS_STORAGE_KEY,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [setRecentModelIds]);

  React.useEffect(() => {
    if (selectedModel.trim().length === 0) return;
    setRecentModelIds((prev) => {
      const next = [
        selectedModel,
        ...prev.filter((id) => id !== selectedModel),
      ].slice(0, 8);
      try {
        window.localStorage.setItem(
          RECENT_MODELS_STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch (error) {
        console.error("AiPanel localStorage write failed", {
          operation: "write",
          key: RECENT_MODELS_STORAGE_KEY,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return next;
    });
  }, [selectedModel, setRecentModelIds]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CANDIDATE_COUNT_STORAGE_KEY);
      if (!raw) return;
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed)) return;
      if (parsed >= 1 && parsed <= 5) setCandidateCount(parsed);
    } catch (error) {
      console.error("AiPanel localStorage read failed", {
        operation: "read",
        key: CANDIDATE_COUNT_STORAGE_KEY,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [setCandidateCount]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        CANDIDATE_COUNT_STORAGE_KEY,
        String(candidateCount),
      );
    } catch (error) {
      console.error("AiPanel localStorage write failed", {
        operation: "write",
        key: CANDIDATE_COUNT_STORAGE_KEY,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [candidateCount]);

  React.useEffect(() => {
    return onAiModelCatalogUpdated(() => {
      void refreshModels();
    });
  }, [refreshModels]);

  React.useEffect(() => {
    if (!editor || bootstrapStatus !== "ready") return;
    const onSelectionUpdate = (): void => {
      const captured = captureSelectionRef(editor!);
      if (!captured.ok) return;
      const normalized = captured.data.selectionText.trim();
      if (normalized.length === 0) return;
      setSelectionSnapshot({
        selectionRef: captured.data.selectionRef,
        selectionText: normalized,
      });
    };
    editor.on("selectionUpdate", onSelectionUpdate);
    return () => {
      editor?.off("selectionUpdate", onSelectionUpdate);
    };
  }, [bootstrapStatus, editor, setSelectionSnapshot]);

  React.useEffect(() => {
    if (lastCandidates.length === 0) {
      if (selectedCandidateId !== null) setSelectedCandidateId(null);
      return;
    }
    const selectedExists = lastCandidates.some(
      (item) => item.id === selectedCandidateId,
    );
    if (!selectedExists) setSelectedCandidateId(lastCandidates[0]?.id ?? null);
  }, [lastCandidates, selectedCandidateId, setSelectedCandidateId]);

  React.useEffect(() => {
    if (status !== "idle") return;
    if (proposal || !activeRunId || activeOutputText.trim().length === 0)
      return;
    const effectiveSnapshot =
      selectionRef && selectionText.length > 0
        ? { selectionRef: selectionRef, selectionText: selectionText }
        : pendingSelectionSnapshotRef.current;
    if (!effectiveSnapshot || effectiveSnapshot.selectionText.length === 0)
      return;
    setProposal({
      runId: activeRunId,
      selectionRef: effectiveSnapshot.selectionRef,
      selectionText: effectiveSnapshot.selectionText,
      replacementText: activeOutputText,
    });
    pendingSelectionSnapshotRef.current = null;
    if (typeof setCompareMode === "function") setCompareMode(true, null);
  }, [
    activeOutputText,
    activeRunId,
    setCompareMode,
    proposal,
    selectionRef,
    selectionText,
    setProposal,
    status,
    pendingSelectionSnapshotRef,
  ]);

  React.useEffect(() => {
    if (!proposal) setInlineDiffConfirmOpen(false);
  }, [proposal, setInlineDiffConfirmOpen]);

  React.useEffect(() => {
    if (!inlineDiffConfirmOpen && editor)
      updateInlineDiffDecorations(editor, []);
  }, [inlineDiffConfirmOpen, editor]);

  React.useEffect(() => {
    function onJudgeResultEvent(evt: Event): void {
      const customEvent = evt as CustomEvent<unknown>;
      if (!isJudgeResultEvent(customEvent.detail)) return;
      const result = customEvent.detail;
      if (projectId && result.projectId !== projectId) return;
      if (lastRunId && result.traceId !== lastRunId) return;
      setJudgeResult(result);
    }
    window.addEventListener(JUDGE_RESULT_CHANNEL, onJudgeResultEvent);
    return () => {
      window.removeEventListener(JUDGE_RESULT_CHANNEL, onJudgeResultEvent);
    };
  }, [lastRunId, projectId, setJudgeResult]);

  React.useEffect(() => {
    if (status !== "idle") return;
    if (!projectId || !lastRunId || outputText.trim().length === 0) return;
    if (evaluatedRunIdRef.current === lastRunId) return;
    evaluatedRunIdRef.current = lastRunId;
    runFireAndForget(async () => {
      try {
        const res = await invoke("judge:quality:evaluate", {
          projectId: projectId!,
          traceId: lastRunId!,
          text: outputText,
          contextSummary: lastRequest ?? t("ai.contextSummary"),
        });
        if (res.ok) return;
        console.error("AiPanel judge evaluation failed", {
          projectId,
          traceId: lastRunId,
          code: res.error.code,
          message: res.error.message,
        });
      } catch (error) {
        console.error("AiPanel judge evaluation failed", {
          projectId,
          traceId: lastRunId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      if (evaluatedRunIdRef.current === lastRunId)
        evaluatedRunIdRef.current = null;
    });
  }, [
    lastRequest,
    lastRunId,
    outputText,
    projectId,
    status,
    t,
    evaluatedRunIdRef,
  ]);

  React.useEffect(() => {
    const signal = newChatSignal ?? 0;
    if (signal === lastHandledNewChatSignalRef.current) return;
    lastHandledNewChatSignalRef.current = signal;
    handleNewChatRef.current();
  }, [newChatSignal, lastHandledNewChatSignalRef, handleNewChatRef]);
}

// ---------------------------------------------------------------------------
// createAiPanelActions
// ---------------------------------------------------------------------------

export type AiPanelActionsDeps = {
  input: string;
  selectedSkillId: string;
  selectionRef: SelectionRef | null;
  selectionText: string;
  editor: Editor | null;
  bootstrapStatus: string;
  status: AiStatus;
  projectId: string | null;
  documentId: string | null;
  selectedMode: AiMode;
  selectedModel: AiModel;
  candidateCount: number;
  currentProject: { projectId: string } | null;
  proposal: AiProposal | null;
  inlineDiffConfirmOpen: boolean;
  applyStatus: AiApplyStatus;
  setInput: (v: string) => void;
  setSelectedSkillId: (id: string) => void;
  setSelectionSnapshot: (
    s: { selectionRef: SelectionRef; selectionText: string } | null,
  ) => void;
  setLastRequest: React.Dispatch<React.SetStateAction<string | null>>;
  setJudgeResult: React.Dispatch<React.SetStateAction<JudgeResultEvent | null>>;
  setProposal: (p: AiProposal | null) => void;
  setCompareMode: (enabled: boolean, versionId?: string | null) => void;
  setInlineDiffConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCandidateId: (id: string | null) => void;
  setError: (e: IpcError | null) => void;
  clearError: () => void;
  setSkillsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  run: (args?: {
    inputOverride?: string;
    context?: { projectId?: string; documentId?: string };
    mode?: AiMode;
    model?: AiModel;
    candidateCount?: number;
    streamOverride?: boolean;
  }) => Promise<void>;
  regenerateWithStrongNegative: (args?: {
    projectId?: string;
  }) => Promise<void>;
  refreshSkills: () => Promise<void>;
  persistAiApply: (args: {
    projectId: string;
    documentId: string;
    contentJson: string;
    runId: string;
  }) => Promise<void>;
  logAiApplyConflict: (args: {
    documentId: string;
    runId: string;
  }) => Promise<void>;
  clearEvaluatedRunId: () => void;
  setPendingSelectionSnapshot: (
    v: { selectionRef: SelectionRef; selectionText: string } | null,
  ) => void;
  focusTextarea: () => void;
  t: (key: string) => string;
};

export function createAiPanelActions(a: AiPanelActionsDeps) {
  async function onRun(args?: {
    inputOverride?: string;
    skillIdOverride?: string;
  }): Promise<void> {
    const effectiveSkillId = args?.skillIdOverride ?? a.selectedSkillId;
    const inputToSend = (args?.inputOverride ?? a.input).trim();
    const allowEmptyInput = isContinueSkill(effectiveSkillId);
    let selectionSnapshotForRun: {
      selectionRef: SelectionRef;
      selectionText: string;
    } | null =
      a.selectionRef && a.selectionText.trim().length > 0
        ? {
            selectionRef: a.selectionRef,
            selectionText: a.selectionText.trim(),
          }
        : null;
    let selectionContextText = selectionSnapshotForRun?.selectionText ?? "";
    if (!selectionContextText && a.editor && a.bootstrapStatus === "ready") {
      const captured = captureSelectionRef(a.editor);
      if (captured.ok) {
        const normalized = captured.data.selectionText.trim();
        if (normalized.length > 0) {
          selectionContextText = normalized;
          selectionSnapshotForRun = {
            selectionRef: captured.data.selectionRef,
            selectionText: normalized,
          };
          a.setSelectionSnapshot({
            selectionRef: captured.data.selectionRef,
            selectionText: normalized,
          });
        }
      }
    }
    const composedInput =
      selectionContextText.length > 0
        ? `Selection context:\n${selectionContextText}\n\n${inputToSend}`.trim()
        : inputToSend;
    if (!allowEmptyInput && composedInput.length === 0) return;
    a.setLastRequest(inputToSend);
    a.setJudgeResult(null);
    a.clearEvaluatedRunId();
    if (typeof a.setCompareMode === "function") a.setCompareMode(false);
    a.setProposal(null);
    a.setInlineDiffConfirmOpen(false);
    a.setSelectedCandidateId(null);
    a.setError(null);
    a.setPendingSelectionSnapshot(selectionSnapshotForRun);
    try {
      await a.run({
        inputOverride: composedInput,
        context: {
          projectId: a.currentProject?.projectId ?? a.projectId ?? undefined,
          documentId: a.documentId ?? undefined,
        },
        mode: a.selectedMode,
        model: a.selectedModel,
        candidateCount: a.candidateCount,
        streamOverride: a.candidateCount > 1 ? false : undefined,
      });
    } finally {
      a.setSelectionSnapshot(null);
    }
  }

  function onReject(): void {
    a.setPendingSelectionSnapshot(null);
    if (typeof a.setCompareMode === "function") a.setCompareMode(false);
    a.setProposal(null);
    a.setInlineDiffConfirmOpen(false);
    a.setSelectionSnapshot(null);
  }

  function onSelectCandidate(candidateId: string): void {
    a.setSelectedCandidateId(candidateId);
    a.setProposal(null);
    a.setInlineDiffConfirmOpen(false);
  }

  async function onRegenerateAll(): Promise<void> {
    a.setProposal(null);
    a.setInlineDiffConfirmOpen(false);
    a.setSelectedCandidateId(null);
    a.setJudgeResult(null);
    a.clearEvaluatedRunId();
    await a.regenerateWithStrongNegative({
      projectId: a.currentProject?.projectId ?? a.projectId ?? undefined,
    });
  }

  async function handleSkillSelect(skillId: string): Promise<void> {
    a.setSelectedSkillId(skillId);
    a.setSkillsOpen(false);
    if (isRunning(a.status)) return;
    let inputOverride = a.input;
    if (isContinueSkill(skillId)) {
      inputOverride = "";
    } else if (a.editor) {
      const captured = captureSelectionRef(a.editor);
      if (captured.ok) inputOverride = captured.data.selectionText;
    }
    await onRun({ skillIdOverride: skillId, inputOverride });
  }

  async function handleSkillToggle(args: {
    skillId: string;
    enabled: boolean;
  }): Promise<void> {
    const toggled = await invoke("skill:registry:toggle", {
      skillId: args.skillId,
      enabled: args.enabled,
    });
    if (!toggled.ok) {
      a.setError(toggled.error);
      return;
    }
    await a.refreshSkills();
  }

  async function handleSkillScopeUpdate(args: {
    id: string;
    scope: "global" | "project";
  }): Promise<void> {
    const updated = await invoke("skill:custom:update", {
      id: args.id,
      scope: args.scope,
    });
    if (!updated.ok) {
      a.setError(updated.error);
      return;
    }
    await a.refreshSkills();
  }

  async function onApply(): Promise<void> {
    if (!a.editor || !a.proposal || !a.projectId || !a.documentId) return;
    if (!a.inlineDiffConfirmOpen) {
      a.setInlineDiffConfirmOpen(true);
      if (a.editor) {
        const diffs = createInlineDiffDecorations({
          originalText: a.proposal.selectionText,
          suggestedText: a.proposal.replacementText,
        });
        updateInlineDiffDecorations(a.editor, diffs);
      }
      return;
    }
    const applied = applySelection({
      editor: a.editor,
      selectionRef: a.proposal.selectionRef,
      replacementText: a.proposal.replacementText,
    });
    if (!applied.ok) {
      a.setError(applied.error);
      if (applied.error.code === "CONFLICT")
        void a.logAiApplyConflict({
          documentId: a.documentId,
          runId: a.proposal.runId,
        });
      return;
    }
    const json = JSON.stringify(a.editor.getJSON());
    await a.persistAiApply({
      projectId: a.projectId,
      documentId: a.documentId,
      contentJson: json,
      runId: a.proposal.runId,
    });
    if (a.editor) updateInlineDiffDecorations(a.editor, []);
    a.setInlineDiffConfirmOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const allowEmptyInput = isContinueSkill(a.selectedSkillId);
      if (!isRunning(a.status) && (allowEmptyInput || a.input.trim()))
        void onRun();
    }
  }

  function handleNewChat(): void {
    a.setLastRequest(null);
    a.setJudgeResult(null);
    a.clearEvaluatedRunId();
    a.setInput("");
    if (typeof a.setCompareMode === "function") a.setCompareMode(false);
    a.setPendingSelectionSnapshot(null);
    a.setProposal(null);
    a.setInlineDiffConfirmOpen(false);
    a.setSelectionSnapshot(null);
    a.setError(null);
    a.focusTextarea();
  }

  return {
    onRun,
    onReject,
    onSelectCandidate,
    onRegenerateAll,
    handleSkillSelect,
    handleSkillToggle,
    handleSkillScopeUpdate,
    onApply,
    handleKeyDown,
    handleNewChat,
  };
}

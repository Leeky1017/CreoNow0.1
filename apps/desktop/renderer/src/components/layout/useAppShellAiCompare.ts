import React from "react";

import { useAiStore, type AiProposal } from "../../stores/aiStore";
import { useEditorStore } from "../../stores/editorStore";
import { useProjectStore } from "../../stores/projectStore";
import { applySelection } from "../../features/ai/applySelection";
import {
  applyHunkDecisions,
  computeDiffHunks,
  unifiedDiff,
  type DiffHunkDecision,
} from "../../lib/diff/unifiedDiff";

export type AppShellAiCompareResult = {
  aiProposal: AiProposal | null;
  aiDiffText: string;
  aiHunks: ReturnType<typeof computeDiffHunks>;
  aiHunkDecisions: DiffHunkDecision[];
  setAiHunkDecisions: React.Dispatch<React.SetStateAction<DiffHunkDecision[]>>;
  handleRejectAiSuggestion: () => void;
  handleAcceptAiSuggestion: () => Promise<void>;
};

export function useAppShellAiCompare(): AppShellAiCompareResult {
  const aiProposal = useAiStore((s) => s.proposal);
  const setAiProposal = useAiStore((s) => s.setProposal);
  const setAiSelectionSnapshot = useAiStore((s) => s.setSelectionSnapshot);
  const persistAiApply = useAiStore((s) => s.persistAiApply);
  const setAiError = useAiStore((s) => s.setError);
  const logAiApplyConflict = useAiStore((s) => s.logAiApplyConflict);
  const editor = useEditorStore((s) => s.editor);
  const documentId = useEditorStore((s) => s.documentId);
  const setCompareMode = useEditorStore((s) => s.setCompareMode);
  const compareMode = useEditorStore((s) => s.compareMode);
  const compareVersionId = useEditorStore((s) => s.compareVersionId);
  const currentProjectId = useProjectStore((s) => s.current)?.projectId ?? null;

  const lastMountedEditorRef = React.useRef<typeof editor>(null);
  const [aiHunkDecisions, setAiHunkDecisions] = React.useState<
    DiffHunkDecision[]
  >([]);

  const aiDiffText = React.useMemo(() => {
    if (!aiProposal) return "";
    return unifiedDiff({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
    });
  }, [aiProposal]);

  const aiHunks = React.useMemo(() => {
    if (!aiProposal) return [];
    return computeDiffHunks({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
    });
  }, [aiProposal]);

  React.useEffect(() => {
    if (editor) lastMountedEditorRef.current = editor;
  }, [editor]);

  React.useEffect(() => {
    if (!compareMode || compareVersionId) {
      if (aiHunkDecisions.length > 0) setAiHunkDecisions([]);
      return;
    }
    if (!aiProposal) {
      setCompareMode(false);
      return;
    }
    setAiHunkDecisions((prev) =>
      prev.length === aiHunks.length
        ? prev
        : Array.from({ length: aiHunks.length }, () => "pending" as const),
    );
  }, [
    aiHunkDecisions.length,
    aiHunks.length,
    aiProposal,
    compareMode,
    compareVersionId,
    setCompareMode,
  ]);

  const handleRejectAiSuggestion = React.useCallback(() => {
    setAiProposal(null);
    setAiSelectionSnapshot(null);
    setAiHunkDecisions([]);
    setCompareMode(false);
  }, [setAiProposal, setAiSelectionSnapshot, setCompareMode]);

  const handleAcceptAiSuggestion = React.useCallback(async () => {
    const effectiveEditor = editor ?? lastMountedEditorRef.current;
    if (!effectiveEditor || !documentId || !currentProjectId || !aiProposal)
      return;

    const normalizedDecisions = aiHunks.map((_, idx) => {
      const decision = aiHunkDecisions[idx] ?? "pending";
      return decision === "rejected" ? "rejected" : "accepted";
    });
    const replacementText = applyHunkDecisions({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
      decisions: normalizedDecisions,
    });

    const applied = applySelection({
      editor: effectiveEditor,
      selectionRef: aiProposal.selectionRef,
      replacementText,
    });
    if (!applied.ok) {
      setAiError(applied.error);
      if (applied.error.code === "CONFLICT") {
        await logAiApplyConflict({ documentId, runId: aiProposal.runId });
      }
      return;
    }

    await persistAiApply({
      projectId: currentProjectId,
      documentId,
      contentJson: JSON.stringify(effectiveEditor.getJSON()),
      runId: aiProposal.runId,
    });
    setCompareMode(false);
    setAiHunkDecisions([]);
  }, [
    aiHunkDecisions,
    aiHunks,
    aiProposal,
    currentProjectId,
    documentId,
    editor,
    logAiApplyConflict,
    persistAiApply,
    setAiError,
    setCompareMode,
  ]);

  return {
    aiProposal,
    aiDiffText,
    aiHunks,
    aiHunkDecisions,
    setAiHunkDecisions,
    handleRejectAiSuggestion,
    handleAcceptAiSuggestion,
  };
}

import { useAiStore } from "../../stores/aiStore";
import { useEditorStore } from "../../stores/editorStore";
import { useProjectStore } from "../../stores/projectStore";

export function useAiPanelSelectors() {
  const status = useAiStore((s) => s.status);
  const selectedSkillId = useAiStore((s) => s.selectedSkillId);
  const skills = useAiStore((s) => s.skills);
  const skillsStatus = useAiStore((s) => s.skillsStatus);
  const skillsLastError = useAiStore((s) => s.skillsLastError);
  const input = useAiStore((s) => s.input);
  const outputText = useAiStore((s) => s.outputText);
  const lastRunId = useAiStore((s) => s.lastRunId);
  const lastCandidates = useAiStore((s) => s.lastCandidates);
  const usageStats = useAiStore((s) => s.usageStats);
  const queuePosition = useAiStore((s) => s.queuePosition);
  const queuedCount = useAiStore((s) => s.queuedCount);
  const activeChatSessionId = useAiStore((s) => s.activeChatSessionId);
  const activeChatMessages = useAiStore((s) => s.activeChatMessages);
  const selectedCandidateId = useAiStore((s) => s.selectedCandidateId);
  const lastError = useAiStore((s) => s.lastError);
  const selectionRef = useAiStore((s) => s.selectionRef);
  const selectionText = useAiStore((s) => s.selectionText);
  const proposal = useAiStore((s) => s.proposal);
  const applyStatus = useAiStore((s) => s.applyStatus);
  const setInput = useAiStore((s) => s.setInput);
  const setSelectedSkillId = useAiStore((s) => s.setSelectedSkillId);
  const refreshSkills = useAiStore((s) => s.refreshSkills);
  const clearError = useAiStore((s) => s.clearError);
  const setError = useAiStore((s) => s.setError);
  const setSelectionSnapshot = useAiStore((s) => s.setSelectionSnapshot);
  const setProposal = useAiStore((s) => s.setProposal);
  const setSelectedCandidateId = useAiStore((s) => s.setSelectedCandidateId);
  const persistAiApply = useAiStore((s) => s.persistAiApply);
  const logAiApplyConflict = useAiStore((s) => s.logAiApplyConflict);
  const run = useAiStore((s) => s.run);
  const regenerateWithStrongNegative = useAiStore(
    (s) => s.regenerateWithStrongNegative,
  );
  const cancel = useAiStore((s) => s.cancel);
  const selectChatSession = useAiStore((s) => s.selectChatSession);
  const editor = useEditorStore((s) => s.editor);
  const bootstrapStatus = useEditorStore((s) => s.bootstrapStatus);
  const compareMode = useEditorStore((s) => s.compareMode);
  const setCompareMode = useEditorStore((s) => s.setCompareMode);
  const projectId = useEditorStore((s) => s.projectId);
  const documentId = useEditorStore((s) => s.documentId);
  const currentProject = useProjectStore((s) => s.current);

  return {
    status,
    selectedSkillId,
    skills,
    skillsStatus,
    skillsLastError,
    input,
    outputText,
    lastRunId,
    lastCandidates,
    usageStats,
    queuePosition,
    queuedCount,
    activeChatSessionId,
    activeChatMessages,
    selectedCandidateId,
    lastError,
    selectionRef,
    selectionText,
    proposal,
    applyStatus,
    setInput,
    setSelectedSkillId,
    refreshSkills,
    clearError,
    setError,
    setSelectionSnapshot,
    setProposal,
    setSelectedCandidateId,
    persistAiApply,
    logAiApplyConflict,
    run,
    regenerateWithStrongNegative,
    cancel,
    selectChatSession,
    editor,
    bootstrapStatus,
    compareMode,
    setCompareMode,
    projectId,
    documentId,
    currentProject,
  };
}

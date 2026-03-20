import React from "react";
import { useTranslation } from "react-i18next";
import type { JudgeResultEvent } from "@shared/types/judge";
import { PanelContainer } from "../../components/composites/PanelContainer";
import { useOpenSettings } from "../../contexts/OpenSettingsContext";
import { useAiStore, type SelectionRef } from "../../stores/aiStore";
import { useEditorStore } from "../../stores/editorStore";
import { useProjectStore } from "../../stores/projectStore";
import { unifiedDiff } from "../../lib/diff/unifiedDiff";
import type { AiMode } from "./ModePicker";
import type { AiModel, AiModelOption } from "./ModelPicker";
import { useAiStream } from "./useAiStream";
import { formatSelectionPreview } from "./aiPanelFormatting";
import { buildAiErrorConfigs, type ModelsListError } from "./aiPanelHelpers";
import {
  useAiPanelEffects,
  createAiPanelActions,
  isRunning,
} from "./useAiPanelEffects";
import { AiMessageList } from "./AiMessageList";
import { AiInputArea } from "./AiInputArea";
export { formatDbErrorDescription } from "./aiPanelHelpers";
export { CodeBlock } from "./CodeBlock";

export function AiPanel(props: { newChatSignal?: number } = {}): JSX.Element {
  useAiStream();
  const { t } = useTranslation();
  const openSettings = useOpenSettings();
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
  const editor = useEditorStore((s) => s.editor);
  const bootstrapStatus = useEditorStore((s) => s.bootstrapStatus);
  const compareMode = useEditorStore((s) => s.compareMode);
  const setCompareMode = useEditorStore((s) => s.setCompareMode);
  const projectId = useEditorStore((s) => s.projectId);
  const documentId = useEditorStore((s) => s.documentId);
  const currentProject = useProjectStore((s) => s.current);
  const [skillsOpen, setSkillsOpen] = React.useState(false);
  const [skillManagerOpen, setSkillManagerOpen] = React.useState(false);
  const [modeOpen, setModeOpen] = React.useState(false);
  const [modelOpen, setModelOpen] = React.useState(false);
  const [selectedMode, setSelectedMode] = React.useState<AiMode>("ask");
  const [selectedModel, setSelectedModel] = React.useState<AiModel>("gpt-5.2");
  const [candidateCount, setCandidateCount] = React.useState(1);
  const [recentModelIds, setRecentModelIds] = React.useState<string[]>([]);
  const [availableModels, setAvailableModels] = React.useState<AiModelOption[]>(
    [],
  );
  const [modelsStatus, setModelsStatus] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [modelsLastError, setModelsLastError] =
    React.useState<ModelsListError | null>(null);
  const [lastRequest, setLastRequest] = React.useState<string | null>(null);
  const [inlineDiffConfirmOpen, setInlineDiffConfirmOpen] =
    React.useState(false);
  const [judgeResult, setJudgeResult] = React.useState<JudgeResultEvent | null>(
    null,
  );
  const evaluatedRunIdRef = React.useRef<string | null>(null);
  const pendingSelectionSnapshotRef = React.useRef<{
    selectionRef: SelectionRef;
    selectionText: string;
  } | null>(null);
  const selectedCandidate =
    lastCandidates.find((item) => item.id === selectedCandidateId) ??
    lastCandidates[0] ??
    null;
  const activeOutputText = selectedCandidate?.text ?? outputText;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const lastHandledNewChatSignalRef = React.useRef(props.newChatSignal ?? 0);
  const handleNewChatRef = React.useRef<() => void>(() => {});
  const focusTextarea = React.useCallback(() => {
    textareaRef.current?.focus();
  }, []);
  const clearEvaluatedRunId = React.useCallback(() => {
    evaluatedRunIdRef.current = null;
  }, []);
  const setPendingSelectionSnapshot = React.useCallback(
    (v: { selectionRef: SelectionRef; selectionText: string } | null) => {
      pendingSelectionSnapshotRef.current = v;
    },
    [],
  );
  useAiPanelEffects({
    refreshSkills,
    selectedModel,
    setModelsStatus,
    setModelsLastError,
    setAvailableModels,
    setSelectedModel,
    setRecentModelIds,
    setCandidateCount,
    candidateCount,
    editor,
    bootstrapStatus,
    setSelectionSnapshot,
    lastCandidates,
    selectedCandidateId,
    setSelectedCandidateId,
    status,
    proposal,
    activeRunId: selectedCandidate?.runId ?? lastRunId,
    activeOutputText,
    selectionRef,
    selectionText,
    setProposal,
    setCompareMode,
    pendingSelectionSnapshotRef,
    inlineDiffConfirmOpen,
    setInlineDiffConfirmOpen,
    lastRunId,
    projectId,
    outputText,
    lastRequest,
    evaluatedRunIdRef,
    setJudgeResult,
    handleNewChatRef,
    lastHandledNewChatSignalRef,
    newChatSignal: props.newChatSignal,
    t,
  });
  // eslint-disable-next-line react-hooks/refs -- ref-taint false positive; callbacks only invoked from event handlers
  const actions = createAiPanelActions({
    input,
    selectedSkillId,
    selectionRef,
    selectionText,
    editor,
    bootstrapStatus,
    status,
    projectId,
    documentId,
    selectedMode,
    selectedModel,
    candidateCount,
    currentProject,
    proposal,
    inlineDiffConfirmOpen,
    applyStatus,
    setInput,
    setSelectedSkillId,
    setSelectionSnapshot,
    setLastRequest,
    setJudgeResult,
    setProposal,
    setCompareMode,
    setInlineDiffConfirmOpen,
    setSelectedCandidateId,
    setError,
    clearError,
    setSkillsOpen,
    run,
    regenerateWithStrongNegative,
    refreshSkills,
    persistAiApply,
    logAiApplyConflict,
    clearEvaluatedRunId,
    setPendingSelectionSnapshot,
    focusTextarea,
    t,
  });
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/refs
    handleNewChatRef.current = actions.handleNewChat;
  }, [actions.handleNewChat]);
  const working = isRunning(status);
  const hasSelectionReference =
    !!selectionRef && selectionText.trim().length > 0;
  const selectionPreview = hasSelectionReference
    ? formatSelectionPreview(selectionText.trim())
    : "";
  const errorConfigs = buildAiErrorConfigs({
    skillsLastError,
    modelsLastError,
    lastError,
    t,
  });
  const diffText = proposal
    ? unifiedDiff({
        oldText: proposal.selectionText,
        newText: proposal.replacementText,
      })
    : "";
  const canApply =
    !!editor &&
    !!proposal &&
    !!projectId &&
    !!documentId &&
    applyStatus !== "applying";
  return (
    <PanelContainer data-testid="ai-panel" title="AI">
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <AiMessageList
            historyMessages={activeChatSessionId ? activeChatMessages : []}
            lastRequest={lastRequest}
            working={working}
            status={status}
            queuePosition={queuePosition}
            queuedCount={queuedCount}
            errorConfigs={errorConfigs}
            lastCandidates={lastCandidates}
            selectedCandidate={selectedCandidate}
            activeOutputText={activeOutputText}
            judgeResult={judgeResult}
            usageStats={usageStats}
            applyStatus={applyStatus}
            proposal={proposal}
            compareMode={compareMode}
            diffText={diffText}
            canApply={canApply}
            inlineDiffConfirmOpen={inlineDiffConfirmOpen}
            clearError={clearError}
            openSettings={openSettings}
            onSelectCandidate={actions.onSelectCandidate}
            onRegenerateAll={() => void actions.onRegenerateAll()}
            onApply={() => void actions.onApply()}
            onReject={actions.onReject}
            setInlineDiffConfirmOpen={setInlineDiffConfirmOpen}
          />
          <AiInputArea
            ref={textareaRef}
            hasSelectionReference={hasSelectionReference}
            selectionPreview={selectionPreview}
            setSelectionSnapshot={() => setSelectionSnapshot(null)}
            input={input}
            setInput={setInput}
            handleKeyDown={actions.handleKeyDown}
            working={working}
            onRun={() => void actions.onRun()}
            cancel={cancel}
            modeOpen={modeOpen}
            modelOpen={modelOpen}
            skillsOpen={skillsOpen}
            setModeOpen={setModeOpen}
            setModelOpen={setModelOpen}
            setSkillsOpen={setSkillsOpen}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            modelsStatus={modelsStatus}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            skillsStatus={skillsStatus}
            availableModels={availableModels}
            recentModelIds={recentModelIds}
            selectedSkillId={selectedSkillId}
            skills={skills}
            handleSkillSelect={(skillId) =>
              void actions.handleSkillSelect(skillId)
            }
            handleSkillToggle={(args) => void actions.handleSkillToggle(args)}
            handleSkillScopeUpdate={(args) =>
              void actions.handleSkillScopeUpdate(args)
            }
            openSettings={openSettings}
            skillManagerOpen={skillManagerOpen}
            setSkillManagerOpen={setSkillManagerOpen}
            currentProject={currentProject}
            projectId={projectId}
            refreshSkills={refreshSkills}
          />
        </div>
      </div>
    </PanelContainer>
  );
}

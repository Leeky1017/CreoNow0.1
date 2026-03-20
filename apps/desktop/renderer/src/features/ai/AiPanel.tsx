import React from "react";
import { useTranslation } from "react-i18next";
import type { JudgeResultEvent } from "@shared/types/judge";
import { PanelContainer } from "../../components/composites/PanelContainer";
import { useOpenSettings } from "../../contexts/OpenSettingsContext";
import type { SelectionRef } from "../../stores/aiStore";
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
import { AiPanelTabBar } from "./AiPanelTabBar";
import { AiChatSessionList } from "./AiChatSessionList";
import { useAiPanelSelectors } from "./useAiPanelSelectors";
export { formatDbErrorDescription } from "./aiPanelHelpers";
export { CodeBlock } from "./CodeBlock";

export function AiPanel(props: { newChatSignal?: number } = {}): JSX.Element {
  useAiStream();
  const { t } = useTranslation();
  const openSettings = useOpenSettings();
  const sel = useAiPanelSelectors();
  const [activeTab, setActiveTab] = React.useState<"chat" | "history">("chat");
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
    sel.lastCandidates.find((item) => item.id === sel.selectedCandidateId) ??
    sel.lastCandidates[0] ??
    null;
  const activeOutputText = selectedCandidate?.text ?? sel.outputText;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const lastHandledNewChatSignalRef = React.useRef(props.newChatSignal ?? 0);
  const handleNewChatRef = React.useRef<() => void>(() => {});
  const focusTextarea = React.useCallback(() => {
    textareaRef.current?.focus();
  }, []);
  const handleSelectSession = React.useCallback(
    (sessionId: string) => {
      if (sel.projectId) {
        void sel.selectChatSession({
          projectId: sel.projectId,
          sessionId,
        });
        setActiveTab("chat");
      }
    },
    [sel.selectChatSession, sel.projectId],
  );
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
    refreshSkills: sel.refreshSkills,
    selectedModel,
    setModelsStatus,
    setModelsLastError,
    setAvailableModels,
    setSelectedModel,
    setRecentModelIds,
    setCandidateCount,
    candidateCount,
    editor: sel.editor,
    bootstrapStatus: sel.bootstrapStatus,
    setSelectionSnapshot: sel.setSelectionSnapshot,
    lastCandidates: sel.lastCandidates,
    selectedCandidateId: sel.selectedCandidateId,
    setSelectedCandidateId: sel.setSelectedCandidateId,
    status: sel.status,
    proposal: sel.proposal,
    activeRunId: selectedCandidate?.runId ?? sel.lastRunId,
    activeOutputText,
    selectionRef: sel.selectionRef,
    selectionText: sel.selectionText,
    setProposal: sel.setProposal,
    setCompareMode: sel.setCompareMode,
    pendingSelectionSnapshotRef,
    inlineDiffConfirmOpen,
    setInlineDiffConfirmOpen,
    lastRunId: sel.lastRunId,
    projectId: sel.projectId,
    outputText: sel.outputText,
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
    input: sel.input,
    selectedSkillId: sel.selectedSkillId,
    selectionRef: sel.selectionRef,
    selectionText: sel.selectionText,
    editor: sel.editor,
    bootstrapStatus: sel.bootstrapStatus,
    status: sel.status,
    projectId: sel.projectId,
    documentId: sel.documentId,
    selectedMode,
    selectedModel,
    candidateCount,
    currentProject: sel.currentProject,
    proposal: sel.proposal,
    inlineDiffConfirmOpen,
    applyStatus: sel.applyStatus,
    setInput: sel.setInput,
    setSelectedSkillId: sel.setSelectedSkillId,
    setSelectionSnapshot: sel.setSelectionSnapshot,
    setLastRequest,
    setJudgeResult,
    setProposal: sel.setProposal,
    setCompareMode: sel.setCompareMode,
    setInlineDiffConfirmOpen,
    setSelectedCandidateId: sel.setSelectedCandidateId,
    setError: sel.setError,
    clearError: sel.clearError,
    setSkillsOpen,
    run: sel.run,
    regenerateWithStrongNegative: sel.regenerateWithStrongNegative,
    refreshSkills: sel.refreshSkills,
    persistAiApply: sel.persistAiApply,
    logAiApplyConflict: sel.logAiApplyConflict,
    clearEvaluatedRunId,
    setPendingSelectionSnapshot,
    focusTextarea,
    t,
  });
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/refs
    handleNewChatRef.current = actions.handleNewChat;
  }, [actions.handleNewChat]);
  const working = isRunning(sel.status);
  const hasSelectionReference =
    !!sel.selectionRef && sel.selectionText.trim().length > 0;
  const selectionPreview = hasSelectionReference
    ? formatSelectionPreview(sel.selectionText.trim())
    : "";
  const errorConfigs = buildAiErrorConfigs({
    skillsLastError: sel.skillsLastError,
    modelsLastError,
    lastError: sel.lastError,
    t,
  });
  const diffText = sel.proposal
    ? unifiedDiff({
        oldText: sel.proposal.selectionText,
        newText: sel.proposal.replacementText,
      })
    : "";
  const canApply =
    !!sel.editor &&
    !!sel.proposal &&
    !!sel.projectId &&
    !!sel.documentId &&
    sel.applyStatus !== "applying";
  return (
    <PanelContainer data-testid="ai-panel" title="AI">
      <div className="flex flex-col h-full min-h-0">
        <AiPanelTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <AiMessageList
              historyMessages={
                sel.activeChatSessionId ? sel.activeChatMessages : []
              }
              lastRequest={lastRequest}
              working={working}
              status={sel.status}
              queuePosition={sel.queuePosition}
              queuedCount={sel.queuedCount}
              errorConfigs={errorConfigs}
              lastCandidates={sel.lastCandidates}
              selectedCandidate={selectedCandidate}
              activeOutputText={activeOutputText}
              judgeResult={judgeResult}
              usageStats={sel.usageStats}
              applyStatus={sel.applyStatus}
              proposal={sel.proposal}
              compareMode={sel.compareMode}
              diffText={diffText}
              canApply={canApply}
              inlineDiffConfirmOpen={inlineDiffConfirmOpen}
              clearError={sel.clearError}
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
              setSelectionSnapshot={() => sel.setSelectionSnapshot(null)}
              input={sel.input}
              setInput={sel.setInput}
              handleKeyDown={actions.handleKeyDown}
              working={working}
              onRun={() => void actions.onRun()}
              cancel={sel.cancel}
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
              skillsStatus={sel.skillsStatus}
              availableModels={availableModels}
              recentModelIds={recentModelIds}
              selectedSkillId={sel.selectedSkillId}
              skills={sel.skills}
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
              currentProject={sel.currentProject}
              projectId={sel.projectId}
              refreshSkills={sel.refreshSkills}
            />
          </div>
        ) : (
          <AiChatSessionList
            projectId={sel.projectId ?? ""}
            onSelectSession={handleSelectSession}
          />
        )}
      </div>
    </PanelContainer>
  );
}

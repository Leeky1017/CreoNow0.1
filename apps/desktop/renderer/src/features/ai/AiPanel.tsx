import React from "react";
import { useTranslation } from "react-i18next";
import type { Editor } from "@tiptap/react";
import type { IpcError, IpcErrorCode } from "@shared/types/ipc-generated";
import type { SettingsTab } from "../settings-dialog/SettingsDialog";

import {
  AiErrorCard,
  type AiErrorConfig,
} from "../../components/features/AiDialogs";

import { Button, Spinner, Text } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { PanelContainer } from "../../components/composites/PanelContainer";

import { useOpenSettings } from "../../contexts/OpenSettingsContext";

import {
  useAiStore,
  type AiApplyStatus,
  type AiCandidate,
  type ChatMessageItem,
  type AiProposal,
  type AiStatus,
  type AiUsageStats,
  type SelectionRef,
  type SkillListItem,
} from "../../stores/aiStore";

import { useEditorStore } from "../../stores/editorStore";

import { useProjectStore } from "../../stores/projectStore";

import { unifiedDiff } from "../../lib/diff/unifiedDiff";

import { runFireAndForget } from "../../lib/fireAndForget";
import { invoke } from "../../lib/ipcClient";

import { DiffView } from "../diff/DiffView";

import { applySelection, captureSelectionRef } from "./applySelection";
import {
  createInlineDiffDecorations,
  type InlineDiffDecoration,
} from "../editor/extensions/inlineDiff";

import { SkillPicker } from "./SkillPicker";
import { SkillManagerDialog } from "./SkillManagerDialog";

import { ModePicker, getModeName, type AiMode } from "./ModePicker";

import {
  ModelPicker,
  getModelName,
  type AiModel,
  type AiModelOption,
} from "./ModelPicker";
import { useAiStream } from "./useAiStream";
import { onAiModelCatalogUpdated } from "./modelCatalogEvents";
import {
  JUDGE_RESULT_CHANNEL,
  type JudgeResultEvent,
} from "@shared/types/judge";
import {
  formatSelectionPreview,
  formatTokenValue,
  formatUsd,
  isContinueSkill,
  judgeSeverityClass,
} from "./aiPanelFormatting";

import { ArrowUp } from "lucide-react";
import { getHumanErrorMessage } from "../../lib/errorMessages";
const RECENT_MODELS_STORAGE_KEY = "creonow.ai.recentModels";
const CANDIDATE_COUNT_STORAGE_KEY = "creonow.ai.candidateCount";
const DB_REBUILD_DEFAULT_COMMAND = "pnpm -C apps/desktop rebuild:native";

type ModelsListError = {
  code: string;
  message: string;
};

/**

 * Check if a given status represents an in-flight run.

 */

function isRunning(status: AiStatus): boolean {
  return status === "running" || status === "streaming";
}

function updateInlineDiffDecorations(
  editor: Editor,
  diffs: InlineDiffDecoration[],
): void {
  const editorStorage = (editor as { storage?: unknown }).storage;
  if (!editorStorage || typeof editorStorage !== "object") return;
  const inlineDiffStorage = (editorStorage as UnknownRecord)
    .inlineDiff as UnknownRecord | undefined;
  if (!inlineDiffStorage || !Array.isArray(inlineDiffStorage.diffs)) return;
  inlineDiffStorage.diffs = diffs;
  editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));
}

type UnknownRecord = Record<string, unknown>;

/**
 * Narrow unknown values to plain records.
 */
function isRecord(x: unknown): x is UnknownRecord {
  return typeof x === "object" && x !== null;
}

/**
 * Runtime validation for judge result push events.
 *
 * Why: renderer must ignore malformed push payloads safely.
 */
function isJudgeResultEvent(x: unknown): x is JudgeResultEvent {
  if (!isRecord(x)) {
    return false;
  }

  const severity = x.severity;
  if (severity !== "high" && severity !== "medium" && severity !== "low") {
    return false;
  }

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

type DbErrorDetails = {
  category?: string;
  remediation?: {
    command?: string;
    restartRequired?: boolean;
  };
};

/**
 * Build actionable DB remediation text for AI panel errors.
 *
 * Why: users need a concrete recovery command when native DB bindings fail.
 */
export function formatDbErrorDescription(args: {
  message: string;
  details?: unknown;
}): string {
  const raw = args.details;
  if (!raw || typeof raw !== "object") {
    return args.message;
  }

  const details = raw as DbErrorDetails;
  const command = details.remediation?.command?.trim();
  if (!command) {
    return args.message;
  }

  const restartSuffix = details.remediation?.restartRequired
    ? " Then restart the app."
    : "";
  return `${args.message}\nFix: run \`${command}\`.${restartSuffix}`;
}

/**
 * Resolve remediation command for DB native-binding failures.
 *
 * Why: guide card must always offer an executable recovery command.
 */
function resolveDbRemediationCommand(details?: unknown): string {
  const raw = details;
  if (!raw || typeof raw !== "object") {
    return DB_REBUILD_DEFAULT_COMMAND;
  }
  const command = (raw as DbErrorDetails).remediation?.command?.trim();
  return command && command.length > 0 ? command : DB_REBUILD_DEFAULT_COMMAND;
}

function isProviderConfigErrorCode(code: string): boolean {
  return code === "AI_NOT_CONFIGURED";
}

/**

 * SendStopButton - Combined send/stop button

 *

 * - Idle: Arrow up icon (send)

 * - Working: Circle with square icon (stop)

 */

function SendStopButton(props: {
  isWorking: boolean;

  disabled?: boolean;

  onSend: () => void;

  onStop: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <Tooltip
      content={
        props.isWorking
          ? t("ai.panel.stopGenerating")
          : t("ai.panel.sendMessage")
      }
    >
      <button
        data-testid="ai-send-stop"
        type="button"
        className="focus-ring w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={props.isWorking ? props.onStop : props.onSend}
        disabled={props.disabled}
      >
        {props.isWorking ? (
          // Stop icon: circle with square

          <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
            <div className="w-2 h-2 bg-current rounded-[1px]" />
          </div>
        ) : (
          // Send icon: arrow up

          <ArrowUp size={16} strokeWidth={1.5} />
        )}
      </button>
    </Tooltip>
  );
}

/**
 * ToolButton - Small button for input toolbar

 */

function ToolButton(props: {
  children: React.ReactNode;
  active?: boolean;
  testId?: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <button
      data-testid={props.testId}
      type="button"
      className={`
        focus-ring px-1.5 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)]
        transition-colors cursor-pointer
        ${
          props.active
            ? "text-[var(--color-fg-default)] bg-[var(--color-bg-selected)]"
            : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
        }
      `}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function ErrorGuideCard(props: {
  testId: string;
  title: string;
  description: string;
  steps: string[];
  errorCode: string;
  command?: string;
  actionLabel?: string;
  actionTestId?: string;
  onAction?: () => void;
}): JSX.Element {
  const [copied, setCopied] = React.useState(false);

  async function handleCopyCommand(): Promise<void> {
    if (!props.command || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(props.command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const { t } = useTranslation();

  return (
    <section
      data-testid={props.testId}
      className="w-full rounded-[var(--radius-md)] bg-[var(--color-error-subtle)]"
    >
      <div className="flex">
        <div className="w-1.5 rounded-l-[var(--radius-md)] bg-[var(--color-error)]" />
        <div className="flex-1 px-3 py-2.5">
          <h4 className="text-[13px] font-semibold text-[var(--color-fg-default)]">
            {props.title}
          </h4>
          <p className="mt-1 text-[12px] leading-snug text-[var(--color-fg-muted)] whitespace-pre-wrap">
            {props.description}
          </p>
          <ol className="mt-2 list-decimal pl-4 space-y-1 text-[12px] leading-snug text-[var(--color-fg-default)]">
            {props.steps.map((step, index) => (
              <li key={`${props.testId}-step-${index}`}>{step}</li>
            ))}
          </ol>
          {props.command ? (
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] px-2 py-1 text-[11px] text-[var(--color-fg-default)]">
                {props.command}
              </code>
              <button
                type="button"
                data-testid={`${props.testId}-copy-command`}
                className="focus-ring text-[11px] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                onClick={() => void handleCopyCommand()}
              >
                {copied ? t("ai.panel.copied") : t("ai.panel.copy")}
              </button>
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            {props.onAction && props.actionLabel ? (
              <button
                type="button"
                data-testid={props.actionTestId}
                className="focus-ring text-[11px] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                onClick={props.onAction}
              >
                {props.actionLabel}
              </button>
            ) : null}
            <span className="text-[10px] font-mono text-[var(--color-error)]">
              {props.errorCode}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**

 * CodeBlock - Renders a code block with Copy and Apply buttons

 * Exported for use in AI response rendering

 */

export function CodeBlock(props: {
  language?: string;

  code: string;

  onCopy?: () => void;

  onApply?: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  function handleCopy(): void {
    void navigator.clipboard.writeText(props.code);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);

    props.onCopy?.();
  }

  return (
    <div className="my-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-base)]">
      {/* Header */}

      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-raised)] border-b border-[var(--color-separator)]">
        <span className="text-[11px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          {props.language || "code"}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="focus-ring px-2 py-0.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
          >
            {copied ? t("ai.panel.copied") : t("ai.panel.copy")}
          </button>

          {props.onApply && (
            <button
              type="button"
              onClick={props.onApply}
              className="focus-ring px-2 py-0.5 text-[11px] text-[var(--color-fg-accent)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
            >
              {t("ai.panel.applyCode")}
            </button>
          )}
        </div>
      </div>

      {/* Code content */}

      <pre className="m-0 p-3 overflow-x-auto text-[12px] leading-[1.6] text-[var(--color-fg-default)] font-[var(--font-family-mono)]">
        <code>{props.code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Extracted helpers & sub-components
// ---------------------------------------------------------------------------

type ErrorLike = { code: string; message: string; details?: unknown };

type AiErrorConfigs = {
  skillsErrorConfig: AiErrorConfig | null;
  modelsErrorConfig: AiErrorConfig | null;
  runtimeErrorConfig: AiErrorConfig | null;
  dbGuideError: ErrorLike | null;
  dbGuideCommand: string;
  showDbGuide: boolean;
  providerGuideCode: string | null;
  showProviderGuide: boolean;
  shouldRenderGenericErrors: boolean;
};

function buildAiErrorConfigs(args: {
  skillsLastError: ErrorLike | null;
  modelsLastError: ModelsListError | null;
  lastError: ErrorLike | null;
  t: (key: string) => string;
}): AiErrorConfigs {
  const { skillsLastError, modelsLastError, lastError, t } = args;

  const skillsErrorConfig: AiErrorConfig | null = skillsLastError
    ? {
        type: "service_error",
        title: t("ai.panel.skillsUnavailable"),
        description: skillsLastError.message,
        errorCode: skillsLastError.code,
      }
    : null;

  const modelsErrorConfig: AiErrorConfig | null = modelsLastError
    ? {
        type: "service_error",
        title: t("ai.panel.modelsUnavailable"),
        description: getHumanErrorMessage(
          modelsLastError as { code: IpcErrorCode; message: string },
        ),
        errorCode: modelsLastError.code,
      }
    : null;

  const runtimeErrorConfig: AiErrorConfig | null = lastError
    ? {
        type:
          lastError.code === "TIMEOUT" || lastError.code === "SKILL_TIMEOUT"
            ? "timeout"
            : lastError.code === "RATE_LIMITED" ||
                lastError.code === "AI_RATE_LIMITED"
              ? "rate_limit"
              : "service_error",
        title:
          lastError.code === "TIMEOUT" || lastError.code === "SKILL_TIMEOUT"
            ? t("ai.panel.timeout")
            : lastError.code === "RATE_LIMITED" ||
                lastError.code === "AI_RATE_LIMITED"
              ? t("ai.panel.rateLimited")
              : t("ai.panel.aiError"),
        description: lastError.message,
        errorCode: lastError.code,
      }
    : null;

  const dbGuideError =
    skillsLastError?.code === "DB_ERROR"
      ? skillsLastError
      : lastError?.code === "DB_ERROR"
        ? lastError
        : null;
  const dbGuideCommand = resolveDbRemediationCommand(dbGuideError?.details);
  const showDbGuide = dbGuideError !== null;

  const providerGuideCode =
    lastError && isProviderConfigErrorCode(lastError.code)
      ? lastError.code
      : modelsLastError && isProviderConfigErrorCode(modelsLastError.code)
        ? modelsLastError.code
        : skillsLastError && isProviderConfigErrorCode(skillsLastError.code)
          ? skillsLastError.code
          : null;
  const showProviderGuide = !showDbGuide && providerGuideCode !== null;
  const shouldRenderGenericErrors = !showDbGuide && !showProviderGuide;

  return {
    skillsErrorConfig,
    modelsErrorConfig,
    runtimeErrorConfig,
    dbGuideError,
    dbGuideCommand,
    showDbGuide,
    providerGuideCode,
    showProviderGuide,
    shouldRenderGenericErrors,
  };
}

// ---------------------------------------------------------------------------
// useAiPanelEffects — all side-effects extracted from AiPanel
// ---------------------------------------------------------------------------

type AiPanelEffectsDeps = {
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

function useAiPanelEffects(d: AiPanelEffectsDeps): void {
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
    if (!inlineDiffConfirmOpen && editor) updateInlineDiffDecorations(editor, []);
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
// createAiPanelActions — handler functions extracted from AiPanel
// ---------------------------------------------------------------------------

type AiPanelActionsDeps = {
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

function createAiPanelActions(a: AiPanelActionsDeps) {
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

// ---------------------------------------------------------------------------
// AiPanelChatArea — scrollable content area
// ---------------------------------------------------------------------------

type AiPanelChatAreaProps = {
  historyMessages: ChatMessageItem[];
  lastRequest: string | null;
  working: boolean;
  status: AiStatus;
  queuePosition: number | null;
  queuedCount: number;
  errorConfigs: AiErrorConfigs;
  lastCandidates: AiCandidate[];
  selectedCandidate: AiCandidate | null;
  activeOutputText: string;
  judgeResult: JudgeResultEvent | null;
  usageStats: AiUsageStats | null;
  applyStatus: AiApplyStatus;
  proposal: AiProposal | null;
  compareMode: boolean;
  diffText: string;
  canApply: boolean;
  inlineDiffConfirmOpen: boolean;
  clearError: () => void;
  openSettings: (section?: SettingsTab) => void;
  onSelectCandidate: (id: string) => void;
  onRegenerateAll: () => void;
  onApply: () => void;
  onReject: () => void;
  setInlineDiffConfirmOpen: (open: boolean) => void;
};

function AiPanelErrorDisplay(props: {
  errorConfigs: AiErrorConfigs;
  clearError: () => void;
  openSettings: (section?: SettingsTab) => void;
}): JSX.Element | null {
  const { t } = useTranslation();
  const ec = props.errorConfigs;

  if (ec.showDbGuide) {
    return (
      <ErrorGuideCard
        testId="ai-error-guide-db"
        title={t("ai.panel.dbErrorTitle")}
        description={ec.dbGuideError?.message ?? t("ai.panel.dbErrorFallback")}
        steps={[t("ai.panel.dbStep1"), t("ai.panel.dbStep2")]}
        command={ec.dbGuideCommand}
        errorCode="DB_ERROR"
      />
    );
  }

  if (ec.showProviderGuide) {
    return (
      <ErrorGuideCard
        testId="ai-error-guide-provider"
        title={t("ai.panel.providerTitle")}
        description={t("ai.panel.providerDescription")}
        steps={[
          t("ai.panel.providerStep1"),
          t("ai.panel.providerStep2"),
          t("ai.panel.providerStep3"),
        ]}
        errorCode={ec.providerGuideCode ?? "AI_NOT_CONFIGURED"}
        actionLabel={t("ai.panel.openSettingsAi")}
        actionTestId="ai-error-guide-open-settings"
        onAction={() => props.openSettings("ai")}
      />
    );
  }

  return (
    <>
      {ec.skillsErrorConfig ? (
        <AiErrorCard error={ec.skillsErrorConfig} showDismiss={false} />
      ) : null}
      {ec.modelsErrorConfig ? (
        <AiErrorCard error={ec.modelsErrorConfig} showDismiss={false} />
      ) : null}
      {ec.runtimeErrorConfig ? (
        <AiErrorCard
          error={ec.runtimeErrorConfig}
          errorCodeTestId="ai-error-code"
          onDismiss={props.clearError}
        />
      ) : null}
    </>
  );
}

function AiPanelProposalArea(props: {
  proposal: AiProposal;
  compareMode: boolean;
  diffText: string;
  canApply: boolean;
  inlineDiffConfirmOpen: boolean;
  applyStatus: AiApplyStatus;
  onApply: () => void;
  onReject: () => void;
  setInlineDiffConfirmOpen: (open: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      {!props.compareMode ? (
        <DiffView diffText={props.diffText} testId="ai-panel-diff" />
      ) : null}
      <div className="flex gap-2">
        <Button
          data-testid="ai-apply"
          variant="secondary"
          size="md"
          onClick={() => void props.onApply()}
          disabled={!props.canApply}
          className="flex-1"
        >
          {props.inlineDiffConfirmOpen
            ? t("ai.panel.applyArmed")
            : t("ai.panel.apply")}
        </Button>
        {props.inlineDiffConfirmOpen ? (
          <Button
            data-testid="ai-apply-confirm"
            variant="secondary"
            size="md"
            onClick={() => void props.onApply()}
            disabled={!props.canApply}
            className="flex-1"
          >
            {t("ai.panel.confirmApply")}
          </Button>
        ) : null}
        <Button
          data-testid="ai-reject"
          variant="ghost"
          size="md"
          onClick={
            props.inlineDiffConfirmOpen
              ? () => props.setInlineDiffConfirmOpen(false)
              : props.onReject
          }
          disabled={props.applyStatus === "applying"}
        >
          {props.inlineDiffConfirmOpen
            ? t("ai.panel.backToDiff")
            : t("ai.panel.reject")}
        </Button>
      </div>
    </>
  );
}

function AiPanelChatArea(props: AiPanelChatAreaProps): JSX.Element {
  const { t } = useTranslation();
  const hasHistoryReplay = props.historyMessages.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {hasHistoryReplay ? (
        <div data-testid="ai-history-replay-list" className="w-full space-y-2">
          {props.historyMessages.map((message) => (
            <div
              key={message.messageId}
              data-testid={`ai-history-message-${message.role}`}
              className={`w-full rounded-[var(--radius-md)] p-3 text-[13px] whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-[var(--color-bg-base)] text-[var(--color-fg-default)]"
                  : "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
      ) : null}

      {!hasHistoryReplay && props.lastRequest ? (
        <div className="w-full p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
          <div className="text-[13px] text-[var(--color-fg-default)] whitespace-pre-wrap">
            {props.lastRequest}
          </div>
        </div>
      ) : null}

      {props.working && (
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
          <Spinner size="sm" />
          <span>
            {props.status === "streaming"
              ? t("ai.panel.generating")
              : t("ai.panel.thinking")}
          </span>
          {typeof props.queuePosition === "number" &&
          props.queuePosition > 0 ? (
            <span data-testid="ai-queue-status">
              {t("ai.panel.queueStatus", {
                position: props.queuePosition,
                count: props.queuedCount,
              })}
            </span>
          ) : null}
        </div>
      )}

      <AiPanelErrorDisplay
        errorConfigs={props.errorConfigs}
        clearError={props.clearError}
        openSettings={props.openSettings}
      />

      {props.lastCandidates.length > 0 ? (
        <div
          data-testid="ai-candidate-list"
          className="w-full grid grid-cols-1 gap-2"
        >
          {props.lastCandidates.map((candidate, index) => {
            const isSelected = props.selectedCandidate?.id === candidate.id;
            return (
              <button
                key={candidate.id}
                data-testid={`ai-candidate-card-${index + 1}`}
                type="button"
                onClick={() => props.onSelectCandidate(candidate.id)}
                className={`focus-ring w-full text-left rounded-[var(--radius-md)] border px-3 py-2 transition-colors ${
                  isSelected
                    ? "border-[var(--color-accent)] bg-[var(--color-bg-selected)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-[var(--color-fg-default)]">
                    {t("ai.candidate", { index: index + 1 })}
                  </span>
                  {isSelected ? (
                    <span className="text-[11px] text-[var(--color-fg-accent)]">
                      {t("ai.candidateSelected")}
                    </span>
                  ) : null}
                </div>
                <Text
                  size="small"
                  color="muted"
                  className="mt-1 whitespace-pre-wrap"
                >
                  {candidate.summary}
                </Text>
              </button>
            );
          })}
        </div>
      ) : null}

      {props.lastCandidates.length > 1 ? (
        <div className="w-full flex justify-end">
          <Button
            data-testid="ai-candidate-regenerate"
            variant="ghost"
            size="sm"
            onClick={() => void props.onRegenerateAll()}
            disabled={props.working}
          >
            {t("ai.regenerateAll")}
          </Button>
        </div>
      ) : null}

      {!hasHistoryReplay && props.activeOutputText ? (
        <div
          data-testid="ai-output"
          className="w-full"
          aria-live="polite"
          aria-atomic="false"
        >
          <div className="text-[13px] leading-relaxed text-[var(--color-fg-default)] whitespace-pre-wrap">
            {props.activeOutputText}
            {props.status === "streaming" && <span className="typing-cursor" />}
          </div>
        </div>
      ) : !hasHistoryReplay ? (
        !props.lastRequest &&
        !props.working && (
          <div
            data-testid="ai-output"
            aria-live="polite"
            aria-atomic="false"
            className="flex-1 flex items-center justify-center text-center py-12"
          >
            <Text size="small" color="muted">
              {t("ai.emptyHint")}
            </Text>
          </div>
        )
      ) : null}

      {props.judgeResult ? (
        <div
          data-testid="ai-judge-result"
          className="w-full rounded-[var(--radius-md)] bg-[var(--color-bg-base)] px-3 py-2 space-y-1"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              data-testid="ai-judge-severity"
              className={`text-[11px] font-semibold uppercase tracking-wide ${judgeSeverityClass(props.judgeResult.severity)}`}
            >
              {props.judgeResult.severity}
            </span>
            {props.judgeResult.labels.length === 0 ? (
              <span
                data-testid="ai-judge-pass"
                className="text-[12px] text-[var(--color-fg-default)]"
              >
                {t("ai.judgePass")}
              </span>
            ) : (
              props.judgeResult.labels.map((label) => (
                <span
                  key={label}
                  className="text-[12px] text-[var(--color-fg-default)]"
                >
                  {label}
                </span>
              ))
            )}
          </div>
          <Text data-testid="ai-judge-summary" size="small" color="muted">
            {props.judgeResult.summary}
          </Text>
          {props.judgeResult.partialChecksSkipped ? (
            <Text data-testid="ai-judge-partial" size="small" color="muted">
              {t("ai.judgePartialSkipped")}
            </Text>
          ) : null}
        </div>
      ) : null}

      {props.usageStats ? (
        <div
          data-testid="ai-usage-stats"
          className="w-full rounded-[var(--radius-md)] bg-[var(--color-bg-base)] px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
            <span>
              {t("ai.panel.usagePrompt")}{" "}
              <span data-testid="ai-usage-prompt-tokens">
                {formatTokenValue(props.usageStats.promptTokens)}
              </span>
            </span>
            <span>
              {t("ai.usageOutput")}{" "}
              <span data-testid="ai-usage-completion-tokens">
                {formatTokenValue(props.usageStats.completionTokens)}
              </span>
            </span>
            <span>
              {t("ai.usageSessionTotal")}{" "}
              <span data-testid="ai-usage-session-total-tokens">
                {formatTokenValue(props.usageStats.sessionTotalTokens)}
              </span>
            </span>
            {typeof props.usageStats.estimatedCostUsd === "number" ? (
              <span>
                {t("ai.usageCostEstimate")}{" "}
                <span data-testid="ai-usage-estimated-cost">
                  {formatUsd(props.usageStats.estimatedCostUsd)}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {props.applyStatus === "applied" && (
        <Text data-testid="ai-apply-status" size="small" color="muted">
          {t("ai.appliedSaved")}
        </Text>
      )}

      {props.proposal && (
        <AiPanelProposalArea
          proposal={props.proposal}
          compareMode={props.compareMode}
          diffText={props.diffText}
          canApply={props.canApply}
          inlineDiffConfirmOpen={props.inlineDiffConfirmOpen}
          applyStatus={props.applyStatus}
          onApply={props.onApply}
          onReject={props.onReject}
          setInlineDiffConfirmOpen={props.setInlineDiffConfirmOpen}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AiPanelInputArea — fixed input section at the bottom
// ---------------------------------------------------------------------------

type AiPanelInputAreaProps = {
  hasSelectionReference: boolean;
  selectionPreview: string;
  setSelectionSnapshot: (s: null) => void;
  input: string;
  setInput: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  working: boolean;
  onRun: () => void;
  cancel: () => Promise<void>;
  modeOpen: boolean;
  modelOpen: boolean;
  skillsOpen: boolean;
  setModeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setModelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSkillsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMode: AiMode;
  setSelectedMode: (mode: AiMode) => void;
  modelsStatus: string;
  selectedModel: AiModel;
  setSelectedModel: (model: AiModel) => void;
  skillsStatus: string;
  availableModels: AiModelOption[];
  recentModelIds: string[];
  selectedSkillId: string;
  skills: SkillListItem[];
  handleSkillSelect: (skillId: string) => void;
  handleSkillToggle: (args: { skillId: string; enabled: boolean }) => void;
  handleSkillScopeUpdate: (args: {
    id: string;
    scope: "global" | "project";
  }) => void;
  openSettings: (section?: SettingsTab) => void;
  skillManagerOpen: boolean;
  setSkillManagerOpen: (open: boolean) => void;
  currentProject: { projectId: string } | null;
  projectId: string | null;
  refreshSkills: () => Promise<void>;
};

const AiPanelInputArea = React.forwardRef<
  HTMLTextAreaElement,
  AiPanelInputAreaProps
>(function AiPanelInputArea(props, ref) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 px-1.5 pb-1.5 pt-2 border-t border-[var(--color-separator)]">
      <div className="relative border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)] focus-within:border-[var(--color-border-focus)]">
        {props.hasSelectionReference ? (
          <div
            data-testid="ai-selection-reference-card"
            className="mx-2 mt-2 mb-1 rounded-[var(--radius-sm)] bg-[var(--color-bg-raised)] px-2 py-1.5"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-fg-muted)]">
                  {t("ai.panel.selectionFromEditor")}
                </div>
                <div
                  data-testid="ai-selection-reference-preview"
                  className="text-[12px] text-[var(--color-fg-default)] whitespace-pre-wrap break-words"
                >
                  {props.selectionPreview}
                </div>
              </div>
              <Tooltip content={t("ai.panel.dismissSelection")}>
                <button
                  type="button"
                  data-testid="ai-selection-reference-close"
                  className="focus-ring h-5 w-5 shrink-0 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                  onClick={() => props.setSelectionSnapshot(null)}
                >
                  ×
                </button>
              </Tooltip>
            </div>
          </div>
        ) : null}
        <textarea
          ref={ref}
          data-testid="ai-input"
          value={props.input}
          onChange={(e) => props.setInput(e.target.value)}
          onKeyDown={props.handleKeyDown}
          placeholder={t("ai.panel.inputPlaceholder")}
          className="w-full min-h-[60px] max-h-[160px] px-3 py-2 bg-transparent border-none resize-none text-[13px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <ToolButton
              active={props.modeOpen}
              onClick={() => {
                props.setModeOpen((v) => !v);
                props.setModelOpen(false);
                props.setSkillsOpen(false);
              }}
            >
              {getModeName(props.selectedMode, t)}
            </ToolButton>
            <ToolButton
              active={props.modelOpen}
              onClick={() => {
                props.setModelOpen((v) => !v);
                props.setModeOpen(false);
                props.setSkillsOpen(false);
              }}
            >
              {props.modelsStatus === "loading"
                ? t("ai.panel.loading")
                : getModelName(props.selectedModel, props.availableModels)}
            </ToolButton>
            <ToolButton
              active={props.skillsOpen}
              testId="ai-skills-toggle"
              onClick={() => {
                props.setSkillsOpen((v) => !v);
                props.setModeOpen(false);
                props.setModelOpen(false);
              }}
            >
              {props.skillsStatus === "loading"
                ? t("ai.panel.loading")
                : t("ai.panel.skill")}
            </ToolButton>
          </div>
          <SendStopButton
            isWorking={props.working}
            disabled={!props.working && !props.input.trim()}
            onSend={() => void props.onRun()}
            onStop={() => void props.cancel()}
          />
        </div>
        <ModePicker
          open={props.modeOpen}
          selectedMode={props.selectedMode}
          onOpenChange={props.setModeOpen}
          onSelectMode={(mode) => {
            props.setSelectedMode(mode);
            props.setModeOpen(false);
          }}
        />
        <ModelPicker
          open={props.modelOpen}
          models={props.availableModels}
          recentModelIds={props.recentModelIds}
          selectedModel={props.selectedModel}
          onOpenChange={props.setModelOpen}
          onSelectModel={(model) => {
            props.setSelectedModel(model);
            props.setModelOpen(false);
          }}
        />
        <SkillPicker
          open={props.skillsOpen}
          items={props.skills}
          selectedSkillId={props.selectedSkillId}
          onOpenChange={props.setSkillsOpen}
          onSelectSkillId={(skillId) => {
            void props.handleSkillSelect(skillId);
          }}
          onOpenSettings={() => {
            props.setSkillsOpen(false);
            props.openSettings();
          }}
          onCreateSkill={() => {
            props.setSkillsOpen(false);
            props.setSkillManagerOpen(true);
          }}
          onToggleSkill={(skillId, enabled) => {
            void props.handleSkillToggle({ skillId, enabled });
          }}
          onUpdateScope={(id, scope) => {
            void props.handleSkillScopeUpdate({ id, scope });
          }}
        />
        <SkillManagerDialog
          open={props.skillManagerOpen}
          onOpenChange={props.setSkillManagerOpen}
          projectId={props.currentProject?.projectId ?? props.projectId ?? null}
          onSaved={async () => {
            await props.refreshSkills();
          }}
        />
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// AiPanel — main component (thin shell)
// ---------------------------------------------------------------------------

/**

 * AiPanel provides the AI assistant interface for text generation and editing.

 *

 * Layout:

 * - User Request Card (shows current input)

 * - AI Response Area with streaming cursor

 * - Action Area (Apply/Reject when proposal exists)

 * - Input Area with embedded toolbar and send/stop button

 */
type AiPanelProps = {
  newChatSignal?: number;
};

export function AiPanel(props: AiPanelProps = {}): JSX.Element {
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
  const historyMessages = activeChatSessionId ? activeChatMessages : [];
  const activeRunId = selectedCandidate?.runId ?? lastRunId;

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
    activeRunId,
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

  // createAiPanelActions receives callbacks that write to refs, which the React
  // compiler ref rule treats as "ref values" via taint tracking. The callbacks
  // are only invoked from event handlers, never during render. Suppressed.
  // eslint-disable-next-line react-hooks/refs
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

  // Sync the latest handleNewChat callback into a ref so effects can call it
  // without re-triggering themselves. Writing .current inside useEffect is the
  // standard "latest value" pattern; the lint rule flags it because `actions`
  // is returned from a function that receives MutableRefObjects — false positive.
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
          <AiPanelChatArea
            historyMessages={historyMessages}
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
          <AiPanelInputArea
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

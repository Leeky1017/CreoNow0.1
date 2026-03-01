import React from "react";

import {
  AiErrorCard,
  type AiErrorConfig,
} from "../../components/features/AiDialogs";

import { Button, Spinner, Text } from "../../components/primitives";

import { useOpenSettings } from "../../contexts/OpenSettingsContext";

import {
  useAiStore,
  type AiStatus,
  type SelectionRef,
} from "../../stores/aiStore";

import { useEditorStore } from "../../stores/editorStore";

import { useProjectStore } from "../../stores/projectStore";

import { unifiedDiff } from "../../lib/diff/unifiedDiff";

import { runFireAndForget } from "../../lib/fireAndForget";
import { invoke } from "../../lib/ipcClient";

import { DiffView } from "../diff/DiffView";

import { applySelection, captureSelectionRef } from "./applySelection";

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
  return (
    <button
      data-testid="ai-send-stop"
      type="button"
      className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={props.isWorking ? props.onStop : props.onSend}
      disabled={props.disabled}
      title={props.isWorking ? "Stop generating" : "Send message"}
    >
      {props.isWorking ? (
        // Stop icon: circle with square

        <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
          <div className="w-2 h-2 bg-current rounded-[1px]" />
        </div>
      ) : (
        // Send icon: arrow up

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="19" x2="12" y2="5" />

          <polyline points="5 12 12 5 19 12" />
        </svg>
      )}
    </button>
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
        px-1.5 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)]
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
                className="text-[11px] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                onClick={() => void handleCopyCommand()}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            {props.onAction && props.actionLabel ? (
              <button
                type="button"
                data-testid={props.actionTestId}
                className="text-[11px] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
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

      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-raised)] border-b border-[var(--color-border-default)]">
        <span className="text-[11px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          {props.language || "code"}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>

          {props.onApply && (
            <button
              type="button"
              onClick={props.onApply}
              className="px-2 py-0.5 text-[11px] text-[var(--color-fg-accent)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
            >
              Apply
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
  const activeRunId = selectedCandidate?.runId ?? lastRunId;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const lastHandledNewChatSignalRef = React.useRef(props.newChatSignal ?? 0);
  const handleNewChatRef = React.useRef<() => void>(() => {});

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

      if (res.data.items.length === 0) {
        return;
      }

      const selectedExists = res.data.items.some(
        (item) => item.id === selectedModel,
      );

      if (!selectedExists) {
        setSelectedModel(res.data.items[0].id);
      }
    } catch (error) {
      const cause =
        error instanceof Error ? error.message : String(error ?? "unknown");
      setModelsStatus("error");
      setModelsLastError({ code: "INTERNAL", message: cause });
    }
  }, [selectedModel]);

  React.useEffect(() => {
    void refreshSkills();
    void refreshModels();
  }, [refreshModels, refreshSkills]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_MODELS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }
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
      return;
    }
  }, []);

  React.useEffect(() => {
    if (selectedModel.trim().length === 0) {
      return;
    }
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
  }, [selectedModel]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CANDIDATE_COUNT_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed)) {
        return;
      }
      if (parsed >= 1 && parsed <= 5) {
        setCandidateCount(parsed);
      }
    } catch (error) {
      console.error("AiPanel localStorage read failed", {
        operation: "read",
        key: CANDIDATE_COUNT_STORAGE_KEY,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  }, []);

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
      return;
    }
  }, [candidateCount]);

  React.useEffect(() => {
    return onAiModelCatalogUpdated(() => {
      void refreshModels();
    });
  }, [refreshModels]);

  React.useEffect(() => {
    if (!editor || bootstrapStatus !== "ready") {
      return;
    }

    const onSelectionUpdate = (): void => {
      const captured = captureSelectionRef(editor);
      if (!captured.ok) {
        return;
      }
      const normalized = captured.data.selectionText.trim();
      if (normalized.length === 0) {
        return;
      }
      setSelectionSnapshot({
        selectionRef: captured.data.selectionRef,
        selectionText: normalized,
      });
    };

    editor.on("selectionUpdate", onSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
    };
  }, [bootstrapStatus, editor, setSelectionSnapshot]);

  React.useEffect(() => {
    if (lastCandidates.length === 0) {
      if (selectedCandidateId !== null) {
        setSelectedCandidateId(null);
      }
      return;
    }

    const selectedExists = lastCandidates.some(
      (item) => item.id === selectedCandidateId,
    );
    if (!selectedExists) {
      setSelectedCandidateId(lastCandidates[0]?.id ?? null);
    }
  }, [lastCandidates, selectedCandidateId, setSelectedCandidateId]);

  React.useEffect(() => {
    if (status !== "idle") {
      return;
    }

    if (proposal || !activeRunId || activeOutputText.trim().length === 0) {
      return;
    }

    const effectiveSelectionSnapshot =
      selectionRef && selectionText.length > 0
        ? { selectionRef, selectionText }
        : pendingSelectionSnapshotRef.current;
    if (
      !effectiveSelectionSnapshot ||
      effectiveSelectionSnapshot.selectionText.length === 0
    ) {
      return;
    }

    setProposal({
      runId: activeRunId,

      selectionRef: effectiveSelectionSnapshot.selectionRef,

      selectionText: effectiveSelectionSnapshot.selectionText,

      replacementText: activeOutputText,
    });
    pendingSelectionSnapshotRef.current = null;
    if (typeof setCompareMode === "function") {
      setCompareMode(true, null);
    }
  }, [
    activeOutputText,
    activeRunId,
    setCompareMode,

    proposal,

    selectionRef,

    selectionText,

    setProposal,

    status,
  ]);

  React.useEffect(() => {
    if (!proposal) {
      setInlineDiffConfirmOpen(false);
    }
  }, [proposal]);

  React.useEffect(() => {
    function onJudgeResultEvent(evt: Event): void {
      const customEvent = evt as CustomEvent<unknown>;
      if (!isJudgeResultEvent(customEvent.detail)) {
        return;
      }

      const result = customEvent.detail;
      if (projectId && result.projectId !== projectId) {
        return;
      }
      if (lastRunId && result.traceId !== lastRunId) {
        return;
      }

      setJudgeResult(result);
    }

    window.addEventListener(JUDGE_RESULT_CHANNEL, onJudgeResultEvent);
    return () => {
      window.removeEventListener(JUDGE_RESULT_CHANNEL, onJudgeResultEvent);
    };
  }, [lastRunId, projectId]);

  React.useEffect(() => {
    if (status !== "idle") {
      return;
    }
    if (!projectId || !lastRunId || outputText.trim().length === 0) {
      return;
    }
    if (evaluatedRunIdRef.current === lastRunId) {
      return;
    }

    evaluatedRunIdRef.current = lastRunId;
    runFireAndForget(async () => {
      try {
        const res = await invoke("judge:quality:evaluate", {
          projectId,
          traceId: lastRunId,
          text: outputText,
          contextSummary: lastRequest ?? "AI 面板上下文摘要",
        });
        if (res.ok) {
          return;
        }
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
      if (evaluatedRunIdRef.current === lastRunId) {
        evaluatedRunIdRef.current = null;
      }
    });
  }, [lastRequest, lastRunId, outputText, projectId, status]);

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

  /**
   * Run the selected skill with deterministic input-source override support.
   *
   * Why: skill panel selection must be able to trigger execution immediately
   * with selection/context-derived input, without waiting for manual Send.
   */
  async function onRun(args?: {
    inputOverride?: string;
    skillIdOverride?: string;
  }): Promise<void> {
    const effectiveSkillId = args?.skillIdOverride ?? selectedSkillId;
    const inputToSend = (args?.inputOverride ?? input).trim();
    const allowEmptyInput = isContinueSkill(effectiveSkillId);

    let selectionSnapshotForRun: {
      selectionRef: SelectionRef;
      selectionText: string;
    } | null =
      selectionRef && selectionText.trim().length > 0
        ? {
            selectionRef,
            selectionText: selectionText.trim(),
          }
        : null;

    let selectionContextText = selectionSnapshotForRun?.selectionText ?? "";

    if (!selectionContextText && editor && bootstrapStatus === "ready") {
      const captured = captureSelectionRef(editor);
      if (captured.ok) {
        const normalized = captured.data.selectionText.trim();
        if (normalized.length > 0) {
          selectionContextText = normalized;
          selectionSnapshotForRun = {
            selectionRef: captured.data.selectionRef,
            selectionText: normalized,
          };
          setSelectionSnapshot({
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

    setLastRequest(inputToSend);
    setJudgeResult(null);
    evaluatedRunIdRef.current = null;

    if (typeof setCompareMode === "function") {
      setCompareMode(false);
    }
    setProposal(null);
    setInlineDiffConfirmOpen(false);
    setSelectedCandidateId(null);

    setError(null);

    pendingSelectionSnapshotRef.current = selectionSnapshotForRun;
    try {
      await run({
        inputOverride: composedInput,
        context: {
          projectId: currentProject?.projectId ?? projectId ?? undefined,
          documentId: documentId ?? undefined,
        },
        mode: selectedMode,
        model: selectedModel,
        candidateCount,
        streamOverride: candidateCount > 1 ? false : undefined,
      });
    } finally {
      setSelectionSnapshot(null);
    }
  }

  /**
   * Drop current proposal and reset inline-diff confirmation state.
   *
   * Why: reject must leave panel in a deterministic idle state for next run.
   */
  function onReject(): void {
    pendingSelectionSnapshotRef.current = null;
    if (typeof setCompareMode === "function") {
      setCompareMode(false);
    }
    setProposal(null);
    setInlineDiffConfirmOpen(false);

    setSelectionSnapshot(null);
  }

  function onSelectCandidate(candidateId: string): void {
    setSelectedCandidateId(candidateId);
    setProposal(null);
    setInlineDiffConfirmOpen(false);
  }

  async function onRegenerateAll(): Promise<void> {
    setProposal(null);
    setInlineDiffConfirmOpen(false);
    setSelectedCandidateId(null);
    setJudgeResult(null);
    evaluatedRunIdRef.current = null;

    await regenerateWithStrongNegative({
      projectId: currentProject?.projectId ?? projectId ?? undefined,
    });
  }

  /**
   * Execute a skill immediately from picker selection.
   *
   * Why: P1 trigger flow requires one-click skill execution from the panel.
   */
  async function handleSkillSelect(skillId: string): Promise<void> {
    setSelectedSkillId(skillId);
    setSkillsOpen(false);

    if (isRunning(status)) {
      return;
    }

    let inputOverride = input;
    if (isContinueSkill(skillId)) {
      inputOverride = "";
    } else if (editor) {
      const captured = captureSelectionRef(editor);
      if (captured.ok) {
        inputOverride = captured.data.selectionText;
      }
    }

    await onRun({
      skillIdOverride: skillId,
      inputOverride,
    });
  }

  /**
   * Persist enable/disable state changes for a skill entry.
   */
  async function handleSkillToggle(args: {
    skillId: string;
    enabled: boolean;
  }): Promise<void> {
    const toggled = await invoke("skill:registry:toggle", {
      skillId: args.skillId,
      enabled: args.enabled,
    });
    if (!toggled.ok) {
      setError(toggled.error);
      return;
    }

    await refreshSkills();
  }

  /**
   * Promote/demote a custom skill scope and refresh picker state.
   */
  async function handleSkillScopeUpdate(args: {
    id: string;
    scope: "global" | "project";
  }): Promise<void> {
    const updated = await invoke("skill:custom:update", {
      id: args.id,
      scope: args.scope,
    });
    if (!updated.ok) {
      setError(updated.error);
      return;
    }

    await refreshSkills();
  }

  /**
   * Apply AI output through a two-step confirmation.
   *
   * Why: enforce "preview diff first, persist only after explicit confirm".
   */
  async function onApply(): Promise<void> {
    if (!editor || !proposal || !projectId || !documentId) {
      return;
    }

    if (!inlineDiffConfirmOpen) {
      setInlineDiffConfirmOpen(true);
      return;
    }

    const applied = applySelection({
      editor,

      selectionRef: proposal.selectionRef,

      replacementText: proposal.replacementText,
    });

    if (!applied.ok) {
      setError(applied.error);

      if (applied.error.code === "CONFLICT") {
        void logAiApplyConflict({ documentId, runId: proposal.runId });
      }

      return;
    }

    const json = JSON.stringify(editor.getJSON());

    await persistAiApply({
      projectId,

      documentId,

      contentJson: json,

      runId: proposal.runId,
    });

    setInlineDiffConfirmOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    // Enter to send (without Shift)

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      const allowEmptyInput = isContinueSkill(selectedSkillId);
      if (!isRunning(status) && (allowEmptyInput || input.trim())) {
        void onRun();
      }
    }
  }

  /**

   * Start a new chat: clear current conversation and focus input.

   */

  function handleNewChat(): void {
    setLastRequest(null);
    setJudgeResult(null);
    evaluatedRunIdRef.current = null;

    setInput("");

    if (typeof setCompareMode === "function") {
      setCompareMode(false);
    }
    pendingSelectionSnapshotRef.current = null;
    setProposal(null);
    setInlineDiffConfirmOpen(false);
    setSelectionSnapshot(null);

    setError(null);

    textareaRef.current?.focus();
  }

  handleNewChatRef.current = handleNewChat;

  React.useEffect(() => {
    const signal = props.newChatSignal ?? 0;
    if (signal === lastHandledNewChatSignalRef.current) {
      return;
    }
    lastHandledNewChatSignalRef.current = signal;
    handleNewChatRef.current();
  }, [props.newChatSignal]);

  const working = isRunning(status);
  const hasSelectionReference =
    !!selectionRef && selectionText.trim().length > 0;
  const selectionPreview = hasSelectionReference
    ? formatSelectionPreview(selectionText.trim())
    : "";

  const skillsErrorConfig: AiErrorConfig | null = skillsLastError
    ? {
        type: "service_error",

        title: "Skills unavailable",
        description: skillsLastError.message,
        errorCode: skillsLastError.code,
      }
    : null;

  const modelsErrorConfig: AiErrorConfig | null = modelsLastError
    ? {
        type: "service_error",

        title: "Models unavailable",

        description: `${modelsLastError.code}: ${modelsLastError.message}`,
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
            ? "Timeout"
            : lastError.code === "RATE_LIMITED" ||
                lastError.code === "AI_RATE_LIMITED"
              ? "Rate limited"
              : "AI error",

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

  return (
    <section
      data-testid="ai-panel"
      className="flex flex-col h-full min-h-0 bg-[var(--color-bg-surface)]"
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* User Request - boxed */}
          {lastRequest && (
            <div className="w-full p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
              <div className="text-[13px] text-[var(--color-fg-default)] whitespace-pre-wrap">
                {lastRequest}
              </div>
            </div>
          )}

          {/* Status indicator */}
          {working && (
            <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
              <Spinner size="sm" />
              <span>
                {status === "streaming" ? "Generating..." : "Thinking..."}
              </span>
              {typeof queuePosition === "number" && queuePosition > 0 ? (
                <span data-testid="ai-queue-status">
                  Queue #{queuePosition} ({queuedCount} waiting)
                </span>
              ) : null}
            </div>
          )}

          {/* Error Display */}
          {showDbGuide ? (
            <ErrorGuideCard
              testId="ai-error-guide-db"
              title="Native binding requires repair"
              description={
                dbGuideError?.message ??
                "AI runtime dependencies are not ready for this environment."
              }
              steps={[
                "Rebuild the native module in this workspace.",
                "Restart the app after the rebuild completes.",
              ]}
              command={dbGuideCommand}
              errorCode="DB_ERROR"
            />
          ) : null}

          {showProviderGuide ? (
            <ErrorGuideCard
              testId="ai-error-guide-provider"
              title="AI provider is not configured"
              description="Open Settings -> AI and choose a provider before using AI features."
              steps={[
                "Open Settings and switch to the AI tab.",
                "Select provider mode and fill base URL/API key.",
                "Save, test connection, then retry this action.",
              ]}
              errorCode={providerGuideCode ?? "AI_NOT_CONFIGURED"}
              actionLabel="Open Settings -> AI"
              actionTestId="ai-error-guide-open-settings"
              onAction={() => openSettings("ai")}
            />
          ) : null}

          {shouldRenderGenericErrors && skillsErrorConfig ? (
            <AiErrorCard error={skillsErrorConfig} showDismiss={false} />
          ) : null}

          {shouldRenderGenericErrors && modelsErrorConfig ? (
            <AiErrorCard error={modelsErrorConfig} showDismiss={false} />
          ) : null}

          {shouldRenderGenericErrors && runtimeErrorConfig ? (
            <AiErrorCard
              error={runtimeErrorConfig}
              errorCodeTestId="ai-error-code"
              onDismiss={clearError}
            />
          ) : null}

          {lastCandidates.length > 0 ? (
            <div
              data-testid="ai-candidate-list"
              className="w-full grid grid-cols-1 gap-2"
            >
              {lastCandidates.map((candidate, index) => {
                const isSelected = selectedCandidate?.id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    data-testid={`ai-candidate-card-${index + 1}`}
                    type="button"
                    onClick={() => onSelectCandidate(candidate.id)}
                    className={`w-full text-left rounded-[var(--radius-md)] border px-3 py-2 transition-colors ${
                      isSelected
                        ? "border-[var(--color-accent)] bg-[var(--color-bg-selected)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-[var(--color-fg-default)]">
                        方案 {index + 1}
                      </span>
                      {isSelected ? (
                        <span className="text-[11px] text-[var(--color-fg-accent)]">
                          已选择
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

          {lastCandidates.length > 1 ? (
            <div className="w-full flex justify-end">
              <Button
                data-testid="ai-candidate-regenerate"
                variant="ghost"
                size="sm"
                onClick={() => void onRegenerateAll()}
                disabled={working}
              >
                全部不满意，重新生成
              </Button>
            </div>
          ) : null}

          {/* AI Response - no box, just text flow */}
          {activeOutputText ? (
            <div data-testid="ai-output" className="w-full">
              <div className="text-[13px] leading-relaxed text-[var(--color-fg-default)] whitespace-pre-wrap">
                {activeOutputText}
                {status === "streaming" && <span className="typing-cursor" />}
              </div>
            </div>
          ) : (
            !lastRequest &&
            !working && (
              <div
                data-testid="ai-output"
                className="flex-1 flex items-center justify-center text-center py-12"
              >
                <Text size="small" color="muted">
                  选中文本或输入指令，开始与 AI 协作
                </Text>
              </div>
            )
          )}

          {judgeResult ? (
            <div
              data-testid="ai-judge-result"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-3 py-2 space-y-1"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  data-testid="ai-judge-severity"
                  className={`text-[11px] font-semibold uppercase tracking-wide ${judgeSeverityClass(
                    judgeResult.severity,
                  )}`}
                >
                  {judgeResult.severity}
                </span>
                {judgeResult.labels.length === 0 ? (
                  <span
                    data-testid="ai-judge-pass"
                    className="text-[12px] text-[var(--color-fg-default)]"
                  >
                    质量校验通过
                  </span>
                ) : (
                  judgeResult.labels.map((label) => (
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
                {judgeResult.summary}
              </Text>
              {judgeResult.partialChecksSkipped ? (
                <Text data-testid="ai-judge-partial" size="small" color="muted">
                  部分校验已跳过
                </Text>
              ) : null}
            </div>
          ) : null}

          {usageStats ? (
            <div
              data-testid="ai-usage-stats"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
                <span>
                  Prompt:{" "}
                  <span data-testid="ai-usage-prompt-tokens">
                    {formatTokenValue(usageStats.promptTokens)}
                  </span>
                </span>
                <span>
                  输出:{" "}
                  <span data-testid="ai-usage-completion-tokens">
                    {formatTokenValue(usageStats.completionTokens)}
                  </span>
                </span>
                <span>
                  本会话累计:{" "}
                  <span data-testid="ai-usage-session-total-tokens">
                    {formatTokenValue(usageStats.sessionTotalTokens)}
                  </span>
                </span>
                {typeof usageStats.estimatedCostUsd === "number" ? (
                  <span>
                    费用估算:{" "}
                    <span data-testid="ai-usage-estimated-cost">
                      {formatUsd(usageStats.estimatedCostUsd)}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Applied Status */}
          {applyStatus === "applied" && (
            <Text data-testid="ai-apply-status" size="small" color="muted">
              Applied &amp; saved
            </Text>
          )}

          {/* Proposal Area (Diff + Apply/Reject) */}
          {proposal && (
            <>
              {!compareMode ? (
                <DiffView diffText={diffText} testId="ai-panel-diff" />
              ) : null}
              <div className="flex gap-2">
                <Button
                  data-testid="ai-apply"
                  variant="secondary"
                  size="md"
                  onClick={() => void onApply()}
                  disabled={!canApply}
                  className="flex-1"
                >
                  {inlineDiffConfirmOpen ? "Apply (armed)" : "Apply"}
                </Button>
                {inlineDiffConfirmOpen ? (
                  <Button
                    data-testid="ai-apply-confirm"
                    variant="secondary"
                    size="md"
                    onClick={() => void onApply()}
                    disabled={!canApply}
                    className="flex-1"
                  >
                    Confirm Apply
                  </Button>
                ) : null}
                <Button
                  data-testid="ai-reject"
                  variant="ghost"
                  size="md"
                  onClick={
                    inlineDiffConfirmOpen
                      ? () => setInlineDiffConfirmOpen(false)
                      : onReject
                  }
                  disabled={applyStatus === "applying"}
                >
                  {inlineDiffConfirmOpen ? "Back to Diff" : "Reject"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Input Area - Fixed at bottom, minimal padding like Cursor */}
        <div className="shrink-0 px-1.5 pb-1.5 pt-2 border-t border-[var(--color-separator)]">
          {/* Unified input wrapper */}
          <div className="relative border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)] focus-within:border-[var(--color-border-focus)]">
            {hasSelectionReference ? (
              <div
                data-testid="ai-selection-reference-card"
                className="mx-2 mt-2 mb-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-2 py-1.5"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-fg-muted)]">
                      Selection from editor
                    </div>
                    <div
                      data-testid="ai-selection-reference-preview"
                      className="text-[12px] text-[var(--color-fg-default)] whitespace-pre-wrap break-words"
                    >
                      {selectionPreview}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="ai-selection-reference-close"
                    className="h-5 w-5 shrink-0 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                    onClick={() => setSelectionSnapshot(null)}
                    title="Dismiss selection reference"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : null}
            <textarea
              ref={textareaRef}
              data-testid="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] max-h-[160px] px-3 py-2 bg-transparent border-none resize-none text-[13px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
            />

            {/* Embedded toolbar - seamless, no separator */}
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                {/* Mode button */}
                <ToolButton
                  active={modeOpen}
                  onClick={() => {
                    setModeOpen((v) => !v);
                    setModelOpen(false);
                    setSkillsOpen(false);
                  }}
                >
                  {getModeName(selectedMode)}
                </ToolButton>

                {/* Model button */}
                <ToolButton
                  active={modelOpen}
                  onClick={() => {
                    setModelOpen((v) => !v);
                    setModeOpen(false);
                    setSkillsOpen(false);
                  }}
                >
                  {modelsStatus === "loading"
                    ? "Loading"
                    : getModelName(selectedModel, availableModels)}
                </ToolButton>

                {/* Skill button */}
                <ToolButton
                  active={skillsOpen}
                  testId="ai-skills-toggle"
                  onClick={() => {
                    setSkillsOpen((v) => !v);
                    setModeOpen(false);
                    setModelOpen(false);
                  }}
                >
                  {skillsStatus === "loading" ? "Loading" : "SKILL"}
                </ToolButton>
              </div>

              <SendStopButton
                isWorking={working}
                disabled={!working && !input.trim()}
                onSend={() => void onRun()}
                onStop={() => void cancel()}
              />
            </div>

            {/* Pickers anchored to the input wrapper */}
            <ModePicker
              open={modeOpen}
              selectedMode={selectedMode}
              onOpenChange={setModeOpen}
              onSelectMode={(mode) => {
                setSelectedMode(mode);
                setModeOpen(false);
              }}
            />
            <ModelPicker
              open={modelOpen}
              models={availableModels}
              recentModelIds={recentModelIds}
              selectedModel={selectedModel}
              onOpenChange={setModelOpen}
              onSelectModel={(model) => {
                setSelectedModel(model);
                setModelOpen(false);
              }}
            />
            <SkillPicker
              open={skillsOpen}
              items={skills}
              selectedSkillId={selectedSkillId}
              onOpenChange={setSkillsOpen}
              onSelectSkillId={(skillId) => {
                void handleSkillSelect(skillId);
              }}
              onOpenSettings={() => {
                setSkillsOpen(false);
                openSettings();
              }}
              onCreateSkill={() => {
                setSkillsOpen(false);
                setSkillManagerOpen(true);
              }}
              onToggleSkill={(skillId, enabled) => {
                void handleSkillToggle({ skillId, enabled });
              }}
              onUpdateScope={(id, scope) => {
                void handleSkillScopeUpdate({ id, scope });
              }}
            />
            <SkillManagerDialog
              open={skillManagerOpen}
              onOpenChange={setSkillManagerOpen}
              projectId={currentProject?.projectId ?? projectId ?? null}
              onSaved={async () => {
                await refreshSkills();
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SettingsTab } from "../settings-dialog/SettingsDialog";

import { AiErrorCard } from "../../components/features/AiDialogs";

import { Spinner, Text } from "../../components/primitives";
import { Button } from "../../components/primitives/Button";

import {
  type AiApplyStatus,
  type AiCandidate,
  type ChatMessageItem,
  type AiProposal,
  type AiStatus,
  type AiUsageStats as AiUsageStatsType,
} from "../../stores/aiStore";

import { useTranslation } from "react-i18next";
import type { JudgeResultEvent } from "@shared/types/judge";
import { judgeSeverityClass } from "./aiPanelFormatting";

import { AiEmptyState } from "./AiEmptyState";
import { AiUsageStats } from "./AiUsageStats";
import { AiProposalView } from "./AiProposalView";
import type { AiErrorConfigs } from "./aiPanelHelpers";

// ---------------------------------------------------------------------------
// ErrorGuideCard — extracted inline component
// ---------------------------------------------------------------------------

export function ErrorGuideCard(props: {
  testId: string;
  title: string;
  description: string;
  steps: string[];
  errorCode: string;
  severity?: "error" | "warning" | "info";
  command?: string;
  actionLabel?: string;
  actionTestId?: string;
  onAction?: () => void;
}): JSX.Element {
  const [copied, setCopied] = React.useState(false);
  const sev = props.severity ?? "error";

  const borderColorMap = {
    error: "bg-[var(--color-error)]",
    warning: "bg-[var(--color-warning)]",
    info: "bg-[var(--color-info)]",
  };

  const bgColorMap = {
    error: "bg-[var(--color-error-subtle)]",
    warning: "bg-[var(--color-warning-subtle)]",
    info: "bg-[var(--color-info-subtle)]",
  };

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
      className={`w-full rounded-[var(--radius-md)] ${bgColorMap[sev]}`}
    >
      <div className="flex">
        <div
          className={`w-1.5 rounded-l-[var(--radius-md)] ${borderColorMap[sev]}`}
        />
        <div className="flex-1 px-3 py-2.5">
          <h4 className="text-(--text-body) font-semibold text-[var(--color-fg-default)]">
            {props.title}
          </h4>
          <p className="mt-1 text-(--text-caption) leading-snug text-[var(--color-fg-muted)] whitespace-pre-wrap">
            {props.description}
          </p>
          <ol className="mt-2 list-decimal pl-4 space-y-1 text-(--text-caption) leading-snug text-[var(--color-fg-default)]">
            {props.steps.map((step, index) => (
              <li key={`${props.testId}-step-${index}`}>{step}</li>
            ))}
          </ol>
          {props.command ? (
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] px-2 py-1 text-(--text-status) text-[var(--color-fg-default)]">
                {props.command}
              </code>
              <Button
                type="button"
                data-testid={`${props.testId}-copy-command`}
                className="focus-ring text-(--text-status) px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-default"
                onClick={() => void handleCopyCommand()}
              >
                {copied ? t("ai.panel.copied") : t("ai.panel.copy")}
              </Button>
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            {props.onAction && props.actionLabel ? (
              <Button
                type="button"
                data-testid={props.actionTestId}
                className="focus-ring text-(--text-status) px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-default"
                onClick={props.onAction}
              >
                {props.actionLabel}
              </Button>
            ) : null}
            <span className="text-(--text-label) font-mono text-[var(--color-error)]">
              {/* 审计：v1-13 #013 KEEP */}
              {/* eslint-disable-next-line creonow/no-raw-error-code-in-ui -- 技术原因：diagnostic code reference for AI error display; user-friendly description shown above */}
              {props.errorCode}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// AiPanelErrorDisplay
// ---------------------------------------------------------------------------

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
        severity="error"
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
        severity="warning"
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

// ---------------------------------------------------------------------------
// AiMessageList — message stream rendering (chat area content)
// ---------------------------------------------------------------------------

export type AiMessageListProps = {
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
  usageStats: AiUsageStatsType | null;
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

export function AiMessageList(props: AiMessageListProps): JSX.Element {
  const { t } = useTranslation();
  const hasHistoryReplay = props.historyMessages.length > 0;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: props.historyMessages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label={t("ai.panel.messageArea")}
      className="flex-1 overflow-y-auto scroll-shadow-y p-3 space-y-4"
    >
      {hasHistoryReplay
        ? (() => {
            const virtualItems = virtualizer.getVirtualItems();
            const useVirtual = virtualItems.length > 0;
            if (useVirtual) {
              return (
                <div
                  data-testid="ai-history-replay-list"
                  className="w-full relative"
                  style={{ height: `${virtualizer.getTotalSize()}px` }}
                >
                  {virtualItems.map((virtualRow) => {
                    const message = props.historyMessages[virtualRow.index];
                    return (
                      <div
                        key={message.messageId}
                        ref={virtualizer.measureElement}
                        data-index={virtualRow.index}
                        data-testid={`ai-history-message-${message.role}`}
                        className={`absolute left-0 right-0 w-full rounded-[var(--radius-md)] p-3 text-(--text-body) whitespace-pre-wrap list-item-enter ${
                          message.role === "user"
                            ? "bg-[var(--color-bg-base)] text-[var(--color-fg-default)]"
                            : "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)] border-l-2 border-[var(--color-accent)]"
                        }`}
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {message.content}
                      </div>
                    );
                  })}
                </div>
              );
            }
            return (
              <div
                data-testid="ai-history-replay-list"
                className="w-full space-y-2"
              >
                {props.historyMessages.map((message) => (
                  <div
                    key={message.messageId}
                    data-testid={`ai-history-message-${message.role}`}
                    className={`w-full rounded-[var(--radius-md)] p-3 text-(--text-body) whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-[var(--color-bg-base)] text-[var(--color-fg-default)]"
                        : "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)] border-l-2 border-[var(--color-accent)]"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            );
          })()
        : null}

      {!hasHistoryReplay && props.lastRequest ? (
        <div className="w-full p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
          <div className="text-(--text-body) text-[var(--color-fg-default)] whitespace-pre-wrap">
            {props.lastRequest}
          </div>
        </div>
      ) : null}

      {props.working && (
        <div className="flex items-center gap-2 text-(--text-caption) text-[var(--color-fg-muted)]">
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
              <Button
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
                  <span className="text-(--text-caption) font-semibold text-[var(--color-fg-default)]">
                    {t("ai.candidate", { index: index + 1 })}
                  </span>
                  {isSelected ? (
                    <span className="text-(--text-status) text-[var(--color-fg-accent)]">
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
              </Button>
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
          <div className="text-(--text-body) leading-relaxed text-[var(--color-fg-default)] whitespace-pre-wrap">
            {props.activeOutputText}
            {props.status === "streaming" && <span className="typing-cursor" />}
          </div>
        </div>
      ) : !hasHistoryReplay ? (
        !props.lastRequest &&
        !props.working && (
          <div data-testid="ai-output" aria-live="polite" aria-atomic="false">
            <AiEmptyState />
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
              className={`text-(--text-status) font-semibold uppercase tracking-wide ${judgeSeverityClass(props.judgeResult.severity)}`}
            >
              {props.judgeResult.severity}
            </span>
            {props.judgeResult.labels.length === 0 ? (
              <span
                data-testid="ai-judge-pass"
                className="text-(--text-caption) text-[var(--color-fg-default)]"
              >
                {t("ai.judgePass")}
              </span>
            ) : (
              props.judgeResult.labels.map((label) => (
                <span
                  key={label}
                  className="text-(--text-caption) text-[var(--color-fg-default)]"
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
        <AiUsageStats
          promptTokens={props.usageStats.promptTokens}
          completionTokens={props.usageStats.completionTokens}
          sessionTotalTokens={props.usageStats.sessionTotalTokens}
          estimatedCostUsd={props.usageStats.estimatedCostUsd}
        />
      ) : null}

      {props.applyStatus === "applied" && (
        <Text data-testid="ai-apply-status" size="small" color="muted">
          {t("ai.appliedSaved")}
        </Text>
      )}

      {props.proposal && (
        <AiProposalView
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

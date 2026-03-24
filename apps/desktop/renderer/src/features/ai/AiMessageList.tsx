import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SettingsTab } from "../settings-dialog/SettingsDialog";

import { Spinner, Text } from "../../components/primitives";

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

import { AiEmptyState } from "./AiEmptyState";
import { AiUsageStats } from "./AiUsageStats";
import { AiProposalView } from "./AiProposalView";
import type { AiErrorConfigs } from "./aiPanelHelpers";
import { AiPanelErrorDisplay } from "./ErrorGuideCard";
import { AiCandidateCards } from "./AiCandidateCards";
import { AiJudgeResult } from "./AiJudgeResult";

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

  // 审计：v1-13 #1237 KEEP — useVirtualizer 三方 hook 签名不兼容 react-hooks 规则
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

      <AiCandidateCards
        candidates={props.lastCandidates}
        selectedCandidate={props.selectedCandidate}
        working={props.working}
        onSelectCandidate={props.onSelectCandidate}
        onRegenerateAll={props.onRegenerateAll}
      />

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

      {props.judgeResult ? <AiJudgeResult result={props.judgeResult} /> : null}

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

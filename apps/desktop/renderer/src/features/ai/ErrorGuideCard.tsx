import React from "react";
import type { SettingsTab } from "../settings-dialog/SettingsDialog";

import { AiErrorCard } from "../../components/features/AiDialogs";
import { Button } from "../../components/primitives/Button";

import { useTranslation } from "react-i18next";
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

export function AiPanelErrorDisplay(props: {
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

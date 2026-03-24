// QualityPanel — Main component wiring IPC data to QualityGatesPanelContent
import React from "react";
import { useTranslation } from "react-i18next";
import type { IpcError } from "@shared/types/ipc-generated";
import { Card } from "../../components/primitives/Card";
import { Heading } from "../../components/primitives/Heading";
import { Text } from "../../components/primitives/Text";
import { useJudgeEnsure } from "../../hooks/useJudgeEnsure";
import { invoke } from "../../lib/ipcClient";
import { useProjectStore } from "../../stores/projectStore";
import {
  QualityGatesPanelContent,
  type QualitySettings,
} from "../quality-gates/QualityGatesPanel";
import {
  type JudgeModelState,
  type ConstraintsData,
  JudgeStatusSection,
  ConstraintsSection,
  buildCheckGroups,
  derivePanelStatus,
} from "./QualityPanelSections";

export function QualityPanel(): JSX.Element {
  const { t } = useTranslation();
  const projectId = useProjectStore((s) => s.current?.projectId ?? null);

  // Judge model state
  const [judgeState, setJudgeState] = React.useState<JudgeModelState | null>(
    null,
  );
  const [judgeError, setJudgeError] = React.useState<IpcError | null>(null);
  const [judgeLoading, setJudgeLoading] = React.useState(true);
  const {
    busy: ensureBusy,
    downloading: ensureDownloading,
    error: ensureError,
    ensure,
    clearError,
  } = useJudgeEnsure();

  // Constraints state
  const [constraints, setConstraints] = React.useState<ConstraintsData | null>(
    null,
  );
  const [constraintsError, setConstraintsError] =
    React.useState<IpcError | null>(null);
  const [constraintsLoading, setConstraintsLoading] = React.useState(true);

  // Settings state for QualityGatesPanelContent
  const [settings, setSettings] = React.useState<QualitySettings>({
    runOnSave: true,
    blockOnErrors: false,
    frequency: "on-demand",
  });
  const [settingsExpanded, setSettingsExpanded] = React.useState(false);
  const [expandedCheckId, setExpandedCheckId] = React.useState<string | null>(
    null,
  );

  // Fetch judge state
  const fetchJudgeState = React.useCallback(async () => {
    const res = await invoke("judge:model:getstate", {});
    if (res.ok) {
      setJudgeState(res.data.state);
      setJudgeError(null);
      clearError();
    } else {
      setJudgeState(null);
      setJudgeError(res.error);
    }
    setJudgeLoading(false);
  }, [clearError]);

  // Fetch constraints
  const fetchConstraints = React.useCallback(async () => {
    if (!projectId) {
      setConstraints(null);
      setConstraintsError(null);
      setConstraintsLoading(false);
      return;
    }

    const res = await invoke("constraints:policy:get", { projectId });
    if (res.ok) {
      setConstraints(res.data.constraints);
      setConstraintsError(null);
    } else {
      // CRITICAL: Do NOT treat failure as empty constraints (that's silent failure)
      setConstraints(null);
      setConstraintsError(res.error);
    }
    setConstraintsLoading(false);
  }, [projectId]);

  // Initial fetch
  React.useEffect(() => {
    void fetchJudgeState();
    void fetchConstraints();
  }, [fetchJudgeState, fetchConstraints]);

  // Handle ensure button
  const handleEnsure = React.useCallback(async () => {
    setJudgeError(null);
    const result = await ensure();
    if (!result) {
      return;
    }

    if (result.ok) {
      setJudgeState(result.state);
      return;
    }

    setJudgeError(result.error);
    setJudgeState({
      status: "error",
      error: { code: result.error.code, message: result.error.message },
    });
  }, [ensure]);

  // Handle run all checks
  const handleRunAllChecks = React.useCallback(async () => {
    setJudgeLoading(true);
    setConstraintsLoading(true);
    await fetchJudgeState();
    await fetchConstraints();
  }, [fetchJudgeState, fetchConstraints]);

  const effectiveJudgeState: JudgeModelState | null = ensureDownloading
    ? { status: "downloading" }
    : judgeState;
  const effectiveJudgeError = ensureError ?? judgeError;

  // Build check groups and panel status
  const checkGroups = buildCheckGroups(effectiveJudgeState, constraints, t);
  const panelStatus = derivePanelStatus(
    effectiveJudgeState,
    effectiveJudgeError,
    constraintsError,
    judgeLoading || constraintsLoading,
  );

  // Count issues (errors are issues)
  const issuesCount =
    (effectiveJudgeError ? 1 : 0) +
    (constraintsError ? 1 : 0) +
    (effectiveJudgeState?.status === "error" ? 1 : 0) +
    (effectiveJudgeState?.status === "not_ready" ? 1 : 0);

  // No project selected
  if (!projectId) {
    return (
      <div
        data-testid="quality-panel"
        className="tab-crossfade flex flex-col gap-4 p-4 h-full overflow-auto"
      >
        <Heading level="h3" className="font-bold text-(--text-subtitle)">
          {t("rightPanel.quality.panelTitle")}
        </Heading>

        <Card className="p-4 rounded-[var(--radius-md)]">
          <Text
            data-testid="quality-panel-no-project"
            size="small"
            color="muted"
            className="text-center"
          >
            {t("rightPanel.quality.noProjectSelected")}
          </Text>
        </Card>

        <section>
          <Heading level="h4" className="mb-2 font-semibold text-(--text-body)">
            {t("rightPanel.quality.judgeModelHeading")}
          </Heading>
          <JudgeStatusSection
            state={effectiveJudgeState}
            error={effectiveJudgeError}
            loading={judgeLoading}
            onEnsure={handleEnsure}
            ensureBusy={ensureBusy}
          />
        </section>
      </div>
    );
  }

  return (
    <div
      data-testid="quality-panel"
      className="tab-crossfade flex flex-col h-full"
    >
      {/* Summary section with real status */}
      <div className="p-4 space-y-4 border-b border-[var(--color-separator)]">
        <section>
          <Heading level="h4" className="mb-2 font-semibold text-(--text-body)">
            {t("rightPanel.quality.judgeModelHeading")}
          </Heading>
          <JudgeStatusSection
            state={effectiveJudgeState}
            error={effectiveJudgeError}
            loading={judgeLoading}
            onEnsure={handleEnsure}
            ensureBusy={ensureBusy}
          />
        </section>

        <section>
          <Heading level="h4" className="mb-2 font-semibold text-(--text-body)">
            {t("rightPanel.quality.projectConstraints")}
          </Heading>
          <ConstraintsSection
            constraints={constraints}
            error={constraintsError}
            loading={constraintsLoading}
          />
        </section>
      </div>

      {/* Quality Gates Panel with real data */}
      <div className="flex-1 min-h-0">
        <QualityGatesPanelContent
          checkGroups={checkGroups}
          panelStatus={panelStatus}
          issuesCount={issuesCount > 0 ? issuesCount : undefined}
          expandedCheckId={expandedCheckId}
          onToggleCheck={(id) =>
            setExpandedCheckId((prev) => (prev === id ? null : id))
          }
          onRunAllChecks={handleRunAllChecks}
          settings={settings}
          onSettingsChange={setSettings}
          settingsExpanded={settingsExpanded}
          onToggleSettings={() => setSettingsExpanded((prev) => !prev)}
          showCloseButton={false}
        />
      </div>
    </div>
  );
}

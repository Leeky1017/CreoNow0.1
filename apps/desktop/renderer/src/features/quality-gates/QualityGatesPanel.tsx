// QualityGatesPanel — Thin shell (re-exports types + orchestrates sub-components)
import { CircleCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { PanelStatusIndicator } from "./QualityCheckItems";
import {
  CheckGroupAccordion,
  PlayIcon,
  SettingsSection,
} from "./QualityRuleList";
import {
  panelContentStyles,
  panelContainerStyles,
  headerStyles,
  closeButtonStyles,
  scrollAreaStyles,
} from "./qualityGatesTypes";
import type {
  QualityGatesPanelProps,
  QualityGatesPanelContentProps,
} from "./qualityGatesTypes";

// Re-export all types for backward compatibility
export type {
  CheckStatus,
  IssueSeverity,
  CheckIssue,
  CheckItem,
  CheckGroup,
  PanelStatus,
  CheckFrequency,
  QualitySettings,
  QualityGatesPanelProps,
  QualityGatesPanelContentProps,
} from "./qualityGatesTypes";

function CloseIcon() {
  return <X size={16} strokeWidth={1.5} />;
}
function CheckCircleIcon() {
  return <CircleCheck size={16} strokeWidth={1.5} />;
}

export function QualityGatesPanelContent({
  checkGroups,
  panelStatus,
  issuesCount,
  expandedCheckId,
  onToggleCheck,
  onFixIssue,
  onIgnoreIssue,
  onViewInEditor,
  onRunAllChecks,
  onClose,
  settings = { runOnSave: true, blockOnErrors: false, frequency: "on-demand" },
  onSettingsChange,
  settingsExpanded = false,
  onToggleSettings,
  fixingIssueId,
  showCloseButton = true,
}: QualityGatesPanelContentProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      className={panelContentStyles}
      data-testid="quality-gates-panel-content"
    >
      <div className={headerStyles}>
        <div>
          <h2 className="text-(--text-subtitle) font-semibold text-[var(--color-fg-default)] tracking-tight">
            {t("qualityGates.title")}
          </h2>
          <div className="mt-2">
            <PanelStatusIndicator
              status={panelStatus}
              issuesCount={issuesCount}
            />
          </div>
        </div>
        {showCloseButton && (
          <Button
            type="button"
            onClick={onClose}
            className={closeButtonStyles}
            aria-label={t("qualityGates.closeAriaLabel")}
          >
            <CloseIcon />
          </Button>
        )}
      </div>

      <div className={scrollAreaStyles}>
        <Button
          data-testid="quality-run-all-checks"
          variant="secondary"
          size="sm"
          onClick={onRunAllChecks}
          loading={panelStatus === "running"}
          fullWidth
          className="!justify-center !gap-2"
        >
          <PlayIcon />
          {t("qualityGates.runAllChecks")}
        </Button>

        {panelStatus === "all-passed" && (
          <div className="p-4 bg-[var(--color-success-subtle)] border border-[var(--color-success)]/20 rounded-[var(--radius-lg)] text-center">
            <CheckCircleIcon />
            <p className="text-(--text-body) text-[var(--color-success)] mt-2">
              {t("qualityGates.allPassedMessage")}
            </p>
          </div>
        )}

        {checkGroups.map((group) => (
          <CheckGroupAccordion
            key={group.id}
            group={group}
            expandedCheckId={expandedCheckId}
            onToggleCheck={onToggleCheck}
            onFix={onFixIssue}
            onIgnore={onIgnoreIssue}
            onViewInEditor={onViewInEditor}
            fixingIssueId={fixingIssueId}
          />
        ))}

        <SettingsSection
          settings={settings}
          onSettingsChange={onSettingsChange}
          expanded={settingsExpanded}
          onToggle={onToggleSettings}
        />
      </div>
    </div>
  );
}

export function QualityGatesPanel({
  checkGroups,
  panelStatus,
  issuesCount,
  expandedCheckId,
  onToggleCheck,
  onFixIssue,
  onIgnoreIssue,
  onViewInEditor,
  onRunAllChecks,
  onClose,
  settings = { runOnSave: true, blockOnErrors: false, frequency: "on-demand" },
  onSettingsChange,
  settingsExpanded = false,
  onToggleSettings,
  width = 320,
  fixingIssueId,
}: QualityGatesPanelProps): JSX.Element {
  return (
    <aside
      className={panelContainerStyles}
      style={{ width }}
      data-testid="quality-gates-panel"
    >
      <QualityGatesPanelContent
        checkGroups={checkGroups}
        panelStatus={panelStatus}
        issuesCount={issuesCount}
        expandedCheckId={expandedCheckId}
        onToggleCheck={onToggleCheck}
        onFixIssue={onFixIssue}
        onIgnoreIssue={onIgnoreIssue}
        onViewInEditor={onViewInEditor}
        onRunAllChecks={onRunAllChecks}
        onClose={onClose}
        settings={settings}
        onSettingsChange={onSettingsChange}
        settingsExpanded={settingsExpanded}
        onToggleSettings={onToggleSettings}
        fixingIssueId={fixingIssueId}
        showCloseButton={true}
      />
    </aside>
  );
}

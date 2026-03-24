// Quality Gates — Rule list (CheckGroupAccordion) and Settings
import { ChevronDown, Play, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CheckItemRow } from "./QualityCheckItems";
import { Button } from "../../components/primitives/Button";
import { Label } from "../../components/primitives/Label";
import { Select } from "../../components/primitives/Select";
import type {
  CheckFrequency,
  CheckGroup,
  QualitySettings,
} from "./qualityGatesTypes";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      size={16}
      strokeWidth={1.5}
      className={`transition-transform duration-[var(--duration-fast)] ${expanded ? "rotate-180" : ""}`}
    />
  );
}
function SettingsIcon() {
  return <Settings size={16} strokeWidth={1.5} />;
}
export function PlayIcon() {
  return <Play size={16} strokeWidth={1.5} />;
}

export function CheckGroupAccordion({
  group,
  expandedCheckId,
  onToggleCheck,
  onFix,
  onIgnore,
  onViewInEditor,
  fixingIssueId,
}: {
  group: CheckGroup;
  expandedCheckId?: string | null;
  onToggleCheck?: (checkId: string) => void;
  onFix?: (checkId: string, issueId: string) => void;
  onIgnore?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  fixingIssueId?: string | null;
}) {
  const { t } = useTranslation();
  const checkCount = group.checks.length;
  const passedCount = group.checks.filter((c) => c.status === "passed").length;

  return (
    <div
      className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] overflow-hidden"
      data-testid={`check-group-${group.id}`}
    >
      <div className="px-4 py-3 bg-[var(--color-bg-raised)] border-b border-[var(--color-separator)]">
        <div className="flex items-center justify-between">
          <span className="text-(--text-body) font-medium text-[var(--color-fg-default)]">
            {group.name}
          </span>
          <span className="text-(--text-status) text-[var(--color-fg-muted)]">
            {t("qualityGates.checksCount", {
              passed: passedCount,
              total: checkCount,
            })}
          </span>
        </div>
      </div>
      <div>
        {group.checks.map((check) => (
          <CheckItemRow
            key={check.id}
            check={check}
            isExpanded={expandedCheckId === check.id}
            onToggle={onToggleCheck}
            onFix={onFix}
            onIgnore={onIgnore}
            onViewInEditor={onViewInEditor}
            fixingIssueId={fixingIssueId}
          />
        ))}
      </div>
    </div>
  );
}

function SettingsToggle({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label
        htmlFor={id}
        className={`text-(--text-body) text-[var(--color-fg-default)] select-none cursor-pointer ${disabled ? "opacity-50" : ""}`}
      >
        {label}
      </Label>
      <Button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center w-11 h-6 rounded-full border shrink-0 cursor-pointer transition-colors duration-[var(--duration-slow)] ease-[var(--ease-default)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] ${
          checked
            ? "bg-[var(--color-fg-default)] border-[var(--color-fg-default)]"
            : "bg-[var(--color-bg-hover)] border-[var(--color-border-default)]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute left-(--dimension-rule-indicator-offset) w-4.5 h-4.5 rounded-full transition-transform duration-[var(--duration-slow)] pointer-events-none ${
            checked
              ? "translate-x-5 bg-[var(--color-fg-inverse)]"
              : "translate-x-0 bg-[var(--color-fg-subtle)]"
          }`}
        />
      </Button>
    </div>
  );
}

export function SettingsSection({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: {
  settings: QualitySettings;
  onSettingsChange?: (settings: QualitySettings) => void;
  expanded: boolean;
  onToggle?: () => void;
}) {
  const { t } = useTranslation();
  const frequencyOptions: { value: CheckFrequency; label: string }[] = [
    { value: "on-demand", label: t("qualityGates.frequencyOnDemand") },
    { value: "after-edit", label: t("qualityGates.frequencyAfterEdit") },
    { value: "every-5-minutes", label: t("qualityGates.frequencyEvery5Min") },
  ];

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] overflow-hidden">
      <Button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--duration-fast)]"
      >
        <div className="flex items-center gap-2">
          <SettingsIcon />
          <span className="text-(--text-body) font-medium text-[var(--color-fg-default)]">
            {t("qualityGates.settings")}
          </span>
        </div>
        <ChevronIcon expanded={expanded} />
      </Button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--color-separator)]">
          <div className="pt-4 space-y-4">
            <SettingsToggle
              id="run-on-save"
              label={t("qualityGates.runOnSave")}
              checked={settings.runOnSave}
              onChange={(checked) =>
                onSettingsChange?.({ ...settings, runOnSave: checked })
              }
            />
            <SettingsToggle
              id="block-on-errors"
              label={t("qualityGates.blockOnErrors")}
              checked={settings.blockOnErrors}
              onChange={(checked) =>
                onSettingsChange?.({ ...settings, blockOnErrors: checked })
              }
            />
            <div className="flex items-center justify-between">
              <Label
                htmlFor="check-frequency"
                className="text-(--text-body) text-[var(--color-fg-default)]"
              >
                {t("qualityGates.checkFrequency")}
              </Label>
              <Select
                id="check-frequency"
                value={settings.frequency}
                onValueChange={(val) =>
                  onSettingsChange?.({
                    ...settings,
                    frequency: val as CheckFrequency,
                  })
                }
                options={frequencyOptions}
                className="text-(--text-caption)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

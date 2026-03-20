// Quality Gates — Check result items (IssueCard, CheckItemRow, CheckStatusIcon, PanelStatusIndicator)
import {
  ChevronDown,
  CircleCheck,
  CircleX,
  Loader2,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives";
import type {
  CheckIssue,
  CheckItem,
  CheckStatus,
  PanelStatus,
} from "./qualityGatesTypes";

function CheckCircleIcon() {
  return <CircleCheck size={16} strokeWidth={1.5} />;
}
function WarningIcon() {
  return <TriangleAlert size={16} strokeWidth={1.5} />;
}
function ErrorIcon() {
  return <CircleX size={16} strokeWidth={1.5} />;
}
function SpinnerIcon() {
  return <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />;
}
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      size={16}
      strokeWidth={1.5}
      className={`transition-transform duration-[var(--duration-fast)] ${expanded ? "rotate-180" : ""}`}
    />
  );
}
function LocationIcon() {
  return <MapPin size={16} strokeWidth={1.5} />;
}

export function PanelStatusIndicator({
  status,
  issuesCount,
}: {
  status: PanelStatus;
  issuesCount?: number;
}) {
  const { t } = useTranslation();
  const statusConfig = {
    "all-passed": {
      color: "bg-[var(--color-success)]",
      text: t("qualityGates.statusAllPassed"),
      textColor: "text-[var(--color-success)]",
    },
    "issues-found": {
      color: "bg-[var(--color-warning)]",
      text: t("qualityGates.statusIssuesFound", { count: issuesCount ?? 0 }),
      textColor: "text-[var(--color-warning)]",
    },
    errors: {
      color: "bg-[var(--color-error)]",
      text: t("qualityGates.statusErrors", { count: issuesCount ?? 0 }),
      textColor: "text-[var(--color-error)]",
    },
    running: {
      color: "bg-[var(--color-info)]",
      text: t("qualityGates.statusRunning"),
      textColor: "text-[var(--color-info)]",
    },
  };
  const config = statusConfig[status];
  return (
    <div className="flex items-center gap-2">
      {status === "running" ? (
        <SpinnerIcon />
      ) : (
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
      )}
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
}

export function CheckStatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case "passed":
      return (
        <span className="text-[var(--color-success)]">
          <CheckCircleIcon />
        </span>
      );
    case "warning":
      return (
        <span className="text-[var(--color-warning)]">
          <WarningIcon />
        </span>
      );
    case "error":
      return (
        <span className="text-[var(--color-error)]">
          <ErrorIcon />
        </span>
      );
    case "running":
      return (
        <span className="text-[var(--color-info)]">
          <SpinnerIcon />
        </span>
      );
    default:
      return null;
  }
}

export function IssueCard({
  issue,
  checkId,
  onFix,
  onIgnore,
  onViewInEditor,
  isFixing,
}: {
  issue: CheckIssue;
  checkId: string;
  onFix?: (checkId: string, issueId: string) => void;
  onIgnore?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  isFixing?: boolean;
}) {
  const { t } = useTranslation();
  if (issue.ignored) {
    return (
      <div className="p-3 bg-[var(--color-bg-raised)] rounded-lg border border-[var(--color-separator)] opacity-50">
        <p className="text-[12px] text-[var(--color-fg-muted)] line-through">
          {issue.description}
        </p>
        <span className="text-[10px] text-[var(--color-fg-placeholder)] mt-1 inline-block">
          {t("qualityGates.ignored")}
        </span>
      </div>
    );
  }
  return (
    <div
      className={`p-3 rounded-lg border ${
        issue.severity === "error"
          ? "bg-[var(--color-error-subtle)] border-[var(--color-error)]/20"
          : "bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/20"
      }`}
      data-testid={`issue-card-${issue.id}`}
    >
      <p className="text-[12px] text-[var(--color-fg-default)] leading-relaxed">
        {issue.description}
      </p>
      {issue.location && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--color-fg-muted)]">
          <LocationIcon />
          {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
          <button
            type="button"
            onClick={() => onViewInEditor?.(checkId, issue.id)}
            className="hover:text-[var(--color-fg-default)] hover:underline transition-colors"
          >
            {issue.location}
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onFix?.(checkId, issue.id)}
          loading={isFixing}
          className="!h-6 !text-[10px] !px-2"
        >
          {t("qualityGates.fixIssue")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onIgnore?.(checkId, issue.id)}
          className="!h-6 !text-[10px] !px-2"
        >
          {t("qualityGates.ignore")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewInEditor?.(checkId, issue.id)}
          className="!h-6 !text-[10px] !px-2"
        >
          {t("qualityGates.viewInEditor")}
        </Button>
      </div>
    </div>
  );
}

export function CheckItemRow({
  check,
  isExpanded,
  onToggle,
  onFix,
  onIgnore,
  onViewInEditor,
  fixingIssueId,
}: {
  check: CheckItem;
  isExpanded: boolean;
  onToggle?: (checkId: string) => void;
  onFix?: (checkId: string, issueId: string) => void;
  onIgnore?: (checkId: string, issueId: string) => void;
  onViewInEditor?: (checkId: string, issueId: string) => void;
  fixingIssueId?: string | null;
}) {
  const { t } = useTranslation();
  const hasIssues = check.issues && check.issues.length > 0;
  const activeIssues = check.issues?.filter((i) => !i.ignored) ?? [];
  const issueCount = activeIssues.length;

  return (
    <div
      className="border-b border-[var(--color-separator)] last:border-b-0"
      data-testid={`check-item-${check.id}`}
    >
      {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
      <button
        type="button"
        onClick={() => hasIssues && onToggle?.(check.id)}
        disabled={!hasIssues}
        className={`w-full px-3 py-3 flex items-start gap-3 text-left transition-colors duration-[var(--duration-fast)] ${
          hasIssues
            ? "hover:bg-[var(--color-bg-hover)] cursor-pointer"
            : "cursor-default"
        }`}
      >
        <div className="mt-0.5">
          <CheckStatusIcon status={check.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--color-fg-default)]">
              {check.name}
            </span>
            {issueCount > 0 && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  check.status === "error"
                    ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]"
                    : "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                }`}
              >
                {issueCount}
              </span>
            )}
            {check.ignoredCount && check.ignoredCount > 0 && (
              <span className="text-[10px] text-[var(--color-fg-placeholder)]">
                {t("qualityGates.ignoredCount", { count: check.ignoredCount })}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-fg-muted)] mt-0.5 leading-relaxed">
            {check.description}
          </p>
          {check.resultValue && check.status === "passed" && (
            <span className="text-[11px] text-[var(--color-success)] mt-1 inline-block">
              {check.resultValue}
            </span>
          )}
        </div>
        {hasIssues && (
          <div className="mt-1">
            <ChevronIcon expanded={isExpanded} />
          </div>
        )}
      </button>
      {isExpanded && hasIssues && (
        <div className="px-3 pb-3 space-y-2">
          {check.issues?.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              checkId={check.id}
              onFix={onFix}
              onIgnore={onIgnore}
              onViewInEditor={onViewInEditor}
              isFixing={fixingIssueId === issue.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

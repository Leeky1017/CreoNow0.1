// QualityPanel — Sub-sections (JudgeStatus, Constraints, helpers)
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { IpcError } from "@shared/types/ipc-generated";
import { Card } from "../../components/primitives/Card";
import { Button } from "../../components/primitives/Button";
import { Text } from "../../components/primitives/Text";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import type {
  CheckGroup,
  PanelStatus,
} from "../quality-gates/QualityGatesPanel";

type JudgeModelState =
  | { status: "ready" }
  | { status: "downloading" }
  | { status: "not_ready" }
  | { status: "error"; error: { code: string; message: string } };
type ConstraintsData = { items: string[] };

export type { JudgeModelState, ConstraintsData };

function formatJudgeState(
  state: JudgeModelState,
  t: TFunction,
): { label: string; status: "ready" | "downloading" | "error" | "not_ready" } {
  switch (state.status) {
    case "ready":
      return { label: t("rightPanel.quality.ready"), status: "ready" };
    case "downloading":
      return {
        label: t("rightPanel.quality.downloading"),
        status: "downloading",
      };
    case "not_ready":
      return { label: t("rightPanel.quality.notReady"), status: "not_ready" };
    case "error":
      return { label: t("rightPanel.quality.errorWithCode"), status: "error" };
  }
}

function StatusDot(props: {
  status: "ready" | "downloading" | "error" | "not_ready" | "loading";
}): JSX.Element {
  const colors = {
    ready: "bg-[var(--color-success)]",
    downloading: "bg-[var(--color-info)]",
    error: "bg-[var(--color-error)]",
    not_ready: "bg-[var(--color-warning)]",
    loading: "bg-[var(--color-fg-muted)]",
  };
  if (props.status === "downloading") {
    return (
      <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-info)] animate-pulse" />
    );
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[props.status]}`}
    />
  );
}

export function JudgeStatusSection(props: {
  state: JudgeModelState | null;
  error: IpcError | null;
  loading: boolean;
  onEnsure: () => void;
  ensureBusy: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const { state, error, loading, onEnsure, ensureBusy } = props;

  if (loading) {
    return (
      <Card className="p-3 rounded-[var(--radius-md)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot status="loading" />
            <Text size="small" color="muted">
              {t("rightPanel.quality.loadingJudgeStatus")}
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-3 rounded-[var(--radius-md)] border-[var(--color-error)]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot status="error" />
            <Text
              data-testid="quality-panel-judge-error"
              size="small"
              color="muted"
            >
              <span data-testid="quality-panel-judge-error-code">
                {getHumanErrorMessage(error)}
              </span>
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  if (!state) {
    return (
      <Card className="p-3 rounded-[var(--radius-md)]">
        <Text size="small" color="muted">
          {t("rightPanel.quality.judgeStatusUnavailable")}
        </Text>
      </Card>
    );
  }

  const { label, status } = formatJudgeState(state, t);

  return (
    <Card className="p-3 rounded-[var(--radius-md)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <Text size="small" color="default">
            {t("rightPanel.quality.judgeModelLabel")}{" "}
            <span
              data-testid="quality-panel-judge-status"
              data-status={status}
              className="font-medium"
            >
              {label}
            </span>
          </Text>
        </div>
        {status !== "ready" && status !== "downloading" && (
          <Button
            data-testid="quality-panel-judge-ensure"
            variant="secondary"
            size="sm"
            onClick={onEnsure}
            disabled={ensureBusy}
            loading={ensureBusy}
          >
            {status === "not_ready"
              ? t("rightPanel.quality.initialize")
              : t("rightPanel.quality.retry")}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function ConstraintsSection(props: {
  constraints: ConstraintsData | null;
  error: IpcError | null;
  loading: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const { constraints, error, loading } = props;

  if (loading) {
    return (
      <Card className="p-3 rounded-[var(--radius-md)]">
        <Text size="small" color="muted">
          {t("rightPanel.quality.loadingConstraints")}
        </Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-3 rounded-[var(--radius-md)] border-[var(--color-error)]/20">
        <Text
          data-testid="quality-panel-constraints-error"
          size="small"
          color="muted"
        >
          <span data-testid="quality-panel-constraints-error-code">
            {getHumanErrorMessage(error)}
          </span>
        </Text>
      </Card>
    );
  }

  const count = constraints?.items.length ?? 0;

  return (
    <Card className="p-3 rounded-[var(--radius-md)]">
      <div className="flex items-center justify-between">
        <Text size="small" color="default">
          {t("rightPanel.quality.constraintsLabel")}{" "}
          <span
            data-testid="quality-panel-constraints-count"
            className="font-medium"
          >
            {t("rightPanel.quality.rulesCount", { count })}
          </span>
        </Text>
      </div>
      {count > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {constraints?.items.slice(0, 5).map((item, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)]"
            >
              {item.length > 30 ? `${item.slice(0, 30)}...` : item}
            </span>
          ))}
          {count > 5 && (
            <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)]">
              {t("rightPanel.quality.moreCount", { count: count - 5 })}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export function buildCheckGroups(
  judgeState: JudgeModelState | null,
  constraints: ConstraintsData | null,
  t: TFunction,
): CheckGroup[] {
  const groups: CheckGroup[] = [];

  if (judgeState) {
    const judgeStatus =
      judgeState.status === "ready"
        ? "passed"
        : judgeState.status === "error"
          ? "error"
          : judgeState.status === "downloading"
            ? "running"
            : "warning";
    groups.push({
      id: "system",
      name: t("rightPanel.quality.systemGroup"),
      checks: [
        {
          id: "judge-model",
          name: t("rightPanel.quality.judgeModelCheck"),
          description: t("rightPanel.quality.judgeModelDescription"),
          status: judgeStatus,
          resultValue:
            judgeState.status === "ready"
              ? t("rightPanel.quality.available")
              : undefined,
        },
      ],
    });
  }

  if (constraints) {
    const constraintCount = constraints.items.length;
    groups.push({
      id: "constraints",
      name: t("rightPanel.quality.writingConstraints"),
      checks: [
        {
          id: "active-constraints",
          name: t("rightPanel.quality.activeConstraints"),
          description: t("rightPanel.quality.activeConstraintsDescription"),
          status: constraintCount > 0 ? "passed" : "warning",
          resultValue: t("rightPanel.quality.rulesDefinedCount", {
            count: constraintCount,
          }),
        },
      ],
    });
  }

  return groups;
}

export function derivePanelStatus(
  judgeState: JudgeModelState | null,
  judgeError: IpcError | null,
  constraintsError: IpcError | null,
  loading: boolean,
): PanelStatus {
  if (loading) return "running";
  if (judgeError || constraintsError) return "errors";
  if (judgeState?.status === "error") return "errors";
  if (judgeState?.status === "downloading") return "running";
  if (judgeState?.status === "not_ready") return "issues-found";
  return "all-passed";
}

import { useTranslation } from "react-i18next";
import type { JudgeResultEvent } from "@shared/types/judge";
import { Text } from "../../components/primitives";
import { judgeSeverityClass } from "./aiPanelFormatting";

// ---------------------------------------------------------------------------
// AiJudgeResult — judge verdict display
// ---------------------------------------------------------------------------

export function AiJudgeResult(props: {
  result: JudgeResultEvent;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      data-testid="ai-judge-result"
      className="w-full rounded-[var(--radius-md)] bg-[var(--color-bg-base)] px-3 py-2 space-y-1"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          data-testid="ai-judge-severity"
          className={`text-(--text-status) font-semibold uppercase tracking-wide ${judgeSeverityClass(props.result.severity)}`}
        >
          {props.result.severity}
        </span>
        {props.result.labels.length === 0 ? (
          <span
            data-testid="ai-judge-pass"
            className="text-(--text-caption) text-[var(--color-fg-default)]"
          >
            {t("ai.judgePass")}
          </span>
        ) : (
          props.result.labels.map((label) => (
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
        {props.result.summary}
      </Text>
      {props.result.partialChecksSkipped ? (
        <Text data-testid="ai-judge-partial" size="small" color="muted">
          {t("ai.judgePartialSkipped")}
        </Text>
      ) : null}
    </div>
  );
}

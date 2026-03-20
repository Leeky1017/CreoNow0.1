import { useTranslation } from "react-i18next";
import { formatTokenValue, formatUsd } from "./aiPanelFormatting";

type AiUsageStatsProps = {
  promptTokens: number;
  completionTokens: number;
  sessionTotalTokens: number;
  estimatedCostUsd?: number;
  className?: string;
};

export function AiUsageStats(props: AiUsageStatsProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      data-testid="ai-usage-stats"
      className={`w-full rounded-[var(--radius-md)] bg-[var(--color-bg-base)] px-3 py-2 ${props.className ?? ""}`}
    >
      <div className="text-[10px] text-[var(--color-fg-muted)] mb-1" data-testid="ai-usage-annotation">
        {t("ai.usageAnnotation")}
      </div>
      <div className="space-y-0.5 text-[11px] text-[var(--color-fg-muted)]">
        <div>
          {t("ai.panel.usagePrompt")}{" "}
          <span data-testid="ai-usage-prompt-tokens">
            {formatTokenValue(props.promptTokens)}
          </span>
        </div>
        <div>
          {t("ai.usageOutput")}{" "}
          <span data-testid="ai-usage-completion-tokens">
            {formatTokenValue(props.completionTokens)}
          </span>
        </div>
        <div>
          {t("ai.usageSessionTotal")}{" "}
          <span data-testid="ai-usage-session-total-tokens">
            {formatTokenValue(props.sessionTotalTokens)}
          </span>
        </div>
        {typeof props.estimatedCostUsd === "number" ? (
          <div>
            {t("ai.usageCostEstimate")}{" "}
            <span data-testid="ai-usage-estimated-cost">
              {formatUsd(props.estimatedCostUsd)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

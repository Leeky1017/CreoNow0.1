import { useTranslation } from "react-i18next";
import type { AiErrorType } from "./types";

export type RetryState = "idle" | "loading" | "success" | "error";

const ExternalLinkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 256 256"><path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" /></svg>);
const Spinner = ({ className = "" }: { className?: string }) => (<svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>);
const buttonContainerStyles = ["flex", "items-center", "gap-2"].join(" ");
const retryButtonStyles = [
  "text-xs font-medium text-[var(--color-fg-default)] bg-[var(--color-bg-hover)]",
  "hover:bg-[var(--color-bg-active)] px-3 py-1.5 rounded-[var(--radius-sm)]",
  "transition-colors duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] disabled:opacity-50 disabled:cursor-not-allowed",
  "flex items-center gap-1.5",
].join(" ");
const upgradeButtonStyles = [
  "text-xs font-medium text-[var(--color-bg-base)] bg-[var(--color-warning)]",
  "hover:bg-[var(--color-warning)]/80 px-3 py-1.5 rounded-[var(--radius-sm)]",
  "transition-colors duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");
const linkButtonStyles = [
  "text-xs font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]",
  "px-2 flex items-center gap-1",
  "transition-colors duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

function RetryButtonContent(props: {
  retryState: RetryState;
  isTimeout: boolean;
}): JSX.Element {
  const { t } = useTranslation();

  if (props.retryState === "loading") {
    return (
      <>
        <Spinner />
        <span>{t("ai.error.retrying")}</span>
      </>
    );
  }
  if (props.retryState === "success") {
    return (
      <span className="text-[var(--color-success)]">
        {t("ai.error.success")}
      </span>
    );
  }
  if (props.retryState === "error") {
    return (
      <span className="text-[var(--color-error)]">{t("ai.error.failed")}</span>
    );
  }
  return (
    <span>
      {props.isTimeout ? t("ai.error.tryAgain") : t("ai.error.retry")}
    </span>
  );
}

export function AiErrorCardActions(props: {
  errorType: AiErrorType;
  retryState: RetryState;
  isRetryDisabled: boolean;
  onRetry?: () => void;
  onUpgradePlan?: () => void;
  onViewUsage?: () => void;
  onCheckStatus?: () => void;
  handleRetry: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={buttonContainerStyles}>
      {props.errorType === "usage_limit" && (
        <>
          {props.onUpgradePlan && (
            // eslint-disable-next-line creonow/no-native-html-element -- specialized button
            <button
              type="button"
              className={upgradeButtonStyles}
              onClick={props.onUpgradePlan}
            >
              {t("ai.error.upgradePlan")}
            </button>
          )}
          {props.onViewUsage && (
            // eslint-disable-next-line creonow/no-native-html-element -- specialized button
            <button
              type="button"
              className={linkButtonStyles}
              onClick={props.onViewUsage}
            >
              {t("ai.error.viewUsage")}
            </button>
          )}
        </>
      )}

      {props.errorType === "service_error" && (
        <>
          {props.onRetry && (
            // eslint-disable-next-line creonow/no-native-html-element -- specialized button
            <button
              type="button"
              className={retryButtonStyles}
              onClick={props.handleRetry}
              disabled={props.retryState === "loading"}
            >
              <RetryButtonContent
                retryState={props.retryState}
                isTimeout={false}
              />
            </button>
          )}
          {props.onCheckStatus && (
            // eslint-disable-next-line creonow/no-native-html-element -- specialized button
            <button
              type="button"
              className={linkButtonStyles}
              onClick={props.onCheckStatus}
            >
              {t("ai.error.checkStatus")}
              <ExternalLinkIcon />
            </button>
          )}
        </>
      )}

      {(props.errorType === "connection_failed" ||
        props.errorType === "timeout" ||
        props.errorType === "rate_limit") &&
        props.onRetry && (
          // eslint-disable-next-line creonow/no-native-html-element -- specialized button
          <button
            type="button"
            className={retryButtonStyles}
            onClick={props.handleRetry}
            disabled={props.isRetryDisabled}
          >
            <RetryButtonContent
              retryState={props.retryState}
              isTimeout={props.errorType === "timeout"}
            />
          </button>
        )}
    </div>
  );
}

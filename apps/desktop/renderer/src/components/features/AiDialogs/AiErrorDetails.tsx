import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { AiErrorType, AiErrorConfig } from "./types";

const WifiOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M229.94,90.93a8,8,0,0,1-11.32.52,172,172,0,0,0-141.59-41.06,8,8,0,1,1-3.18-15.68A188.34,188.34,0,0,1,230.46,79.6,8,8,0,0,1,229.94,90.93ZM213.92,152a8,8,0,0,0-11.84-10.79,76.05,76.05,0,0,0-105.29,1.55,8,8,0,0,0,11.36,11.26,60,60,0,0,1,83.09-1.22A8,8,0,0,0,213.92,152ZM128,192a12,12,0,1,0,12,12A12,12,0,0,0,128,192ZM53.92,34.62A8,8,0,1,0,42.08,45.38L73.55,79.36A188.2,188.2,0,0,0,25.54,79.6,8,8,0,0,0,26.06,90.93a8,8,0,0,0,5.19,1.92,8,8,0,0,0,5.08-1.79,172.18,172.18,0,0,1,44.14-26.84L97,82.06a148.36,148.36,0,0,0-50.13,35.85,8,8,0,0,0,11.7,10.91,132.72,132.72,0,0,1,47.6-32.51l19.07,21a108.25,108.25,0,0,0-46.57,28.71,8,8,0,1,0,11.56,11.06,92.23,92.23,0,0,1,42.85-25.38l25.31,27.84a60,60,0,0,0-30.27,18.17,8,8,0,1,0,11.68,10.93,44,44,0,0,1,29.87-15.05l37.75,41.52a8,8,0,1,0,11.84-10.76Z" /></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" /></svg>);
const ThrottleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" /></svg>);
const LimitIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" /></svg>);
const ServerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M80,112a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H88A8,8,0,0,1,80,112Zm144-48V200a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V64A16,16,0,0,1,48,48H208A16,16,0,0,1,224,64ZM48,104H208V64H48v40Zm160,16v80H48V120Zm-16,32a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V160A8,8,0,0,0,192,152Zm-48,0a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V160A8,8,0,0,0,144,152Z" /></svg>);

function getIconByType(type: AiErrorType): JSX.Element {
  switch (type) {
    case "connection_failed":
      return <WifiOffIcon />;
    case "timeout":
      return <ClockIcon />;
    case "rate_limit":
      return <ThrottleIcon />;
    case "usage_limit":
      return <LimitIcon />;
    case "service_error":
      return <ServerIcon />;
    default:
      return <ThrottleIcon />;
  }
}

function getIconColorsByType(type: AiErrorType): { bg: string; text: string } {
  switch (type) {
    case "connection_failed":
    // fall through
    case "timeout":
    // fall through
    case "rate_limit":
      return {
        bg: "bg-[var(--color-warning-subtle)]",
        text: "text-[var(--color-warning)]",
      };
    case "usage_limit":
      return {
        bg: "bg-[var(--color-warning-subtle)]",
        text: "text-[var(--color-warning)]",
      };
    case "service_error":
      return {
        bg: "bg-[var(--color-error-subtle)]",
        text: "text-[var(--color-error)]",
      };
    default:
      return {
        bg: "bg-[var(--color-warning-subtle)]",
        text: "text-[var(--color-warning)]",
      };
  }
}

export function getBorderColorByType(type: AiErrorType): string {
  switch (type) {
    case "service_error":
      return "border-[var(--color-error)]/20";
    default:
      return "border-[var(--color-warning)]/20";
  }
}

/** Resolve background colour token from error type. */
export function getBgColorByType(type: AiErrorType): string {
  if (type === "rate_limit" || type === "usage_limit") {
    return "bg-[var(--color-bg-raised)]";
  }
  return "bg-[var(--color-error-subtle)]";
}

const contentStyles = ["flex", "items-start", "gap-3"].join(" ");
const iconContainerStyles = [
  "p-1.5 rounded-[var(--radius-sm)] shrink-0 mt-0.5",
].join(" ");
const titleStyles = [
  "text-sm font-medium text-[var(--color-fg-default)] mb-0.5",
].join(" ");
const descriptionStyles = [
  "text-xs text-[var(--color-fg-muted)] leading-snug mb-2",
].join(" ");
const errorCodeStyles = [
  "text-[10px] font-mono text-[var(--color-error)] mb-2",
].join(" ");
const countdownStyles = [
  "text-[10px] font-mono text-[var(--color-warning)] bg-[var(--color-warning-subtle)]",
  "inline-block px-1.5 py-0.5 rounded-[var(--radius-sm)]",
  "border border-[var(--color-warning)]/10 mb-2",
].join(" ");
const readyToRetryStyles = [
  "text-[10px] font-mono text-[var(--color-success)] bg-[var(--color-success-subtle)]",
  "inline-block px-1.5 py-0.5 rounded-[var(--radius-sm)]",
  "border border-[var(--color-success)]/10 mb-2 animate-pulse",
].join(" ");

interface AiErrorDetailsProps {
  error: AiErrorConfig;
  errorCodeTestId?: string;
  localizedErrorCode: string | null;
  countdown: number;
  countdownComplete: boolean;
  children?: ReactNode;
}

export function AiErrorDetails({
  error,
  errorCodeTestId,
  localizedErrorCode,
  countdown,
  countdownComplete,
  children,
}: AiErrorDetailsProps): JSX.Element {
  const { t } = useTranslation();
  const iconColors = getIconColorsByType(error.type);

  return (
    <div className={contentStyles}>
      {/* Icon */}
      <div
        className={`${iconContainerStyles} ${iconColors.bg} ${iconColors.text}`}
      >
        {getIconByType(error.type)}
      </div>

      {/* Content */}
      <div className="flex-1 pr-6">
        <h4 className={titleStyles}>{error.title}</h4>

        <p className={descriptionStyles}>{error.description}</p>

        {/* Error code for service errors */}
        {localizedErrorCode ? (
          <div data-testid={errorCodeTestId} className={errorCodeStyles}>
            {localizedErrorCode}
          </div>
        ) : null}

        {/* Countdown for rate limit */}
        {error.type === "rate_limit" && countdown > 0 && (
          <div className={countdownStyles}>
            {t("ai.error.countdownRetry", { seconds: countdown })}
          </div>
        )}

        {/* Ready to retry message when countdown completes */}
        {error.type === "rate_limit" &&
          countdownComplete &&
          countdown === 0 && (
            <div className={readyToRetryStyles}>
              {t("ai.error.readyToRetry")}
            </div>
          )}

        {/* Actions (passed as children) */}
        {children}
      </div>
    </div>
  );
}

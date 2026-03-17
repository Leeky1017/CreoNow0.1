import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { IpcErrorCode } from "@shared/types/ipc-generated";

import { getHumanErrorMessage } from "../../../lib/errorMessages";
import type { AiErrorCardProps, AiErrorType } from "./types";

/* eslint-disable creonow/no-native-html-element -- AiErrorCard uses specialized action buttons (retry, upgrade, dismiss) that don't map to the Button primitive */

/**

 * Card state for tracking visibility and loading

 */

type CardState = "visible" | "dismissing" | "dismissed";

type RetryState = "idle" | "loading" | "success" | "error";

/**

 * Icon components for different error types

 */

const WifiOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M229.94,90.93a8,8,0,0,1-11.32.52,172,172,0,0,0-141.59-41.06,8,8,0,1,1-3.18-15.68A188.34,188.34,0,0,1,230.46,79.6,8,8,0,0,1,229.94,90.93ZM213.92,152a8,8,0,0,0-11.84-10.79,76.05,76.05,0,0,0-105.29,1.55,8,8,0,0,0,11.36,11.26,60,60,0,0,1,83.09-1.22A8,8,0,0,0,213.92,152ZM128,192a12,12,0,1,0,12,12A12,12,0,0,0,128,192ZM53.92,34.62A8,8,0,1,0,42.08,45.38L73.55,79.36A188.2,188.2,0,0,0,25.54,79.6,8,8,0,0,0,26.06,90.93a8,8,0,0,0,5.19,1.92,8,8,0,0,0,5.08-1.79,172.18,172.18,0,0,1,44.14-26.84L97,82.06a148.36,148.36,0,0,0-50.13,35.85,8,8,0,0,0,11.7,10.91,132.72,132.72,0,0,1,47.6-32.51l19.07,21a108.25,108.25,0,0,0-46.57,28.71,8,8,0,1,0,11.56,11.06,92.23,92.23,0,0,1,42.85-25.38l25.31,27.84a60,60,0,0,0-30.27,18.17,8,8,0,1,0,11.68,10.93,44,44,0,0,1,29.87-15.05l37.75,41.52a8,8,0,1,0,11.84-10.76Z" />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
  </svg>
);

const ThrottleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" />
  </svg>
);

const LimitIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" />
  </svg>
);

const ServerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M80,112a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H88A8,8,0,0,1,80,112Zm144-48V200a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V64A16,16,0,0,1,48,48H208A16,16,0,0,1,224,64ZM48,104H208V64H48v40Zm160,16v80H48V120Zm-16,32a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V160A8,8,0,0,0,192,152Zm-48,0a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V160A8,8,0,0,0,144,152Z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="10"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
  </svg>
);

/**

 * Loading spinner component

 */

const Spinner = ({ className = "" }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />

    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

/**

 * Get icon component by error type

 */

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

/**

 * Get icon background/text color by error type

 */

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

/**

 * Get card border color by error type

 */

function getBorderColorByType(type: AiErrorType): string {
  switch (type) {
    case "service_error":
      return "border-[var(--color-error)]/20";

    default:
      return "border-[var(--color-warning)]/20";
  }
}

/** Resolve background colour token from error type. */
function getBgColorByType(type: AiErrorType): string {
  if (type === "rate_limit" || type === "usage_limit") {
    return "bg-[var(--color-bg-raised)]";
  }
  return "bg-[var(--color-error-subtle)]";
}

/**
 * RetryButtonContent – renders the correct label / spinner for retry state.
 */
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

/**
 * AiErrorCardActions – action button group extracted to reduce parent complexity.
 */
function AiErrorCardActions(props: {
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
            <button
              type="button"
              className={upgradeButtonStyles}
              onClick={props.onUpgradePlan}
            >
              {t("ai.error.upgradePlan")}
            </button>
          )}
          {props.onViewUsage && (
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

/**

 * Card styles

 */

const cardStyles = [
  "rounded-[var(--radius-lg)]",

  "p-3",

  "border",

  "relative",

  "transition-all",

  "duration-[var(--duration-normal)]",

  "ease-[var(--ease-default)]",
].join(" ");

const contentStyles = ["flex", "items-start", "gap-3"].join(" ");

const iconContainerStyles = [
  "p-1.5",

  "rounded-[var(--radius-sm)]",

  "shrink-0",

  "mt-0.5",
].join(" ");

const titleStyles = [
  "text-sm",

  "font-medium",

  "text-[var(--color-fg-default)]",

  "mb-0.5",
].join(" ");

const descriptionStyles = [
  "text-xs",

  "text-[var(--color-fg-muted)]",

  "leading-snug",

  "mb-2",
].join(" ");

const errorCodeStyles = [
  "text-[10px]",

  "font-mono",

  "text-[var(--color-error)]",

  "mb-2",
].join(" ");

const countdownStyles = [
  "text-[10px]",

  "font-mono",

  "text-[var(--color-warning)]",

  "bg-[var(--color-warning-subtle)]",

  "inline-block",

  "px-1.5",

  "py-0.5",

  "rounded-[var(--radius-sm)]",

  "border",

  "border-[var(--color-warning)]/10",

  "mb-2",
].join(" ");

const readyToRetryStyles = [
  "text-[10px]",

  "font-mono",

  "text-[var(--color-success)]",

  "bg-[var(--color-success-subtle)]",

  "inline-block",

  "px-1.5",

  "py-0.5",

  "rounded-[var(--radius-sm)]",

  "border",

  "border-[var(--color-success)]/10",

  "mb-2",

  "animate-pulse",
].join(" ");

const buttonContainerStyles = ["flex", "items-center", "gap-2"].join(" ");

const retryButtonStyles = [
  "text-xs",

  "font-medium",

  "text-[var(--color-fg-default)]",

  "bg-[var(--color-bg-hover)]",

  "hover:bg-[var(--color-bg-active)]",

  "px-3",

  "py-1.5",

  "rounded-[var(--radius-sm)]",

  "transition-colors",

  "duration-[var(--duration-fast)]",

  "focus-visible:outline",

  "focus-visible:outline-[length:var(--ring-focus-width)]",

  "focus-visible:outline-offset-[var(--ring-focus-offset)]",

  "focus-visible:outline-[var(--color-ring-focus)]",

  "disabled:opacity-50",

  "disabled:cursor-not-allowed",

  "flex",

  "items-center",

  "gap-1.5",
].join(" ");

const upgradeButtonStyles = [
  "text-xs",

  "font-medium",

  "text-[var(--color-bg-base)]",

  "bg-[var(--color-warning)]",

  "hover:bg-[var(--color-warning)]/80",

  "px-3",

  "py-1.5",

  "rounded-[var(--radius-sm)]",

  "transition-colors",

  "duration-[var(--duration-fast)]",

  "focus-visible:outline",

  "focus-visible:outline-[length:var(--ring-focus-width)]",

  "focus-visible:outline-offset-[var(--ring-focus-offset)]",

  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

const linkButtonStyles = [
  "text-xs",

  "font-medium",

  "text-[var(--color-fg-muted)]",

  "hover:text-[var(--color-fg-default)]",

  "px-2",

  "flex",

  "items-center",

  "gap-1",

  "transition-colors",

  "duration-[var(--duration-fast)]",

  "focus-visible:outline",

  "focus-visible:outline-[length:var(--ring-focus-width)]",

  "focus-visible:outline-offset-[var(--ring-focus-offset)]",

  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

const dismissButtonStyles = [
  "absolute",

  "top-2",

  "right-2",

  "p-1",

  "rounded-[var(--radius-sm)]",

  "text-[var(--color-fg-muted)]",

  "hover:text-[var(--color-fg-default)]",

  "hover:bg-[var(--color-bg-hover)]",

  "transition-colors",

  "duration-[var(--duration-fast)]",

  "focus-visible:outline",

  "focus-visible:outline-[length:var(--ring-focus-width)]",

  "focus-visible:outline-offset-[var(--ring-focus-offset)]",

  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

/**

 * AiErrorCard - Error state card for AI operations

 *

 * Displays different error states with appropriate icons and actions.

 * Features:

 * - Dismiss button with fade-out animation

 * - Retry loading state with spinner

 * - Countdown timer with "Ready to retry" state

 *

 * @example

 * ```tsx

 * <AiErrorCard

 *   error={{

 *     type: "connection_failed",

 *     title: "Connection Failed",

 *     description: "Unable to reach AI service.",

 *   }}

 *   onRetry={() => retryRequest()}

 *   onDismiss={() => hideError()}

 * />

 * ```

 */

export function AiErrorCard({
  error,

  errorCodeTestId,

  onRetry,

  onUpgradePlan,

  onViewUsage,

  onCheckStatus,

  onDismiss,

  showDismiss = true,

  className = "",
}: AiErrorCardProps): JSX.Element | null {
  const { t } = useTranslation();

  // Initialize countdown from props - use a ref to track the initial value

  const initialCountdown =
    error.type === "rate_limit" ? (error.countdownSeconds ?? 0) : 0;

  const [countdown, setCountdown] = useState(initialCountdown);

  const [cardState, setCardState] = useState<CardState>("visible");

  const [retryState, setRetryState] = useState<RetryState>("idle");

  const [countdownComplete, setCountdownComplete] = useState(false);

  const prevCountdownRef = useRef(error.countdownSeconds);

  const iconColors = getIconColorsByType(error.type);

  const borderColor = getBorderColorByType(error.type);

  const bgColor = getBgColorByType(error.type);

  // Countdown timer for rate limit errors

  useEffect(() => {
    if (error.type !== "rate_limit" || !error.countdownSeconds) {
      return;
    }

    // Only reset countdown if the countdownSeconds prop changed

    if (prevCountdownRef.current !== error.countdownSeconds) {
      prevCountdownRef.current = error.countdownSeconds;

      // Use functional update to avoid direct setState in effect
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          setCountdownComplete(true);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [error.type, error.countdownSeconds]);

  const isRetryDisabled =
    (error.type === "rate_limit" && countdown > 0) || retryState === "loading";

  const handleDismiss = useCallback(() => {
    setCardState("dismissing");

    // Wait for animation to complete

    setTimeout(() => {
      setCardState("dismissed");

      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  const handleRetry = useCallback(async () => {
    if (retryState === "loading") return;

    setRetryState("loading");
    try {
      await onRetry?.();
      setRetryState("success");
      setTimeout(() => {
        handleDismiss();
      }, 500);
    } catch {
      setRetryState("error");
      setTimeout(() => {
        setRetryState("idle");
      }, 2000);
    }
  }, [onRetry, handleDismiss, retryState]);

  // Don't render if dismissed

  if (cardState === "dismissed") {
    return null;
  }

  // Opacity class for dismissing animation

  const opacityClass =
    cardState === "dismissing" ? "opacity-0 scale-95" : "opacity-100 scale-100";
  const localizedErrorCode = error.errorCode
    ? getHumanErrorMessage({
        code: error.errorCode as IpcErrorCode,
        message: error.errorCode,
      })
    : null;

  return (
    <div
      className={`${cardStyles} ${bgColor} ${borderColor} ${opacityClass} ${className}`}
    >
      {/* Dismiss button */}

      {showDismiss && (
        <button
          type="button"
          className={dismissButtonStyles}
          onClick={handleDismiss}
          title={t("ai.error.dismiss")}
        >
          <CloseIcon />
        </button>
      )}

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

          {/* Actions */}

          <AiErrorCardActions
            errorType={error.type}
            retryState={retryState}
            isRetryDisabled={isRetryDisabled}
            onRetry={onRetry}
            onUpgradePlan={onUpgradePlan}
            onViewUsage={onViewUsage}
            onCheckStatus={onCheckStatus}
            handleRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  );
}

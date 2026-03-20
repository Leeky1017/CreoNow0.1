import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { IpcErrorCode } from "@shared/types/ipc-generated";

import { getHumanErrorMessage } from "../../../lib/errorMessages";
import type { AiErrorCardProps } from "./types";
import {
  getBorderColorByType,
  getBgColorByType,
  AiErrorDetails,
} from "./AiErrorDetails";
import { type RetryState, AiErrorCardActions } from "./AiErrorActions";

type CardState = "visible" | "dismissing" | "dismissed";

const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" /></svg>);
const cardStyles = [
  "rounded-[var(--radius-lg)] p-3 border relative",
  "transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)]",
].join(" ");
const dismissButtonStyles = [
  "absolute top-2 right-2 p-1",
  "rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]",
  "transition-colors duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

/** AiErrorCard - Error state card for AI operations Displays different error states with appropriate icons and actions. Features: - Dismiss button with fade-out animation - Retry loading state with spinner - Countdown timer with "Ready to retry" state
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
        // eslint-disable-next-line creonow/no-native-html-element -- specialized button
        <button
          type="button"
          className={dismissButtonStyles}
          onClick={handleDismiss}
          title={t("ai.error.dismiss")}
        >
          <CloseIcon />
        </button>
      )}

      <AiErrorDetails
        error={error}
        errorCodeTestId={errorCodeTestId}
        localizedErrorCode={localizedErrorCode}
        countdown={countdown}
        countdownComplete={countdownComplete}
      >
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
      </AiErrorDetails>
    </div>
  );
}

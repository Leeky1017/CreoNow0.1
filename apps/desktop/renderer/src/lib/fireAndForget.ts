export type FireAndForgetOptions = {
  label?: string;
  onError?: (error: unknown) => void;
  critical?: boolean;
};

/**
 * Execute a promise-returning task without awaiting the caller path.
 *
 * Why: renderer fire-and-forget flows must always attach rejection handling.
 */
export function runFireAndForget(
  task: () => Promise<void>,
  options?: FireAndForgetOptions | ((error: unknown) => void),
): void {
  const normalized: FireAndForgetOptions =
    typeof options === "function"
      ? { onError: options, critical: false }
      : options ?? {};

  const { label, onError, critical = true } = normalized;

  const baseMessage = critical
    ? "[fire-and-forget][critical] task failed"
    : "[fire-and-forget][non-critical] task failed";

  const logTaskError = (error: unknown): void => {
    const details = {
      label: label ?? "unknown",
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      critical,
    };

    // TODO(C9): wire to central telemetry once available
    // For now we keep console output as the observable surface.
    if (critical) {
      // eslint-disable-next-line no-console
      console.error(baseMessage, details, error);
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(baseMessage, details, error);
  };

  const safeHandleError = (error: unknown): void => {
    try {
      onError?.(error);
    } catch (handlerError) {
      // Secondary exception from error handler must be observable but not crash the app.
      const secondaryDetails = {
        label: label ?? "unknown",
        errorType:
          handlerError instanceof Error ? handlerError.name : typeof handlerError,
        message:
          handlerError instanceof Error
            ? handlerError.message
            : String(handlerError),
      };
      // eslint-disable-next-line no-console
      console.error("[fire-and-forget] error handler failed", secondaryDetails);
    } finally {
      logTaskError(error);
    }
  };

  void task().catch((error) => {
    safeHandleError(error);
  });
}

import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
import { AiErrorCard } from "./AiErrorCard";
import type { AiErrorConfig, AiErrorType } from "./types";
import { within, expect } from "@storybook/test";

const meta: Meta = {
  title: "Features/AiDialogs/States",
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "var(--color-bg-base)" },
        { name: "surface", value: "var(--color-bg-surface)" },
      ],
    },
  },
};

export default meta;

// =============================================================================
// Data & Helpers
// =============================================================================

const errorConfigs: Record<AiErrorType, AiErrorConfig> = {
  connection_failed: {
    type: "connection_failed",
    title: "Connection Failed",
    description:
      "Unable to reach the AI service. Please check your internet connection and try again.",
  },
  timeout: {
    type: "timeout",
    title: "Request Timed Out",
    description:
      "The AI took too long to respond. This might be due to high demand or complex requests.",
  },
  rate_limit: {
    type: "rate_limit",
    title: "Too Many Requests",
    description:
      "You've made too many requests in a short period. Please wait before trying again.",
    countdownSeconds: 45,
  },
  usage_limit: {
    type: "usage_limit",
    title: "Usage Limit Reached",
    description:
      "You've reached your monthly AI usage limit. Upgrade your plan for unlimited access.",
  },
  service_error: {
    type: "service_error",
    title: "Service Temporarily Unavailable",
    description:
      "Our AI service is currently experiencing issues. We're working to resolve this.",
    errorCode: "upstream_error_503",
  },
};

function waitForDemo(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// =============================================================================
// Error Wrapper Components
// =============================================================================

function ErrorRetryLoadingWrapper() {
  const [key, setKey] = useState(0);
  return (
    <div className="w-[400px] space-y-4">
      <div className="flex items-center gap-4">
        <button
          className="px-3 py-1.5 text-xs bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
          onClick={() => setKey((k) => k + 1)}
        >
          Reset Demo
        </button>
        <span className="text-xs text-[var(--color-fg-muted)]">
          Click Retry to see loading → success → dismiss
        </span>
      </div>
      <div className="p-4 bg-[var(--color-bg-base)]">
        <AiErrorCard
          key={key}
          error={errorConfigs.connection_failed}
          onRetry={async () => {
            console.log("Retrying...");
            await waitForDemo(2000);
          }}
        />
      </div>
    </div>
  );
}

function ErrorRetryFailedWrapper() {
  const [key, setKey] = useState(0);
  return (
    <div className="w-[400px] space-y-4">
      <div className="flex items-center gap-4">
        <button
          className="px-3 py-1.5 text-xs bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
          onClick={() => setKey((k) => k + 1)}
        >
          Reset Demo
        </button>
        <span className="text-xs text-[var(--color-fg-muted)]">
          Click Retry to see loading → failed → reset
        </span>
      </div>
      <div className="p-4 bg-[var(--color-bg-base)]">
        <AiErrorCard
          key={key}
          error={errorConfigs.timeout}
          onRetry={async () => {
            console.log("Retrying...");
            await waitForDemo(1500);
            throw new Error("Story demo retry failure");
          }}
        />
      </div>
    </div>
  );
}

function ErrorDismissAnimationWrapper() {
  const [key, setKey] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const handleReset = useCallback(() => {
    setKey((k) => k + 1);
    setDismissed(false);
  }, []);

  return (
    <div className="w-[400px] space-y-4">
      <div className="flex items-center gap-4">
        <button
          className="px-3 py-1.5 text-xs bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
          onClick={handleReset}
        >
          Reset Demo
        </button>
        <span className="text-xs text-[var(--color-fg-muted)]">
          Click the X button to dismiss
        </span>
        {dismissed && (
          <span className="text-xs text-[var(--color-success)]">
            Dismissed!
          </span>
        )}
      </div>
      <div className="p-4 bg-[var(--color-bg-base)] min-h-[120px]">
        <AiErrorCard
          key={key}
          error={errorConfigs.service_error}
          onRetry={() => console.log("Retrying...")}
          onDismiss={() => setDismissed(true)}
          showDismiss={true}
        />
      </div>
    </div>
  );
}

function ErrorCountdownCompleteWrapper() {
  const [key, setKey] = useState(0);
  const shortCountdownError: AiErrorConfig = {
    type: "rate_limit",
    title: "Too Many Requests",
    description: "Please wait before trying again.",
    countdownSeconds: 5,
  };
  return (
    <div className="w-[400px] space-y-4">
      <div className="flex items-center gap-4">
        <button
          className="px-3 py-1.5 text-xs bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
          onClick={() => setKey((k) => k + 1)}
        >
          Reset Demo (5s countdown)
        </button>
      </div>
      <div className="p-4 bg-[var(--color-bg-base)]">
        <AiErrorCard
          key={key}
          error={shortCountdownError}
          onRetry={() => console.log("Retrying...")}
        />
      </div>
    </div>
  );
}

// =============================================================================
// 3. Error Card Stories
// =============================================================================

/**
 * Retry with loading state
 */
export const ErrorRetryLoading: StoryObj = {
  render: () => <ErrorRetryLoadingWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * Retry with failure state
 */
export const ErrorRetryFailed: StoryObj = {
  render: () => <ErrorRetryFailedWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * Dismiss animation
 */
export const ErrorDismissAnimation: StoryObj = {
  render: () => <ErrorDismissAnimationWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * Rate limit countdown completion
 */
export const ErrorCountdownComplete: StoryObj = {
  render: () => <ErrorCountdownCompleteWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * All error states displayed together
 */
export const AllErrorStates: StoryObj = {
  render: () => (
    <div className="w-[400px] h-[600px] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg overflow-hidden flex flex-col">
      <div className="h-10 border-b border-[var(--color-separator)] bg-[var(--color-bg-raised)] px-4 flex items-center justify-between shrink-0">
        <span className="text-xs font-medium text-[var(--color-fg-muted)]">
          AI Assistant Panel
        </span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-error)]/20" />
          <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]/20" />
        </div>
      </div>
      <div className="flex-1 bg-[var(--color-bg-base)] p-4 space-y-4 overflow-y-auto">
        <AiErrorCard
          error={errorConfigs.connection_failed}
          onRetry={() => console.log("Retry")}
        />
        <AiErrorCard
          error={errorConfigs.timeout}
          onRetry={() => console.log("Retry")}
        />
        <AiErrorCard
          error={{ ...errorConfigs.rate_limit, countdownSeconds: 10 }}
          onRetry={() => console.log("Retry")}
        />
        <AiErrorCard
          error={errorConfigs.usage_limit}
          onUpgradePlan={() => console.log("Upgrade")}
          onViewUsage={() => console.log("View usage")}
        />
        <AiErrorCard
          error={errorConfigs.service_error}
          onRetry={() => console.log("Retry")}
          onCheckStatus={() => console.log("Check status")}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

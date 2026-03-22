import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
import { AiErrorCard } from "./AiErrorCard";
import { SystemDialog } from "./SystemDialog";
import type { AiErrorConfig, AiErrorType } from "./types";

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
// System Dialog Wrapper Components
// =============================================================================

function SystemDeleteWithLoadingWrapper() {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-[200px] h-[100px]">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => setOpen(true)}
      >
        Open Delete Dialog
      </button>
      <div className="mt-2 text-xs text-[var(--color-fg-muted)]">
        Click Delete to see loading state
      </div>
      <SystemDialog
        open={open}
        onOpenChange={setOpen}
        type="delete"
        onPrimaryAction={() => console.log("Deleted")}
        onSecondaryAction={() => setOpen(false)}
        simulateDelay={2000}
      />
    </div>
  );
}

function SystemKeyboardNavigationWrapper() {
  const [open, setOpen] = useState(true);
  const [lastAction, setLastAction] = useState<string>("");
  return (
    <div className="w-[300px] space-y-4">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => {
          setOpen(true);
          setLastAction("");
        }}
      >
        Open Dialog
      </button>
      <div className="text-xs text-[var(--color-fg-muted)]">
        <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-hover)] rounded text-[10px]">
          Enter
        </kbd>{" "}
        Confirm ·{" "}
        <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-hover)] rounded text-[10px]">
          Esc
        </kbd>{" "}
        Cancel
      </div>
      {lastAction && (
        <div className="text-xs text-[var(--color-success)]">
          Last action: {lastAction}
        </div>
      )}
      <SystemDialog
        open={open}
        onOpenChange={setOpen}
        type="delete"
        onPrimaryAction={() => setLastAction("Delete (via Enter or click)")}
        onSecondaryAction={() => setLastAction("Cancel (via Escape or click)")}
        showKeyboardHints={true}
        simulateDelay={1500}
      />
    </div>
  );
}

function SystemCustomLabelsWrapper() {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-[200px] h-[100px]">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => setOpen(true)}
      >
        Open Dialog
      </button>
      <SystemDialog
        open={open}
        onOpenChange={setOpen}
        type="delete"
        title="Remove Project?"
        description="This will remove the project from your workspace. You can restore it from the trash within 30 days."
        primaryLabel="Remove Project"
        secondaryLabel="Keep Project"
        onPrimaryAction={() => setOpen(false)}
        onSecondaryAction={() => setOpen(false)}
        showKeyboardHints={false}
      />
    </div>
  );
}

function SystemUnsavedChangesWrapper() {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-[200px] h-[100px]">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => setOpen(true)}
      >
        Open Unsaved Changes Dialog
      </button>
      <SystemDialog
        open={open}
        onOpenChange={setOpen}
        type="unsaved_changes"
        onPrimaryAction={() => console.log("Saved")}
        onSecondaryAction={() => setOpen(false)}
        onTertiaryAction={() => {
          console.log("Discarded");
          setOpen(false);
        }}
        simulateDelay={1500}
      />
    </div>
  );
}

function SystemExportCompleteWrapper() {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-[200px] h-[100px]">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => setOpen(true)}
      >
        Open Export Complete Dialog
      </button>
      <SystemDialog
        open={open}
        onOpenChange={setOpen}
        type="export_complete"
        onPrimaryAction={() => console.log("Opening file...")}
        onSecondaryAction={() => setOpen(false)}
        simulateDelay={1000}
      />
    </div>
  );
}

function AllSystemDialogsWrapper() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="text-sm text-[var(--color-fg-muted)] mb-4">
        Click buttons to open each dialog type:
      </div>
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-[var(--color-error-subtle)] text-[var(--color-error)] rounded"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </button>
        <button
          className="px-4 py-2 bg-[var(--color-warning-subtle)] text-[var(--color-warning)] rounded"
          onClick={() => setUnsavedOpen(true)}
        >
          Unsaved Changes
        </button>
        <button
          className="px-4 py-2 bg-[var(--color-success-subtle)] text-[var(--color-success)] rounded"
          onClick={() => setExportOpen(true)}
        >
          Export Complete
        </button>
      </div>
      <SystemDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="delete"
        onPrimaryAction={() => setDeleteOpen(false)}
        onSecondaryAction={() => setDeleteOpen(false)}
      />
      <SystemDialog
        open={unsavedOpen}
        onOpenChange={setUnsavedOpen}
        type="unsaved_changes"
        onPrimaryAction={() => setUnsavedOpen(false)}
        onSecondaryAction={() => setUnsavedOpen(false)}
        onTertiaryAction={() => setUnsavedOpen(false)}
      />
      <SystemDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        type="export_complete"
        onPrimaryAction={() => setExportOpen(false)}
        onSecondaryAction={() => setExportOpen(false)}
      />
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
};

/**
 * Retry with failure state
 */
export const ErrorRetryFailed: StoryObj = {
  render: () => <ErrorRetryFailedWrapper />,
};

/**
 * Dismiss animation
 */
export const ErrorDismissAnimation: StoryObj = {
  render: () => <ErrorDismissAnimationWrapper />,
};

/**
 * Rate limit countdown completion
 */
export const ErrorCountdownComplete: StoryObj = {
  render: () => <ErrorCountdownCompleteWrapper />,
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
};

// =============================================================================
// 4. System Dialog Stories
// =============================================================================

/**
 * Delete dialog with loading state
 */
export const SystemDeleteWithLoading: StoryObj = {
  render: () => <SystemDeleteWithLoadingWrapper />,
};

/**
 * Keyboard navigation demo
 */
export const SystemKeyboardNavigation: StoryObj = {
  render: () => <SystemKeyboardNavigationWrapper />,
};

/**
 * Custom button labels
 */
export const SystemCustomLabels: StoryObj = {
  render: () => <SystemCustomLabelsWrapper />,
};

/**
 * Unsaved changes dialog with loading
 */
export const SystemUnsavedChanges: StoryObj = {
  render: () => <SystemUnsavedChangesWrapper />,
};

/**
 * Export complete dialog
 */
export const SystemExportComplete: StoryObj = {
  render: () => <SystemExportCompleteWrapper />,
};

/**
 * All system dialogs showcase
 */
export const AllSystemDialogs: StoryObj = {
  render: () => <AllSystemDialogsWrapper />,
};

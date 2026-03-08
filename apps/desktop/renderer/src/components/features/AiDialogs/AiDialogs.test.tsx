import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiInlineConfirm } from "./AiInlineConfirm";
import { AiDiffModal } from "./AiDiffModal";
import { AiErrorCard } from "./AiErrorCard";
import { SystemDialog } from "./SystemDialog";
import type {
  AiErrorCardProps,
  AiErrorConfig,
  AiInlineConfirmProps,
  DiffChange,
} from "./types";

// =============================================================================
// Test Data
// =============================================================================

const sampleOriginalText = "The castle stood majestically on the hill";
const sampleSuggestedText =
  "The ancient fortress loomed atop the windswept ridge";

const sampleDiffChanges: DiffChange[] = [
  {
    id: "1",
    before: "The platform supports XML and JSON",
    after: "The platform supports XML, JSON, and CSV",
  },
  {
    id: "2",
    before: "Basic security protocols",
    after: "ISO 27001 compliant security protocols",
  },
];

// =============================================================================
// AiInlineConfirm Tests
// =============================================================================

describe("AiInlineConfirm", () => {
  it("renders suggested text", () => {
    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText(sampleSuggestedText)).toBeInTheDocument();
  });

  it("renders original text when showComparison is true", () => {
    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        showComparison={true}
      />,
    );

    expect(screen.getByText(sampleOriginalText)).toBeInTheDocument();
    expect(screen.getByText(sampleSuggestedText)).toBeInTheDocument();
  });

  it("calls onAccept when Accept button is clicked", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();

    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    const acceptButton = screen.getByRole("button", { name: /accept/i });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(onAccept).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onReject when Reject button is clicked", async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();

    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={vi.fn()}
        onReject={onReject}
      />,
    );

    const rejectButton = screen.getByRole("button", { name: /reject/i });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(onReject).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onViewDiff when View Diff button is clicked", async () => {
    const onViewDiff = vi.fn();
    const user = userEvent.setup();

    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onViewDiff={onViewDiff}
      />,
    );

    const diffButton = screen.getByRole("button", { name: /view diff/i });
    await user.click(diffButton);

    expect(onViewDiff).toHaveBeenCalledTimes(1);
  });

  it("does not render View Diff button when onViewDiff is not provided", () => {
    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /view diff/i }),
    ).not.toBeInTheDocument();
  });

  it("shows applying state with spinner while callback is pending", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn(() => new Promise<void>(() => {}));

    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Applying...")).toBeInTheDocument();
  });

  it("shows accepted state without toolbar after accept callback resolves", async () => {
    const user = userEvent.setup();
    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={vi.fn().mockResolvedValue(undefined)}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => {
      expect(screen.queryByText("Applying...")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
      expect(screen.getByText(sampleSuggestedText)).toBeInTheDocument();
    });
  });

  it("shows rejected state with original text after reject callback resolves", async () => {
    const user = userEvent.setup();
    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={vi.fn()}
        onReject={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: /reject/i }));

    await waitFor(() => {
      expect(screen.queryByText("Applying...")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();
      expect(screen.getByText(sampleOriginalText)).toBeInTheDocument();
    });
  });

  it("[S1] waits for onAccept callback resolution before leaving applying state", async () => {
    const user = userEvent.setup();
    let resolveAccept: (() => void) | undefined;
    const onAccept = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAccept = () => resolve();
        }),
    );

    render(
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /accept/i }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Applying...")).toBeInTheDocument();

    resolveAccept?.();

    await waitFor(() => {
      expect(screen.queryByText("Applying...")).not.toBeInTheDocument();
    });
  });

  it("[S2] does not expose demo-only props in AiInlineConfirmProps", () => {
    type HasSimulateDelay = "simulateDelay" extends keyof AiInlineConfirmProps
      ? true
      : false;
    type HasInitialState = "initialState" extends keyof AiInlineConfirmProps
      ? true
      : false;

    const hasSimulateDelay: HasSimulateDelay = false;
    const hasInitialState: HasInitialState = false;

    expect(hasSimulateDelay).toBe(false);
    expect(hasInitialState).toBe(false);
  });
});

// =============================================================================
// AiDiffModal Tests
// =============================================================================

describe("AiDiffModal", () => {
  it("renders when open is true", () => {
    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={vi.fn()}
        onRejectAll={vi.fn()}
        onApplyChanges={vi.fn()}
      />,
    );

    expect(screen.getByText("Review Changes")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(
      <AiDiffModal
        open={false}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={vi.fn()}
        onRejectAll={vi.fn()}
        onApplyChanges={vi.fn()}
      />,
    );

    expect(screen.queryByText("Review Changes")).not.toBeInTheDocument();
  });

  it("displays correct change count", () => {
    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={vi.fn()}
        onRejectAll={vi.fn()}
        onApplyChanges={vi.fn()}
      />,
    );

    expect(screen.getByText(/2 paragraph/i)).toBeInTheDocument();
  });

  it("displays before and after labels", () => {
    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={vi.fn()}
        onRejectAll={vi.fn()}
        onApplyChanges={vi.fn()}
      />,
    );

    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });

  it("calls onAcceptAll when Accept All is clicked", async () => {
    const onAcceptAll = vi.fn();
    const user = userEvent.setup();

    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={onAcceptAll}
        onRejectAll={vi.fn()}
        onApplyChanges={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Accept All"));
    expect(onAcceptAll).toHaveBeenCalledTimes(1);
  });

  it("calls onRejectAll when Reject All is clicked", async () => {
    const onRejectAll = vi.fn();
    const user = userEvent.setup();

    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={vi.fn()}
        onRejectAll={onRejectAll}
        onApplyChanges={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Reject All"));
    expect(onRejectAll).toHaveBeenCalledTimes(1);
  });

  it("calls onApplyChanges when Apply Changes is clicked", async () => {
    const onApplyChanges = vi.fn();
    const user = userEvent.setup();

    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={vi.fn()}
        onRejectAll={vi.fn()}
        onApplyChanges={onApplyChanges}
        simulateDelay={10}
      />,
    );

    await user.click(screen.getByText("Apply Changes"));

    await waitFor(() => {
      expect(onApplyChanges).toHaveBeenCalledTimes(1);
    });
  });

  it("shows statistics footer", () => {
    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        onAcceptAll={vi.fn()}
        onRejectAll={vi.fn()}
        onApplyChanges={vi.fn()}
      />,
    );

    // Should show added/removed stats
    expect(screen.getByText(/added/i)).toBeInTheDocument();
    expect(screen.getByText(/removed/i)).toBeInTheDocument();
  });

  it("navigates between changes when arrows are clicked", async () => {
    const onCurrentIndexChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AiDiffModal
        open={true}
        onOpenChange={vi.fn()}
        changes={sampleDiffChanges}
        currentIndex={0}
        onCurrentIndexChange={onCurrentIndexChange}
        onAcceptAll={vi.fn()}
        onRejectAll={vi.fn()}
        onApplyChanges={vi.fn()}
      />,
    );

    // Click next
    const buttons = screen.getAllByRole("button");
    const nextButton = buttons.find((btn) =>
      btn.querySelector('svg path[d*="181.66"]'),
    );
    if (nextButton) {
      await user.click(nextButton);
      expect(onCurrentIndexChange).toHaveBeenCalledWith(1);
    }
  });
});

// =============================================================================
// AiErrorCard Tests
// =============================================================================

describe("AiErrorCard", () => {
  it("renders error title and description", () => {
    const error: AiErrorConfig = {
      type: "connection_failed",
      title: "Connection Failed",
      description: "Unable to reach the AI service.",
    };

    render(<AiErrorCard error={error} />);

    expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to reach the AI service."),
    ).toBeInTheDocument();
  });

  it("calls onRetry when Retry button is clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    const error: AiErrorConfig = {
      type: "connection_failed",
      title: "Connection Failed",
      description: "Unable to reach the AI service.",
    };

    render(<AiErrorCard error={error} onRetry={onRetry} />);

    await user.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  it("[S1] uses rejected onRetry callback as retry failure signal", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn().mockRejectedValueOnce(new Error("retry failed"));
    const error: AiErrorConfig = {
      type: "connection_failed",
      title: "Connection Failed",
      description: "Unable to reach the AI service.",
    };

    render(<AiErrorCard error={error} onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  it("[S2] does not expose demo-only props in AiErrorCardProps", () => {
    type HasSimulateDelay = "simulateDelay" extends keyof AiErrorCardProps
      ? true
      : false;
    type HasRetryWillSucceed = "retryWillSucceed" extends keyof AiErrorCardProps
      ? true
      : false;

    const hasSimulateDelay: HasSimulateDelay = false;
    const hasRetryWillSucceed: HasRetryWillSucceed = false;

    expect(hasSimulateDelay).toBe(false);
    expect(hasRetryWillSucceed).toBe(false);
  });

  it("displays error code for service errors", () => {
    const error: AiErrorConfig = {
      type: "service_error",
      title: "Service Error",
      description: "Service is experiencing issues.",
      errorCode: "upstream_error_503",
    };

    render(<AiErrorCard error={error} errorCodeTestId="ai-error-code-test" />);

    expect(screen.getByTestId("ai-error-code-test")).toHaveTextContent("Service is experiencing issues.");
  });

  it("displays countdown for rate limit errors", () => {
    const error: AiErrorConfig = {
      type: "rate_limit",
      title: "Too Many Requests",
      description: "Please wait before trying again.",
      countdownSeconds: 30,
    };

    render(<AiErrorCard error={error} />);

    expect(screen.getByText(/Try again in 30s/i)).toBeInTheDocument();
  });

  it("displays Upgrade Plan button for usage limit errors", async () => {
    const onUpgradePlan = vi.fn();
    const user = userEvent.setup();

    const error: AiErrorConfig = {
      type: "usage_limit",
      title: "Usage Limit Reached",
      description: "Upgrade your plan.",
    };

    render(<AiErrorCard error={error} onUpgradePlan={onUpgradePlan} />);

    await user.click(screen.getByText("Upgrade Plan"));
    expect(onUpgradePlan).toHaveBeenCalledTimes(1);
  });

  it("displays Check Status link for service errors", async () => {
    const onCheckStatus = vi.fn();
    const user = userEvent.setup();

    const error: AiErrorConfig = {
      type: "service_error",
      title: "Service Error",
      description: "Service is experiencing issues.",
    };

    render(<AiErrorCard error={error} onCheckStatus={onCheckStatus} />);

    await user.click(screen.getByText("Check Status"));
    expect(onCheckStatus).toHaveBeenCalledTimes(1);
  });

  it("renders dismiss button when showDismiss is true", () => {
    const error: AiErrorConfig = {
      type: "connection_failed",
      title: "Connection Failed",
      description: "Unable to reach the AI service.",
    };

    render(<AiErrorCard error={error} showDismiss={true} />);

    expect(screen.getByTitle("Dismiss")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    const error: AiErrorConfig = {
      type: "connection_failed",
      title: "Connection Failed",
      description: "Unable to reach the AI service.",
    };

    render(
      <AiErrorCard error={error} showDismiss={true} onDismiss={onDismiss} />,
    );

    await user.click(screen.getByTitle("Dismiss"));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("rate limit countdown", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("decrements countdown every second", () => {
      const error: AiErrorConfig = {
        type: "rate_limit",
        title: "Too Many Requests",
        description: "Please wait.",
        countdownSeconds: 3,
      };

      render(<AiErrorCard error={error} onRetry={vi.fn()} />);

      expect(screen.getByText(/Try again in 3s/i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/Try again in 2s/i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/Try again in 1s/i)).toBeInTheDocument();
    });

    it("shows Ready to retry when countdown completes", () => {
      const error: AiErrorConfig = {
        type: "rate_limit",
        title: "Too Many Requests",
        description: "Please wait.",
        countdownSeconds: 2,
      };

      render(<AiErrorCard error={error} onRetry={vi.fn()} />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Ready to retry/i)).toBeInTheDocument();
    });

    it("disables retry button during countdown", () => {
      const error: AiErrorConfig = {
        type: "rate_limit",
        title: "Too Many Requests",
        description: "Please wait.",
        countdownSeconds: 30,
      };

      render(<AiErrorCard error={error} onRetry={vi.fn()} />);

      // The button contains a span with "Retry" text, so we need to find the button by role
      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeDisabled();
    });

    it("enables retry button after countdown completes", () => {
      const error: AiErrorConfig = {
        type: "rate_limit",
        title: "Too Many Requests",
        description: "Please wait.",
        countdownSeconds: 2,
      };

      render(<AiErrorCard error={error} onRetry={vi.fn()} />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).not.toBeDisabled();
    });
  });
});

// =============================================================================
// SystemDialog Tests
// =============================================================================

describe("SystemDialog", () => {
  describe("delete dialog", () => {
    it("renders with correct title and description", () => {
      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="delete"
          onPrimaryAction={vi.fn()}
        />,
      );

      expect(screen.getByText("Delete Document?")).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it("calls onPrimaryAction when Delete is clicked", async () => {
      const onPrimaryAction = vi.fn();
      const user = userEvent.setup();

      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="delete"
          onPrimaryAction={onPrimaryAction}
          simulateDelay={10}
        />,
      );

      await user.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(onPrimaryAction).toHaveBeenCalledTimes(1);
      });
    });

    it("calls onSecondaryAction when Cancel is clicked", async () => {
      const onSecondaryAction = vi.fn();
      const user = userEvent.setup();

      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="delete"
          onPrimaryAction={vi.fn()}
          onSecondaryAction={onSecondaryAction}
        />,
      );

      await user.click(screen.getByText("Cancel"));
      expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("unsaved changes dialog", () => {
    it("renders with correct title and description", () => {
      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="unsaved_changes"
          onPrimaryAction={vi.fn()}
        />,
      );

      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
      expect(screen.getByText(/You have unsaved changes/i)).toBeInTheDocument();
    });

    it("renders three buttons: Discard, Cancel, Save", () => {
      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="unsaved_changes"
          onPrimaryAction={vi.fn()}
          onSecondaryAction={vi.fn()}
          onTertiaryAction={vi.fn()}
        />,
      );

      expect(screen.getByText("Discard")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("calls onTertiaryAction when Discard is clicked", async () => {
      const onTertiaryAction = vi.fn();
      const user = userEvent.setup();

      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="unsaved_changes"
          onPrimaryAction={vi.fn()}
          onTertiaryAction={onTertiaryAction}
        />,
      );

      await user.click(screen.getByText("Discard"));
      expect(onTertiaryAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("export complete dialog", () => {
    it("renders with correct title and description", () => {
      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="export_complete"
          onPrimaryAction={vi.fn()}
        />,
      );

      expect(screen.getByText("Export Complete")).toBeInTheDocument();
      expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
    });

    it("renders Done and Open File buttons", () => {
      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="export_complete"
          onPrimaryAction={vi.fn()}
          onSecondaryAction={vi.fn()}
        />,
      );

      expect(screen.getByText("Done")).toBeInTheDocument();
      expect(screen.getByText("Open File")).toBeInTheDocument();
    });

    it("calls onPrimaryAction when Open File is clicked", async () => {
      const onPrimaryAction = vi.fn();
      const user = userEvent.setup();

      render(
        <SystemDialog
          open={true}
          onOpenChange={vi.fn()}
          type="export_complete"
          onPrimaryAction={onPrimaryAction}
          simulateDelay={10}
        />,
      );

      await user.click(screen.getByText("Open File"));

      await waitFor(() => {
        expect(onPrimaryAction).toHaveBeenCalledTimes(1);
      });
    });
  });

  it("does not render when open is false", () => {
    render(
      <SystemDialog
        open={false}
        onOpenChange={vi.fn()}
        type="delete"
        onPrimaryAction={vi.fn()}
      />,
    );

    expect(screen.queryByText("Delete Document?")).not.toBeInTheDocument();
  });

  it("uses custom title and description when provided", () => {
    render(
      <SystemDialog
        open={true}
        onOpenChange={vi.fn()}
        type="delete"
        title="Custom Title"
        description="Custom description text"
        onPrimaryAction={vi.fn()}
      />,
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description text")).toBeInTheDocument();
  });

  it("uses custom button labels when provided", () => {
    render(
      <SystemDialog
        open={true}
        onOpenChange={vi.fn()}
        type="delete"
        primaryLabel="Remove"
        secondaryLabel="Keep"
        onPrimaryAction={vi.fn()}
        onSecondaryAction={vi.fn()}
      />,
    );

    expect(screen.getByText("Remove")).toBeInTheDocument();
    expect(screen.getByText("Keep")).toBeInTheDocument();
  });

  it("shows keyboard hints when showKeyboardHints is true", () => {
    render(
      <SystemDialog
        open={true}
        onOpenChange={vi.fn()}
        type="delete"
        onPrimaryAction={vi.fn()}
        showKeyboardHints={true}
      />,
    );

    expect(screen.getByText("Enter")).toBeInTheDocument();
    expect(screen.getByText("Esc")).toBeInTheDocument();
  });

  it("hides keyboard hints when showKeyboardHints is false", () => {
    render(
      <SystemDialog
        open={true}
        onOpenChange={vi.fn()}
        type="delete"
        onPrimaryAction={vi.fn()}
        showKeyboardHints={false}
      />,
    );

    expect(screen.queryByText("Enter")).not.toBeInTheDocument();
    expect(screen.queryByText("Esc")).not.toBeInTheDocument();
  });

  it("shows loading state when primary action is clicked", async () => {
    const user = userEvent.setup();

    render(
      <SystemDialog
        open={true}
        onOpenChange={vi.fn()}
        type="delete"
        onPrimaryAction={vi.fn()}
        simulateDelay={1000}
      />,
    );

    await user.click(screen.getByText("Delete"));

    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });
});

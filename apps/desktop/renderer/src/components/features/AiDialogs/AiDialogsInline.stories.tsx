import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AiInlineConfirm } from "./AiInlineConfirm";
import { AiDiffModal } from "./AiDiffModal";
import type { DiffChange, DiffChangeState } from "./types";

/**
 * AI Dialogs — Inline confirmation and diff comparison components
 *
 * This file includes:
 * - **AiInlineConfirm**: Inline confirmation for AI text suggestions
 * - **AiDiffModal**: Side-by-side diff comparison modal
 */
const meta: Meta = {
  title: "Features/AiDialogs/Inline",
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
// Sample Data
// =============================================================================

const sampleOriginalText =
  "The castle stood majestically on the hill, overlooking the vast expanse of the valley below.";

const sampleSuggestedText =
  "The ancient fortress loomed atop the windswept ridge, commanding views of the sprawling valley and the distant mountains beyond.";

const sampleDiffChanges: DiffChange[] = [
  {
    id: "1",
    before:
      "The platform currently supports XML and JSON data formats for import operations. This limitation has been identified as a bottleneck for enterprise clients using legacy CSV systems.",
    after:
      "The platform currently supports XML, JSON, and CSV data formats for import operations. This expansion directly addresses requirements from enterprise clients migrating from legacy systems.",
  },
  {
    id: "2",
    before:
      "Security protocols have been updated to comply with basic standards, requiring password authentication for administrative access.",
    after:
      "Security protocols have been updated to comply with ISO 27001 standards, requiring multi-factor authentication for all administrative access points effective Q3 2024.",
  },
  {
    id: "3",
    before: "The user interface will be refreshed in the next update.",
    after:
      "The user interface will undergo a comprehensive redesign following modern accessibility guidelines (WCAG 2.1 AA) in the next major release.",
  },
  {
    id: "4",
    before: "Budget allocation for the hardware refresh cycle remains pending.",
    after:
      "Budget allocation for the hardware refresh cycle remains pending final board approval, expected by the end of the fiscal quarter.",
  },
];

function waitForDemo(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// =============================================================================
// Wrapper Components
// =============================================================================

function InlineConfirmAcceptFlowWrapper() {
  const [key, setKey] = useState(0);
  return (
    <div className="w-[600px] space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          className="px-3 py-1.5 text-xs bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
          onClick={() => setKey((k) => k + 1)}
        >
          Reset Demo
        </button>
        <span className="text-xs text-[var(--color-fg-muted)]">
          Click Accept to see the animation flow
        </span>
      </div>
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg">
        <AiInlineConfirm
          key={key}
          originalText={sampleOriginalText}
          suggestedText={sampleSuggestedText}
          onAccept={async () => {
            await waitForDemo(1500);
            console.log("Accepted");
          }}
          onReject={() => console.log("Rejected")}
          showComparison={true}
        />
      </div>
    </div>
  );
}

function InlineConfirmRejectFlowWrapper() {
  const [key, setKey] = useState(0);
  return (
    <div className="w-[600px] space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          className="px-3 py-1.5 text-xs bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
          onClick={() => setKey((k) => k + 1)}
        >
          Reset Demo
        </button>
        <span className="text-xs text-[var(--color-fg-muted)]">
          Click Reject to see the restoration animation
        </span>
      </div>
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg">
        <AiInlineConfirm
          key={key}
          originalText={sampleOriginalText}
          suggestedText={sampleSuggestedText}
          onAccept={() => console.log("Accepted")}
          onReject={async () => {
            await waitForDemo(800);
            console.log("Rejected");
          }}
          showComparison={true}
        />
      </div>
    </div>
  );
}

function DiffModalWithHighlightWrapper() {
  const [open, setOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  return (
    <div className="w-[200px] h-[100px]">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => setOpen(true)}
      >
        Open Diff Modal
      </button>
      <AiDiffModal
        open={open}
        onOpenChange={setOpen}
        changes={sampleDiffChanges}
        currentIndex={currentIndex}
        onCurrentIndexChange={setCurrentIndex}
        onAcceptAll={() => console.log("Accept all")}
        onRejectAll={() => console.log("Reject all")}
        onApplyChanges={() => console.log("Apply")}
        onEditManually={() => setOpen(false)}
      />
    </div>
  );
}

function DiffModalPartialAcceptWrapper() {
  const [open, setOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const initialStates: Record<string, DiffChangeState> = {
    "1": "accepted",
    "2": "rejected",
    "3": "pending",
    "4": "pending",
  };
  return (
    <div className="w-[200px] h-[100px]">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => setOpen(true)}
      >
        Open Modal (Pre-reviewed)
      </button>
      <AiDiffModal
        open={open}
        onOpenChange={setOpen}
        changes={sampleDiffChanges}
        currentIndex={currentIndex}
        onCurrentIndexChange={setCurrentIndex}
        onAcceptAll={() => console.log("Accept all")}
        onRejectAll={() => console.log("Reject all")}
        onApplyChanges={() => console.log("Apply")}
        initialChangeStates={initialStates}
      />
    </div>
  );
}

function DiffModalApplyingChangesWrapper() {
  const [open, setOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  return (
    <div className="w-[200px] h-[100px]">
      <button
        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-fg-default)] rounded"
        onClick={() => setOpen(true)}
      >
        Open Modal
      </button>
      <div className="mt-2 text-xs text-[var(--color-fg-muted)]">
        Click &quot;Apply Changes&quot; to see loading state
      </div>
      <AiDiffModal
        open={open}
        onOpenChange={setOpen}
        changes={sampleDiffChanges.slice(0, 2)}
        currentIndex={currentIndex}
        onCurrentIndexChange={setCurrentIndex}
        onAcceptAll={() => {}}
        onRejectAll={() => {}}
        onApplyChanges={() => console.log("Applied!")}
        simulateDelay={2000}
      />
    </div>
  );
}

// =============================================================================
// 1. Inline Confirm Stories
// =============================================================================

/**
 * Default inline AI confirmation view
 */
export const InlineConfirmDefault: StoryObj = {
  render: () => (
    <div className="w-[600px] p-8 bg-[var(--color-bg-surface)] rounded-lg">
      <div className="space-y-6 text-[var(--color-fg-muted)] leading-relaxed font-light">
        <p>
          The executive summary provides a high-level overview of the strategic
          initiative. It outlines the primary objectives, key stakeholders, and
          the anticipated timeline for delivery.
        </p>
        <AiInlineConfirm
          originalText={sampleOriginalText}
          suggestedText={sampleSuggestedText}
          onAccept={() => console.log("Accepted")}
          onReject={() => console.log("Rejected")}
          onViewDiff={() => console.log("View diff")}
        />
        <p>
          Budget allocation for the hardware refresh cycle remains pending final
          board approval, expected by the end of the fiscal month.
        </p>
      </div>
    </div>
  ),
};

/**
 * Accept Flow - Click Accept to see the full animation
 */
export const InlineConfirmAcceptFlow: StoryObj = {
  render: () => <InlineConfirmAcceptFlowWrapper />,
};

/**
 * Reject Flow - Click Reject to see the restoration animation
 */
export const InlineConfirmRejectFlow: StoryObj = {
  render: () => <InlineConfirmRejectFlowWrapper />,
};

/**
 * Applying State - Shows the loading state
 */
export const InlineConfirmApplyingState: StoryObj = {
  render: () => (
    <div className="w-[600px] p-8 bg-[var(--color-bg-surface)] rounded-lg">
      <div className="text-xs text-[var(--color-fg-muted)] mb-4">
        Click &quot;Accept&quot; to enter applying state (Story callback keeps
        promise pending).
      </div>
      <AiInlineConfirm
        originalText={sampleOriginalText}
        suggestedText={sampleSuggestedText}
        onAccept={() => new Promise<void>(() => {})}
        onReject={() => {}}
      />
    </div>
  ),
};

// =============================================================================
// 2. Diff Modal Stories
// =============================================================================

/**
 * Diff Modal with real diff highlighting
 */
export const DiffModalWithHighlight: StoryObj = {
  render: () => <DiffModalWithHighlightWrapper />,
};

/**
 * Diff Modal with partial accept/reject
 */
export const DiffModalPartialAccept: StoryObj = {
  render: () => <DiffModalPartialAcceptWrapper />,
};

/**
 * Diff Modal with Apply Changes loading
 */
export const DiffModalApplyingChanges: StoryObj = {
  render: () => <DiffModalApplyingChangesWrapper />,
};

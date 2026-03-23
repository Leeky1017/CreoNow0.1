import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SystemDialog } from "./SystemDialog";
import { within, expect } from "@storybook/test";

const meta: Meta = {
  title: "Features/AiDialogs/StatesSystem",
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
// 4. System Dialog Stories
// =============================================================================

/**
 * Delete dialog with loading state
 */
export const SystemDeleteWithLoading: StoryObj = {
  render: () => <SystemDeleteWithLoadingWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * Keyboard navigation demo
 */
export const SystemKeyboardNavigation: StoryObj = {
  render: () => <SystemKeyboardNavigationWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * Custom button labels
 */
export const SystemCustomLabels: StoryObj = {
  render: () => <SystemCustomLabelsWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * Unsaved changes dialog with loading
 */
export const SystemUnsavedChanges: StoryObj = {
  render: () => <SystemUnsavedChangesWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * Export complete dialog
 */
export const SystemExportComplete: StoryObj = {
  render: () => <SystemExportCompleteWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * All system dialogs showcase
 */
export const AllSystemDialogs: StoryObj = {
  render: () => <AllSystemDialogsWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

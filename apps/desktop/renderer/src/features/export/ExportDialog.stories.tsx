import type { Meta, StoryObj } from "@storybook/react";
import { ExportDialog, defaultExportOptions } from "./ExportDialog";

/**
 * ExportDialog component stories
 *
 * Export dialog with 3 view states:
 * - Config: Format selection, export options, preview
 * - Progress: Export in progress with progress bar
 * - Success: Export complete confirmation
 *
 * Based on design spec: 29-export-dialog.html
 *
 * Real document content used:
 * - Title: "The Architecture of Silence"
 * - Estimated size: ~2.4 MB
 *
 * Format options:
 * - Markdown structured export
 * - PDF structured pages
 * - Word (.docx) structured export
 * - TXT plain text boundary
 *
 * Export settings:
 * - Include metadata (default checked)
 * - Version history (default unchecked)
 * - Embed images (default checked)
 *
 * Page size (PDF only):
 * - A4 (default)
 * - Letter
 * - Legal
 */
const meta: Meta<typeof ExportDialog> = {
  title: "Features/ExportDialog",
  component: ExportDialog,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
    },
  },
  argTypes: {
    open: { control: "boolean" },
    onOpenChange: { action: "openChange" },
    onExport: { action: "export" },
    onCancel: { action: "cancel" },
    view: {
      control: "select",
      options: ["config", "progress", "success"],
    },
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
  decorators: [
    (Story) => (
      <div
        className="w-full h-screen bg-[var(--color-bg-base)]"
        data-theme="dark"
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ExportDialog>;

/**
 * Story 1: ConfigViewDefault
 *
 * Default configuration view with Markdown selected.
 * Validates:
 * - Markdown default selected (blue border + inner dot)
 * - "Include metadata" and "Embed images" checked by default
 * - Page size A4 shown in preview badge
 * - Bottom shows "~2.4 MB"
 */
export const ConfigViewDefault: Story = {
  args: {
    open: true,
    projectId: "storybook-project",
    documentTitle: "The Architecture of Silence",
    estimatedSize: "~2.4 MB",
    initialOptions: defaultExportOptions,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default config view with Markdown selected and structured capability descriptions visible for all formats.",
      },
    },
  },
};

/**
 * Story 2: SelectMarkdownFormat
 *
 * Markdown format selected.
 * Validates:
 * - Markdown card selected (blue border)
 * - PDF card unselected
 * - Page Size dropdown disabled (greyed out)
 * - Preview area shows "MARKDOWN"
 */
export const SelectMarkdownFormat: Story = {
  args: {
    open: true,
    projectId: "storybook-project",
    documentTitle: "The Architecture of Silence",
    estimatedSize: "~1.2 MB",
    initialOptions: {
      ...defaultExportOptions,
      format: "markdown",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Markdown format selected. Page Size is disabled since it only applies to PDF. Preview shows 'MARKDOWN • A4'.",
      },
    },
  },
};

/**
 * Story 3: ToggleAllOptions
 *
 * All options toggled to non-default state.
 * Validates:
 * - Include metadata unchecked
 * - Version history checked
 * - Embed images unchecked
 * - File size estimate changes "~1.2 MB"
 */
export const ToggleAllOptions: Story = {
  args: {
    open: true,
    projectId: "storybook-project",
    documentTitle: "The Architecture of Silence",
    estimatedSize: "~1.2 MB",
    initialOptions: {
      ...defaultExportOptions,
      includeMetadata: false,
      versionHistory: true,
      embedImages: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "All export options toggled from defaults. Include metadata OFF, Version history ON, Embed images OFF. Estimated size reduced.",
      },
    },
  },
};

/**
 * Story 4: ChangePageSize
 *
 * Page size changed to Letter.
 * Validates:
 * - Letter selected in dropdown
 * - Preview area shows "PDF • LETTER"
 */
export const ChangePageSize: Story = {
  args: {
    open: true,
    documentTitle: "The Architecture of Silence",
    estimatedSize: "~2.4 MB",
    initialOptions: {
      ...defaultExportOptions,
      pageSize: "letter",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Page size changed to Letter. Preview badge shows 'PDF • LETTER'.",
      },
    },
  },
};

/**
 * Story 5: ProgressView
 *
 * Export in progress at 45%.
 * Validates:
 * - Progress bar animation at 45%
 * - Current step text "Generating pages..."
 * - Percentage display "45%"
 * - Cancel button visible
 */
export const ProgressView: Story = {
  args: {
    open: true,
    documentTitle: "The Architecture of Silence",
    view: "progress",
    progress: 45,
    progressStep: "Generating pages...",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Export in progress at 45%. Shows progress bar, step label 'Generating pages...', and Cancel button.",
      },
    },
  },
};

/**
 * Story 6: ProgressViewAlmostDone
 *
 * Export almost complete at 95%.
 * Validates:
 * - Progress bar nearly full at 95%
 * - Current step "Finalizing PDF..."
 * - Progress bar almost at max
 */
export const ProgressViewAlmostDone: Story = {
  args: {
    open: true,
    documentTitle: "The Architecture of Silence",
    view: "progress",
    progress: 95,
    progressStep: "Finalizing PDF...",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Export almost complete at 95%. Progress bar nearly full, step shows 'Finalizing PDF...'.",
      },
    },
  },
};

/**
 * Story 7: SuccessView
 *
 * Export complete successfully.
 * Validates:
 * - Green checkmark icon
 * - "Export Complete" title
 * - "Your file has been successfully downloaded." description
 * - "Done" button with white background, black text
 */
export const SuccessView: Story = {
  args: {
    open: true,
    documentTitle: "The Architecture of Silence",
    view: "success",
    result: {
      relativePath: "exports/storybook-project/mock-doc.md",
      bytesWritten: 1234,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Export complete. Shows green checkmark, success message, and Done button with white background.",
      },
    },
  },
};

/**
 * Story 10: ProgressViewPreparing
 *
 * Export just started, preparing phase.
 * Validates:
 * - Progress bar at low percentage (15%)
 * - Step text "Preparing..."
 */
export const ProgressViewPreparing: Story = {
  args: {
    open: true,
    documentTitle: "The Architecture of Silence",
    view: "progress",
    progress: 15,
    progressStep: "Preparing...",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Export just started at 15%. Shows 'Preparing...' step label.",
      },
    },
  },
};

/**
 * Story 11: ProgressViewEmbeddingImages
 *
 * Export in embedding images phase.
 * Validates:
 * - Progress at 75%
 * - Step text "Embedding images..."
 */
export const ProgressViewEmbeddingImages: Story = {
  args: {
    open: true,
    documentTitle: "The Architecture of Silence",
    view: "progress",
    progress: 75,
    progressStep: "Embedding images...",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Export at 75% progress. Shows 'Embedding images...' step label.",
      },
    },
  },
};

export const UnsupportedStructureError: Story = {
  args: {
    open: true,
    projectId: "storybook-project",
    documentTitle: "The Architecture of Silence",
    error: {
      code: "INVALID_ARGUMENT",
      message: "This export format cannot write: doc.content.0:table",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Config view with an explicit unsupported-structure failure, showing the same error surface users get before file write.",
      },
    },
  },
};

/**
 * Story 12: LegalPageSize
 *
 * Legal page size selected for PDF.
 * Validates:
 * - Legal selected in dropdown
 * - Preview shows "PDF • LEGAL"
 */
export const LegalPageSize: Story = {
  args: {
    open: true,
    documentTitle: "The Architecture of Silence",
    estimatedSize: "~2.6 MB",
    initialOptions: {
      ...defaultExportOptions,
      pageSize: "legal",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "PDF with Legal page size. Preview badge shows 'PDF • LEGAL'.",
      },
    },
  },
};

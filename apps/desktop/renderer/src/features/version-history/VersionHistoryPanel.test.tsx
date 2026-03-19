import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VersionHistoryPanel, type TimeGroup } from "./VersionHistoryPanel";

/**
 * Sample test data
 */
const SAMPLE_TIME_GROUPS: TimeGroup[] = [
  {
    label: "",
    versions: [
      {
        id: "current",
        timestamp: "Just now",
        authorType: "user",
        authorName: "You",
        description: "Fixed typo in the executive summary",
        wordChange: { type: "none", count: 0 },
        isCurrent: true,
      },
    ],
  },
  {
    label: "Earlier Today",
    versions: [
      {
        id: "v-1042",
        timestamp: "10:42 AM",
        authorType: "ai",
        authorName: "AI Assistant",
        description: 'Generated new section on "Security Protocols"',
        wordChange: { type: "added", count: 124 },
      },
      {
        id: "v-0915",
        timestamp: "9:15 AM",
        authorType: "user",
        authorName: "Sarah M.",
        description: "Removed redundant paragraph",
        wordChange: { type: "removed", count: 12 },
      },
      {
        id: "v-0800",
        timestamp: "8:00 AM",
        authorType: "auto-save",
        authorName: "Auto-Save",
        description: "System checkpoint created automatically",
        wordChange: { type: "none", count: 0 },
      },
    ],
  },
  {
    label: "Yesterday",
    versions: [
      {
        id: "v-y-1620",
        timestamp: "4:20 PM",
        authorType: "user",
        authorName: "You",
        description: "Added initial scope definitions",
        wordChange: { type: "added", count: 54 },
      },
    ],
  },
];

describe("VersionHistoryPanel", () => {
  it("renders panel with title and document name", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Project Requirements.docx"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    expect(screen.getByText("Version History")).toBeInTheDocument();
    expect(screen.getByText("Project Requirements.docx")).toBeInTheDocument();
  });

  it("renders all version cards", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    // Check current version
    expect(
      screen.getByText("Fixed typo in the executive summary"),
    ).toBeInTheDocument();

    // Check AI version
    expect(
      screen.getByText('Generated new section on "Security Protocols"'),
    ).toBeInTheDocument();

    // Check user version
    expect(screen.getByText("Removed redundant paragraph")).toBeInTheDocument();

    // Check auto-save version
    expect(
      screen.getByText("System checkpoint created automatically"),
    ).toBeInTheDocument();
  });

  it("renders time group labels", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    expect(screen.getByText("Earlier Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("renders Current badge for current version", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("renders author badges with correct names", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    expect(screen.getAllByText("You")).toHaveLength(2); // Current + Yesterday
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByText("Sarah M.")).toBeInTheDocument();
    expect(screen.getByText("Auto-Save")).toBeInTheDocument();
  });

  it("renders word change badges correctly", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    expect(screen.getByText("+124 words")).toBeInTheDocument();
    expect(screen.getByText("-12 words")).toBeInTheDocument();
    // Auto-Save version shows "No changes"
    expect(screen.getByText("No changes")).toBeInTheDocument();
    // Current version shows word count in footer text
    expect(screen.getByText("0 words changed")).toBeInTheDocument();
  });

  it("calls onSelect when clicking a version card", () => {
    const onSelect = vi.fn();
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        onSelect={onSelect}
      />,
    );

    const card = screen.getByTestId("version-card-v-1042");
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith("v-1042");
  });

  it("renders action buttons for selected version", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId="v-1042"
      />,
    );

    // Selected version shows action buttons in the card
    // There are also hover action buttons on other cards (icon-only with title)
    const restoreButtons = screen.getAllByRole("button", { name: /Restore/i });
    const compareButtons = screen.getAllByRole("button", { name: /Compare/i });
    const previewButtons = screen.getAllByRole("button", { name: /Preview/i });

    // Should have at least 1 button for each action (from selected card)
    expect(restoreButtons.length).toBeGreaterThanOrEqual(1);
    expect(compareButtons.length).toBeGreaterThanOrEqual(1);
    expect(previewButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onRestore when clicking enabled Restore button", () => {
    const onRestore = vi.fn();
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId="v-1042"
        onRestore={onRestore}
      />,
    );

    const restoreButtons = screen.getAllByRole("button", { name: /Restore/i });
    expect(restoreButtons[0]).toBeEnabled();
    fireEvent.click(restoreButtons[0]);

    expect(onRestore).toHaveBeenCalledWith("v-1042");
  });

  it("does not call onRestore when no version is selected", () => {
    const onRestore = vi.fn();
    const onSelect = vi.fn();
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        onRestore={onRestore}
        onSelect={onSelect}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Restore/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("version-card-v-1042"));

    expect(onSelect).toHaveBeenCalledWith("v-1042");
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("calls onCompare when clicking Compare button", () => {
    const onCompare = vi.fn();
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId="v-1042"
        onCompare={onCompare}
      />,
    );

    const compareButtons = screen.getAllByRole("button", { name: /Compare/i });
    fireEvent.click(compareButtons[0]);

    expect(onCompare).toHaveBeenCalledWith("v-1042");
  });

  it("calls onPreview when clicking Preview button", () => {
    const onPreview = vi.fn();
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId="v-1042"
        onPreview={onPreview}
      />,
    );

    const previewButtons = screen.getAllByRole("button", { name: /Preview/i });
    fireEvent.click(previewButtons[0]);

    expect(onPreview).toHaveBeenCalledWith("v-1042");
  });

  it("calls onClose when clicking close button", () => {
    const onClose = vi.fn();
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        onClose={onClose}
      />,
    );

    const closeButton = screen.getByRole("button", {
      name: "Close version history",
    });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("renders auto-save status in footer", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        autoSaveEnabled
        lastSavedText="2m ago"
      />,
    );

    expect(
      screen.getByText("Auto-save on (last saved 2m ago)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Configure auto-save settings"),
    ).toBeInTheDocument();
  });

  it("renders auto-save off status when disabled", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        autoSaveEnabled={false}
      />,
    );

    expect(screen.getByText("Auto-save off")).toBeInTheDocument();
  });

  it("calls onConfigureAutoSave when clicking settings link", () => {
    const onConfigureAutoSave = vi.fn();
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        onConfigureAutoSave={onConfigureAutoSave}
      />,
    );

    const settingsLink = screen.getByText("Configure auto-save settings");
    fireEvent.click(settingsLink);

    expect(onConfigureAutoSave).toHaveBeenCalled();
  });
});

describe("VersionHistoryPanel — display and metadata", () => {
  it("applies custom width", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        width={400}
      />,
    );

    const panel = screen.getByTestId("version-history-panel");
    expect(panel).toHaveStyle({ width: "400px" });
  });

  it("highlights selected version with accent border", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId="v-1042"
      />,
    );

    const selectedCard = screen.getByTestId("version-card-v-1042");
    expect(selectedCard).toHaveClass("border-l-2");
    // Selected version uses accent color (white) instead of info color (blue)
    expect(selectedCard).toHaveClass("border-[var(--color-accent)]");
  });

  it("renders timestamps correctly", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByText("10:42 AM")).toBeInTheDocument();
    expect(screen.getByText("9:15 AM")).toBeInTheDocument();
    expect(screen.getByText("8:00 AM")).toBeInTheDocument();
    expect(screen.getByText("4:20 PM")).toBeInTheDocument();
  });

  it("renders affected paragraphs when available", () => {
    const groupsWithMetadata: TimeGroup[] = [
      {
        label: "Today",
        versions: [
          {
            id: "v-with-meta",
            timestamp: "10:00 AM",
            authorType: "ai",
            authorName: "AI Assistant",
            description: "Generated content",
            wordChange: { type: "added", count: 100 },
            reason: "ai-apply:run-123",
            affectedParagraphs: 3,
          },
        ],
      },
    ];

    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={groupsWithMetadata}
      />,
    );

    // For non-selected cards, affectedParagraphs shows in a simplified format
    expect(screen.getByText("3 paragraphs affected")).toBeInTheDocument();
  });

  it("renders version metadata in selected card", () => {
    const groupsWithMetadata: TimeGroup[] = [
      {
        label: "Today",
        versions: [
          {
            id: "v-selected",
            timestamp: "10:00 AM",
            authorType: "ai",
            authorName: "AI Assistant",
            description: "Generated content with AI",
            wordChange: { type: "added", count: 100 },
            reason: "ai-apply:run-123",
            affectedParagraphs: 2,
            diffSummary: "Add了新的安全协议Chapters...",
          },
        ],
      },
    ];

    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={groupsWithMetadata}
        selectedId="v-selected"
      />,
    );

    // Selected card shows full metadata
    expect(screen.getByText("AI Modification")).toBeInTheDocument();
    expect(screen.getByText("2 paragraphs affected")).toBeInTheDocument();
    expect(screen.getByText("Change Preview")).toBeInTheDocument();
    expect(
      screen.getByText("Add了新的安全协议Chapters..."),
    ).toBeInTheDocument();
  });

  it("renders ai-accept reason as AI Modification label", () => {
    const groupsWithAiAccept: TimeGroup[] = [
      {
        label: "Today",
        versions: [
          {
            id: "v-ai-accept",
            timestamp: "10:00 AM",
            authorType: "ai",
            authorName: "AI Assistant",
            description: "Accepted AI rewrite",
            wordChange: { type: "added", count: 10 },
            reason: "ai-accept",
          },
        ],
      },
    ];

    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={groupsWithAiAccept}
        selectedId="v-ai-accept"
      />,
    );

    expect(screen.getByText("AI Modification")).toBeInTheDocument();
  });

  it("should render AI mark tag when showAiMarks is enabled", () => {
    const groupsWithAiAccept: TimeGroup[] = [
      {
        label: "Today",
        versions: [
          {
            id: "v-ai-mark",
            timestamp: "10:00 AM",
            authorType: "ai",
            authorName: "AI Assistant",
            description: "Accepted AI rewrite",
            wordChange: { type: "added", count: 10 },
            reason: "ai-accept",
          },
        ],
      },
    ];

    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={groupsWithAiAccept}
        selectedId="v-ai-mark"
        showAiMarks={true}
      />,
    );

    expect(screen.getByTestId("ai-mark-tag-v-ai-mark")).toBeInTheDocument();
  });

  it("should not render AI mark tag by default when showAiMarks is disabled", () => {
    const groupsWithAiAccept: TimeGroup[] = [
      {
        label: "Today",
        versions: [
          {
            id: "v-ai-mark-default",
            timestamp: "10:00 AM",
            authorType: "ai",
            authorName: "AI Assistant",
            description: "Accepted AI rewrite",
            wordChange: { type: "added", count: 10 },
            reason: "ai-accept",
          },
        ],
      },
    ];

    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={groupsWithAiAccept}
        selectedId="v-ai-mark-default"
      />,
    );

    expect(
      screen.queryByTestId("ai-mark-tag-v-ai-mark-default"),
    ).not.toBeInTheDocument();
  });

  it("should render unified PanelHeader with title, subtitle, and close action", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    const header = document.querySelector(".panel-header");
    expect(header).toBeInTheDocument();
    expect(screen.getByText("Version History")).toBeInTheDocument();
    expect(screen.getByText("Test Document")).toBeInTheDocument();
    expect(screen.getByLabelText("Close version history")).toBeInTheDocument();
  });

  it("should render expandable diff preview for selected version summaries", async () => {
    const user = userEvent.setup();
    const groupsWithDiffSummary: TimeGroup[] = [
      {
        label: "Today",
        versions: [
          {
            id: "v-diff-summary",
            timestamp: "10:42 AM",
            authorType: "ai",
            authorName: "AI Assistant",
            description: "Expanded the section overview",
            wordChange: { type: "added", count: 124 },
            diffSummary:
              "Added a long explanatory paragraph to clarify the system boundaries and note the failure modes in a single concise block.",
          },
        ],
      },
    ];

    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={groupsWithDiffSummary}
        selectedId="v-diff-summary"
      />,
    );

    const summary = screen.getByTestId("version-diff-summary");
    expect(summary).toHaveClass("line-clamp-2");

    await user.click(screen.getByRole("button", { name: "Expand" }));

    expect(summary).not.toHaveClass("line-clamp-2");
    expect(
      screen.getByRole("button", { name: "Collapse" }),
    ).toBeInTheDocument();
  });

  it("should render hover actions with fade transition classes", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    const hoverActions = screen.getByTestId(
      "version-card-hover-actions-v-1042",
    );
    expect(hoverActions).toHaveClass("transition-opacity");
    expect(hoverActions).toHaveClass("duration-[var(--duration-fast)]");
  });

  it("should render no-changes badge with high-contrast token classes", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Document"
        timeGroups={SAMPLE_TIME_GROUPS}
      />,
    );

    const badge = screen.getByTestId("version-no-changes-badge");
    expect(badge).toHaveClass("text-[var(--color-fg-default)]");
    expect(badge).toHaveClass("bg-[var(--color-bg-overlay)]");
    expect(badge).toHaveClass("border");
  });
});

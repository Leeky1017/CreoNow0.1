import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QualityGatesPanel, type CheckGroup } from "./QualityGatesPanel";

/**
 * Sample test data
 */
const SAMPLE_CHECK_GROUPS: CheckGroup[] = [
  {
    id: "style",
    name: "Style",
    checks: [
      {
        id: "passive-voice",
        name: "Passive Voice",
        description: "Detects overuse of passive voice (threshold: 15%)",
        status: "passed",
        resultValue: "8%",
      },
      {
        id: "sentence-variety",
        name: "Sentence Variety",
        description: "Analyzes sentence length distribution...",
        status: "passed",
        resultValue: "76%",
      },
    ],
  },
  {
    id: "consistency",
    name: "Consistency",
    checks: [
      {
        id: "character-names",
        name: "Character Names",
        description: "Ensures consistent naming conventions...",
        status: "warning",
        issues: [
          {
            id: "issue-1",
            description: '"Elara" was written as "Elera" in Chapter 3',
            location: "Chapter 3, Paragraph 5",
            severity: "warning",
          },
        ],
      },
      {
        id: "timeline",
        name: "Timeline",
        description: "Validates chronological consistency of events.",
        status: "passed",
      },
    ],
  },
];

describe("QualityGatesPanel", () => {
  it("renders panel with title", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
      />,
    );

    expect(screen.getByText("Quality Gates")).toBeInTheDocument();
  });

  it("renders all check groups", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
      />,
    );

    expect(screen.getByText("Style")).toBeInTheDocument();
    expect(screen.getByText("Consistency")).toBeInTheDocument();
  });

  it("renders all check items", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
      />,
    );

    expect(screen.getByText("Passive Voice")).toBeInTheDocument();
    expect(screen.getByText("Sentence Variety")).toBeInTheDocument();
    expect(screen.getByText("Character Names")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
  });

  it("renders check count for each group", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
      />,
    );

    expect(screen.getByText("2/2 checks")).toBeInTheDocument(); // Style
    expect(screen.getByText("1/2 checks")).toBeInTheDocument(); // Consistency
  });

  it("renders status indicator with issues count", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={2}
      />,
    );

    expect(screen.getByText("2 Issues Found")).toBeInTheDocument();
  });

  it("renders all passed status", () => {
    const passedGroups: CheckGroup[] = [
      {
        id: "style",
        name: "Style",
        checks: [
          {
            id: "passive-voice",
            name: "Passive Voice",
            description: "Detects overuse of passive voice",
            status: "passed",
          },
        ],
      },
    ];

    render(
      <QualityGatesPanel
        checkGroups={passedGroups}
        panelStatus="all-passed"
        issuesCount={0}
      />,
    );

    expect(screen.getByText("All Passed")).toBeInTheDocument();
    expect(
      screen.getByText("Your content meets all quality standards."),
    ).toBeInTheDocument();
  });

  it("renders running status", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="running"
      />,
    );

    expect(screen.getByText("Running checks...")).toBeInTheDocument();
  });

  it("renders Run All Checks button", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Run All Checks/i }),
    ).toBeInTheDocument();
  });

  it("calls onRunAllChecks when button is clicked", () => {
    const onRunAllChecks = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        onRunAllChecks={onRunAllChecks}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Run All Checks/i }));
    expect(onRunAllChecks).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        onClose={onClose}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Close quality gates panel" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("renders issue badge count for checks with issues", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
      />,
    );

    // Character Names check should show "1" badge
    const checkItem = screen.getByTestId("check-item-character-names");
    expect(checkItem).toHaveTextContent("1");
  });

  it("expands issue details when check is toggled", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        expandedCheckId="character-names"
      />,
    );

    // Issue should be visible
    expect(
      screen.getByText('"Elara" was written as "Elera" in Chapter 3'),
    ).toBeInTheDocument();
    expect(screen.getByText("Chapter 3, Paragraph 5")).toBeInTheDocument();
  });

  it("renders action buttons for expanded issue", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        expandedCheckId="character-names"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Fix Issue" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ignore" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View in Editor" }),
    ).toBeInTheDocument();
  });

  it("calls onToggleCheck when check is clicked", () => {
    const onToggleCheck = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        onToggleCheck={onToggleCheck}
      />,
    );

    // Click on the check item with issues
    const checkItem = screen.getByTestId("check-item-character-names");
    fireEvent.click(checkItem.querySelector("button")!);

    expect(onToggleCheck).toHaveBeenCalledWith("character-names");
  });

  it("calls onFixIssue when Fix Issue is clicked", () => {
    const onFixIssue = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        expandedCheckId="character-names"
        onFixIssue={onFixIssue}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fix Issue" }));
    expect(onFixIssue).toHaveBeenCalledWith("character-names", "issue-1");
  });

  it("calls onIgnoreIssue when Ignore is clicked", () => {
    const onIgnoreIssue = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        expandedCheckId="character-names"
        onIgnoreIssue={onIgnoreIssue}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ignore" }));
    expect(onIgnoreIssue).toHaveBeenCalledWith("character-names", "issue-1");
  });

  it("calls onViewInEditor when View in Editor is clicked", () => {
    const onViewInEditor = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        expandedCheckId="character-names"
        onViewInEditor={onViewInEditor}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View in Editor" }));
    expect(onViewInEditor).toHaveBeenCalledWith("character-names", "issue-1");
  });
});

describe("QualityGatesPanel — display and settings", () => {
  it("renders result value for passed checks", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
      />,
    );

    expect(screen.getByText("8%")).toBeInTheDocument();
    expect(screen.getByText("76%")).toBeInTheDocument();
  });

  it("renders settings section", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
      />,
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("expands settings when toggled", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        settingsExpanded
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
      />,
    );

    expect(screen.getByText("Run checks on save")).toBeInTheDocument();
    expect(screen.getByText("Block save on errors")).toBeInTheDocument();
    expect(screen.getByText("Check frequency")).toBeInTheDocument();
  });

  it("calls onToggleSettings when settings header is clicked", () => {
    const onToggleSettings = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        onToggleSettings={onToggleSettings}
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
      />,
    );

    fireEvent.click(screen.getByText("Settings"));
    expect(onToggleSettings).toHaveBeenCalled();
  });

  it("calls onSettingsChange when toggle is changed", () => {
    const onSettingsChange = vi.fn();
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        settingsExpanded
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
        onSettingsChange={onSettingsChange}
      />,
    );

    const toggleButton = screen.getByRole("switch", {
      name: "Run checks on save",
    });
    fireEvent.click(toggleButton);

    expect(onSettingsChange).toHaveBeenCalledWith({
      runOnSave: false,
      blockOnErrors: false,
      frequency: "on-demand",
    });
  });

  it("applies custom width", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        width={400}
      />,
    );

    const panel = screen.getByTestId("quality-gates-panel");
    expect(panel).toHaveStyle({ width: "400px" });
  });

  it("renders ignored issue with strikethrough", () => {
    const groupsWithIgnored: CheckGroup[] = [
      {
        id: "consistency",
        name: "Consistency",
        checks: [
          {
            id: "character-names",
            name: "Character Names",
            description: "Ensures consistent naming conventions...",
            status: "warning",
            ignoredCount: 1,
            issues: [
              {
                id: "issue-1",
                description: "Ignored issue",
                location: "Chapter 1",
                severity: "warning",
                ignored: true,
              },
            ],
          },
        ],
      },
    ];

    render(
      <QualityGatesPanel
        checkGroups={groupsWithIgnored}
        panelStatus="issues-found"
        issuesCount={0}
        expandedCheckId="character-names"
      />,
    );

    expect(screen.getByText("Ignored issue")).toHaveClass("line-through");
    expect(screen.getByText("1 Ignored")).toBeInTheDocument();
  });

  it("shows fixing state for issue", () => {
    render(
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={1}
        expandedCheckId="character-names"
        fixingIssueId="issue-1"
      />,
    );

    const fixButton = screen.getByRole("button", { name: /Fix Issue/i });
    expect(fixButton).toBeDisabled();
  });

  it("renders errors status correctly", () => {
    const errorGroups: CheckGroup[] = [
      {
        id: "consistency",
        name: "Consistency",
        checks: [
          {
            id: "character-names",
            name: "Character Names",
            description: "Ensures consistent naming conventions...",
            status: "error",
            issues: [
              {
                id: "issue-1",
                description: "Critical naming error",
                severity: "error",
              },
            ],
          },
        ],
      },
    ];

    render(
      <QualityGatesPanel
        checkGroups={errorGroups}
        panelStatus="errors"
        issuesCount={1}
      />,
    );

    expect(screen.getByText("1 Error")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";

import {
  VersionHistoryPanelContent,
  type TimeGroup,
} from "./VersionHistoryPanel";

describe("VersionHistoryContainer follow-up behavior coverage", () => {
  const timeGroups: TimeGroup[] = [
    {
      label: "Today",
      versions: [
        {
          id: "v-1",
          timestamp: "10:42 AM",
          authorType: "user",
          authorName: "You",
          description: "Refined the opening paragraph",
          wordChange: { type: "added", count: 18 },
        },
      ],
    },
  ];

  it("renders panel content with a runtime version list instead of source-level assertions", () => {
    render(
      React.createElement(VersionHistoryPanelContent, {
        documentTitle: "Test Document",
        timeGroups,
      }),
    );

    expect(screen.getByText("Version History")).toBeInTheDocument();
    expect(
      screen.getByText("Refined the opening paragraph"),
    ).toBeInTheDocument();
    expect(screen.getByText("10:42 AM")).toBeInTheDocument();
  });

  it("renders auto-save footer controls as user-visible behavior", () => {
    render(
      React.createElement(VersionHistoryPanelContent, {
        documentTitle: "Test Document",
        timeGroups,
        lastSavedText: "2m ago",
      }),
    );

    expect(
      screen.getByText("Auto-save on (last saved 2m ago)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Configure auto-save settings" }),
    ).toBeInTheDocument();
  });
});

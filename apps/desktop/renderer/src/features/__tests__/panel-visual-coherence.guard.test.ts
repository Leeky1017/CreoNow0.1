import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";

import { CharacterPanel } from "../character/CharacterPanel";
import { OutlinePanel } from "../outline/OutlinePanel";
import { VersionHistoryPanel } from "../version-history/VersionHistoryPanel";

describe("panel visual coherence", () => {
  it("renders the shared panel header pattern in CharacterPanel", () => {
    render(React.createElement(CharacterPanel, { characters: [] }));

    const header = document.querySelector(".panel-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("h-10");
    expect(screen.getByText("CHARACTERS")).toBeInTheDocument();
  });

  it("renders the shared panel header pattern in OutlinePanel", () => {
    render(React.createElement(OutlinePanel, { items: [] }));

    const header = document.querySelector(".panel-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("h-10");
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  it("renders the shared panel header pattern in VersionHistoryPanel", () => {
    render(
      React.createElement(VersionHistoryPanel, {
        documentTitle: "Test Document",
        timeGroups: [],
      }),
    );

    const header = document.querySelector(".panel-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("h-10");
    expect(screen.getByText("Version History")).toBeInTheDocument();
  });
});

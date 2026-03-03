import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DiffViewPanel } from "./DiffViewPanel";

const twoVersionOptions = [
  { id: "v-prev", label: "Version from 1h ago", type: "auto" as const },
  { id: "current", label: "Current Version", type: "current" as const },
];

describe("DiffViewPanel", () => {
  it("should support two-version navigation with change index updates", async () => {
    const user = userEvent.setup();
    const diffText = [
      "--- old",
      "+++ new",
      "@@ -1,2 +1,2 @@",
      " keep-1",
      "-old-a",
      "+new-a",
      "@@ -10,2 +10,2 @@",
      " keep-10",
      "-old-b",
      "+new-b",
      "",
    ].join("\n");

    render(
      <DiffViewPanel
        diffText={diffText}
        versions={twoVersionOptions}
        initialViewMode="unified"
      />,
    );

    expect(document.body).toHaveTextContent("Change 1 of 2");

    await user.click(screen.getByLabelText("Next Change"));
    expect(document.body).toHaveTextContent("Change 2 of 2");
  });

  it("should show empty diff message and zero stats when versions are identical", () => {
    render(
      <DiffViewPanel
        diffText=""
        versions={twoVersionOptions}
        initialViewMode="unified"
      />,
    );

    expect(screen.getByText("No changes to display")).toBeInTheDocument();
    expect(screen.getByText("+0 lines")).toBeInTheDocument();
    expect(screen.getByText("-0 lines")).toBeInTheDocument();
  });

  it("should apply dashed underline style when lineUnderlineStyle is dashed", () => {
    const diffText = [
      "--- old",
      "+++ new",
      "@@ -1,1 +1,1 @@",
      "-old-a",
      "+new-a",
      "",
    ].join("\n");

    render(
      <DiffViewPanel
        diffText={diffText}
        versions={twoVersionOptions}
        initialViewMode="unified"
        lineUnderlineStyle="dashed"
      />,
    );

    const changedLine = screen.getByText("new-a");
    expect(changedLine).toHaveClass("decoration-dashed");
  });
});

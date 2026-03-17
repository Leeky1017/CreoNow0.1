import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillPicker } from "./SkillPicker";

const sampleSkills = [
  {
    id: "builtin:rewrite",
    name: "Rewrite",
    enabled: true,
    valid: true,
    scope: "builtin" as const,
    packageId: "pkg-builtin",
    version: "1.0.0",
  },
  {
    id: "global:formal-rewrite",
    name: "正式风格Rewrite",
    enabled: true,
    valid: true,
    scope: "global" as const,
    packageId: "pkg-global",
    version: "1.0.0",
  },
  {
    id: "project:formal-rewrite",
    name: "正式风格Rewrite",
    enabled: true,
    valid: true,
    scope: "project" as const,
    packageId: "pkg-project",
    version: "1.0.0",
  },
  {
    id: "builtin:translate",
    name: "翻译",
    enabled: false,
    valid: true,
    scope: "builtin" as const,
    packageId: "pkg-builtin",
    version: "1.0.0",
  },
];

describe("SkillPicker scope management", () => {
  it("should group skills by scope sections", () => {
    render(
      <SkillPicker
        open={true}
        items={sampleSkills}
        selectedSkillId="builtin:rewrite"
        onOpenChange={vi.fn()}
        onSelectSkillId={vi.fn()}
      />,
    );

    expect(screen.getByText("Built-in Skills")).toBeInTheDocument();
    expect(screen.getByText("Global Skills")).toBeInTheDocument();
    expect(screen.getByText("Project Skills")).toBeInTheDocument();
  });

  it("should render custom-empty state when there are no global/project skills", () => {
    const builtinOnly = sampleSkills.filter((item) => item.scope === "builtin");

    render(
      <SkillPicker
        open={true}
        items={builtinOnly}
        selectedSkillId="builtin:rewrite"
        onOpenChange={vi.fn()}
        onSelectSkillId={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "No custom skills yet. Click to create or describe your needs in natural language.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Skill" }),
    ).toBeInTheDocument();
  });

  it("should gray out disabled skills with opacity + not-allowed cursor", () => {
    render(
      <SkillPicker
        open={true}
        items={sampleSkills}
        selectedSkillId="builtin:rewrite"
        onOpenChange={vi.fn()}
        onSelectSkillId={vi.fn()}
      />,
    );

    const disabledButton = screen.getByTestId("ai-skill-builtin:translate");
    expect(disabledButton).toBeDisabled();
    expect(disabledButton.className).toContain("opacity-50");
    expect(disabledButton.className).toContain("cursor-not-allowed");
  });

  it("should prefer project skill and mark override when project/global names collide", () => {
    render(
      <SkillPicker
        open={true}
        items={sampleSkills}
        selectedSkillId="project:formal-rewrite"
        onOpenChange={vi.fn()}
        onSelectSkillId={vi.fn()}
      />,
    );

    const formalRows = screen.getAllByText("正式风格Rewrite");
    expect(formalRows).toHaveLength(1);
    expect(screen.getByText("Project Override")).toBeInTheDocument();
  });

  it("should still allow selecting enabled skill", async () => {
    const user = userEvent.setup();
    const onSelectSkillId = vi.fn();

    render(
      <SkillPicker
        open={true}
        items={sampleSkills}
        selectedSkillId="builtin:rewrite"
        onOpenChange={vi.fn()}
        onSelectSkillId={onSelectSkillId}
      />,
    );

    await user.click(screen.getByTestId("ai-skill-builtin:rewrite"));
    expect(onSelectSkillId).toHaveBeenCalledWith("builtin:rewrite");
  });
});

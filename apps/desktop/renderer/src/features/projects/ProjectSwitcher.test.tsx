import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "../../components/layout/Sidebar";
import { LayoutTestWrapper } from "../../components/layout/test-utils";
import { LAYOUT_DEFAULTS } from "../../stores/layoutStore";
import type { ProjectListItem } from "../../stores/projectStore";
import { ProjectSwitcher } from "./ProjectSwitcher";

const FIXED_NOW = new Date("2026-02-12T08:30:00.000Z");

const PROJECTS: ProjectListItem[] = [
  {
    projectId: "project-borealis",
    name: "Borealis",
    rootPath: "/projects/borealis",
    type: "screenplay",
    updatedAt: new Date("2026-02-12T08:27:00.000Z").getTime(),
  },
  {
    projectId: "project-atlas",
    name: "Atlas",
    rootPath: "/projects/atlas",
    type: "novel",
    updatedAt: new Date("2026-02-12T08:20:00.000Z").getTime(),
  },
  {
    projectId: "project-comet",
    name: "Comet",
    rootPath: "/projects/comet",
    type: "media",
    updatedAt: new Date("2026-02-12T08:15:00.000Z").getTime(),
  },
];

/**
 * Return the currently rendered option names in display order.
 *
 * Why: tests assert sorting and filtering behavior from user-visible text.
 */
function readOptionNames(): string[] {
  return screen
    .getAllByTestId("project-switcher-option-name")
    .map((el) => el.textContent ?? "");
}

describe("ProjectSwitcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render ProjectSwitcher at the top of Sidebar when Sidebar is expanded", () => {
    render(
      <LayoutTestWrapper>
        <Sidebar
          width={LAYOUT_DEFAULTS.sidebar.default}
          collapsed={false}
          projectId="project-atlas"
          activePanel="files"
          currentProjectId="project-atlas"
          projects={PROJECTS}
          onSwitchProject={vi.fn(async () => {})}
        />
      </LayoutTestWrapper>,
    );

    const sidebar = screen.getByTestId("layout-sidebar");
    const switcher = screen.getByTestId("project-switcher");
    const switcherHost = screen.getByTestId("sidebar-project-switcher");

    expect(within(switcher).getByText("Atlas")).toBeInTheDocument();
    expect(sidebar.firstElementChild).toBe(switcherHost);
    expect(switcherHost.contains(switcher)).toBe(true);
  });

  it("should open a styled dropdown with auto-focused search input when trigger is clicked", () => {
    render(
      <ProjectSwitcher
        currentProjectId="project-atlas"
        projects={PROJECTS}
        onSwitch={vi.fn(async () => {})}
      />,
    );

    fireEvent.click(screen.getByTestId("project-switcher-trigger"));

    const dropdown = screen.getByTestId("project-switcher-dropdown");
    const options = screen.getByTestId("project-switcher-options");
    const searchInput = screen.getByTestId("project-switcher-search");

    expect(dropdown.className).toContain("shadow-[var(--shadow-md)]");
    expect(dropdown.className).toContain("z-[var(--z-dropdown)]");
    expect(options).toHaveClass("max-h-80");
    expect(options).toHaveClass("overflow-y-auto");
    expect(searchInput).toHaveFocus();
  });

  it("should sort by recent update and filter by search input after 150ms debounce", () => {
    render(
      <ProjectSwitcher
        currentProjectId="project-atlas"
        projects={PROJECTS}
        onSwitch={vi.fn(async () => {})}
      />,
    );

    fireEvent.click(screen.getByTestId("project-switcher-trigger"));

    const searchInput = screen.getByTestId("project-switcher-search");

    expect(readOptionNames()).toEqual(["Borealis", "Atlas", "Comet"]);

    fireEvent.change(searchInput, { target: { value: "at" } });
    expect(readOptionNames()).toEqual(["Borealis", "Atlas", "Comet"]);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(readOptionNames()).toEqual(["Atlas"]);

    fireEvent.change(searchInput, { target: { value: "" } });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(readOptionNames()).toEqual(["Borealis", "Atlas", "Comet"]);
  });

  it("should show empty state and create button when no projects exist", () => {
    render(
      <ProjectSwitcher
        currentProjectId={null}
        projects={[]}
        onSwitch={vi.fn(async () => {})}
      />,
    );

    fireEvent.click(screen.getByTestId("project-switcher-trigger"));

    expect(screen.getByText("No projects")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create New Project" }),
    ).toBeInTheDocument();
  });

  it("should switch project via callback and close dropdown when user selects a project", async () => {
    const onSwitch = vi.fn(async () => {});

    render(
      <ProjectSwitcher
        currentProjectId="project-atlas"
        projects={PROJECTS}
        onSwitch={onSwitch}
      />,
    );

    fireEvent.click(screen.getByTestId("project-switcher-trigger"));
    fireEvent.click(
      screen.getByTestId("project-switcher-option-project-borealis"),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(onSwitch).toHaveBeenCalledWith("project-borealis");
    expect(screen.queryByTestId("project-switcher-dropdown")).toBeNull();
  });

  it("should show top progress bar when switching takes longer than 1s and hide it after completion", async () => {
    let resolveSwitch: (() => void) | null = null;
    const onSwitch = vi.fn(() => {
      return new Promise<void>((resolve) => {
        resolveSwitch = resolve;
      });
    });

    render(
      <ProjectSwitcher
        currentProjectId="project-atlas"
        projects={PROJECTS}
        onSwitch={onSwitch}
      />,
    );

    fireEvent.click(screen.getByTestId("project-switcher-trigger"));
    fireEvent.click(
      screen.getByTestId("project-switcher-option-project-borealis"),
    );

    expect(screen.queryByTestId("project-switcher-progress")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.queryByTestId("project-switcher-progress")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("project-switcher-progress")).toBeInTheDocument();

    await act(async () => {
      resolveSwitch?.();
      await Promise.resolve();
    });

    expect(screen.queryByTestId("project-switcher-progress")).toBeNull();
  });
});

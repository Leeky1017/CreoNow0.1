import { render } from "@testing-library/react";
import { composeStories, setProjectAnnotations } from "@storybook/react";
import type { ComponentType } from "react";

import { describe, expect, it } from "vitest";

import preview from "../../../.storybook/preview";
import { expectNoAxeViolations } from "./axe-helper";

setProjectAnnotations(preview);

type StoryPlayStep = <T>(
  label: string,
  playStep: () => Promise<T> | T,
) => Promise<T>;

interface StoryPlayContext {
  canvasElement: HTMLElement;
  step: StoryPlayStep;
}

type ComposedStory = ComponentType<Record<string, never>> & {
  play?: (context: StoryPlayContext) => Promise<void> | void;
};

export type StoryModuleExports = Parameters<typeof composeStories>[0];
export type StoryModuleMap = Record<string, StoryModuleExports>;

interface StoryAxeCase {
  suiteLabel: string;
  storyFilePath: string;
  exportName: string;
  Story: ComposedStory;
}

interface StoryModuleFailure {
  storyFilePath: string;
  message: string;
}

interface DiscoveredStoryModule {
  storyFilePath: string;
  cases: readonly StoryAxeCase[];
}

interface StoryAxeSuite {
  label: string;
  storyFileCount: number;
  storyExportCount: number;
  cases: readonly StoryAxeCase[];
}

export interface StoryAxeSummary {
  storyFileCount: number;
  storyExportCount: number;
  suiteCount: number;
  emptyStoryFiles: readonly string[];
  failedStoryFiles: readonly StoryModuleFailure[];
}

export interface StoryAxeSuiteOptions {
  suite: string;
  storyModules: StoryModuleMap;
}

const runPlayStep: StoryPlayStep = async (_label, playStep) => playStep();

function normalizeStoryFilePath(modulePath: string): string {
  return modulePath.replace(/^\.\//, "").replace(/^\.\.\//, "");
}

function getSuiteLabel(storyFilePath: string): string {
  const [root, section] = storyFilePath.split("/");
  return section ? `${root}/${section}` : root;
}

function toFailureMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function sortStoryCases(left: StoryAxeCase, right: StoryAxeCase): number {
  const pathComparison = left.storyFilePath.localeCompare(right.storyFilePath);

  if (pathComparison !== 0) {
    return pathComparison;
  }

  return left.exportName.localeCompare(right.exportName);
}

function collectStoryCases(
  storyFilePath: string,
  storyModule: StoryModuleExports,
): readonly StoryAxeCase[] {
  const suiteLabel = getSuiteLabel(storyFilePath);
  const composedStories = composeStories(storyModule);

  return Object.entries(composedStories)
    .map(([exportName, Story]) => ({
      suiteLabel,
      storyFilePath,
      exportName,
      Story: Story as ComposedStory,
    }))
    .sort(sortStoryCases);
}

function discoverStoryModules(storyModules: StoryModuleMap): {
  modules: readonly DiscoveredStoryModule[];
  failedStoryFiles: readonly StoryModuleFailure[];
} {
  const sortedStoryModules = Object.entries(storyModules).sort(
    ([leftPath], [rightPath]) => leftPath.localeCompare(rightPath),
  );
  const modules: DiscoveredStoryModule[] = [];
  const failedStoryFiles: StoryModuleFailure[] = [];

  for (const [modulePath, storyModule] of sortedStoryModules) {
    const storyFilePath = normalizeStoryFilePath(modulePath);

    try {
      modules.push({
        storyFilePath,
        cases: collectStoryCases(storyFilePath, storyModule),
      });
    } catch (error) {
      failedStoryFiles.push({
        storyFilePath,
        message: toFailureMessage(error),
      });
    }
  }

  return { modules, failedStoryFiles };
}

function buildSuites(
  modules: readonly DiscoveredStoryModule[],
): readonly StoryAxeSuite[] {
  const suites = new Map<string, StoryAxeCase[]>();
  const storyFilesBySuite = new Map<string, Set<string>>();

  for (const module of modules) {
    for (const storyCase of module.cases) {
      const cases = suites.get(storyCase.suiteLabel) ?? [];
      const storyFiles = storyFilesBySuite.get(storyCase.suiteLabel) ?? new Set();

      cases.push(storyCase);
      storyFiles.add(module.storyFilePath);

      suites.set(storyCase.suiteLabel, cases);
      storyFilesBySuite.set(storyCase.suiteLabel, storyFiles);
    }
  }

  return Array.from(suites.entries())
    .map(([label, cases]) => ({
      label,
      storyFileCount: storyFilesBySuite.get(label)?.size ?? 0,
      storyExportCount: cases.length,
      cases: [...cases].sort(sortStoryCases),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function buildSummary(
  modules: readonly DiscoveredStoryModule[],
  suites: readonly StoryAxeSuite[],
  failedStoryFiles: readonly StoryModuleFailure[],
): StoryAxeSummary {
  return {
    storyFileCount: modules.length,
    storyExportCount: modules.reduce(
      (total, module) => total + module.cases.length,
      0,
    ),
    suiteCount: suites.length,
    emptyStoryFiles: modules
      .filter((module) => module.cases.length === 0)
      .map((module) => module.storyFilePath),
    failedStoryFiles,
  };
}

async function runStoryPlay(
  Story: ComposedStory,
  canvasElement: HTMLElement,
): Promise<void> {
  if (typeof Story.play !== "function") {
    return;
  }

  await Story.play({
    canvasElement,
    step: runPlayStep,
  });
}

function createStoryAuditRoot(): { auditRoot: HTMLElement; storyContainer: HTMLElement } {
  const auditRoot = document.createElement("div");
  const storyContainer = document.createElement("div");

  auditRoot.dataset.testid = "story-axe-root";
  auditRoot.appendChild(storyContainer);
  document.body.appendChild(auditRoot);

  return { auditRoot, storyContainer };
}

function containPortalContent(auditRoot: HTMLElement): HTMLElement[] {
  const movedNodes: HTMLElement[] = [];

  for (const child of Array.from(document.body.children)) {
    if (child !== auditRoot) {
      auditRoot.appendChild(child);
      movedNodes.push(child as HTMLElement);
    }
  }

  return movedNodes;
}

function restorePortalContent(movedNodes: readonly HTMLElement[]): void {
  for (const node of movedNodes) {
    if (node.parentElement !== document.body) {
      document.body.appendChild(node);
    }
  }
}

function hasStructuralLandmark(auditRoot: HTMLElement): boolean {
  return (
    auditRoot.querySelector(
      [
        "main",
        "[role='main']",
        "header",
        "footer",
        "aside",
        "[role='complementary']",
        "nav",
        "[role='navigation']",
        "[role='dialog']",
        "[role='alertdialog']",
        "section[aria-label]",
        "section[aria-labelledby]",
      ].join(", "),
    ) !== null
  );
}

function applyFallbackLandmark(auditRoot: HTMLElement): void {
  if (hasStructuralLandmark(auditRoot)) {
    auditRoot.removeAttribute("role");
    auditRoot.removeAttribute("aria-label");
    return;
  }

  auditRoot.setAttribute("role", "main");
  auditRoot.setAttribute("aria-label", "Story canvas");
}

async function runStoryAxeCase(storyCase: StoryAxeCase): Promise<void> {
  const { auditRoot, storyContainer } = createStoryAuditRoot();
  const { container, unmount } = render(<storyCase.Story />, {
    baseElement: document.body,
    container: storyContainer,
  });
  let movedPortalNodes: HTMLElement[] = [];

  try {
    await runStoryPlay(storyCase.Story, container);
    movedPortalNodes = containPortalContent(auditRoot);
    applyFallbackLandmark(auditRoot);
    await expectNoAxeViolations(
      auditRoot,
      `${storyCase.storyFilePath} :: ${storyCase.exportName}`,
    );
  } finally {
    restorePortalContent(movedPortalNodes);
    unmount();
    auditRoot.remove();
  }
}

export function runDiscoveredStoryAxeSuite({
  suite,
  storyModules,
}: StoryAxeSuiteOptions): StoryAxeSummary {
  const { modules, failedStoryFiles } = discoverStoryModules(storyModules);
  const suites = buildSuites(modules);
  const summary = buildSummary(modules, suites, failedStoryFiles);

  describe(suite, () => {
    it(
      `discovers ${summary.storyFileCount} story files and ${summary.storyExportCount} story exports`,
      () => {
        expect(summary.storyFileCount).toBeGreaterThan(0);
        expect(summary.storyExportCount).toBeGreaterThanOrEqual(
          summary.storyFileCount,
        );
        expect(summary.emptyStoryFiles).toEqual([]);
        expect(summary.failedStoryFiles).toEqual([]);
      },
    );

    for (const storySuite of suites) {
      describe(
        `${storySuite.label} (${storySuite.storyFileCount} files / ${storySuite.storyExportCount} exports)`,
        () => {
          for (const storyCase of storySuite.cases) {
            it(
              `${storyCase.storyFilePath} :: ${storyCase.exportName}`,
              async () => {
                await runStoryAxeCase(storyCase);
              },
              30000,
            );
          }
        },
      );
    }
  });

  return summary;
}

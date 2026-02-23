import { render } from "@testing-library/react";
import type { ComponentType } from "react";

import { describe, expect, it } from "vitest";

type SnapshotStory = ComponentType<Record<string, never>>;

export type StorySnapshotEntry = readonly [name: string, Story: SnapshotStory];

export interface StorySnapshotSuiteOptions {
  suite: string;
  scenarioId?: string;
  testName: string;
  entries: readonly StorySnapshotEntry[];
}

export function runStorySnapshotSuite({
  suite,
  scenarioId,
  testName,
  entries,
}: StorySnapshotSuiteOptions): void {
  describe(suite, () => {
    const title = scenarioId ? `[${scenarioId}] ${testName}` : testName;

    it(title, () => {
      for (const [name, Story] of entries) {
        const { container, unmount } = render(<Story />);
        expect(container.firstChild).toMatchSnapshot(name);
        unmount();
      }
    });
  });
}

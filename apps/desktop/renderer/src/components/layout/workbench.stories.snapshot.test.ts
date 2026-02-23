import { render } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import { describe, expect, it } from "vitest";

import * as iconBarStories from "./IconBar.stories";
import * as rightPanelStories from "./RightPanel.stories";

const {
  Default: IconBarDefault,
  SearchHover,
  KnowledgeGraphActive,
} = composeStories(iconBarStories);
const {
  AiTabDefault,
  InfoTab,
  Collapsed: RightPanelCollapsed,
} = composeStories(rightPanelStories);

describe("workbench stories snapshots", () => {
  it("[WB-TEST-01] should cover icon bar + right panel key story states", () => {
    const entries = [
      ["icon-bar-default", IconBarDefault],
      ["icon-bar-search-hover", SearchHover],
      ["icon-bar-kg-active", KnowledgeGraphActive],
      ["right-panel-ai", AiTabDefault],
      ["right-panel-info", InfoTab],
      ["right-panel-collapsed", RightPanelCollapsed],
    ] as const;

    for (const [name, Story] of entries) {
      const { container, unmount } = render(Story({}));
      expect(container.firstChild).toMatchSnapshot(name);
      unmount();
    }
  });
});

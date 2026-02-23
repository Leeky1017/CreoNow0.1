import { render } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import { describe, expect, it } from "vitest";

import * as toolbarStories from "./EditorToolbar.stories";
import * as writeButtonStories from "./WriteButton.stories";

const {
  Default: ToolbarDefault,
  NoEditor,
  WithFormattedContent,
} = composeStories(toolbarStories);
const {
  Visible: WriteButtonVisible,
  Disabled: WriteButtonDisabled,
  Running: WriteButtonRunning,
} = composeStories(writeButtonStories);

describe("editor stories snapshots", () => {
  it("[ED-TEST-01] should cover toolbar + write button story states", () => {
    const entries = [
      ["editor-toolbar-default", ToolbarDefault],
      ["editor-toolbar-formatted", WithFormattedContent],
      ["editor-toolbar-no-editor", NoEditor],
      ["editor-write-button-visible", WriteButtonVisible],
      ["editor-write-button-disabled", WriteButtonDisabled],
      ["editor-write-button-running", WriteButtonRunning],
    ] as const;

    for (const [name, Story] of entries) {
      const { container, unmount } = render(Story({}));
      expect(container.firstChild).toMatchSnapshot(name);
      unmount();
    }
  });
});

import { composeStories } from "@storybook/react";

import { runStorySnapshotSuite } from "../../test-utils/storySnapshotHarness";

import * as stories from "./KgViews.stories";

const {
  GraphMultiNode,
  GraphMinimal,
  GraphEmpty,
  CharacterCardComplete,
  CharacterCardPartial,
  CharacterCardEmpty,
} = composeStories(stories);

runStorySnapshotSuite({
  suite: "kg-views.stories snapshots",
  testName:
    "should cover graph(3 states) and character-card(3 states) story snapshots",
  entries: [
    ["graph-multi-node", GraphMultiNode],
    ["graph-minimal", GraphMinimal],
    ["graph-empty", GraphEmpty],
    ["character-card-complete", CharacterCardComplete],
    ["character-card-partial", CharacterCardPartial],
    ["character-card-empty", CharacterCardEmpty],
  ],
});

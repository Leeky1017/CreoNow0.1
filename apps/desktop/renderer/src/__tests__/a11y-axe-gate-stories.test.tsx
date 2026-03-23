import { describe } from "vitest";
import {
  runDiscoveredStoryAxeSuite,
  type StoryModuleExports,
  type StoryModuleMap,
} from "../test-utils/storyAxeHarness";

interface ImportMetaGlob {
  glob: <TModule>(
    pattern: string,
    options: {
      eager: true;
    },
  ) => Record<string, TModule>;
}

const storyModules = (
  import.meta as ImportMeta & ImportMetaGlob
).glob<StoryModuleExports>("../**/*.stories.tsx", {
  eager: true,
}) satisfies StoryModuleMap;

describe("a11y axe story discovery", () => {
  runDiscoveredStoryAxeSuite({
    suite: "axe-core a11y gate — storybook-wide stories",
    storyModules,
  });
});

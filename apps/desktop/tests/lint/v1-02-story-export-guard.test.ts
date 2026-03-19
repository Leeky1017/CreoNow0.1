/**
 * v1-02 Story export guard
 *
 * Ensures that each v1-02 new variant / size has a dedicated Storybook story
 * export. This prevents accidental deletion of variant-specific stories during
 * refactoring.
 *
 * Covered v1-02 additions:
 * - Button: pill variant, icon size
 * - Card: bento variant, compact variant
 * - Tabs: underline indicator
 * - Badge: pill shape
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PRIMITIVES_DIR = path.resolve(
  import.meta.dirname,
  "../../renderer/src/components/primitives",
);

function readStory(component: string): string {
  return readFileSync(
    path.join(PRIMITIVES_DIR, `${component}.stories.tsx`),
    "utf8",
  );
}

describe("v1-02 variant story export guard", () => {
  describe("Button", () => {
    const source = readStory("Button");

    it("exports a dedicated Pill story", () => {
      expect(source).toMatch(/export\s+const\s+Pill\s*:\s*Story/);
    });

    it("exports a dedicated IconOnly story", () => {
      expect(source).toMatch(/export\s+const\s+IconOnly\s*:\s*Story/);
    });
  });

  describe("Card", () => {
    const source = readStory("Card");

    it("exports a dedicated Bento story", () => {
      expect(source).toMatch(/export\s+const\s+Bento\s*:\s*Story/);
    });

    it("exports a dedicated Compact story", () => {
      expect(source).toMatch(/export\s+const\s+Compact\s*:\s*Story/);
    });
  });

  describe("Tabs", () => {
    const source = readStory("Tabs");

    it("exports a dedicated Underline story", () => {
      expect(source).toMatch(/export\s+const\s+Underline\s*:\s*Story/);
    });
  });

  describe("Badge", () => {
    const source = readStory("Badge");

    it("exports a dedicated Pill story", () => {
      expect(source).toMatch(/export\s+const\s+Pill\s*:\s*Story/);
    });
  });
});

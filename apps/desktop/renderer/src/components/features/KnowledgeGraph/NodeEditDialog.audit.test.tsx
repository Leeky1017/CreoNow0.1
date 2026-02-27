import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("NodeEditDialog entity type options", () => {
  it("AUD-C11-S3: UI options must not include 'other'", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "renderer/src/components/features/KnowledgeGraph/NodeEditDialog.tsx",
      ),
      "utf8",
    );

    expect(source).not.toContain('value: "other"');
    expect(source).toContain('value: "faction"');
  });
});

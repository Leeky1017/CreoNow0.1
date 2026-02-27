import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("memoryStore bootstrap retirement", () => {
  it("AUD-C11-S5/S6: memoryStore must not define deprecated bootstrapForProject", () => {
    const source = readFileSync(
      resolve(process.cwd(), "renderer/src/stores/memoryStore.ts"),
      "utf8",
    );

    expect(source).not.toContain("bootstrapForProject");
    expect(source).toContain("bootstrapForContext");
  });
});

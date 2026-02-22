import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_SRC_DIR = resolve(CURRENT_DIR, "..", "..");

const PHASE1_TARGET_FILES = [
  "features/ai/ModelPicker.tsx",
  "features/ai/ModePicker.tsx",
] as const;

function readRendererFile(relativePath: string): string {
  return readFileSync(resolve(RENDERER_SRC_DIR, relativePath), "utf8");
}

function findNonExemptNativeControls(source: string): string[] {
  const withoutFileInputs = source.replace(
    /<\s*input\b[^>]*\btype\s*=\s*["']file["'][^>]*>/g,
    "",
  );

  return withoutFileInputs.match(/<\s*(button|input)\b/g) ?? [];
}

describe("WB-P1-S5: primitive replacement guard", () => {
  it("disallows direct non-exempt <button>/<input> usage in phase1 target files", () => {
    for (const relativePath of PHASE1_TARGET_FILES) {
      const source = readRendererFile(relativePath);
      const nonExemptMatches = findNonExemptNativeControls(source);

      expect(
        nonExemptMatches,
        `${relativePath} should use primitives instead of direct native controls`,
      ).toHaveLength(0);
    }
  });
});

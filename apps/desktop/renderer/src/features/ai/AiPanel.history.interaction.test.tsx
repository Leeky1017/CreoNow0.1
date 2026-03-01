import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../..",
);

describe("WB-FE-CLN-S3: AI history interaction guard", () => {
  it("ChatHistory does not use hardcoded MOCK_HISTORY data", () => {
    const filePath = path.join(
      REPO_ROOT,
      "apps/desktop/renderer/src/features/ai/ChatHistory.tsx",
    );
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/\bMOCK_HISTORY\b/);
  });

  it("onSelectChat handler in RightPanel is not a no-op", () => {
    const filePath = path.join(
      REPO_ROOT,
      "apps/desktop/renderer/src/components/layout/RightPanel.tsx",
    );
    const content = fs.readFileSync(filePath, "utf-8");
    // The pattern `void chatId` is the no-op placeholder
    expect(content).not.toMatch(/void\s+chatId/);
  });
});

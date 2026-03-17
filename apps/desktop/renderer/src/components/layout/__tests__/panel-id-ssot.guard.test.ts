import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OWNER_ALIGNED_ICONBAR_ORDER = [
  "files",
  "search",
  "outline",
  "versionHistory",
  "memory",
  "characters",
  "knowledgeGraph",
] as const;

const OWNER_ALIGNED_RIGHT_PANEL_TABS = ["ai", "info", "quality"] as const;

function readSource(relativePath: string): string {
  const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(filePath, "utf8");
}

function extractIconBarCodeOrder(iconBarSource: string): string[] {
  const mainIconsBlock = iconBarSource.match(
    /const MAIN_ICONS: IconItem\[] = \[([\s\S]*?)\];/,
  );

  if (!mainIconsBlock) {
    throw new Error("Cannot locate MAIN_ICONS block in IconBar.tsx.");
  }

  return Array.from(
    mainIconsBlock[1].matchAll(/(?:id|panel):\s*"([^"]+)"/g),
  ).map((match) => match[1]);
}

function extractRightPanelTypeUnion(layoutStoreSource: string): string[] {
  const unionMatch = layoutStoreSource.match(
    /export type RightPanelType\s*=\s*([^;]+);/,
  );

  if (!unionMatch) {
    throw new Error("Cannot locate RightPanelType union in layoutStore.tsx.");
  }

  return Array.from(unionMatch[1].matchAll(/"([^"]+)"/g)).map(
    (match) => match[1],
  );
}

function hasMediaFutureMarker(mainWorkbenchSpec: string): boolean {
  return /`media`[\s\S]*?\[FUTURE\]/.test(mainWorkbenchSpec);
}

describe("WB-FE-DRIFT panel-id SSOT guard", () => {
  it("IconBar current order stays aligned with owner-decided contract and keeps media as [FUTURE] (WB-FE-DRIFT-S1)", () => {
    const mainWorkbenchSpec = readSource(
      "../../../../../../../openspec/specs/workbench/spec.md",
    );
    const iconBarSource = readSource("../IconBar.tsx");

    const actualOrder = extractIconBarCodeOrder(iconBarSource);

    expect(actualOrder).toEqual([...OWNER_ALIGNED_ICONBAR_ORDER]);
    expect(hasMediaFutureMarker(mainWorkbenchSpec)).toBe(true);
    expect(actualOrder).not.toContain("media");
  });

  it("knowledge graph semantic ID is fixed to knowledgeGraph (WB-FE-DRIFT-S2)", () => {
    const layoutStoreSource = readSource("../../../stores/layoutStore.tsx");
    const iconBarSource = readSource("../IconBar.tsx");
    const codeSources = [layoutStoreSource, iconBarSource].join("\n");

    const hasGraphIdInCode = /(["'])graph\1/.test(codeSources);
    const hasKnowledgeGraphId = /(["'])knowledgeGraph\1/.test(codeSources);

    expect(hasKnowledgeGraphId).toBe(true);
    expect(hasGraphIdInCode).toBe(false);
  });

  it("RightPanel tab set matches spec enum (ai/info/quality) (WB-FE-DRIFT-S3)", () => {
    const layoutStoreSource = readSource("../../../stores/layoutStore.tsx");
    const storeEnum = extractRightPanelTypeUnion(layoutStoreSource);

    expect(storeEnum).toEqual([...OWNER_ALIGNED_RIGHT_PANEL_TABS]);
  });
});

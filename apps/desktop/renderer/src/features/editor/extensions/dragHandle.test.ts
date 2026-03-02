import { describe, it, expect } from "vitest";
import {
  createDragHandleDecorations,
  DragHandleExtension,
} from "./dragHandle";

describe("dragHandle extension", () => {
  it("[ED-FE-ADV-S1] creates drag handle decoration for block nodes", () => {
    const blocks = [
      { type: "paragraph", pos: 0 },
      { type: "heading", pos: 10 },
      { type: "paragraph", pos: 25 },
    ];
    const decorations = createDragHandleDecorations({ blocks, editable: true });
    expect(decorations).toHaveLength(3);
    expect(decorations[0]).toHaveProperty("blockPos", 0);
    expect(decorations[0]).toHaveProperty("blockType", "paragraph");
    expect(decorations[1]).toHaveProperty("blockPos", 10);
    expect(decorations[1]).toHaveProperty("blockType", "heading");
    expect(decorations[2]).toHaveProperty("blockPos", 25);
  });

  it("[ED-FE-ADV-S1b] does not render drag handle in readonly mode", () => {
    const blocks = [{ type: "paragraph", pos: 0 }];
    const decorations = createDragHandleDecorations({
      blocks,
      editable: false,
    });
    expect(decorations).toHaveLength(0);
  });

  it("[ED-FE-ADV-S1c] returns empty array when no blocks provided", () => {
    const decorations = createDragHandleDecorations({
      blocks: [],
      editable: true,
    });
    expect(decorations).toHaveLength(0);
  });

  it("[ED-FE-ADV-S1d] extension contract has correct shape", () => {
    expect(DragHandleExtension.name).toBe("dragHandle");
    expect(DragHandleExtension.decorations).toEqual([]);
  });
});

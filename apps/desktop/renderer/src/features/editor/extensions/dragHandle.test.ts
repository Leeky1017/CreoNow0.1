import { describe, it, expect, vi } from "vitest";
import {
  createDragHandleDecorations,
  DragHandleExtension,
  executeDragReorder,
} from "./dragHandle";
import type { DragReorderEditor, DragReorderChain } from "./dragHandle";

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

  it("[ED-FE-ADV-S1d] extension is a real TipTap Extension with drag lifecycle hooks", () => {
    expect(DragHandleExtension.config.name).toBe("dragHandle");
    expect(DragHandleExtension.config.onUpdate).toBeDefined();
    expect(DragHandleExtension.config.addStorage).toBeDefined();
    // Visible handle mount + cleanup (the lifecycle execution path)
    expect(DragHandleExtension.config.onCreate).toBeDefined();
    expect(DragHandleExtension.config.onDestroy).toBeDefined();
  });

  it("[ED-FE-ADV-S1e] executeDragReorder moves block from source to target", () => {
    const chain: DragReorderChain = {
      deleteRange: vi.fn().mockReturnThis(),
      insertContentAt: vi.fn().mockReturnThis(),
      run: vi.fn().mockReturnValue(true),
    };
    const nodeJson = { type: "paragraph", content: [{ type: "text", text: "moved" }] };
    const editor: DragReorderEditor = {
      state: {
        doc: {
          nodeAt: vi.fn().mockReturnValue({
            nodeSize: 8,
            toJSON: () => nodeJson,
          }),
        },
      },
      chain: vi.fn().mockReturnValue(chain),
    };

    const result = executeDragReorder(editor, 5, 20);

    expect(result).toBe(true);
    expect(chain.deleteRange).toHaveBeenCalledWith({ from: 5, to: 13 });
    // 20 - 8 = 12 (adjusted because source is before target)
    expect(chain.insertContentAt).toHaveBeenCalledWith(12, nodeJson);
    expect(chain.run).toHaveBeenCalled();
  });

  it("[ED-FE-ADV-S1f] executeDragReorder returns false when source node not found", () => {
    const editor: DragReorderEditor = {
      state: { doc: { nodeAt: vi.fn().mockReturnValue(null) } },
      chain: vi.fn(),
    };

    expect(executeDragReorder(editor, 5, 20)).toBe(false);
    expect(editor.chain).not.toHaveBeenCalled();
  });

  it("[ED-FE-ADV-S1g] executeDragReorder returns false when source equals target", () => {
    const editor: DragReorderEditor = {
      state: { doc: { nodeAt: vi.fn() } },
      chain: vi.fn(),
    };

    expect(executeDragReorder(editor, 5, 5)).toBe(false);
    expect(editor.state.doc.nodeAt).not.toHaveBeenCalled();
  });
});

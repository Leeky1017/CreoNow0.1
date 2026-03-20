/**
 * v1-05 Editor Decomposition Guard Tests
 *
 * Verifies structural constraints after decomposing EditorPane.tsx (1515 lines),
 * EditorToolbar.tsx (457 lines), and EditorBubbleMenu.tsx (414 lines) into
 * focused sub-modules.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(__dirname, "..");

function readSource(filename: string): string {
  return readFileSync(resolve(dir, filename), "utf-8");
}

function fileExists(filename: string): boolean {
  return existsSync(resolve(dir, filename));
}

function countLines(filename: string): number {
  const content = readSource(filename);
  const lines = content.split("\n");
  return content.endsWith("\n") ? lines.length - 1 : lines.length;
}

describe("Editor decomposition guard", () => {
  describe("AC-1: EditorPane.tsx ≤ 300 lines", () => {
    it("EditorPane.tsx should be ≤ 300 lines after decomposition", () => {
      const lines = countLines("EditorPane.tsx");
      expect(lines).toBeLessThanOrEqual(300);
    });
  });

  describe("AC-2: EditorToolbar.tsx ≤ 300 lines", () => {
    it("EditorToolbar.tsx should be ≤ 300 lines after decomposition", () => {
      const lines = countLines("EditorToolbar.tsx");
      expect(lines).toBeLessThanOrEqual(300);
    });
  });

  describe("AC-3: EditorBubbleMenu.tsx ≤ 300 lines", () => {
    it("EditorBubbleMenu.tsx should be ≤ 300 lines after decomposition", () => {
      const lines = countLines("EditorBubbleMenu.tsx");
      expect(lines).toBeLessThanOrEqual(300);
    });
  });

  describe("AC-4: extraction files exist", () => {
    it("useEditorSetup.ts exists", () => {
      expect(fileExists("useEditorSetup.ts")).toBe(true);
    });
    it("useEditorKeybindings.ts exists", () => {
      expect(fileExists("useEditorKeybindings.ts")).toBe(true);
    });
    it("useEntityCompletion.ts exists", () => {
      expect(fileExists("useEntityCompletion.ts")).toBe(true);
    });
    it("editorPaneHelpers.ts exists", () => {
      expect(fileExists("editorPaneHelpers.ts")).toBe(true);
    });
    it("InlineAiOverlay.tsx exists as standalone", () => {
      expect(fileExists("InlineAiOverlay.tsx")).toBe(true);
    });
    it("ToolbarFormatGroup.tsx exists", () => {
      expect(fileExists("ToolbarFormatGroup.tsx")).toBe(true);
    });
    it("BubbleMenuFormatActions.tsx exists", () => {
      expect(fileExists("BubbleMenuFormatActions.tsx")).toBe(true);
    });
    it("BubbleMenuAiActions.tsx exists", () => {
      expect(fileExists("BubbleMenuAiActions.tsx")).toBe(true);
    });
  });

  describe("AC-5: EditorPane uses extracted modules", () => {
    it("EditorPane.tsx imports useEditorSetup", () => {
      const source = readSource("EditorPane.tsx");
      expect(source).toMatch(/from\s+["']\.\/useEditorSetup["']/);
    });
    it("EditorPane.tsx imports useEditorKeybindings", () => {
      const source = readSource("EditorPane.tsx");
      expect(source).toMatch(/from\s+["']\.\/useEditorKeybindings["']/);
    });
    it("EditorPane.tsx imports useEntityCompletion", () => {
      const source = readSource("EditorPane.tsx");
      expect(source).toMatch(/from\s+["']\.\/useEntityCompletion["']/);
    });
  });

  describe("AC-6: EditorToolbar uses extracted format group", () => {
    it("EditorToolbar.tsx imports ToolbarFormatGroup", () => {
      const source = readSource("EditorToolbar.tsx");
      expect(source).toMatch(/from\s+["']\.\/ToolbarFormatGroup["']/);
    });
  });

  describe("AC-7: EditorBubbleMenu uses extracted actions", () => {
    it("EditorBubbleMenu.tsx imports BubbleMenuFormatActions", () => {
      const source = readSource("EditorBubbleMenu.tsx");
      expect(source).toMatch(/from\s+["']\.\/BubbleMenuFormatActions["']/);
    });
    it("EditorBubbleMenu.tsx imports BubbleMenuAiActions", () => {
      const source = readSource("EditorBubbleMenu.tsx");
      expect(source).toMatch(/from\s+["']\.\/BubbleMenuAiActions["']/);
    });
  });

  describe("AC-8: existing exports preserved", () => {
    it("EditorPane re-exports parseEditorContentJsonSafely", () => {
      const source = readSource("EditorPane.tsx");
      expect(source).toMatch(/parseEditorContentJsonSafely/);
    });
    it("EditorPane re-exports chunkLargePasteText", () => {
      const source = readSource("EditorPane.tsx");
      expect(source).toMatch(/chunkLargePasteText/);
    });
    it("EditorPane re-exports sanitizePastedHtml", () => {
      const source = readSource("EditorPane.tsx");
      expect(source).toMatch(/sanitizePastedHtml/);
    });
    it("EditorPane re-exports InlineAiOverlay", () => {
      const source = readSource("EditorPane.tsx");
      expect(source).toMatch(/InlineAiOverlay/);
    });
    it("EditorBubbleMenu.tsx still exports EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY", () => {
      const source = readSource("EditorBubbleMenu.tsx");
      expect(source).toMatch(/export.*EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY/);
    });
  });
});

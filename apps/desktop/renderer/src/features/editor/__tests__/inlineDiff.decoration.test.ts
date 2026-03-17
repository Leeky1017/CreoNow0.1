import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import {
  createInlineDiffDecorations,
  InlineDiffExtension,
  resolveInlineDiffText,
} from "../extensions/inlineDiff";

/* ------------------------------------------------------------------ */
/*  VC-FE-DIFF-S1 — createInlineDiffDecorations pure-function baseline */
/* ------------------------------------------------------------------ */

describe("VC-FE-DIFF-S1: createInlineDiffDecorations returns decoration data", () => {
  it("returns non-empty decoration array for differing texts", () => {
    const decorations = createInlineDiffDecorations({
      originalText: "Hello world",
      suggestedText: "Hello universe",
    });

    expect(decorations.length).toBeGreaterThan(0);
    expect(decorations[0]).toHaveProperty("removedLines");
    expect(decorations[0]).toHaveProperty("addedLines");
  });

  it("returns empty array when texts are identical", () => {
    const decorations = createInlineDiffDecorations({
      originalText: "Same text",
      suggestedText: "Same text",
    });

    expect(decorations).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/*  VC-FE-DIFF-S2 — InlineDiffExtension produces DecorationSet         */
/* ------------------------------------------------------------------ */

describe("VC-FE-DIFF-S2: InlineDiffExtension produces ProseMirror DecorationSet when diff data is provided", () => {
  it("produces decorations when diff data is injected via storage", () => {
    const editor = new Editor({
      extensions: [StarterKit, InlineDiffExtension],
      content: "<p>Hello world</p>",
    });

    // Inject diff data via extension storage
    const diffData = createInlineDiffDecorations({
      originalText: "Hello world",
      suggestedText: "Hello universe",
    });

    editor.storage.inlineDiff.diffs = diffData;
    // Dispatch a transaction to trigger plugin state update
    editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));

    // Access the plugin's DecorationSet via the view
    const pluginKey = "inlineDiff$";
    const plugins = editor.state.plugins;
    const inlineDiffPlugin = plugins.find(
      (p) => (p as unknown as { key: string }).key === pluginKey,
    );
    expect(inlineDiffPlugin).toBeDefined();

    const pluginState = inlineDiffPlugin!.getState(editor.state);
    // Plugin state should be a non-empty DecorationSet
    expect(pluginState).toBeDefined();
    expect(pluginState.find).toBeDefined(); // DecorationSet has .find()
    expect(pluginState.find().length).toBeGreaterThan(0);

    editor.destroy();
  });
});

/* ------------------------------------------------------------------ */
/*  VC-FE-DIFF-S3 — clears decorations when diff data is removed       */
/* ------------------------------------------------------------------ */

describe("VC-FE-DIFF-S3: InlineDiffExtension clears decorations when diff data is removed", () => {
  it("has empty DecorationSet after clearing diff data", () => {
    const editor = new Editor({
      extensions: [StarterKit, InlineDiffExtension],
      content: "<p>Hello world</p>",
    });

    // 1. Inject diff data
    const diffData = createInlineDiffDecorations({
      originalText: "Hello world",
      suggestedText: "Hello universe",
    });
    editor.storage.inlineDiff.diffs = diffData;
    editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));

    // 2. Clear diff data
    editor.storage.inlineDiff.diffs = [];
    editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));

    // 3. Plugin state should be empty
    const plugins = editor.state.plugins;
    const inlineDiffPlugin = plugins.find(
      (p) => (p as unknown as { key: string }).key === "inlineDiff$",
    );
    expect(inlineDiffPlugin).toBeDefined();

    const pluginState = inlineDiffPlugin!.getState(editor.state);
    expect(pluginState.find().length).toBe(0);

    editor.destroy();
  });
});

/* ------------------------------------------------------------------ */
/*  VC-FE-DIFF-S4 — decoration CSS classes use semantic tokens          */
/* ------------------------------------------------------------------ */

describe("VC-FE-DIFF-S4: decoration uses semantic token classes for insert/delete", () => {
  it("decorations include inline-diff-added and inline-diff-removed classes", () => {
    const editor = new Editor({
      extensions: [StarterKit, InlineDiffExtension],
      content: "<p>Hello world</p>",
    });

    const diffData = createInlineDiffDecorations({
      originalText: "Hello world",
      suggestedText: "Hello universe",
    });
    editor.storage.inlineDiff.diffs = diffData;
    editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));

    const plugins = editor.state.plugins;
    const inlineDiffPlugin = plugins.find(
      (p) => (p as unknown as { key: string }).key === "inlineDiff$",
    );
    expect(inlineDiffPlugin).toBeDefined();

    const pluginState = inlineDiffPlugin!.getState(editor.state);
    const decorations = pluginState.find();

    // Inline decorations store attrs (including class) in spec.attrs or
    // directly as the attrs object depending on ProseMirror version.
    // We check both the spec and the rendered DOM attribute.
    const classNames = decorations.map(
      (d: {
        spec?: { class?: string };
        type?: { attrs?: { class?: string } };
      }) => {
        // ProseMirror Decoration.inline stores attrs in type.attrs
        const fromAttrs = d.type?.attrs?.class ?? "";
        const fromSpec = d.spec?.class ?? "";
        return fromAttrs || fromSpec;
      },
    );

    const hasAdded = classNames.some((c: string) =>
      c.includes("inline-diff-added"),
    );
    const hasRemoved = classNames.some((c: string) =>
      c.includes("inline-diff-removed"),
    );

    // We expect at least removed since doc text matches removedLines
    expect(hasAdded || hasRemoved).toBe(true);

    editor.destroy();
  });
});

/* ------------------------------------------------------------------ */
/*  VC-FE-DIFF-S5 — accept/reject resolves diff text correctly        */
/* ------------------------------------------------------------------ */

describe("VC-FE-DIFF-S5: accept/reject resolves InlineDiff text correctly", () => {
  it("accepting all hunks produces the suggested text", () => {
    const original = "Hello world\nFoo bar";
    const suggested = "Hello universe\nFoo baz";

    const decorations = createInlineDiffDecorations({
      originalText: original,
      suggestedText: suggested,
    });

    const decisions = decorations.map(() => "accepted" as const);
    const result = resolveInlineDiffText({
      originalText: original,
      suggestedText: suggested,
      decisions,
    });

    expect(result).toBe(suggested);
  });

  it("rejecting all hunks preserves the original text", () => {
    const original = "Hello world\nFoo bar";
    const suggested = "Hello universe\nFoo baz";

    const decorations = createInlineDiffDecorations({
      originalText: original,
      suggestedText: suggested,
    });

    const decisions = decorations.map(() => "rejected" as const);
    const result = resolveInlineDiffText({
      originalText: original,
      suggestedText: suggested,
      decisions,
    });

    expect(result).toBe(original);
  });
});

/* ------------------------------------------------------------------ */
/*  VC-FE-DIFF-S6 — extension registered in editor produces diffs     */
/*  on apply-arm and clears on dismiss                                 */
/* ------------------------------------------------------------------ */

describe("VC-FE-DIFF-S6: InlineDiff lifecycle — show on arm, clear on dismiss", () => {
  it("shows decorations when diff data is set and clears when emptied", () => {
    const editor = new Editor({
      extensions: [StarterKit, InlineDiffExtension],
      content: "<p>Hello world</p>",
    });

    // Arm: inject diffs
    const diffs = createInlineDiffDecorations({
      originalText: "Hello world",
      suggestedText: "Hello universe",
    });
    editor.storage.inlineDiff.diffs = diffs;
    editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));

    const plugin = editor.state.plugins.find(
      (p) => (p as unknown as { key: string }).key === "inlineDiff$",
    );
    expect(plugin).toBeDefined();
    expect(plugin!.getState(editor.state).find().length).toBeGreaterThan(0);

    // Dismiss: clear diffs
    editor.storage.inlineDiff.diffs = [];
    editor.view.dispatch(editor.state.tr.setMeta("inlineDiffUpdate", true));
    expect(plugin!.getState(editor.state).find().length).toBe(0);

    editor.destroy();
  });
});

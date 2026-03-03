import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

import {
  applyHunkDecisions,
  computeDiffHunks,
  type DiffHunkDecision,
} from "../../../lib/diff/unifiedDiff";

export type InlineDiffDecision = DiffHunkDecision;

export type InlineDiffDecoration = {
  hunkIndex: number;
  removedLines: string[];
  addedLines: string[];
};

export function createPendingInlineDiffDecisions(
  length: number,
): InlineDiffDecision[] {
  return Array.from({ length }, () => "pending");
}

export function createInlineDiffDecorations(args: {
  originalText: string;
  suggestedText: string;
}): InlineDiffDecoration[] {
  return computeDiffHunks({
    oldText: args.originalText,
    newText: args.suggestedText,
  }).map((hunk) => ({
    hunkIndex: hunk.index,
    removedLines: hunk.oldLines,
    addedLines: hunk.newLines,
  }));
}

export function resolveInlineDiffText(args: {
  originalText: string;
  suggestedText: string;
  decisions: InlineDiffDecision[];
}): string {
  return applyHunkDecisions({
    oldText: args.originalText,
    newText: args.suggestedText,
    decisions: args.decisions,
  });
}

/* ------------------------------------------------------------------ */
/*  diffToDecorationSet — pure function                                */
/* ------------------------------------------------------------------ */

/**
 * Map an array of InlineDiffDecoration to a ProseMirror DecorationSet.
 *
 * Walks the document's top-level block nodes (paragraphs) and matches
 * their text content against removed/added lines from each hunk.
 * - Removed lines → `inline-diff-removed` (red highlight + line-through)
 * - Added lines   → `inline-diff-added`   (green highlight)
 */
export function diffToDecorationSet(
  diffs: ReadonlyArray<InlineDiffDecoration>,
  doc: ProseMirrorNode,
): DecorationSet {
  if (diffs.length === 0) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  // Collect block-level lines with their positions.
  const docLines: { text: string; from: number; to: number }[] = [];
  doc.forEach((node, offset) => {
    docLines.push({
      text: node.textContent,
      from: offset + 1, // inside the node (skip node open token)
      to: offset + node.nodeSize - 1, // before node close token
    });
  });

  // Build a mutable set so each doc line is matched at most once.
  const usedLineIndices = new Set<number>();

  for (const diff of diffs) {
    for (const removedLine of diff.removedLines) {
      const idx = docLines.findIndex(
        (l, i) => !usedLineIndices.has(i) && l.text === removedLine,
      );
      if (idx !== -1) {
        const line = docLines[idx];
        usedLineIndices.add(idx);
        if (line.from < line.to) {
          decorations.push(
            Decoration.inline(line.from, line.to, {
              class: "inline-diff-removed",
            }),
          );
        }
      }
    }

    for (const addedLine of diff.addedLines) {
      const idx = docLines.findIndex(
        (l, i) => !usedLineIndices.has(i) && l.text === addedLine,
      );
      if (idx !== -1) {
        const line = docLines[idx];
        usedLineIndices.add(idx);
        if (line.from < line.to) {
          decorations.push(
            Decoration.inline(line.from, line.to, {
              class: "inline-diff-added",
            }),
          );
        }
      }
    }
  }

  if (decorations.length === 0) return DecorationSet.empty;
  return DecorationSet.create(doc, decorations);
}

/* ------------------------------------------------------------------ */
/*  InlineDiffExtension — TipTap Extension                             */
/* ------------------------------------------------------------------ */

export interface InlineDiffStorage {
  /** Diff hunk data to render as inline decorations. */
  diffs: InlineDiffDecoration[];
}

const inlineDiffPluginKey = new PluginKey("inlineDiff");

/**
 * TipTap Extension that renders inline diff decorations in the editor.
 *
 * Usage:
 *   1. Register via `extensions: [InlineDiffExtension]`
 *   2. Set `editor.storage.inlineDiff.diffs = [...]`
 *   3. Dispatch `editor.view.dispatch(tr.setMeta("inlineDiffUpdate", true))`
 *   4. Clear by setting `diffs = []` and dispatching again.
 */
export const InlineDiffExtension = Extension.create<
  Record<string, never>,
  InlineDiffStorage
>({
  name: "inlineDiff",

  addStorage(): InlineDiffStorage {
    return { diffs: [] };
  },

  addProseMirrorPlugins() {
    const extensionStorage = this.storage;

    return [
      new Plugin({
        key: inlineDiffPluginKey,

        state: {
          init() {
            return DecorationSet.empty;
          },

          apply(tr, oldSet, _oldState, newState) {
            if (tr.getMeta("inlineDiffUpdate")) {
              return diffToDecorationSet(extensionStorage.diffs, newState.doc);
            }
            if (tr.docChanged) {
              return oldSet.map(tr.mapping, tr.doc);
            }
            return oldSet;
          },
        },

        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

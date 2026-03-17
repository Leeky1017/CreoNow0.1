/**
 * Drag Handle extension — visible drag handles with block reorder.
 *
 * 1. Computes block positions on every update (storage.blockPositions).
 * 2. Mounts a floating drag-handle element in the editor wrapper
 *    (onCreate), positions it on block hover, and enables HTML5
 *    drag-and-drop to reorder top-level blocks.
 * 3. Read-only editors suppress all handles.
 *
 * CSS class `.drag-handle` is styled in main.css.
 */

import { Extension } from "@tiptap/react";

/* ------------------------------------------------------------------ */
/*  Pure-function contract                                             */
/* ------------------------------------------------------------------ */

export type DragHandleDecoration = {
  /** ProseMirror position of the block node */
  blockPos: number;
  /** Node type name (paragraph, heading, etc.) */
  blockType: string;
};

/**
 * Create drag handle decorations for every provided block node.
 *
 * @returns Empty array when the editor is not editable.
 */
export function createDragHandleDecorations(args: {
  blocks: ReadonlyArray<{ type: string; pos: number }>;
  editable: boolean;
}): DragHandleDecoration[] {
  if (!args.editable) return [];
  return args.blocks.map((block) => ({
    blockPos: block.pos,
    blockType: block.type,
  }));
}

/* ------------------------------------------------------------------ */
/*  Drag reorder — pure function                                       */
/* ------------------------------------------------------------------ */

/** Minimal editor surface needed by `executeDragReorder`. */
export interface DragReorderEditor {
  state: {
    doc: {
      nodeAt: (
        pos: number,
      ) => { nodeSize: number; toJSON: () => Record<string, unknown> } | null;
    };
  };
  chain: () => DragReorderChain;
}

/** Fluent chain subset used by reorder. */
export interface DragReorderChain {
  deleteRange: (range: { from: number; to: number }) => DragReorderChain;
  insertContentAt: (
    pos: number,
    content: Record<string, unknown>,
  ) => DragReorderChain;
  run: () => boolean;
}

/**
 * Move the block at `sourceBlockPos` to `targetBlockPos`.
 *
 * Uses editor.chain() to atomically delete the source and insert at target.
 * Returns `true` when the reorder was applied.
 */
export function executeDragReorder(
  editor: DragReorderEditor,
  sourceBlockPos: number,
  targetBlockPos: number,
): boolean {
  if (sourceBlockPos === targetBlockPos) return false;

  const sourceNode = editor.state.doc.nodeAt(sourceBlockPos);
  if (!sourceNode) return false;

  const nodeJson = sourceNode.toJSON();
  const nodeSize = sourceNode.nodeSize;

  /* When the source is before the target the positions shift after delete. */
  const adjustedTarget =
    targetBlockPos > sourceBlockPos
      ? targetBlockPos - nodeSize
      : targetBlockPos;

  return editor
    .chain()
    .deleteRange({ from: sourceBlockPos, to: sourceBlockPos + nodeSize })
    .insertContentAt(adjustedTarget, nodeJson)
    .run();
}

/* ------------------------------------------------------------------ */
/*  TipTap Extension                                                   */
/* ------------------------------------------------------------------ */

/** @internal listeners kept for cleanup in onDestroy. */
interface DragListeners {
  onMouseOver: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

export interface DragHandleStorage {
  /** Computed block positions. Empty when read-only. */
  blockPositions: DragHandleDecoration[];
  /** @internal – mounted handle element (null in tests / SSR). */
  _handleEl: HTMLElement | null;
  /** @internal – registered listeners for cleanup. */
  _listeners: DragListeners | null;
}

/**
 * TipTap Extension for block drag handles.
 *
 * Lifecycle:
 *  - **onCreate** — mounts a `.drag-handle` element, attaches drag events.
 *  - **onUpdate** — recomputes `storage.blockPositions`.
 *  - **onDestroy** — removes the element and listeners.
 */
export const DragHandleExtension = Extension.create<
  Record<string, never>,
  DragHandleStorage
>({
  name: "dragHandle",

  addStorage(): DragHandleStorage {
    return {
      blockPositions: [],
      _handleEl: null,
      _listeners: null,
    };
  },

  onCreate() {
    /* Skip DOM work when running in a test / headless environment
       or when the editor is read-only. */
    if (typeof document === "undefined" || !this.editor.isEditable) {
      return;
    }

    const editorView = this.editor.view;
    const editorDom = editorView.dom;
    const wrapper = editorDom.parentElement;
    if (!wrapper) return;

    /* ---- mount handle element ---- */
    const handleEl = document.createElement("div");
    handleEl.className = "drag-handle";
    handleEl.setAttribute("draggable", "true");
    handleEl.setAttribute("contenteditable", "false");
    handleEl.setAttribute("aria-label", "Drag to reorder block");
    handleEl.textContent = "\u2801\u2801"; // braille dots as grip icon
    handleEl.style.display = "none";
    wrapper.style.position = "relative";
    wrapper.appendChild(handleEl);
    this.storage._handleEl = handleEl;

    /* ---- event handlers ---- */
    const storage = this.storage;
    const editor = this.editor;
    let dragSourcePos = -1;
    /** The DOM block currently under the cursor — used by dragstart. */
    let hoveredBlock: Element | null = null;

    const onMouseOver = (e: MouseEvent): void => {
      if (!editor.isEditable) return;
      const target = e.target as HTMLElement;
      const block = target.closest(".ProseMirror > *");
      if (!block || !(block instanceof HTMLElement)) {
        handleEl.style.display = "none";
        hoveredBlock = null;
        return;
      }
      hoveredBlock = block;
      const blockRect = block.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      handleEl.style.display = "flex";
      handleEl.style.top = `${blockRect.top - wrapperRect.top}px`;
    };

    const onMouseLeave = (): void => {
      handleEl.style.display = "none";
      hoveredBlock = null;
    };

    const onDragStart = (e: DragEvent): void => {
      if (!hoveredBlock) return;
      const pos = editorView.posAtDOM(hoveredBlock, 0);
      dragSourcePos = pos;
      if (e.dataTransfer) {
        e.dataTransfer.setData("application/x-drag-handle", String(pos));
        e.dataTransfer.effectAllowed = "move";
      }
    };

    const onDragOver = (e: DragEvent): void => {
      e.preventDefault();
    };

    const onDrop = (e: DragEvent): void => {
      e.preventDefault();
      const raw = e.dataTransfer?.getData("application/x-drag-handle");
      if (!raw) return;
      const sourcePos = parseInt(raw, 10);
      if (Number.isNaN(sourcePos) || sourcePos < 0) return;

      const coords = editorView.posAtCoords({
        left: e.clientX,
        top: e.clientY,
      });
      if (!coords) return;

      executeDragReorder(editor, sourcePos, coords.pos);
      dragSourcePos = -1;
    };

    handleEl.addEventListener("dragstart", onDragStart);
    editorDom.addEventListener("mouseover", onMouseOver);
    editorDom.addEventListener("mouseleave", onMouseLeave);
    editorDom.addEventListener("dragover", onDragOver);
    editorDom.addEventListener("drop", onDrop);

    storage._listeners = {
      onMouseOver,
      onMouseLeave,
      onDragStart,
      onDragOver,
      onDrop,
    };

    /* Suppress TS unused-variable for dragSourcePos kept for debugging. */
    void dragSourcePos;
  },

  onDestroy() {
    const { _handleEl, _listeners } = this.storage;

    if (_handleEl) {
      _handleEl.remove();
    }

    if (_listeners) {
      try {
        const editorDom = this.editor.view.dom;
        editorDom.removeEventListener("mouseover", _listeners.onMouseOver);
        editorDom.removeEventListener("mouseleave", _listeners.onMouseLeave);
        editorDom.removeEventListener("dragover", _listeners.onDragOver);
        editorDom.removeEventListener("drop", _listeners.onDrop);
      } catch {
        /* editor.view may already be destroyed — safe to ignore */
      }
    }
  },

  onUpdate() {
    if (!this.editor.isEditable) {
      this.storage.blockPositions = [];
      return;
    }

    const blocks: DragHandleDecoration[] = [];
    this.editor.state.doc.descendants((node, pos) => {
      if (node.isBlock && node.isTextblock) {
        blocks.push({ blockPos: pos, blockType: node.type.name });
      }
    });
    this.storage.blockPositions = blocks;
  },
});

import React from "react";
import { useTranslation } from "react-i18next";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import type { IpcResponseData } from "@shared/types/ipc-generated";

import { useOptionalAiStore } from "../../stores/aiStore";
import {
  useEditorStore,
  type EntityCompletionSession,
} from "../../stores/editorStore";
<<<<<<< HEAD
=======
import { useOptionalLayoutStore } from "../../stores/layoutStore";
>>>>>>> 14c499b9 (feat(zen-mode): A0-01 禅模式真实可编辑 (#986))
import { useVersionStore } from "../../stores/versionStore";
import { useAutosave } from "./useAutosave";
import { useHotkey } from "../../lib/hotkeys/useHotkey";
import { Button, ScrollArea, Text } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { EditorToolbar } from "./EditorToolbar";
import {
  EditorBubbleMenu,
  EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY,
} from "./EditorBubbleMenu";
import { resolveFinalDocumentEditDecision } from "./finalDocumentEditGuard";
import { WriteButton } from "./WriteButton";
import { EditorContextMenu } from "./EditorContextMenu";
import { SlashCommandExtension } from "./extensions/slashCommand";
import { DragHandleExtension } from "./extensions/dragHandle";
import { SlashCommandPanel } from "./SlashCommandPanel";
import { EntityCompletionPanel } from "./EntityCompletionPanel";
import {
  routeSlashCommandExecution,
  getSlashCommandRegistry,
  type SlashCommandExecutors,
  type SlashCommandId,
} from "./slashCommands";
import {
  resolveEditorLineHeightToken,
  resolveEditorScaleFactor,
} from "./typography";
import { buildAiStreamUndoCheckpoint, undoAiStream } from "./aiStreamUndo";
import type { AiStreamCheckpoint } from "./aiStreamUndo";

const IS_VITEST_RUNTIME =
  typeof process !== "undefined" && Boolean(process.env.VITEST);

export const EDITOR_DOCUMENT_CHARACTER_LIMIT = 1_000_000;
export const LARGE_PASTE_THRESHOLD_CHARS = 2 * 1024 * 1024;
const LARGE_PASTE_CHUNK_SIZE = 64 * 1024;
const WRITE_CONTEXT_WINDOW = 240;
const ENTITY_COMPLETION_LOOKBACK_CHARS = 96;
const ENTITY_COMPLETION_TRIGGER = "@";
const EMPTY_EDITOR_DOC: ReturnType<Editor["getJSON"]> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type EntityListItem = IpcResponseData<"knowledge:entity:list">["items"][number];

const ALLOWED_PASTE_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
]);

const UNWRAP_TAGS = new Set([
  "span",
  "font",
  "section",
  "article",
  "main",
  "header",
  "footer",
]);

const DROP_TAGS = new Set([
  "script",
  "style",
  "object",
  "embed",
  "iframe",
  "svg",
  "math",
]);

function isAiRunning(status: string): boolean {
  return status === "running" || status === "streaming";
}

function normalizeEntityMatchValue(value: string): string {
  return value.trim().toLowerCase();
}

function collectEntityCandidates(
  query: string,
  items: EntityListItem[],
): Array<{
  id: string;
  name: string;
  type: EntityListItem["type"];
}> {
  const normalizedQuery = normalizeEntityMatchValue(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  return items
    .filter((item) => {
      const normalizedName = normalizeEntityMatchValue(item.name);
      if (normalizedName.includes(normalizedQuery)) {
        return true;
      }
      return item.aliases.some((alias) =>
        normalizeEntityMatchValue(alias).includes(normalizedQuery),
      );
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
    }));
}

function detectEntityCompletionInput(editor: Editor): {
  query: string;
  triggerFrom: number;
  triggerTo: number;
  anchorTop: number;
  anchorLeft: number;
} | null {
  const { state, view } = editor;
  const selection = state.selection;

  if (!selection.empty) {
    return null;
  }

  const triggerTo = selection.from;
  const textFrom = Math.max(1, triggerTo - ENTITY_COMPLETION_LOOKBACK_CHARS);
  const textBeforeCursor = state.doc.textBetween(
    textFrom,
    triggerTo,
    "\n",
    "\n",
  );
  const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]+)$/);

  if (!match) {
    return null;
  }

  const query = match[1];
  if (query.trim().length === 0) {
    return null;
  }

  const triggerFrom = triggerTo - `${ENTITY_COMPLETION_TRIGGER}${query}`.length;
  if (triggerFrom < 1) {
    return null;
  }

  let coords: { bottom: number; left: number };
  try {
    const resolved = view.coordsAtPos(triggerTo);
    coords = { bottom: resolved.bottom, left: resolved.left };
  } catch {
    // JSDOM does not fully implement geometry APIs used by ProseMirror.
    coords = { bottom: 0, left: 0 };
  }
  return {
    query,
    triggerFrom,
    triggerTo,
    anchorTop: coords.bottom + 6,
    anchorLeft: coords.left,
  };
}

function buildWriteInput(editor: Editor): string {
  const cursor = editor.state.selection.to;
  const from = Math.max(1, cursor - WRITE_CONTEXT_WINDOW);
  const nearCursor = editor.state.doc
    .textBetween(from, cursor, "\n", "\n")
    .trim();
  if (nearCursor.length > 0) {
    return `Continue writing from cursor context:\n${nearCursor}`;
  }

  const fallback = editor.state.doc.textContent.trim();
  if (fallback.length > 0) {
    return `Continue writing from cursor context:\n${fallback.slice(-WRITE_CONTEXT_WINDOW)}`;
  }
  return "Continue writing from cursor context:";
}

/**
 * Parse persisted editor JSON with fail-safe fallback.
 */
export function parseEditorContentJsonSafely(
  contentJson: string,
): ReturnType<Editor["getJSON"]> {
  try {
    return JSON.parse(contentJson) as ReturnType<Editor["getJSON"]>;
  } catch {
    return EMPTY_EDITOR_DOC;
  }
}

/**
 * Split large text into deterministic chunks for incremental paste processing.
 *
 * Why: very large clipboard payloads should be processed in bounded units to
 * keep UI responsive and avoid a single giant parse/insert step.
 */
export function chunkLargePasteText(
  text: string,
  chunkSize = LARGE_PASTE_CHUNK_SIZE,
): string[] {
  if (chunkSize <= 0) {
    return [text];
  }
  if (text.length === 0) {
    return [];
  }
  const chunks: string[] = [];
  for (let cursor = 0; cursor < text.length; cursor += chunkSize) {
    chunks.push(text.slice(cursor, cursor + chunkSize));
  }
  return chunks;
}

/**
 * Check whether current document length reaches capacity threshold.
 */
export function shouldWarnDocumentCapacity(
  currentLength: number,
  limit = EDITOR_DOCUMENT_CHARACTER_LIMIT,
): boolean {
  return currentLength >= limit;
}

/**
 * Check whether incoming paste should ask overflow confirmation.
 */
export function shouldConfirmOverflowPaste(args: {
  currentLength: number;
  pasteLength: number;
  limit?: number;
}): boolean {
  const limit = args.limit ?? EDITOR_DOCUMENT_CHARACTER_LIMIT;
  return args.currentLength + args.pasteLength > limit;
}

/**
 * Remove unsupported paste formatting and keep editor-supported structure.
 *
 * Why: paste from external editors often contains style blobs and embeds that
 * TipTap P0 does not support; this keeps output deterministic and safe.
 */
export function sanitizePastedHtml(inputHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(inputHtml, "text/html");
  const { body } = doc;

  const sanitizeElement = (element: HTMLElement): void => {
    const children = Array.from(element.childNodes);
    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const childElement = child as HTMLElement;
      const tag = childElement.tagName.toLowerCase();

      if (DROP_TAGS.has(tag)) {
        childElement.remove();
        continue;
      }

      if (tag === "div") {
        const paragraph = doc.createElement("p");
        while (childElement.firstChild) {
          paragraph.appendChild(childElement.firstChild);
        }
        childElement.replaceWith(paragraph);
        sanitizeElement(paragraph);
        continue;
      }

      if (UNWRAP_TAGS.has(tag) || !ALLOWED_PASTE_TAGS.has(tag)) {
        while (childElement.firstChild) {
          element.insertBefore(childElement.firstChild, childElement);
        }
        childElement.remove();
        continue;
      }

      for (const attr of Array.from(childElement.attributes)) {
        childElement.removeAttribute(attr.name);
      }

      sanitizeElement(childElement);
    }
  };

  sanitizeElement(body);

  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType !== Node.TEXT_NODE) {
      continue;
    }
    const value = child.textContent ?? "";
    if (value.trim().length === 0) {
      child.remove();
      continue;
    }
    const paragraph = doc.createElement("p");
    paragraph.textContent = value;
    child.replaceWith(paragraph);
  }

  return body.innerHTML;
}

function useEntityCompletion(deps: {
  editor: ReturnType<typeof useEditor>;
  bootstrapStatus: string;
  documentId: string | null;
  contentReady: boolean;
  isPreviewMode: boolean;
  documentStatus: string | null;
  entityCompletionSession: EntityCompletionSession;
  setEntityCompletionSession: (patch: Partial<EntityCompletionSession>) => void;
  clearEntityCompletionSession: () => void;
  listKnowledgeEntities: (args: {
    projectId: string;
  }) => Promise<
    { ok: true; data: { items: EntityListItem[] } } | { ok: false }
  >;
  projectId: string;
}) {
  const {
    bootstrapStatus,
    clearEntityCompletionSession,
    contentReady,
    documentId,
    documentStatus,
    editor,
    entityCompletionSession,
    isPreviewMode,
    listKnowledgeEntities,
    projectId,
    setEntityCompletionSession,
  } = deps;

  const entityCompletionSessionRef = React.useRef(entityCompletionSession);
  const entityCompletionRequestIdRef = React.useRef(0);

  React.useEffect(() => {
    entityCompletionSessionRef.current = entityCompletionSession;
  }, [entityCompletionSession]);

  const resolveEntityCompletionCandidates = React.useCallback(
    async (args: {
      query: string;
      triggerFrom: number;
      triggerTo: number;
      anchorTop: number;
      anchorLeft: number;
    }): Promise<void> => {
      const requestId = ++entityCompletionRequestIdRef.current;
      setEntityCompletionSession({
        open: true,
        query: args.query,
        triggerFrom: args.triggerFrom,
        triggerTo: args.triggerTo,
        anchorTop: args.anchorTop,
        anchorLeft: args.anchorLeft,
        status: "loading",
        selectedIndex: 0,
        candidates: [],
        message: null,
      });

      const listed = await listKnowledgeEntities({
        projectId: projectId,
      });
      if (requestId !== entityCompletionRequestIdRef.current) {
        return;
      }

      if (!listed.ok) {
        setEntityCompletionSession({
          open: true,
          status: "error",
          candidates: [],
          selectedIndex: 0,
          message: null,
        });
        return;
      }

      const candidates = collectEntityCandidates(args.query, listed.data.items);
      if (candidates.length === 0) {
        setEntityCompletionSession({
          open: true,
          status: "empty",
          candidates: [],
          selectedIndex: 0,
          message: null,
        });
        return;
      }

      setEntityCompletionSession({
        open: true,
        status: "ready",
        candidates,
        selectedIndex: 0,
        message: null,
      });
    },
    [listKnowledgeEntities, projectId, setEntityCompletionSession],
  );

  React.useEffect(() => {
    if (
      !editor ||
      bootstrapStatus !== "ready" ||
      !documentId ||
      !contentReady ||
      isPreviewMode ||
      documentStatus === "final"
    ) {
      clearEntityCompletionSession();
      return;
    }

    const onEditorChange = () => {
      const detected = detectEntityCompletionInput(editor);
      if (!detected) {
        if (entityCompletionSessionRef.current.open) {
          clearEntityCompletionSession();
        }
        return;
      }

      const session = entityCompletionSessionRef.current;
      const sameQuery =
        session.open &&
        session.query === detected.query &&
        session.triggerFrom === detected.triggerFrom &&
        session.triggerTo === detected.triggerTo;
      if (sameQuery) {
        if (
          session.anchorTop !== detected.anchorTop ||
          session.anchorLeft !== detected.anchorLeft
        ) {
          setEntityCompletionSession({
            anchorTop: detected.anchorTop,
            anchorLeft: detected.anchorLeft,
          });
        }
        return;
      }

      void resolveEntityCompletionCandidates(detected);
    };

    onEditorChange();
    editor.on("update", onEditorChange);
    editor.on("selectionUpdate", onEditorChange);
    return () => {
      editor.off("update", onEditorChange);
      editor.off("selectionUpdate", onEditorChange);
    };
  }, [
    bootstrapStatus,
    clearEntityCompletionSession,
    contentReady,
    documentId,
    documentStatus,
    editor,
    isPreviewMode,
    resolveEntityCompletionCandidates,
    setEntityCompletionSession,
  ]);

  const applyEntityCompletionCandidate = React.useCallback(
    (index: number) => {
      if (!editor) {
        return;
      }

      const session = entityCompletionSessionRef.current;
      const candidate = session.candidates[index];
      if (!candidate) {
        return;
      }

      editor
        .chain()
        .focus()
        .insertContentAt(
          {
            from: session.triggerFrom,
            to: session.triggerTo,
          },
          `${ENTITY_COMPLETION_TRIGGER}${candidate.name} `,
        )
        .run();
      clearEntityCompletionSession();
    },
    [clearEntityCompletionSession, editor],
  );

  // TODO: migrate to useHotkey — entity completion keyboard nav is tightly
  // coupled to transient autocomplete session state (open/candidates/selectedIndex).
  // Whitelisted in hotkey-listener-guard.test.ts.
  React.useEffect(() => {
    if (!editor || !entityCompletionSession.open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearEntityCompletionSession();
        return;
      }

      if (entityCompletionSession.status !== "ready") {
        return;
      }

      const candidateCount = entityCompletionSession.candidates.length;
      if (candidateCount === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setEntityCompletionSession({
          selectedIndex:
            (entityCompletionSession.selectedIndex + 1) % candidateCount,
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setEntityCompletionSession({
          selectedIndex:
            (entityCompletionSession.selectedIndex - 1 + candidateCount) %
            candidateCount,
        });
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        applyEntityCompletionCandidate(entityCompletionSession.selectedIndex);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    applyEntityCompletionCandidate,
    clearEntityCompletionSession,
    editor,
    entityCompletionSession,
    setEntityCompletionSession,
  ]);

  return { applyEntityCompletionCandidate };
}

function useEditorCommands(deps: {
  editor: ReturnType<typeof useEditor>;
  aiSetSelectedSkillId: ((id: string) => void) | null;
  aiRun:
    | ((args?: {
        inputOverride?: string;
        context?: { projectId?: string; documentId?: string };
      }) => Promise<void>)
    | null;
  aiStatus: string;
  documentId: string | null;
  projectId: string;
  isPreviewMode: boolean;
  documentStatus: string | null;
  save: (args: {
    projectId: string;
    documentId: string;
    contentJson: string;
    actor: "user" | "auto";
    reason: "manual-save" | "autosave";
  }) => Promise<void>;
  closeSlashPanel: () => void;
  contentReady: boolean;
  bootstrapStatus: string;
  downgradeFinalStatusForEdit: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<boolean>;
  t: (key: string) => string;
}) {
  const {
    aiRun,
    aiSetSelectedSkillId,
    aiStatus,
    bootstrapStatus,
    closeSlashPanel,
    contentReady,
    documentId,
    documentStatus,
    downgradeFinalStatusForEdit,
    editor,
    isPreviewMode,
    projectId,
    save,
    t,
  } = deps;

  const aiStreamCheckpointRef = React.useRef<AiStreamCheckpoint | null>(null);

  async function requestEditFromFinal(): Promise<void> {
    if (!documentId || documentStatus !== "final") {
      return;
    }
    const confirmed = window.confirm(t("editor.confirmSwitchToDraft"));
    const decision = resolveFinalDocumentEditDecision({
      status: documentStatus,
      confirmed,
    });
    if (!decision.allowEditing) {
      return;
    }
    await downgradeFinalStatusForEdit({
      projectId: projectId,
      documentId: documentId,
    });
  }

  const runSlashAiSkill = React.useCallback(
    async (skillId: string): Promise<void> => {
      if (
        !aiSetSelectedSkillId ||
        !aiRun ||
        !editor ||
        !documentId ||
        isAiRunning(aiStatus)
      ) {
        return;
      }

      // Capture pre-stream checkpoint for atomic undo (ED-FE-ADV-S2)
      aiStreamCheckpointRef.current = buildAiStreamUndoCheckpoint({
        preStreamContent: editor.state.doc.textContent,
        docJson: editor.getJSON() as Record<string, unknown>,
        cursorPos: editor.state.selection.to,
      });

      aiSetSelectedSkillId(skillId);
      await aiRun({
        inputOverride: buildWriteInput(editor),
        context: {
          projectId: projectId,
          documentId: documentId,
        },
      });

      // Stream finished — checkpoint stays alive for atomic undo.
      // Next Ctrl+Z will revert the entire AI round via undoAiStream.
      // Checkpoint is cleared on manual user edit (see onUpdate handler).
    },
    [aiRun, aiSetSelectedSkillId, aiStatus, documentId, editor, projectId],
  );

  /**
   * Revert the last AI stream output atomically.
   * Returns true if the undo was executed, false if no checkpoint exists.
   */
  const handleAiUndo = React.useCallback((): boolean => {
    if (!editor || !aiStreamCheckpointRef.current) return false;
    const result = undoAiStream(editor, aiStreamCheckpointRef.current);
    aiStreamCheckpointRef.current = null;
    return result;
  }, [editor]);

  const onWriteClick = React.useCallback(async (): Promise<void> => {
    await runSlashAiSkill("builtin:write");
  }, [runSlashAiSkill]);

  // --- Editor keyboard shortcuts via unified HotkeyManager ---
  // (Replaces the former useEffect + window.addEventListener("keydown"))

  const editorReady =
    !!editor && bootstrapStatus === "ready" && !!documentId && contentReady;

  // Cmd/Ctrl+Enter: Continue Writing (AI skill)
  useHotkey(
    "editor:continue-writing",
    { key: "Enter", modKey: true },
    React.useCallback(() => {
      if (!editorReady) return;
      void onWriteClick();
    }, [editorReady, onWriteClick]),
    "editor",
    10,
  );

  // Cmd/Ctrl+Shift+R: Polish (AI skill)
  useHotkey(
    "editor:polish",
    { key: "r", modKey: true, shiftKey: true },
    React.useCallback(() => {
      if (!editorReady) return;
      void runSlashAiSkill("builtin:polish");
    }, [editorReady, runSlashAiSkill]),
    "editor",
    10,
  );

  // Cmd/Ctrl+Z: Atomic AI undo when a checkpoint is active (ED-FE-ADV-S2)
  useHotkey(
    "editor:ai-undo",
    { key: "z", modKey: true },
    React.useCallback(() => {
      if (!editorReady) return false;
      // Only intercept when a checkpoint exists; otherwise return false to
      // let the event propagate to TipTap's built-in undo.
      if (!handleAiUndo()) return false;
      return undefined;
    }, [editorReady, handleAiUndo]),
    "editor",
    5,
  );

  // Cmd/Ctrl+S: Save document
  useHotkey(
    "editor:save",
    { key: "s", modKey: true },
    React.useCallback(() => {
      if (!editorReady || !editor || !documentId) return;
      if (isPreviewMode) return;

      const json = JSON.stringify(editor.getJSON());
      void save({
        projectId: projectId,
        documentId: documentId,
        contentJson: json,
        actor: "user",
        reason: "manual-save",
      });
    }, [editorReady, editor, documentId, isPreviewMode, projectId, save]),
    "editor",
    10,
  );

  const handleSlashCommandSelect = React.useCallback(
    (commandId: SlashCommandId) => {
      const executors: SlashCommandExecutors = {
        continueWriting: () => {
          void onWriteClick();
        },
        describe: () => {
          void runSlashAiSkill("builtin:describe");
        },
        dialogue: () => {
          void runSlashAiSkill("builtin:dialogue");
        },
        character: () => {
          void runSlashAiSkill("builtin:character");
        },
        outline: () => {
          void runSlashAiSkill("builtin:outline");
        },
        search: () => {
          void runSlashAiSkill("builtin:search");
        },
      };

      routeSlashCommandExecution(commandId, executors);
      closeSlashPanel();
    },
    [closeSlashPanel, onWriteClick, runSlashAiSkill],
  );

  return {
    handleSlashCommandSelect,
    onWriteClick,
    requestEditFromFinal,
    aiStreamCheckpointRef,
  };
}

function useEditorPaneCore(projectId: string) {
  const { t } = useTranslation();
  const bootstrapStatus = useEditorStore((s) => s.bootstrapStatus);
  const documentId = useEditorStore((s) => s.documentId);
  const documentStatus = useEditorStore((s) => s.documentStatus);
  const documentContentJson = useEditorStore((s) => s.documentContentJson);
  const save = useEditorStore((s) => s.save);
  const setDocumentCharacterCount = useEditorStore(
    (s) => s.setDocumentCharacterCount,
  );
  const setCapacityWarning = useEditorStore((s) => s.setCapacityWarning);
  const entityCompletionSession = useEditorStore(
    (s) => s.entityCompletionSession,
  );
  const setEntityCompletionSession = useEditorStore(
    (s) => s.setEntityCompletionSession,
  );
  const clearEntityCompletionSession = useEditorStore(
    (s) => s.clearEntityCompletionSession,
  );
  const listKnowledgeEntities = useEditorStore((s) => s.listKnowledgeEntities);
  const downgradeFinalStatusForEdit = useEditorStore(
    (s) => s.downgradeFinalStatusForEdit,
  );
  const setEditorInstance = useEditorStore((s) => s.setEditorInstance);
  const previewStatus = useVersionStore((s) => s.previewStatus);
  const previewTimestamp = useVersionStore((s) => s.previewTimestamp);
  const previewContentJson = useVersionStore((s) => s.previewContentJson);
  const exitPreview = useVersionStore((s) => s.exitPreview);
  const aiStatus = useOptionalAiStore((s) => s.status) ?? "idle";
  const aiSetSelectedSkillId = useOptionalAiStore((s) => s.setSelectedSkillId);
  const aiRun = useOptionalAiStore((s) => s.run);

  const suppressAutosaveRef = React.useRef<boolean>(false);
  const [contentReady, setContentReady] = React.useState(false);
  const [writeHovering, setWriteHovering] = React.useState(false);
  const [isSlashPanelOpen, setIsSlashPanelOpen] = React.useState(false);
  const [slashSearchQuery, setSlashSearchQuery] = React.useState("");
  const slashPanelOpenRef = React.useRef(false);
  const isPreviewMode =
    previewStatus === "ready" && previewContentJson !== null;
  const activeContentJson = isPreviewMode
    ? previewContentJson
    : documentContentJson;

  const syncCapacityState = React.useCallback(
    (nextCount: number) => {
      setDocumentCharacterCount(nextCount);
      setCapacityWarning(
        shouldWarnDocumentCapacity(nextCount)
          ? t("editor.pane.charLimitReached")
          : null,
      );
    },
    [setCapacityWarning, setDocumentCharacterCount, t],
  );

  React.useEffect(() => {
    slashPanelOpenRef.current = isSlashPanelOpen;
  }, [isSlashPanelOpen]);

  const openSlashPanel = React.useCallback(() => {
    setIsSlashPanelOpen(true);
  }, []);

  const closeSlashPanel = React.useCallback(() => {
    setIsSlashPanelOpen(false);
    setSlashSearchQuery("");
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
      }),
      SlashCommandExtension.configure({
        isPanelOpen: () => slashPanelOpenRef.current,
        onOpenPanel: openSlashPanel,
        onClosePanel: closeSlashPanel,
      }),
      DragHandleExtension,
      ...(!IS_VITEST_RUNTIME
        ? [
            BubbleMenuExtension.configure({
              pluginKey: EDITOR_INLINE_BUBBLE_MENU_PLUGIN_KEY,
            }),
          ]
        : []),
    ],
    autofocus: true,
    editorProps: {
      transformPastedHTML: sanitizePastedHtml,
      handlePaste(view, event) {
        const clipboardText = event.clipboardData?.getData("text/plain") ?? "";
        if (clipboardText.length < LARGE_PASTE_THRESHOLD_CHARS) {
          return false;
        }

        event.preventDefault();

        const currentLength = view.state.doc.textContent.length;
        const chunks = chunkLargePasteText(clipboardText);
        if (chunks.length === 0) {
          return true;
        }

        const overflow = shouldConfirmOverflowPaste({
          currentLength,
          pasteLength: clipboardText.length,
        });
        const shouldContinueOverflow =
          !overflow || window.confirm(t("editor.pane.pasteLimitExceeded"));

        const allowedLength = shouldContinueOverflow
          ? clipboardText.length
          : Math.max(EDITOR_DOCUMENT_CHARACTER_LIMIT - currentLength, 0);
        if (allowedLength <= 0) {
          return true;
        }

        let remaining = allowedLength;
        for (const chunk of chunks) {
          if (remaining <= 0) {
            break;
          }
          const nextChunk = chunk.slice(0, remaining);
          const tr = view.state.tr.insertText(
            nextChunk,
            view.state.selection.from,
            view.state.selection.to,
          );
          view.dispatch(tr);
          remaining -= nextChunk.length;
        }
        return true;
      },
      attributes: {
        "data-testid": "tiptap-editor",
        class: "h-full outline-none p-4 text-[var(--color-fg-default)]",
      },
    },
    content: { type: "doc", content: [{ type: "paragraph" }] },
  });

  React.useEffect(() => {
    setEditorInstance(editor ?? null);
    return () => setEditorInstance(null);
  }, [editor, setEditorInstance]);

  React.useEffect(() => {
    if (!contentReady || isPreviewMode) {
      closeSlashPanel();
    }
  }, [closeSlashPanel, contentReady, isPreviewMode]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(documentStatus !== "final" && !isPreviewMode);
  }, [documentStatus, editor, isPreviewMode]);

  React.useEffect(() => {
    if (!editor || !documentId || !activeContentJson) {
      setContentReady(false);
      return;
    }

    try {
      setContentReady(false);
      suppressAutosaveRef.current = true;
      editor.commands.setContent(
        parseEditorContentJsonSafely(activeContentJson),
      );
    } finally {
      window.setTimeout(() => {
        suppressAutosaveRef.current = false;
        setContentReady(true);
        syncCapacityState(editor.state.doc.textContent.length);
      }, 0);
    }
  }, [activeContentJson, documentId, editor, syncCapacityState]);

  const {
    handleSlashCommandSelect,
    onWriteClick,
    requestEditFromFinal,
    aiStreamCheckpointRef,
  } = useEditorCommands({
    editor,
    aiSetSelectedSkillId,
    aiRun,
    aiStatus,
    documentId,
    projectId,
    isPreviewMode,
    documentStatus,
    save,
    closeSlashPanel,
    contentReady,
    bootstrapStatus,
    downgradeFinalStatusForEdit,
    t,
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const onUpdate = () => {
      syncCapacityState(editor.state.doc.textContent.length);

      // Clear AI undo checkpoint on any manual edit — the user has
      // implicitly accepted the AI output by continuing to type.
      if (aiStreamCheckpointRef.current && !isAiRunning(aiStatus)) {
        aiStreamCheckpointRef.current = null;
      }
    };

    onUpdate();
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [aiStreamCheckpointRef, aiStatus, editor, syncCapacityState]);

  const { applyEntityCompletionCandidate } = useEntityCompletion({
    editor,
    bootstrapStatus,
    documentId,
    contentReady,
    isPreviewMode,
    documentStatus,
    entityCompletionSession,
    setEntityCompletionSession,
    clearEntityCompletionSession,
    listKnowledgeEntities,
    projectId,
  });

  useAutosave({
    enabled:
      bootstrapStatus === "ready" &&
      !!documentId &&
      contentReady &&
      documentStatus !== "final" &&
      !isPreviewMode,
    projectId,
    documentId: documentId ?? "",
    editor,
    suppressRef: suppressAutosaveRef,
  });

  return {
    t,
    bootstrapStatus,
    documentId,
    documentStatus,
    contentReady,
    editor,
    previewTimestamp,
    isPreviewMode,
    entityCompletionSession,
    applyEntityCompletionCandidate,
    isSlashPanelOpen,
    slashSearchQuery,
    setSlashSearchQuery,
    handleSlashCommandSelect,
    closeSlashPanel,
    writeHovering,
    setWriteHovering,
    exitPreview,
    requestEditFromFinal,
    aiSetSelectedSkillId,
    aiRun,
    aiStatus,
    onWriteClick,
  };
}

/**
 * EditorPane mounts TipTap editor and wires autosave to the DB SSOT.
 */
export function EditorPane(props: { projectId: string }): JSX.Element {
  const core = useEditorPaneCore(props.projectId);
  const zenMode = useOptionalLayoutStore((s) => s.zenMode) ?? false;

  if (core.bootstrapStatus !== "ready") {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {core.t("editor.pane.loadingEditor")}
      </Text>
    );
  }

  if (!core.documentId) {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {core.t("editor.pane.noDocumentSelected")}
      </Text>
    );
  }

  if (!core.contentReady) {
    return (
      <Text as="div" size="body" color="muted" className="p-4">
        {core.t("editor.pane.loadingDocument")}
      </Text>
    );
  }

  const locale =
    (typeof document !== "undefined" && document.documentElement.lang) ||
    (typeof navigator !== "undefined" ? navigator.language : null);
  const scalePercent =
    typeof window !== "undefined"
      ? Math.round((window.devicePixelRatio || 1) * 100)
      : 100;
  const editorLineHeightToken = resolveEditorLineHeightToken(locale);
  const editorScaleFactor = resolveEditorScaleFactor(scalePercent);
  const editorTypographyVars = {
    "--editor-line-height": editorLineHeightToken,
    "--editor-scale-factor": editorScaleFactor,
    "--editor-font-size":
      "calc(var(--text-editor-size) * var(--editor-scale-factor))",
  } as React.CSSProperties;

  return (
    <div
      data-testid="editor-pane"
      data-document-id={core.documentId}
      className="flex h-full w-full min-w-0 flex-col"
    >
      {core.isPreviewMode ? (
        <div
          data-testid="editor-preview-banner"
          className="flex items-center justify-between gap-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-4 py-2"
        >
          <Text size="small" color="muted">
            {core.t("editor.pane.previewingVersion", {
              timestamp: core.previewTimestamp ?? core.t("editor.pane.history"),
            })}
          </Text>
          <div className="flex items-center gap-2">
            <Tooltip content={core.t("editor.pane.restoreTooltip")}>
              <Button
                data-testid="preview-restore-placeholder"
                variant="secondary"
                size="sm"
                disabled={true}
              >
                {core.t("editor.pane.restoreVersion")}
              </Button>
            </Tooltip>
            <Button
              data-testid="preview-return-current"
              variant="secondary"
              size="sm"
              onClick={core.exitPreview}
            >
              {core.t("editor.pane.backToCurrent")}
            </Button>
          </div>
        </div>
      ) : null}

      {core.documentStatus === "final" && !core.isPreviewMode ? (
        <div
          data-testid="final-document-guard"
          className="flex items-center justify-between gap-3 border-b border-[var(--color-separator)] bg-[var(--color-bg-surface)] px-4 py-2"
        >
          <Text size="small" color="muted">
            {core.t("editor.pane.finalDocumentHint")}
          </Text>
          <Button
            data-testid="final-document-edit-trigger"
            variant="secondary"
            size="sm"
            onClick={() => void core.requestEditFromFinal()}
          >
            {core.t("editor.pane.editAnyway")}
          </Button>
        </div>
      ) : null}
      <EditorBubbleMenu editor={core.editor} />
      {!zenMode && (
        <EditorToolbar editor={core.editor} disabled={core.isPreviewMode} />
      )}
      {!zenMode && (
        <SlashCommandPanel
          open={core.isSlashPanelOpen}
          query={core.slashSearchQuery}
          candidates={getSlashCommandRegistry()}
          onQueryChange={core.setSlashSearchQuery}
          onSelectCommand={core.handleSlashCommandSelect}
          onRequestClose={core.closeSlashPanel}
        />
      )}
      <div
        data-testid="editor-content-region"
        className="relative flex-1 min-h-0 font-[var(--font-family-body)] text-[length:var(--editor-font-size)] leading-[var(--editor-line-height)]"
        style={editorTypographyVars}
        onMouseEnter={() => core.setWriteHovering(true)}
        onMouseLeave={() => core.setWriteHovering(false)}
      >
        <EditorContextMenu editor={core.editor}>
          <ScrollArea
            data-testid="editor-content-scroll"
            viewportTestId="editor-content-scroll-viewport"
            className="h-full"
          >
            <EditorContent editor={core.editor} className="h-full" />
          </ScrollArea>
        </EditorContextMenu>
        <EntityCompletionPanel
          session={core.entityCompletionSession}
          onSelectCandidate={core.applyEntityCompletionCandidate}
        />
        <WriteButton
          visible={
            core.writeHovering &&
            !!core.editor &&
            core.contentReady &&
            core.documentStatus !== "final" &&
            !core.isPreviewMode &&
            core.editor.isEditable &&
            core.editor.state.selection.empty
          }
          disabled={
            !core.aiSetSelectedSkillId ||
            !core.aiRun ||
            isAiRunning(core.aiStatus)
          }
          running={isAiRunning(core.aiStatus)}
          onClick={() => void core.onWriteClick()}
        />
      </div>
    </div>
  );
}

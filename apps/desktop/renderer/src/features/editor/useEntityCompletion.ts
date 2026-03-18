import React from "react";
import type { useEditor } from "@tiptap/react";

import type { EntityCompletionSession } from "../../stores/editorStore";
import {
  ENTITY_COMPLETION_TRIGGER,
  collectEntityCandidates,
  detectEntityCompletionInput,
  type EntityListItem,
} from "./entityCompletionUtils";

export function useEntityCompletion(deps: {
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
}): { applyEntityCompletionCandidate: (index: number) => void } {
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

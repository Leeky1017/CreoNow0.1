import React from "react";
import type { Editor } from "@tiptap/react";

import { useEditorStore } from "../../stores/editorStore";

/**
 * Autosave hook for TipTap editor updates.
 *
 * Why: P0 requires a deterministic autosave state machine and retryability, and
 * autosave must create `actor=auto` versions without spamming writes.
 */
export function useAutosave(args: {
  enabled: boolean;
  projectId: string;
  documentId: string;
  editor: Editor | null;
  suppressRef: React.MutableRefObject<boolean>;
}): void {
  const save = useEditorStore((s) => s.save);
  const setAutosaveStatus = useEditorStore((s) => s.setAutosaveStatus);

  const timerRef = React.useRef<number | null>(null);
  const lastQueuedJsonRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!args.enabled || !args.editor) {
      return;
    }

    lastQueuedJsonRef.current = null;

    function onUpdate(): void {
      if (args.suppressRef.current) {
        return;
      }

      const json = args.editor ? JSON.stringify(args.editor.getJSON()) : "";
      if (json.length === 0 || json === lastQueuedJsonRef.current) {
        return;
      }
      lastQueuedJsonRef.current = json;

      setAutosaveStatus("saving");

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        save({
          projectId: args.projectId,
          documentId: args.documentId,
          contentJson: json,
          actor: "auto",
          reason: "autosave",
        }).catch(() => {
          // editorStore.save already sets autosaveStatus to "error"
        });
      }, 500);
    }

    args.editor.on("update", onUpdate);
    return () => {
      args.editor?.off("update", onUpdate);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        const queued = lastQueuedJsonRef.current;
        if (queued && queued.length > 0) {
          save({
            projectId: args.projectId,
            documentId: args.documentId,
            contentJson: queued,
            actor: "auto",
            reason: "autosave",
          }).catch(() => {
            // editorStore.save already sets autosaveStatus to "error"
          });
        }
      }
      lastQueuedJsonRef.current = null;
    };
  }, [
    args.documentId,
    args.editor,
    args.enabled,
    args.projectId,
    args.suppressRef,
    save,
    setAutosaveStatus,
  ]);
}

/**
 * Hook for comparing versions using real version:snapshot:diff IPC.
 */

import { useCallback, useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { invoke } from "../../lib/ipcClient";
import { i18n } from "../../i18n";

export type CompareState = {
  status: "idle" | "loading" | "ready" | "error";
  diffText: string;
  error?: string;
  /** Whether compared changes should be marked as AI-originated. */
  aiMarked?: boolean;
};

/**
 * Hook to manage version comparison state and trigger compare mode.
 *
 * Uses version:snapshot:diff IPC to fetch unified diff payload from main process.
 *
 * Usage:
 * ```tsx
 * const { compareState, startCompare, closeCompare } = useVersionCompare();
 *
 * // In VersionHistoryPanel:
 * onCompare={(versionId) => startCompare(documentId, versionId)}
 *
 * // In AppShell when compareMode is true:
 * <DiffViewPanel
 *   diffText={compareState.diffText}
 *   onClose={closeCompare}
 * />
 * ```
 */
export function useVersionCompare() {
  const setCompareMode = useEditorStore((s) => s.setCompareMode);
  const documentId = useEditorStore((s) => s.documentId);

  const [compareState, setCompareState] = useState<CompareState>({
    status: "idle",
    diffText: "",
  });

  /**
   * Start comparing a version against the current document.
   *
   * Requests unified diff data via version:snapshot:diff IPC.
   */
  const startCompare = useCallback(
    async (docId: string, versionId: string) => {
      setCompareState({ status: "loading", diffText: "" });
      setCompareMode(true, versionId);

      try {
        const res = await invoke("version:snapshot:diff", {
          documentId: docId,
          baseVersionId: versionId,
        });

        if (!res.ok) {
          setCompareState({
            status: "error",
            diffText: "",
            error: `${res.error.code}: ${res.error.message}`,
          });
          return;
        }

        setCompareState({
          status: "ready",
          diffText: res.data.diffText || i18n.t("versionHistory.compare.noDifferencesFound"),
          aiMarked: res.data.aiMarked,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : i18n.t("versionHistory.compare.unknownError");
        setCompareState({
          status: "error",
          diffText: "",
          error: message,
        });
      }
    },
    [setCompareMode],
  );

  /**
   * Close compare mode and return to the editor.
   */
  const closeCompare = useCallback(() => {
    setCompareMode(false);
    setCompareState({ status: "idle", diffText: "" });
  }, [setCompareMode]);

  return {
    compareState,
    startCompare,
    closeCompare,
    documentId,
  };
}

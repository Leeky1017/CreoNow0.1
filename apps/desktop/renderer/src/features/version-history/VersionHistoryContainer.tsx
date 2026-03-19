import React from "react";
import { useTranslation } from "react-i18next";
import { VersionHistoryPanelContent } from "./VersionHistoryPanel";
import { useVersionCompare } from "./useVersionCompare";
import { useEditorStore } from "../../stores/editorStore";
import {
  type VersionListItem,
  useVersionStore,
} from "../../stores/versionStore";
import { invoke } from "../../lib/ipcClient";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { RESTORE_VERSION_CONFIRM_COPY } from "./restoreConfirmCopy";
import { useVersionPreferencesStore } from "../../stores/versionPreferencesStore";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { EmptyState } from "../../components/patterns/EmptyState";
import { LoadingState } from "../../components/patterns/LoadingState";
import { ErrorState } from "../../components/patterns/ErrorState";
import { formatTimestamp, convertToTimeGroups } from "./versionHistoryHelpers";
import { useConflictResolution } from "./useConflictResolution";
import { BranchMergeSection } from "./BranchMergeSection";

export { formatTimestamp } from "./versionHistoryHelpers";

type VersionHistoryContainerProps = {
  projectId: string;
};

/**
 * Container component for VersionHistoryPanel.
 *
 * Manages:
 * - Fetching version list from backend
 * - Converting to timeGroups format
 * - Compare and restore actions
 */
export function VersionHistoryContainer(
  props: VersionHistoryContainerProps,
): JSX.Element {
  const { t } = useTranslation();
  const documentId = useEditorStore((s) => s.documentId);
  const bootstrapEditor = useEditorStore((s) => s.bootstrapForProject);
  const { startCompare } = useVersionCompare();
  const startPreview = useVersionStore((s) => s.startPreview);
  const previewStatus = useVersionStore((s) => s.previewStatus);
  const previewError = useVersionStore((s) => s.previewError);
  const mergeBranch = useVersionStore((s) => s.mergeBranch);
  const resolveBranchConflict = useVersionStore((s) => s.resolveBranchConflict);
  const clearBranchMergeState = useVersionStore((s) => s.clearBranchMergeState);
  const branchMergeStatus = useVersionStore((s) => s.branchMergeStatus);
  const branchMergeError = useVersionStore((s) => s.branchMergeError);
  const mergeSessionId = useVersionStore((s) => s.mergeSessionId);
  const mergeConflicts = useVersionStore((s) => s.mergeConflicts);
  const showAiMarks = useVersionPreferencesStore((s) => s.showAiMarks);
  const { confirm, dialogProps } = useConfirmDialog();

  const [items, setItems] = React.useState<VersionListItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [currentHash, setCurrentHash] = React.useState<string | null>(null);
  const [sourceBranchName, setSourceBranchName] = React.useState("alt-ending");
  const [targetBranchName, setTargetBranchName] = React.useState("main");
  const {
    conflictForm,
    handleResolutionChange,
    handleManualTextChange,
    hasInvalidManualResolution,
    handleResolveConflicts,
  } = useConflictResolution(
    mergeConflicts,
    documentId,
    mergeSessionId,
    resolveBranchConflict,
  );

  // Fetch version list when documentId changes
  React.useEffect(() => {
    if (!documentId) {
      setItems([]);
      setStatus("idle");
      return;
    }

    let cancelled = false;

    async function fetchVersions(): Promise<void> {
      setStatus("loading");

      // Get current document hash
      const docRes = await invoke("file:document:read", {
        projectId: props.projectId,
        documentId: documentId!,
      });
      if (!cancelled && docRes.ok) {
        setCurrentHash(docRes.data.contentHash);
      }

      // Get version list
      const res = await invoke("version:snapshot:list", {
        documentId: documentId!,
      });
      if (cancelled) return;

      if (res.ok) {
        setItems(res.data.items);
        setStatus("ready");
      } else {
        setItems([]);
        setStatus("error");
      }
    }

    void fetchVersions();

    return () => {
      cancelled = true;
    };
  }, [documentId, props.projectId]);

  const timeGroups = React.useMemo(
    () => convertToTimeGroups(items, currentHash),
    [items, currentHash],
  );

  const handleCompare = React.useCallback(
    (versionId: string) => {
      if (!documentId) return;
      void startCompare(documentId, versionId);
    },
    [documentId, startCompare],
  );

  const handleRestore = React.useCallback(
    async (versionId: string) => {
      if (!documentId) return;

      const confirmed = await confirm(RESTORE_VERSION_CONFIRM_COPY);
      if (!confirmed) {
        return;
      }

      const res = await invoke("version:snapshot:rollback", {
        documentId,
        versionId,
      });
      if (res.ok) {
        // Refresh version list
        const listRes = await invoke("version:snapshot:list", { documentId });
        if (listRes.ok) {
          setItems(listRes.data.items);
        }
        await bootstrapEditor(props.projectId);
      }
    },
    [bootstrapEditor, confirm, documentId, props.projectId],
  );

  const handlePreview = React.useCallback(
    (versionId: string) => {
      if (!documentId) return;

      const item = items.find((candidate) => candidate.versionId === versionId);
      const timestamp = item
        ? formatTimestamp(item.createdAt)
        : t("versionHistory.container.history");
      void startPreview(documentId, { versionId, timestamp });
    },
    [documentId, items, startPreview, t],
  );

  const handleMergeBranches = React.useCallback(async () => {
    if (!documentId) {
      return;
    }
    if (
      sourceBranchName.trim().length === 0 ||
      targetBranchName.trim().length === 0
    ) {
      return;
    }
    await mergeBranch({
      documentId,
      sourceBranchName: sourceBranchName.trim(),
      targetBranchName: targetBranchName.trim(),
    });
  }, [documentId, mergeBranch, sourceBranchName, targetBranchName]);

  if (!documentId) {
    return (
      <EmptyState
        variant="generic"
        title={t("versionHistory.container.openDocumentToViewHistory")}
        className="p-3"
      />
    );
  }

  if (status === "loading") {
    return (
      <LoadingState
        variant="spinner"
        size="sm"
        text={t("versionHistory.container.loadingVersions")}
        className="p-3"
      />
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        variant="inline"
        message={t("versionHistory.container.failedToLoadHistory")}
        className="p-3"
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title={t("versionHistory.container.noVersionsYet")}
        className="p-3"
      />
    );
  }

  return (
    <>
      <VersionHistoryPanelContent
        timeGroups={timeGroups}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCompare={handleCompare}
        onRestore={handleRestore}
        onPreview={handlePreview}
        showAiMarks={showAiMarks}
        showCloseButton={false}
      />
      <BranchMergeSection
        sourceBranchName={sourceBranchName}
        onSourceChange={setSourceBranchName}
        targetBranchName={targetBranchName}
        onTargetChange={setTargetBranchName}
        branchMergeStatus={branchMergeStatus}
        branchMergeError={branchMergeError}
        onMergeBranches={() => void handleMergeBranches()}
        mergeConflicts={mergeConflicts}
        conflictForm={conflictForm}
        onResolutionChange={handleResolutionChange}
        onManualTextChange={handleManualTextChange}
        hasInvalidManualResolution={hasInvalidManualResolution}
        onResolveConflicts={() => void handleResolveConflicts()}
        onDismissConflicts={clearBranchMergeState}
      />
      {previewStatus === "error" && previewError ? (
        <div
          role="alert"
          className="px-3 py-2 text-xs text-[var(--color-error)]"
        >
          <span data-testid="version-preview-error">
            {getHumanErrorMessage(previewError)}
          </span>
        </div>
      ) : null}
      <SystemDialog {...dialogProps} />
    </>
  );
}

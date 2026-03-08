import React from "react";
import { useTranslation } from "react-i18next";
import {
  VersionHistoryPanelContent,
  type TimeGroup,
  type VersionEntry,
  type VersionAuthorType,
} from "./VersionHistoryPanel";
import { useVersionCompare } from "./useVersionCompare";
import { useEditorStore } from "../../stores/editorStore";
import {
  type BranchMergeConflict,
  type VersionListItem,
  type VersionStoreActions,
  useVersionStore,
} from "../../stores/versionStore";
import { invoke } from "../../lib/ipcClient";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { RESTORE_VERSION_CONFIRM_COPY } from "./restoreConfirmCopy";
import { useVersionPreferencesStore } from "../../stores/versionPreferencesStore";
import { i18n } from "../../i18n";

/**
 * Map backend actor to UI author type.
 */
function mapActorToAuthorType(
  actor: "user" | "auto" | "ai",
): VersionAuthorType {
  switch (actor) {
    case "user":
      return "user";
    case "ai":
      return "ai";
    case "auto":
      return "auto-save";
    default:
      return "user";
  }
}

/**
 * Get display name for actor type.
 */
function getAuthorName(actor: "user" | "auto" | "ai"): string {
  switch (actor) {
    case "user":
      return i18n.t("versionHistory.container.author.you");
    case "ai":
      return i18n.t("versionHistory.container.author.ai");
    case "auto":
      return i18n.t("versionHistory.container.author.auto");
    default:
      return i18n.t("versionHistory.container.author.unknown");
  }
}

/**
 * Format timestamp for display.
 */
export function formatTimestamp(
  createdAt: number,
  now: number = Date.now(),
): string {
  const diff = now - createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) {
    return i18n.t("versionHistory.container.timeGroup.justNow");
  }
  if (minutes < 60) {
    return i18n.t("versionHistory.container.timeGroup.minutesAgo", { count: minutes });
  }
  if (hours < 24) {
    const date = new Date(createdAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const date = new Date(createdAt);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Get time group label for a timestamp.
 */
function getTimeGroupLabel(createdAt: number): string {
  const now = new Date();
  const date = new Date(createdAt);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return "today";
  }
  if (isYesterday) {
    return "yesterday";
  }
  return "earlier";
}

/**
 * Get description for a version based on reason.
 */
function getDescription(reason: string): string {
  if (reason === "autosave") {
    return i18n.t("versionHistory.container.autosave");
  }
  if (reason === "manual-save") {
    return i18n.t("versionHistory.container.manualSave");
  }
  if (reason === "status-change") {
    return i18n.t("versionHistory.container.statusChange");
  }
  if (reason === "ai-accept") {
    return i18n.t("versionHistory.container.aiModify");
  }
  if (reason === "restore") {
    return i18n.t("versionHistory.container.restoreVersion");
  }
  if (reason.startsWith("ai-apply:")) {
    return i18n.t("versionHistory.container.aiModify");
  }
  return reason || i18n.t("versionHistory.container.versionSnapshot");
}

/**
 * Convert backend version list to UI timeGroups format.
 */
function convertToTimeGroups(
  items: VersionListItem[],
  currentHash: string | null,
): TimeGroup[] {
  if (items.length === 0) {
    return [];
  }

  const groupMap = new Map<string, VersionEntry[]>();

  for (const item of items) {
    const label = getTimeGroupLabel(item.createdAt);
    const isCurrent = item.contentHash === currentHash;

    const entry: VersionEntry = {
      id: item.versionId,
      timestamp: formatTimestamp(item.createdAt),
      authorType: mapActorToAuthorType(item.actor),
      authorName: getAuthorName(item.actor),
      description: getDescription(item.reason),
      wordChange: { type: "none", count: 0 }, // TODO(#571): calculate actual word diff
      isCurrent,
      reason: item.reason,
    };

    const existing = groupMap.get(label) ?? [];
    existing.push(entry);
    groupMap.set(label, existing);
  }

  // Sort groups: today first, then yesterday, then earlier
  const order = ["today", "yesterday", "earlier"];
  const labelTranslations: Record<string, string> = {
    today: i18n.t("versionHistory.container.timeGroup.today"),
    yesterday: i18n.t("versionHistory.container.timeGroup.yesterday"),
    earlier: i18n.t("versionHistory.container.timeGroup.earlier"),
  };
  const groups: TimeGroup[] = [];

  for (const label of order) {
    const versions = groupMap.get(label);
    if (versions && versions.length > 0) {
      groups.push({ label: labelTranslations[label] ?? label, versions });
    }
  }

  return groups;
}


type ConflictFormEntry = {
  resolution: "ours" | "theirs" | "manual";
  manualText: string;
};

function BranchConflictItem(props: {
  conflict: BranchMergeConflict;
  selected: ConflictFormEntry;
  onResolutionChange: (conflictId: string, resolution: "ours" | "theirs" | "manual") => void;
  onManualTextChange: (conflictId: string, manualText: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}): JSX.Element {
  const { conflict, selected, onResolutionChange, onManualTextChange, t } = props;
  return (
    <div
      key={conflict.conflictId}
      data-testid={`branch-conflict-item-${conflict.conflictId}`}
      className="space-y-2 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2"
    >
      <div className="text-[11px] text-[var(--color-fg-muted)]">
        {t('versionHistory.container.conflictNumber', { number: conflict.index + 1 })}
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs text-[var(--color-fg-default)]">
        <div>
          <div className="text-[11px] text-[var(--color-fg-muted)]">
            {t('versionHistory.container.base')}
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {conflict.baseText}
          </pre>
        </div>
        <div>
          <div className="text-[11px] text-[var(--color-fg-muted)]">
            {t('versionHistory.container.ours')}
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {conflict.oursText}
          </pre>
        </div>
        <div>
          <div className="text-[11px] text-[var(--color-fg-muted)]">
            {t('versionHistory.container.theirs')}
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {conflict.theirsText}
          </pre>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-[var(--color-fg-default)]">
        <label className="inline-flex items-center gap-1">
          <input
            type="radio"
            name={`resolution-${conflict.conflictId}`}
            checked={selected.resolution === "ours"}
            onChange={() =>
              onResolutionChange(conflict.conflictId, "ours")
            }
          />
          {t('versionHistory.container.useOurs')}
        </label>
        <label className="inline-flex items-center gap-1">
          <input
            type="radio"
            name={`resolution-${conflict.conflictId}`}
            checked={selected.resolution === "theirs"}
            onChange={() =>
              onResolutionChange(conflict.conflictId, "theirs")
            }
          />
          {t('versionHistory.container.useTheirs')}
        </label>
        <label className="inline-flex items-center gap-1">
          <input
            data-testid={`branch-conflict-manual-${conflict.conflictId}`}
            type="radio"
            name={`resolution-${conflict.conflictId}`}
            checked={selected.resolution === "manual"}
            onChange={() =>
              onResolutionChange(conflict.conflictId, "manual")
            }
          />
          {t('versionHistory.container.useManual')}
        </label>
      </div>
      {selected.resolution === "manual" ? (
        <textarea
          data-testid={`branch-conflict-manual-text-${conflict.conflictId}`}
          className="h-20 w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-2 font-mono text-xs text-[var(--color-fg-default)]"
          value={selected.manualText}
          onChange={(event) =>
            onManualTextChange(
              conflict.conflictId,
              event.target.value,
            )
          }
        />
      ) : null}
    </div>
  );
}

function useConflictResolution(
  mergeConflicts: BranchMergeConflict[],
  documentId: string | null,
  mergeSessionId: string | null,
  resolveBranchConflict: VersionStoreActions["resolveBranchConflict"],
): {
  conflictForm: Record<string, ConflictFormEntry>;
  handleResolutionChange: (conflictId: string, resolution: "ours" | "theirs" | "manual") => void;
  handleManualTextChange: (conflictId: string, manualText: string) => void;
  hasInvalidManualResolution: boolean;
  handleResolveConflicts: () => Promise<void>;
} {
  const [conflictForm, setConflictForm] = React.useState<
    Record<
      string,
      {
        resolution: "ours" | "theirs" | "manual";
        manualText: string;
      }
    >
  >({});

  React.useEffect(() => {
    if (mergeConflicts.length === 0) {
      setConflictForm({});
      return;
    }
    setConflictForm((prev) => {
      const next: Record<
        string,
        {
          resolution: "ours" | "theirs" | "manual";
          manualText: string;
        }
      > = {};
      for (const conflict of mergeConflicts) {
        next[conflict.conflictId] = prev[conflict.conflictId] ?? {
          resolution: "ours",
          manualText: "",
        };
      }
      return next;
    });
  }, [mergeConflicts]);

  const handleResolutionChange = React.useCallback(
    (conflictId: string, resolution: "ours" | "theirs" | "manual") => {
      setConflictForm((prev) => ({
        ...prev,
        [conflictId]: {
          resolution,
          manualText: prev[conflictId]?.manualText ?? "",
        },
      }));
    },
    [],
  );

  const handleManualTextChange = React.useCallback(
    (conflictId: string, manualText: string) => {
      setConflictForm((prev) => ({
        ...prev,
        [conflictId]: {
          resolution: prev[conflictId]?.resolution ?? "manual",
          manualText,
        },
      }));
    },
    [],
  );

  const hasInvalidManualResolution = React.useMemo(
    () =>
      mergeConflicts.some((conflict) => {
        const selected = conflictForm[conflict.conflictId];
        if (selected?.resolution !== "manual") {
          return false;
        }
        return selected.manualText.trim().length === 0;
      }),
    [conflictForm, mergeConflicts],
  );

  const handleResolveConflicts = React.useCallback(async () => {
    if (!documentId || !mergeSessionId) {
      return;
    }
    if (hasInvalidManualResolution) {
      return;
    }

    const resolutions = mergeConflicts.map((conflict) => {
      const selected = conflictForm[conflict.conflictId] ?? {
        resolution: "ours" as const,
        manualText: "",
      };
      if (selected.resolution === "manual") {
        return {
          conflictId: conflict.conflictId,
          resolution: "manual" as const,
          manualText: selected.manualText.trim(),
        };
      }
      return {
        conflictId: conflict.conflictId,
        resolution: selected.resolution,
      };
    });

    const result = await resolveBranchConflict({
      documentId,
      mergeSessionId,
      resolutions,
      resolvedBy: "user",
    });

    if (result.ok) {
      setConflictForm({});
    }
  }, [
    conflictForm,
    documentId,
    hasInvalidManualResolution,
    mergeConflicts,
    mergeSessionId,
    resolveBranchConflict,
  ]);

  return {
    conflictForm,
    handleResolutionChange,
    handleManualTextChange,
    hasInvalidManualResolution,
    handleResolveConflicts,
  };
}
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
} = useConflictResolution(mergeConflicts, documentId, mergeSessionId, resolveBranchConflict);


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
      const timestamp = item ? formatTimestamp(item.createdAt) : t("versionHistory.container.history");
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
      <div className="p-3 text-xs text-[var(--color-fg-muted)]">
        {t('versionHistory.container.openDocumentToViewHistory')}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="p-3 text-xs text-[var(--color-fg-muted)]">
        {t('versionHistory.container.loadingVersions')}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-3 text-xs text-[var(--color-error)]">
        {t('versionHistory.container.failedToLoadHistory')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-3 text-xs text-[var(--color-fg-muted)]">
        {t('versionHistory.container.noVersionsYet')}
      </div>
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
      <div className="mx-3 mt-3 space-y-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-3">
        <div className="text-xs font-semibold text-[var(--color-fg-default)]">
          {t('versionHistory.container.branchMerge')}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-[var(--color-fg-muted)]">
            {t('versionHistory.container.sourceBranch')}
            <input
              data-testid="branch-merge-source-input"
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-fg-default)]"
              value={sourceBranchName}
              onChange={(event) => setSourceBranchName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-[var(--color-fg-muted)]">
            {t('versionHistory.container.targetBranch')}
            <input
              data-testid="branch-merge-target-input"
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-fg-default)]"
              value={targetBranchName}
              onChange={(event) => setTargetBranchName(event.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          data-testid="branch-merge-submit"
          className="focus-ring rounded border border-[var(--color-accent)] px-2 py-1 text-xs text-[var(--color-fg-default)] disabled:opacity-50"
          onClick={() => void handleMergeBranches()}
          disabled={
            branchMergeStatus === "loading" ||
            sourceBranchName.trim().length === 0 ||
            targetBranchName.trim().length === 0
          }
        >
          {branchMergeStatus === "loading" ? t('versionHistory.container.merging') : t('versionHistory.container.mergeBranches')}
        </button>
        {branchMergeStatus === "ready" ? (
          <div className="text-[11px] text-[var(--color-success)]">
            {t('versionHistory.container.branchMergeCompleted')}
          </div>
        ) : null}
        {branchMergeStatus === "error" && branchMergeError ? (
          <div className="text-[11px] text-[var(--color-error)]">
            {branchMergeError.code}: {branchMergeError.message}
          </div>
        ) : null}
      </div>
      {branchMergeStatus === "conflict" && mergeConflicts.length > 0 ? (
        <div
          data-testid="branch-conflict-panel"
          className="mx-3 mt-3 space-y-3 rounded-lg border border-[var(--color-warning)] bg-[var(--color-bg-raised)] p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-[var(--color-fg-default)]">
              {t('versionHistory.container.mergeConflictDiff')}
            </div>
            <button
              type="button"
              className="focus-ring rounded border border-[var(--color-border-default)] px-2 py-1 text-[11px] text-[var(--color-fg-muted)]"
              onClick={clearBranchMergeState}
            >
              {t('versionHistory.container.dismiss')}
            </button>
          </div>

{mergeConflicts.map((conflict) => {
  const selected = conflictForm[conflict.conflictId] ?? {
    resolution: "ours" as const,
    manualText: "",
  };
  return (
    <BranchConflictItem
      key={conflict.conflictId}
      conflict={conflict}
      selected={selected}
      onResolutionChange={handleResolutionChange}
      onManualTextChange={handleManualTextChange}
      t={t}
    />
  );
})}

          <button
            type="button"
            data-testid="branch-conflict-submit"
            className="focus-ring rounded border border-[var(--color-accent)] px-2 py-1 text-xs text-[var(--color-fg-default)] disabled:opacity-50"
            onClick={() => void handleResolveConflicts()}
            disabled={hasInvalidManualResolution}
          >
            {t('versionHistory.container.submitConflictResolution')}
          </button>
        </div>
      ) : null}
      {previewStatus === "error" && previewError ? (
        <div className="px-3 py-2 text-xs text-[var(--color-error)]">
          <span data-testid="version-preview-error">
            {previewError.code}: {previewError.message}
          </span>
        </div>
      ) : null}
      <SystemDialog {...dialogProps} />
    </>
  );
}

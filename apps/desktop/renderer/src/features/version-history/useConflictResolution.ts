/**
 * Hook for managing branch merge conflict resolution state.
 */
import React from "react";
import type {
  BranchMergeConflict,
  VersionStoreActions,
} from "../../stores/versionStore";

export type ConflictFormEntry = {
  resolution: "ours" | "theirs" | "manual";
  manualText: string;
};

export function useConflictResolution(
  mergeConflicts: BranchMergeConflict[],
  documentId: string | null,
  mergeSessionId: string | null,
  resolveBranchConflict: VersionStoreActions["resolveBranchConflict"],
): {
  conflictForm: Record<string, ConflictFormEntry>;
  handleResolutionChange: (
    conflictId: string,
    resolution: "ours" | "theirs" | "manual",
  ) => void;
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

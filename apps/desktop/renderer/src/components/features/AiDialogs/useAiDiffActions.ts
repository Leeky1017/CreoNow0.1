import { useState, useCallback, useMemo } from "react";
import type { DiffChange, DiffChangeState } from "./types";

type ModalState = "reviewing" | "applying" | "applied";

function buildInitialChangeStates(
  changes: DiffChange[],
  initialChangeStates: Record<string, DiffChangeState>,
): Record<string, DiffChangeState> {
  const states: Record<string, DiffChangeState> = {};
  for (const change of changes) {
    states[change.id] = initialChangeStates[change.id] || "pending";
  }
  return states;
}

interface UseAiDiffActionsOptions {
  changes: DiffChange[];
  currentIndex: number;
  onCurrentIndexChange?: (index: number) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApplyChanges: () => void;
  onOpenChange: (open: boolean) => void;
  simulateDelay: number;
  initialChangeStates: Record<string, DiffChangeState>;
}

function calculateStats(changes: DiffChange[]): {
  added: number;
  removed: number;
} {
  let added = 0;
  let removed = 0;
  for (const change of changes) {
    const beforeLines = change.before.split("\n").length;
    const afterLines = change.after.split("\n").length;
    if (afterLines > beforeLines) {
      added += afterLines - beforeLines;
    } else if (beforeLines > afterLines) {
      removed += beforeLines - afterLines;
    }
    const beforeWords = change.before.split(/\s+/).length;
    const afterWords = change.after.split(/\s+/).length;
    if (afterWords > beforeWords) {
      added += 1;
    } else if (beforeWords > afterWords) {
      removed += 1;
    } else if (change.before !== change.after) {
      added += 1;
      removed += 1;
    }
  }
  return { added, removed };
}

export function useAiDiffActions(options: UseAiDiffActionsOptions) {
  const {
    changes,
    currentIndex,
    onCurrentIndexChange,
    onAcceptAll: onAcceptAllProp,
    onRejectAll: onRejectAllProp,
    onApplyChanges: onApplyChangesProp,
    onOpenChange,
    simulateDelay,
    initialChangeStates,
  } = options;

  const [modalState, setModalState] = useState<ModalState>("reviewing");
  const [changeStates, setChangeStates] = useState<
    Record<string, DiffChangeState>
  >(() => buildInitialChangeStates(changes, initialChangeStates));
  const totalChanges = changes.length;
  const currentChange = changes[currentIndex] || {
    id: "",
    before: "",
    after: "",
  };
  const currentState = changeStates[currentChange.id] || "pending";
  const stats = useMemo(() => calculateStats(changes), [changes]);
  const acceptedCount = useMemo(
    () => Object.values(changeStates).filter((s) => s === "accepted").length,
    [changeStates],
  );
  const rejectedCount = useMemo(
    () => Object.values(changeStates).filter((s) => s === "rejected").length,
    [changeStates],
  );
  const handlePrev = useCallback(() => {
    if (currentIndex > 0 && onCurrentIndexChange) {
      onCurrentIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onCurrentIndexChange]);
  const handleNext = useCallback(() => {
    if (currentIndex < totalChanges - 1 && onCurrentIndexChange) {
      onCurrentIndexChange(currentIndex + 1);
    }
  }, [currentIndex, totalChanges, onCurrentIndexChange]);
  const handleAcceptChange = useCallback((changeId: string) => {
    setChangeStates((prev) => ({ ...prev, [changeId]: "accepted" }));
  }, []);
  const handleRejectChange = useCallback((changeId: string) => {
    setChangeStates((prev) => ({ ...prev, [changeId]: "rejected" }));
  }, []);
  const handleAcceptAll = useCallback(() => {
    const newStates: Record<string, DiffChangeState> = {};
    for (const change of changes) {
      newStates[change.id] = "accepted";
    }
    setChangeStates(newStates);
    onAcceptAllProp();
  }, [changes, onAcceptAllProp]);
  const handleRejectAll = useCallback(() => {
    const newStates: Record<string, DiffChangeState> = {};
    for (const change of changes) {
      newStates[change.id] = "rejected";
    }
    setChangeStates(newStates);
    onRejectAllProp();
  }, [changes, onRejectAllProp]);
  const handleApplyChanges = useCallback(async () => {
    setModalState("applying");
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, simulateDelay));
    setModalState("applied");
    onApplyChangesProp();
    // Auto-close after success
    setTimeout(() => {
      onOpenChange(false);
      setModalState("reviewing");
    }, 500);
  }, [simulateDelay, onApplyChangesProp, onOpenChange]);
  const isApplying = modalState === "applying";
  const isApplied = modalState === "applied";
  return {
    modalState,
    changeStates,
    currentChange,
    currentState,
    totalChanges,
    stats,
    acceptedCount,
    rejectedCount,
    isApplying,
    isApplied,
    handlePrev,
    handleNext,
    handleAcceptChange,
    handleRejectChange,
    handleAcceptAll,
    handleRejectAll,
    handleApplyChanges,
  };
}

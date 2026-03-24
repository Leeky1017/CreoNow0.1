/**
 * BranchMergeSection — branch merge UI + conflict resolution panel.
 */
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { RadioGroup } from "../../components/primitives/Radio";
import type { BranchMergeConflict } from "../../stores/versionStore";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import type { IpcError } from "@shared/types/ipc-generated";
import type { ConflictFormEntry } from "./useConflictResolution";
import { Textarea } from "../../components/primitives/Textarea";
import { Label } from "../../components/primitives/Label";

// ============================================================================
// BranchConflictItem
// ============================================================================

function BranchConflictItem(props: {
  conflict: BranchMergeConflict;
  selected: ConflictFormEntry;
  onResolutionChange: (
    conflictId: string,
    resolution: "ours" | "theirs" | "manual",
  ) => void;
  onManualTextChange: (conflictId: string, manualText: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}): JSX.Element {
  const { conflict, selected, onResolutionChange, onManualTextChange, t } =
    props;
  return (
    <div
      key={conflict.conflictId}
      data-testid={`branch-conflict-item-${conflict.conflictId}`}
      className="space-y-2 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2"
    >
      <div className="text-(--text-status) text-[var(--color-fg-muted)]">
        {t("versionHistory.container.conflictNumber", {
          number: conflict.index + 1,
        })}
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs text-[var(--color-fg-default)]">
        <div>
          <div className="text-(--text-status) text-[var(--color-fg-muted)]">
            {t("versionHistory.container.base")}
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {conflict.baseText}
          </pre>
        </div>
        <div>
          <div className="text-(--text-status) text-[var(--color-fg-muted)]">
            {t("versionHistory.container.ours")}
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {conflict.oursText}
          </pre>
        </div>
        <div>
          <div className="text-(--text-status) text-[var(--color-fg-muted)]">
            {t("versionHistory.container.theirs")}
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {conflict.theirsText}
          </pre>
        </div>
      </div>

      <RadioGroup
        name={`resolution-${conflict.conflictId}`}
        value={selected.resolution}
        onValueChange={(val) =>
          onResolutionChange(
            conflict.conflictId,
            val as "ours" | "theirs" | "manual",
          )
        }
        orientation="horizontal"
        size="sm"
        className="text-(--text-status) text-[var(--color-fg-default)]"
        options={[
          {
            value: "ours",
            label: t("versionHistory.container.useOurs"),
          },
          {
            value: "theirs",
            label: t("versionHistory.container.useTheirs"),
          },
          {
            value: "manual",
            label: t("versionHistory.container.useManual"),
          },
        ]}
      />
      {selected.resolution === "manual" ? (
        <Textarea
          data-testid={`branch-conflict-manual-text-${conflict.conflictId}`}
          className="h-20 w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-2 font-mono text-xs text-[var(--color-fg-default)]"
          value={selected.manualText}
          onChange={(event) =>
            onManualTextChange(conflict.conflictId, event.target.value)
          }
        />
      ) : null}
    </div>
  );
}

// ============================================================================
// BranchMergeSection
// ============================================================================

export function BranchMergeSection({
  sourceBranchName,
  onSourceChange,
  targetBranchName,
  onTargetChange,
  branchMergeStatus,
  branchMergeError,
  onMergeBranches,
  mergeConflicts,
  conflictForm,
  onResolutionChange,
  onManualTextChange,
  hasInvalidManualResolution,
  onResolveConflicts,
  onDismissConflicts,
}: {
  sourceBranchName: string;
  onSourceChange: (value: string) => void;
  targetBranchName: string;
  onTargetChange: (value: string) => void;
  branchMergeStatus: string;
  branchMergeError: IpcError | null;
  onMergeBranches: () => void;
  mergeConflicts: BranchMergeConflict[];
  conflictForm: Record<string, ConflictFormEntry>;
  onResolutionChange: (
    conflictId: string,
    resolution: "ours" | "theirs" | "manual",
  ) => void;
  onManualTextChange: (conflictId: string, manualText: string) => void;
  hasInvalidManualResolution: boolean;
  onResolveConflicts: () => void;
  onDismissConflicts: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div className="mx-3 mt-3 space-y-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-3">
        <div className="text-xs font-semibold text-[var(--color-fg-default)]">
          {t("versionHistory.container.branchMerge")}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label className="flex flex-col gap-1 text-(--text-status) text-[var(--color-fg-muted)]">
            {t("versionHistory.container.sourceBranch")}
            <Input
              data-testid="branch-merge-source-input"
              className="!h-auto !px-2 !py-1 !text-xs"
              value={sourceBranchName}
              onChange={(event) => onSourceChange(event.target.value)}
            />
          </Label>
          <Label className="flex flex-col gap-1 text-(--text-status) text-[var(--color-fg-muted)]">
            {t("versionHistory.container.targetBranch")}
            <Input
              data-testid="branch-merge-target-input"
              className="!h-auto !px-2 !py-1 !text-xs"
              value={targetBranchName}
              onChange={(event) => onTargetChange(event.target.value)}
            />
          </Label>
        </div>
        <Button
          variant="secondary"
          size="sm"
          data-testid="branch-merge-submit"
          onClick={onMergeBranches}
          disabled={
            branchMergeStatus === "loading" ||
            sourceBranchName.trim().length === 0 ||
            targetBranchName.trim().length === 0
          }
        >
          {branchMergeStatus === "loading"
            ? t("versionHistory.container.merging")
            : t("versionHistory.container.mergeBranches")}
        </Button>
        {branchMergeStatus === "ready" ? (
          <div className="text-(--text-status) text-[var(--color-success)]">
            {t("versionHistory.container.branchMergeCompleted")}
          </div>
        ) : null}
        {branchMergeStatus === "error" && branchMergeError ? (
          <div
            role="alert"
            className="text-(--text-status) text-[var(--color-error)]"
          >
            {getHumanErrorMessage(branchMergeError)}
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
              {t("versionHistory.container.mergeConflictDiff")}
            </div>
            <Button variant="ghost" size="sm" onClick={onDismissConflicts}>
              {t("versionHistory.container.dismiss")}
            </Button>
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
                onResolutionChange={onResolutionChange}
                onManualTextChange={onManualTextChange}
                t={t}
              />
            );
          })}

          <Button
            variant="secondary"
            size="sm"
            data-testid="branch-conflict-submit"
            onClick={onResolveConflicts}
            disabled={hasInvalidManualResolution}
          >
            {t("versionHistory.container.submitConflictResolution")}
          </Button>
        </div>
      ) : null}
    </>
  );
}

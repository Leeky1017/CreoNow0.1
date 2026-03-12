import React from "react";
import { useTranslation } from "react-i18next";
import type { AutosaveStatus } from "../../stores/editorStore";
import "../../i18n";

function getSaveLabel(
  status: AutosaveStatus,
  t: (key: string) => string,
): string {
  if (status === "saving") {
    return t("workbench.saveIndicator.saving");
  }
  if (status === "saved") {
    return t("workbench.saveIndicator.saved");
  }
  if (status === "error") {
    return t("workbench.saveIndicator.error");
  }
  return "";
}

/**
 * SaveIndicator renders autosave state with a 2-second "saved" confirmation.
 *
 * Why: status text rules are shared by StatusBar and must stay deterministic.
 */
export function SaveIndicator(props: {
  autosaveStatus: AutosaveStatus;
  onRetry: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const [displayStatus, setDisplayStatus] = React.useState<AutosaveStatus>(
    props.autosaveStatus,
  );

  React.useEffect(() => {
    if (props.autosaveStatus === "saved") {
      setDisplayStatus("saved");
      const timer = window.setTimeout(() => {
        setDisplayStatus((current) => (current === "saved" ? "idle" : current));
      }, 2000);
      return () => window.clearTimeout(timer);
    }

    setDisplayStatus(props.autosaveStatus);
    return;
  }, [props.autosaveStatus]);

  const isError = displayStatus === "error";
  const isSaving = displayStatus === "saving";
  const isSaved = displayStatus === "saved";
  const label = getSaveLabel(displayStatus, t);

  if (isError) {
    return (
      <span
        data-testid="editor-autosave-status"
        role="button"
        aria-label={t("workbench.saveIndicator.retryLabel")}
        aria-live="polite"
        data-status={displayStatus}
        tabIndex={0}
        onClick={() => props.onRetry()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            props.onRetry();
          }
        }}
        className="text-[var(--color-error)] bg-[var(--color-error-subtle)] px-1.5 rounded cursor-pointer underline"
      >
        {label}
      </span>
    );
  }

  return (
    <span
      data-testid="editor-autosave-status"
      role="status"
      aria-live="polite"
      data-status={displayStatus}
      className={
        isSaved ? "text-[var(--color-success)]" : "text-[var(--color-fg-muted)]"
      }
    >
      {isSaving ? (
        <>
          <span
            className="inline-block w-3 h-3 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin align-middle"
            aria-hidden="true"
            data-testid="save-spinner"
          />
          {label}
        </>
      ) : (
        label
      )}
    </span>
  );
}

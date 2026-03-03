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
  const label = getSaveLabel(displayStatus, t);

  return (
    <span
      data-testid="editor-autosave-status"
      aria-live="polite"
      data-status={displayStatus}
      onClick={() => {
        if (isError) {
          props.onRetry();
        }
      }}
      className={
        isError
          ? "text-[var(--color-error)] cursor-pointer underline"
          : "text-[var(--color-fg-muted)] cursor-default"
      }
    >
      {label}
    </span>
  );
}

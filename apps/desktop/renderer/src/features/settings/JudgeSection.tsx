import React from "react";
import { useTranslation } from "react-i18next";

import type { IpcChannelSpec } from "@shared/types/ipc-generated";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { runFireAndForget } from "../../lib/fireAndForget";
import { Button, Heading, Text } from "../../components/primitives";
import { useJudgeEnsure } from "../../hooks/useJudgeEnsure";

type JudgeModelState =
  IpcChannelSpec["judge:model:getstate"]["response"]["state"];

/**
 * Render judge state into a stable, human-readable label.
 */
function formatState(state: JudgeModelState): string {
  if (state.status === "error") {
    return `error (${getHumanErrorMessage(state.error)})`;
  }
  return state.status;
}

/**
 * JudgeSection is the Settings surface for model readiness.
 *
 * Why: P0 requires a stable, E2E-testable status + ensure entry without silent failure.
 */
export function JudgeSection(): JSX.Element {
  const { t } = useTranslation();
  const [state, setState] = React.useState<JudgeModelState | null>(null);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const {
    busy: ensureBusy,
    downloading: ensureDownloading,
    error: ensureError,
    ensure,
    clearError,
  } = useJudgeEnsure();

  React.useEffect(() => {
    let canceled = false;
    runFireAndForget(
      async () => {
        const res = await invoke("judge:model:getstate", {});
        if (canceled) {
          return;
        }
        if (res.ok) {
          setState(res.data.state);
          setErrorText(null);
          clearError();
          return;
        }
        setErrorText(getHumanErrorMessage(res.error));
      },
      (error) => {
        if (canceled) {
          return;
        }
        const message =
          error instanceof Error ? error.message : String(error ?? "unknown");
        setErrorText(message);
      },
    );
    return () => {
      canceled = true;
    };
  }, [clearError]);

  async function handleEnsure(): Promise<void> {
    setErrorText(null);
    const result = await ensure();
    if (!result) {
      return;
    }

    if (result.ok) {
      setState(result.state);
      return;
    }

    setErrorText(getHumanErrorMessage(result.error));
    setState({
      status: "error",
      error: { code: result.error.code, message: result.error.message },
    });
  }

  const viewState: JudgeModelState | null = ensureDownloading
    ? { status: "downloading" }
    : state;
  const displayError = ensureError
    ? getHumanErrorMessage(ensureError)
    : errorText;

  return (
    <section
      data-testid="settings-judge-section"
      className="p-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
    >
      <Heading level="h4" className="mb-1.5 font-bold">
        {t("settings.judge.title")}
      </Heading>
      <Text size="small" color="muted" as="div" className="mb-2.5">
        {t("settings.judge.status")}{" "}
        <Text data-testid="judge-status" size="small" color="default" as="span">
          {viewState ? formatState(viewState) : t("settings.judge.loading")}
        </Text>
      </Text>

      <div className="flex items-center gap-2">
        <Button
          data-testid="judge-ensure"
          variant="secondary"
          size="sm"
          onClick={() => void handleEnsure()}
          disabled={ensureBusy}
          loading={ensureBusy}
          className="bg-[var(--color-bg-selected)]"
        >
          {t("settings.judge.ensure")}
        </Button>

        {displayError ? (
          <Text data-testid="judge-error" size="small" color="muted">
            {displayError}
          </Text>
        ) : null}
      </div>
    </section>
  );
}

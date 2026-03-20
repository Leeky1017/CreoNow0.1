import { useTranslation } from "react-i18next";

import { Button, Card, Text } from "../../components/primitives";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import { ErrorState } from "../../components/patterns/ErrorState";
import { LoadingState } from "../../components/patterns/LoadingState";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { useProjectStore } from "../../stores/projectStore";
import { formatUpdatedAt } from "./memoryPanelTypes";
import { useMemoryState } from "./useMemoryState";
import type { MemoryPanelState } from "./useMemoryState";
import { MemoryScopeTabs, MemoryRulesCard } from "./MemoryList";
import { MemoryConflictSection, MemoryComposer } from "./MemoryEditor";

function MemoryPanelFooter(props: {
  t: (key: string, opts?: Record<string, unknown>) => string;
  state: MemoryPanelState;
}): JSX.Element {
  return (
    <>
      <Card
        noPadding
        className="shrink-0 p-2.5 bg-[var(--color-bg-raised)] rounded-[var(--radius-sm)]"
      >
        <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
          <span>
            {props.t("memory.panel.interactionCount", {
              count: props.state.interactionCount,
            })}
          </span>
          <span>
            {props.t("memory.panel.lastUpdate", {
              time: formatUpdatedAt(props.state.latestUpdateAt),
            })}
          </span>
        </div>
      </Card>

      <div className="shrink-0 flex items-center gap-2">
        <Button size="sm" onClick={() => props.state.setComposerOpen(true)}>
          {props.t("memory.panel.addRuleManually")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={props.state.distilling}
          onClick={() => void props.state.handleDistill()}
        >
          {props.t("memory.panel.updatePreferences")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void props.state.handleLearningToggle()}
        >
          {props.state.settings?.preferenceLearningEnabled === false
            ? props.t("memory.panel.resumeLearning")
            : props.t("memory.panel.pauseLearning")}
        </Button>
      </div>
    </>
  );
}

/**
 * MemoryPanel implements MS-3 semantic-rule interaction surface.
 *
 * Why: panel-level behaviors (confirm/edit/delete/manual-add/pause) must be
 * directly user-controllable and decoupled from legacy entry CRUD workflows.
 */
export function MemoryPanel(): JSX.Element {
  const { t } = useTranslation();
  const projectId = useProjectStore(
    (state) => state.current?.projectId ?? null,
  );

  const state = useMemoryState(projectId, t);

  return (
    <section
      data-testid="memory-panel"
      className="h-full min-h-0 flex flex-col bg-[var(--color-bg-surface)]"
    >
      <PanelHeader
        title={t("memory.panel.title")}
        actions={
          <Text size="tiny" color="muted">
            {state.status}
          </Text>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col gap-3 p-3">
        <MemoryScopeTabs
          t={t}
          activeScope={state.activeScope}
          setActiveScope={state.setActiveScope}
          hasProject={Boolean(projectId)}
        />

        {!state.settings?.preferenceLearningEnabled ? (
          <Card
            noPadding
            data-testid="memory-learning-paused"
            className="shrink-0 px-2.5 py-2 border-[var(--color-warning)] text-[var(--color-warning)]"
          >
            <Text size="small" className="text-[var(--color-warning)]">
              {t("memory.panel.learningPaused")}
            </Text>
          </Card>
        ) : null}

        <MemoryConflictSection t={t} state={state} />

        {state.error ? (
          <ErrorState
            variant="banner"
            message={getHumanErrorMessage(state.error)}
            dismissible
            onDismiss={() => state.setError(null)}
            className="shrink-0"
          />
        ) : null}

        <MemoryRulesCard t={t} state={state} />

        {state.distilling ? (
          <LoadingState
            variant="spinner"
            size="sm"
            text={t("memory.panel.distilling")}
            className="shrink-0"
          />
        ) : null}

        <MemoryPanelFooter t={t} state={state} />

        {state.composerOpen ? (
          <MemoryComposer
            t={t}
            draftRule={state.draftRule}
            setDraftRule={state.setDraftRule}
            draftCategory={state.draftCategory}
            setDraftCategory={state.setDraftCategory}
            handleCreateRule={state.handleCreateRule}
            onClose={() => {
              state.setComposerOpen(false);
              state.setDraftRule("");
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

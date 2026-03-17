import React from "react";
import { useTranslation } from "react-i18next";

import type { IpcError, IpcResponseData } from "@shared/types/ipc-generated";
import { Button, Card, Text } from "../../components/primitives";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { useProjectStore } from "../../stores/projectStore";

type PanelScope = "global" | "project";
type SemanticRule = IpcResponseData<"memory:semantic:list">["items"][number];
type SemanticConflict =
  IpcResponseData<"memory:semantic:list">["conflictQueue"][number];
type SemanticCategory = SemanticRule["category"];
type MemorySettings = IpcResponseData<"memory:settings:get">;

type CategoryGroup = {
  category: SemanticCategory;
  labelKey: string;
};

const CATEGORY_GROUPS: CategoryGroup[] = [
  { category: "style", labelKey: "memory.panel.categoryStyle" },
  { category: "structure", labelKey: "memory.panel.categoryStructure" },
  { category: "character", labelKey: "memory.panel.categoryCharacter" },
  { category: "pacing", labelKey: "memory.panel.categoryPacing" },
  { category: "vocabulary", labelKey: "memory.panel.categoryVocabulary" },
];

function normalizePanelLoadError(
  cause: unknown,
  fallbackMessage: string,
): IpcError {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "message" in cause &&
    typeof cause.message === "string" &&
    cause.message.trim().length > 0
  ) {
    return {
      code: "INTERNAL_ERROR",
      message: cause.message,
    };
  }
  return {
    code: "INTERNAL_ERROR",
    message: fallbackMessage,
  };
}

function formatUpdatedAt(ts: number | null): string {
  if (!ts || !Number.isFinite(ts)) {
    return "--";
  }
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}

function useScopeSync(args: {
  activeScope: PanelScope;
  projectId: string | null;
  setActiveScope: React.Dispatch<React.SetStateAction<PanelScope>>;
}): void {
  const { activeScope, projectId, setActiveScope } = args;

  React.useEffect(() => {
    if (projectId && activeScope === "global") {
      return;
    }
    if (!projectId && activeScope !== "global") {
      setActiveScope("global");
      return;
    }
    if (projectId && activeScope !== "project") {
      setActiveScope("project");
    }
  }, [activeScope, projectId, setActiveScope]);
}

function useMemoryState(
  projectId: string | null,
  t: (key: string, opts?: Record<string, unknown>) => string,
) {
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [error, setError] = React.useState<IpcError | null>(null);
  const [rules, setRules] = React.useState<SemanticRule[]>([]);
  const [conflictQueue, setConflictQueue] = React.useState<SemanticConflict[]>(
    [],
  );
  const [conflictCount, setConflictCount] = React.useState(0);
  const [conflictPanelOpen, setConflictPanelOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<MemorySettings | null>(null);
  const [activeScope, setActiveScope] = React.useState<PanelScope>("project");

  const [composerOpen, setComposerOpen] = React.useState(false);
  const [draftRule, setDraftRule] = React.useState("");
  const [draftCategory, setDraftCategory] =
    React.useState<SemanticCategory>("style");

  const [editingRuleId, setEditingRuleId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");

  const [distilling, setDistilling] = React.useState(false);

  const loadPanelData = React.useCallback(async () => {
    if (!projectId) {
      setRules([]);
      setConflictQueue([]);
      setConflictCount(0);
      setSettings(null);
      setStatus("ready");
      setError(null);
      setActiveScope("global");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const [listRes, settingsRes] = await Promise.all([
        invoke("memory:semantic:list", { projectId }),
        invoke("memory:settings:get", {}),
      ]);

      if (!listRes.ok) {
        setStatus("error");
        setError(listRes.error);
        return;
      }

      if (!settingsRes.ok) {
        setStatus("error");
        setError(settingsRes.error);
        return;
      }

      setRules(listRes.data.items);
      setConflictQueue(listRes.data.conflictQueue);
      setConflictCount(
        listRes.data.conflictQueue.filter((item) => item.status === "pending")
          .length,
      );
      setSettings(settingsRes.data);
      setStatus("ready");
    } catch (cause) {
      setStatus("error");
      setError(normalizePanelLoadError(cause, t("memory.panel.loadError")));
    }
  }, [projectId, t]);

  React.useEffect(() => {
    void loadPanelData();
  }, [loadPanelData]);

  useScopeSync({ activeScope, projectId, setActiveScope });

  const filteredRules = React.useMemo(
    () => rules.filter((rule) => rule.scope === activeScope),
    [activeScope, rules],
  );

  const groupedRules = React.useMemo(() => {
    return CATEGORY_GROUPS.map((group) => ({
      ...group,
      items: filteredRules.filter((rule) => rule.category === group.category),
    })).filter((group) => group.items.length > 0);
  }, [filteredRules]);

  const interactionCount = React.useMemo(() => {
    const ids = new Set<string>();
    for (const rule of rules) {
      for (const id of rule.supportingEpisodes) {
        ids.add(id);
      }
      for (const id of rule.contradictingEpisodes) {
        ids.add(id);
      }
    }
    return ids.size;
  }, [rules]);

  const latestUpdateAt = React.useMemo(() => {
    if (rules.length === 0) {
      return null;
    }
    return Math.max(...rules.map((rule) => rule.updatedAt));
  }, [rules]);

  async function handleConfirmRule(ruleId: string): Promise<void> {
    if (!projectId) {
      return;
    }

    const res = await invoke("memory:semantic:update", {
      projectId,
      ruleId,
      patch: {
        userConfirmed: true,
      },
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? res.data.item : rule)),
    );
  }

  function startEdit(rule: SemanticRule): void {
    setEditingRuleId(rule.id);
    setEditingText(rule.rule);
  }

  async function handleSaveEdit(ruleId: string): Promise<void> {
    if (!projectId) {
      return;
    }

    const normalized = editingText.trim();
    if (normalized.length === 0) {
      setError({
        code: "INVALID_ARGUMENT",
        message: t("memory.panel.ruleTextRequired"),
      });
      return;
    }

    const res = await invoke("memory:semantic:update", {
      projectId,
      ruleId,
      patch: {
        rule: normalized,
        userModified: true,
      },
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? res.data.item : rule)),
    );
    setEditingRuleId(null);
    setEditingText("");
  }

  async function handleDeleteRule(ruleId: string): Promise<void> {
    if (!projectId) {
      return;
    }

    const confirmed = window.confirm(t("memory.panel.confirmDeleteRule"));
    if (!confirmed) {
      return;
    }

    const res = await invoke("memory:semantic:delete", { projectId, ruleId });
    if (!res.ok) {
      setError(res.error);
      return;
    }

    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }

  async function handleCreateRule(): Promise<void> {
    if (!projectId) {
      return;
    }

    const normalized = draftRule.trim();
    if (normalized.length === 0) {
      setError({
        code: "INVALID_ARGUMENT",
        message: t("memory.panel.ruleTextRequired"),
      });
      return;
    }

    const res = await invoke("memory:semantic:add", {
      projectId,
      rule: normalized,
      category: draftCategory,
      confidence: 1,
      scope: activeScope,
      userConfirmed: true,
      userModified: false,
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setRules((prev) => [res.data.item, ...prev]);
    setComposerOpen(false);
    setDraftRule("");
    setDraftCategory("style");
  }

  async function handleDistill(): Promise<void> {
    if (!projectId) {
      return;
    }

    setDistilling(true);
    const res = await invoke("memory:semantic:distill", {
      projectId,
      trigger: "manual",
    });
    setDistilling(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    await loadPanelData();
  }

  async function handleLearningToggle(): Promise<void> {
    if (!settings) {
      return;
    }

    const res = await invoke("memory:settings:update", {
      patch: {
        preferenceLearningEnabled: !settings.preferenceLearningEnabled,
      },
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setSettings(res.data);
  }

  async function handleResolveConflict(
    conflictId: string,
    chosenRuleId: string,
  ): Promise<void> {
    if (!projectId) {
      return;
    }

    const conflict = conflictQueue.find((item) => item.id === conflictId);
    if (!conflict) {
      return;
    }

    const res = await invoke("memory:conflict:resolve", {
      projectId,
      conflictId,
      chosenRuleId,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }

    const removedRuleIds = conflict.ruleIds.filter((id) => id !== chosenRuleId);
    setRules((prev) => {
      const replaced = prev.map((rule) =>
        rule.id === res.data.keptRule.id ? res.data.keptRule : rule,
      );
      return replaced.filter((rule) => !removedRuleIds.includes(rule.id));
    });
    setConflictQueue((prev) =>
      prev.map((item) => (item.id === res.data.item.id ? res.data.item : item)),
    );
    setConflictCount((prev) => Math.max(0, prev - 1));
  }

  const pendingConflicts = React.useMemo(
    () => conflictQueue.filter((item) => item.status === "pending"),
    [conflictQueue],
  );

  return {
    status,
    error,
    setError,
    activeScope,
    setActiveScope,
    settings,
    composerOpen,
    setComposerOpen,
    conflictCount,
    conflictQueue,
    pendingConflicts,
    conflictPanelOpen,
    setConflictPanelOpen,
    groupedRules,
    filteredRules,
    editingRuleId,
    editingText,
    setEditingText,
    setEditingRuleId,
    interactionCount,
    latestUpdateAt,
    distilling,
    draftRule,
    setDraftRule,
    draftCategory,
    setDraftCategory,
    handleConfirmRule,
    startEdit,
    handleSaveEdit,
    handleDeleteRule,
    handleCreateRule,
    handleDistill,
    handleLearningToggle,
    handleResolveConflict,
  };
}

type MemoryPanelState = ReturnType<typeof useMemoryState>;

function MemoryScopeTabs(props: {
  t: (key: string) => string;
  activeScope: PanelScope;
  setActiveScope: (scope: PanelScope) => void;
  hasProject: boolean;
}): JSX.Element {
  return (
    <div className="shrink-0 flex gap-1">
      <button
        type="button"
        data-testid="memory-scope-global"
        className={`text-xs px-2 py-1 rounded-[var(--radius-sm)] border ${
          props.activeScope === "global"
            ? "border-[var(--color-border-focus)] bg-[var(--color-bg-raised)]"
            : "border-[var(--color-border-default)]"
        }`}
        onClick={() => props.setActiveScope("global")}
      >
        {props.t("memory.panel.globalTab")}
      </button>
      <button
        type="button"
        data-testid="memory-scope-project"
        disabled={!props.hasProject}
        className={`text-xs px-2 py-1 rounded-[var(--radius-sm)] border ${
          props.activeScope === "project"
            ? "border-[var(--color-border-focus)] bg-[var(--color-bg-raised)]"
            : "border-[var(--color-border-default)]"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => props.setActiveScope("project")}
      >
        {props.t("memory.panel.projectTab")}
      </button>
    </div>
  );
}

function MemoryConflictSection(props: {
  t: (key: string, opts?: Record<string, unknown>) => string;
  state: MemoryPanelState;
}): JSX.Element | null {
  if (props.state.conflictCount <= 0) {
    return null;
  }

  return (
    <>
      <Card
        noPadding
        data-testid="memory-conflict-notice"
        className="shrink-0 px-2.5 py-2 border-[var(--color-warning)] text-[var(--color-warning)]"
      >
        <div className="flex items-center gap-2">
          <Text size="small" className="text-[var(--color-warning)]">
            {props.t("memory.panel.conflictsDetected", {
              count: props.state.conflictCount,
            })}
          </Text>
          <Button
            size="sm"
            variant="secondary"
            data-testid="memory-open-conflict-resolution"
            className="ml-auto"
            onClick={() => props.state.setConflictPanelOpen((open) => !open)}
          >
            {props.state.conflictPanelOpen
              ? props.t("memory.panel.hideConflictResolver")
              : props.t("memory.panel.openConflictResolver")}
          </Button>
        </div>
      </Card>

      {props.state.conflictPanelOpen &&
      props.state.pendingConflicts.length > 0 ? (
        <Card
          noPadding
          data-testid="memory-conflict-resolution-panel"
          className="shrink-0 p-2.5 border-[var(--color-warning)]"
        >
          <div className="flex flex-col gap-2">
            <Text size="small" color="muted">
              {props.t("memory.panel.conflictResolverTitle")}
            </Text>
            {props.state.pendingConflicts.map((conflict) => {
              const options = conflict.ruleIds
                .map((ruleId) =>
                  props.state.filteredRules.find((rule) => rule.id === ruleId),
                )
                .filter((rule): rule is SemanticRule => Boolean(rule));
              return (
                <div
                  key={conflict.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] p-2"
                  data-testid={`memory-conflict-${conflict.id}`}
                >
                  <Text size="tiny" color="muted">
                    {props.t("memory.panel.conflictResolverHint")}
                  </Text>
                  <div className="mt-2 flex flex-col gap-2">
                    {options.map((option) => (
                      <div
                        key={option.id}
                        className="rounded-[var(--radius-sm)] bg-[var(--color-bg-raised)] p-2"
                      >
                        <Text size="small">{option.rule}</Text>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2"
                          data-testid={`memory-resolve-${conflict.id}-${option.id}`}
                          onClick={() =>
                            void props.state.handleResolveConflict(
                              conflict.id,
                              option.id,
                            )
                          }
                        >
                          {props.t("memory.panel.keepThisRule")}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </>
  );
}

function MemoryRulesCard(props: {
  t: (key: string, opts?: Record<string, unknown>) => string;
  state: MemoryPanelState;
}): JSX.Element {
  return (
    <Card
      noPadding
      className="flex-1 min-h-0 overflow-auto p-2.5 bg-[var(--color-bg-surface)]"
    >
      {props.state.status === "loading" ? (
        <div className="h-full flex items-center justify-center">
          <Text size="small" color="muted">
            {props.t("memory.panel.loading")}
          </Text>
        </div>
      ) : props.state.filteredRules.length === 0 ? (
        <div className="h-full min-h-[180px] flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-bg-raised)] flex items-center justify-center text-[var(--color-fg-muted)]">
            {props.t("memory.panel.emptyIcon")}
          </div>
          <Text size="small" color="muted">
            {props.t("memory.panel.aiLearningHint")}
          </Text>
          <Button size="sm" onClick={() => props.state.setComposerOpen(true)}>
            {props.t("memory.panel.addRuleManually")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {props.state.groupedRules.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <Text size="small" color="muted">
                {props.t(group.labelKey)}
              </Text>
              {group.items.map((rule) => {
                const isEditing = props.state.editingRuleId === rule.id;
                return (
                  <Card
                    key={rule.id}
                    data-testid={`memory-rule-${rule.id}`}
                    noPadding
                    className="p-2.5 bg-[var(--color-bg-raised)] rounded-[var(--radius-sm)]"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <label
                              className="text-xs text-[var(--color-fg-muted)]"
                              htmlFor={`memory-edit-${rule.id}`}
                            >
                              {props.t("memory.panel.ruleText")}
                            </label>
                            <textarea
                              id={`memory-edit-${rule.id}`}
                              aria-label={props.t("memory.panel.ruleText")}
                              value={props.state.editingText}
                              onChange={(event) =>
                                props.state.setEditingText(event.target.value)
                              }
                              className="min-h-[70px] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  void props.state.handleSaveEdit(rule.id)
                                }
                              >
                                {props.t("memory.panel.saveChanges")}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  props.state.setEditingRuleId(null);
                                  props.state.setEditingText("");
                                }}
                              >
                                {props.t("memory.panel.cancel")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Text
                              size="small"
                              className="whitespace-pre-wrap break-words"
                            >
                              {rule.rule}
                            </Text>
                            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
                              <span>
                                {props.t("memory.panel.confidence", {
                                  value: Math.round(rule.confidence * 100),
                                })}
                              </span>
                              {rule.userConfirmed ? (
                                <span>{props.t("memory.panel.confirmed")}</span>
                              ) : null}
                              {rule.userModified ? (
                                <span>{props.t("memory.panel.modified")}</span>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>

                      {!isEditing ? (
                        <div className="shrink-0 flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={rule.userConfirmed}
                            onClick={() =>
                              void props.state.handleConfirmRule(rule.id)
                            }
                          >
                            {props.t("memory.panel.confirm")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => props.state.startEdit(rule)}
                          >
                            {props.t("memory.panel.modify")}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              void props.state.handleDeleteRule(rule.id)
                            }
                          >
                            {props.t("memory.panel.delete")}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

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

function MemoryComposer(props: {
  t: (key: string) => string;
  draftRule: string;
  setDraftRule: (v: string) => void;
  draftCategory: SemanticCategory;
  setDraftCategory: (v: SemanticCategory) => void;
  handleCreateRule: () => Promise<void>;
  onClose: () => void;
}): JSX.Element {
  return (
    <Card
      noPadding
      className="shrink-0 p-2.5 bg-[var(--color-bg-raised)] rounded-[var(--radius-sm)]"
    >
      <div className="flex flex-col gap-2">
        <label
          className="text-xs text-[var(--color-fg-muted)]"
          htmlFor="memory-rule-create-input"
        >
          {props.t("memory.panel.addRule")}
        </label>
        <textarea
          id="memory-rule-create-input"
          aria-label={props.t("memory.panel.addRule")}
          value={props.draftRule}
          onChange={(event) => props.setDraftRule(event.target.value)}
          className="min-h-[72px] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-sm"
        />
        <label
          className="text-xs text-[var(--color-fg-muted)]"
          htmlFor="memory-rule-category"
        >
          {props.t("memory.panel.category")}
        </label>
        <select
          id="memory-rule-category"
          value={props.draftCategory}
          onChange={(event) =>
            props.setDraftCategory(event.target.value as SemanticCategory)
          }
          className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 text-sm"
        >
          {CATEGORY_GROUPS.map((group) => (
            <option key={group.category} value={group.category}>
              {props.t(group.labelKey)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => void props.handleCreateRule()}>
            {props.t("memory.panel.saveRule")}
          </Button>
          <Button size="sm" variant="ghost" onClick={props.onClose}>
            {props.t("memory.panel.cancel")}
          </Button>
        </div>
      </div>
    </Card>
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
      className="h-full min-h-0 flex flex-col gap-3 p-3 bg-[var(--color-bg-surface)]"
    >
      <header className="shrink-0 flex items-center gap-2">
        <Text size="small" color="muted">
          {t("memory.panel.title")}
        </Text>
        <Text size="tiny" color="muted" className="ml-auto">
          {state.status}
        </Text>
      </header>

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
        <Card noPadding className="shrink-0 p-2.5">
          <div className="flex items-center gap-2">
            <Text data-testid="memory-error-code" size="code" color="muted">
              {getHumanErrorMessage(state.error)}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => state.setError(null)}
            >
              {t("memory.panel.dismissError")}
            </Button>
          </div>
        </Card>
      ) : null}

      <MemoryRulesCard t={t} state={state} />

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
    </section>
  );
}

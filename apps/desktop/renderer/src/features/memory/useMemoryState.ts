import React from "react";
import type { IpcError } from "@shared/types/ipc-generated";
import { invoke } from "../../lib/ipcClient";
import type {
  PanelScope,
  SemanticCategory,
  SemanticConflict,
  SemanticRule,
  MemorySettings,
} from "./memoryPanelTypes";
import { CATEGORY_GROUPS, normalizePanelLoadError } from "./memoryPanelTypes";

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

export function useMemoryState(
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
      if (!listRes.ok) { setStatus("error"); setError(listRes.error); return; }
      if (!settingsRes.ok) { setStatus("error"); setError(settingsRes.error); return; }
      setRules(listRes.data.items);
      setConflictQueue(listRes.data.conflictQueue);
      setConflictCount(
        listRes.data.conflictQueue.filter((c) => c.status === "pending").length,
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
      for (const id of rule.supportingEpisodes) ids.add(id);
      for (const id of rule.contradictingEpisodes) ids.add(id);
    }
    return ids.size;
  }, [rules]);

  const latestUpdateAt = React.useMemo(() => {
    if (rules.length === 0) return null;
    return Math.max(...rules.map((rule) => rule.updatedAt));
  }, [rules]);

  async function handleConfirmRule(ruleId: string): Promise<void> {
    if (!projectId) return;
    const res = await invoke("memory:semantic:update", {
      projectId, ruleId, patch: { userConfirmed: true },
    });
    if (!res.ok) { setError(res.error); return; }
    setRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? res.data.item : rule)),
    );
  }

  function startEdit(rule: SemanticRule): void {
    setEditingRuleId(rule.id);
    setEditingText(rule.rule);
  }

  async function handleSaveEdit(ruleId: string): Promise<void> {
    if (!projectId) return;
    const normalized = editingText.trim();
    if (normalized.length === 0) {
      setError({
        code: "INVALID_ARGUMENT",
        message: t("memory.panel.ruleTextRequired"),
      });
      return;
    }
    const res = await invoke("memory:semantic:update", {
      projectId, ruleId, patch: { rule: normalized, userModified: true },
    });
    if (!res.ok) { setError(res.error); return; }
    setRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? res.data.item : rule)),
    );
    setEditingRuleId(null);
    setEditingText("");
  }

  async function handleDeleteRule(ruleId: string): Promise<void> {
    if (!projectId) return;
    const confirmed = window.confirm(t("memory.panel.confirmDeleteRule"));
    if (!confirmed) return;
    const res = await invoke("memory:semantic:delete", { projectId, ruleId });
    if (!res.ok) { setError(res.error); return; }
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }

  async function handleCreateRule(): Promise<void> {
    if (!projectId) return;
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
    if (!res.ok) { setError(res.error); return; }
    setRules((prev) => [res.data.item, ...prev]);
    setComposerOpen(false);
    setDraftRule("");
    setDraftCategory("style");
  }

  async function handleDistill(): Promise<void> {
    if (!projectId) return;
    setDistilling(true);
    const res = await invoke("memory:semantic:distill", {
      projectId, trigger: "manual",
    });
    setDistilling(false);
    if (!res.ok) { setError(res.error); return; }
    await loadPanelData();
  }

  async function handleLearningToggle(): Promise<void> {
    if (!settings) return;
    const res = await invoke("memory:settings:update", {
      patch: { preferenceLearningEnabled: !settings.preferenceLearningEnabled },
    });
    if (!res.ok) { setError(res.error); return; }
    setSettings(res.data);
  }

  async function handleResolveConflict(
    conflictId: string,
    chosenRuleId: string,
  ): Promise<void> {
    if (!projectId) return;
    const conflict = conflictQueue.find((item) => item.id === conflictId);
    if (!conflict) return;
    const res = await invoke("memory:conflict:resolve", {
      projectId, conflictId, chosenRuleId,
    });
    if (!res.ok) { setError(res.error); return; }
    const removedRuleIds = conflict.ruleIds.filter((id) => id !== chosenRuleId);
    setRules((prev) => {
      const replaced = prev.map((rule) =>
        rule.id === res.data.keptRule.id ? res.data.keptRule : rule,
      );
      return replaced.filter((rule) => !removedRuleIds.includes(rule.id));
    });
    setConflictQueue((prev) =>
      prev.map((item) =>
        item.id === res.data.item.id ? res.data.item : item,
      ),
    );
    setConflictCount((prev) => Math.max(0, prev - 1));
  }

  const pendingConflicts = React.useMemo(
    () => conflictQueue.filter((item) => item.status === "pending"),
    [conflictQueue],
  );

  return {
    status, error, setError,
    activeScope, setActiveScope, settings,
    composerOpen, setComposerOpen,
    conflictCount, conflictQueue, pendingConflicts,
    conflictPanelOpen, setConflictPanelOpen,
    groupedRules, filteredRules,
    editingRuleId, editingText, setEditingText, setEditingRuleId,
    interactionCount, latestUpdateAt, distilling,
    draftRule, setDraftRule, draftCategory, setDraftCategory,
    handleConfirmRule, startEdit, handleSaveEdit,
    handleDeleteRule, handleCreateRule,
    handleDistill, handleLearningToggle, handleResolveConflict,
  };
}

export type MemoryPanelState = ReturnType<typeof useMemoryState>;

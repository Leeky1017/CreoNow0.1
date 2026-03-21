import React from "react";
import { useTranslation } from "react-i18next";

import {
  useLayoutStore,
} from "../../stores/layoutStore";
import {
  useProjectStore,
} from "../../stores/projectStore";
import { useFileStore } from "../../stores/fileStore";
import { useEditorStore } from "../../stores/editorStore";
import { useVersionPreferencesStore } from "../../stores/versionPreferencesStore";
import {
  usePanelVisibilityActions,
} from "./PanelOrchestrator";
import {
  useVersionCompare,
} from "../../features/version-history/useVersionCompare";
import {
  useConfirmDialog,
} from "../../hooks/useConfirmDialog";
import type { SettingsTab } from "../../features/settings-dialog/SettingsDialog";
import type {
  CommandPaletteLayoutActions,
  CommandPaletteDialogActions,
  CommandPaletteDocumentActions,
} from "../../features/commandPalette/CommandPalette";
import { runFireAndForget } from "../../lib/fireAndForget";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { useAppShellAiCompare } from "./useAppShellAiCompare";

export type AppShellLayoutState = ReturnType<typeof useAppShellLayout>;

/**
 * useAppShellLayout – core layout/state management for AppShell.
 *
 * Manages panel visibility, dialog state, project bootstrapping,
 * version history, and exposes layout actions.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAppShellLayout() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.current);
  const currentProjectId = currentProject?.projectId ?? null;
  const projectItems = useProjectStore((s) => s.items);
  const bootstrapStatus = useProjectStore((s) => s.bootstrapStatus);
  const bootstrapProjects = useProjectStore((s) => s.bootstrap);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const bootstrapFiles = useFileStore((s) => s.bootstrapForProject);
  const bootstrapEditor = useEditorStore((s) => s.bootstrapForProject);
  const compareMode = useEditorStore((s) => s.compareMode);
  const compareVersionId = useEditorStore((s) => s.compareVersionId);
  const documentId = useEditorStore((s) => s.documentId);
  const panelCollapsed = useLayoutStore((s) => s.panelCollapsed);
  const zenMode = useLayoutStore((s) => s.zenMode);
  const activeLeftPanel = useLayoutStore((s) => s.activeLeftPanel);
  const dialogType = useLayoutStore((s) => s.dialogType);
  const spotlightOpen = useLayoutStore((s) => s.spotlightOpen);
  const panelVisibility = usePanelVisibilityActions();
  const setZenMode = useLayoutStore((s) => s.setZenMode);
  const setDialogType = useLayoutStore((s) => s.setDialogType);
  const setSpotlightOpen = useLayoutStore((s) => s.setSpotlightOpen);
  const setActiveRightPanel = useLayoutStore((s) => s.setActiveRightPanel);
  const activeRightPanel = useLayoutStore((s) => s.activeRightPanel);
  const setCompareMode = useEditorStore((s) => s.setCompareMode);
  const showAiMarks = useVersionPreferencesStore((s) => s.showAiMarks);
  const createDocument = useFileStore((s) => s.createAndSetCurrent);
  const setCurrentDocument = useFileStore((s) => s.setCurrent);
  const openEditorDocument = useEditorStore((s) => s.openDocument);

  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] =
    React.useState<SettingsTab>("general");
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] =
    React.useState(false);

  const { compareState, closeCompare } = useVersionCompare();
  const { confirm, dialogProps } = useConfirmDialog();
  const aiCompare = useAppShellAiCompare();

  React.useEffect(() => {
    if (bootstrapStatus === "idle") {
      runFireAndForget(() => bootstrapProjects(), {
        label: "appShell.bootstrapProjects",
      });
    }
  }, [bootstrapProjects, bootstrapStatus]);

  React.useEffect(() => {
    if (!currentProjectId) return;
    runFireAndForget(async () => {
      await bootstrapFiles(currentProjectId);
      await bootstrapEditor(currentProjectId);
    });
  }, [bootstrapEditor, bootstrapFiles, currentProjectId]);

  const openVersionHistoryPanel = React.useCallback(() => {
    setDialogType("versionHistory");
    setSpotlightOpen(false);
  }, [setDialogType, setSpotlightOpen]);

  const toggleSidebarVisibility = React.useCallback(() => {
    panelVisibility.toggleSidebar();
  }, [panelVisibility]);

  const toggleAiPanel = React.useCallback(() => {
    if (panelCollapsed) {
      setActiveRightPanel("ai");
      panelVisibility.expandRightPanel();
      return;
    }
    if (activeRightPanel === "ai") {
      panelVisibility.collapseRightPanel();
      return;
    }
    setActiveRightPanel("ai");
  }, [panelCollapsed, activeRightPanel, panelVisibility, setActiveRightPanel]);

  const openVersionHistoryForDocument = React.useCallback(
    (docId: string) => {
      if (!currentProjectId) {
        openVersionHistoryPanel();
        return;
      }
      runFireAndForget(async () => {
        await setCurrentDocument({
          projectId: currentProjectId,
          documentId: docId,
        });
        await openEditorDocument({
          projectId: currentProjectId,
          documentId: docId,
        });
      });
      openVersionHistoryPanel();
    },
    [currentProjectId, openEditorDocument, openVersionHistoryPanel, setCurrentDocument],
  );

  const handleSwitchProject = React.useCallback(
    async (projectId: string) => {
      await setCurrentProject(projectId);
    },
    [setCurrentProject],
  );

  const openSettingsDialog = React.useCallback(
    (tab: SettingsTab = "general") => {
      setSettingsDefaultTab(tab);
      setSettingsDialogOpen(true);
    },
    [],
  );

  const layoutActions = React.useMemo<CommandPaletteLayoutActions>(
    () => ({
      onToggleSidebar: toggleSidebarVisibility,
      onToggleRightPanel: toggleAiPanel,
      onToggleZenMode: () => setZenMode(!zenMode),
      onOpenVersionHistory: openVersionHistoryPanel,
    }),
    [openVersionHistoryPanel, setZenMode, toggleAiPanel, toggleSidebarVisibility, zenMode],
  );

  const dialogActionCallbacks = React.useMemo<CommandPaletteDialogActions>(
    () => ({
      onOpenSettings: () => openSettingsDialog("general"),
      onOpenExport: () => setExportDialogOpen(true),
      onOpenCreateProject: () => setCreateProjectDialogOpen(true),
    }),
    [openSettingsDialog],
  );

  const documentActionCallbacks = React.useMemo<CommandPaletteDocumentActions>(
    () => ({
      onCreateDocument: async () => {
        if (!currentProjectId) throw new Error("No project selected");
        const res = await createDocument({ projectId: currentProjectId });
        if (!res.ok) throw new Error(getHumanErrorMessage(res.error));
      },
    }),
    [createDocument, currentProjectId],
  );

  return {
    t,
    currentProject,
    currentProjectId,
    projectItems,
    compareMode,
    compareVersionId,
    documentId,
    showAiMarks,
    panelCollapsed,
    zenMode,
    activeLeftPanel,
    dialogType,
    spotlightOpen,
    setSpotlightOpen,
    activeRightPanel,
    setActiveRightPanel,
    setZenMode,
    setDialogType,
    setCompareMode,
    compareState,
    closeCompare,
    confirm,
    dialogProps,
    bootstrapEditor,
    createDocument,
    ...aiCompare,
    toggleSidebarVisibility,
    toggleAiPanel,
    openVersionHistoryPanel,
    openVersionHistoryForDocument,
    handleSwitchProject,
    openSettingsDialog,
    settingsDialogOpen,
    setSettingsDialogOpen,
    settingsDefaultTab,
    exportDialogOpen,
    setExportDialogOpen,
    createProjectDialogOpen,
    setCreateProjectDialogOpen,
    layoutActions,
    dialogActionCallbacks,
    documentActionCallbacks,
  };
}

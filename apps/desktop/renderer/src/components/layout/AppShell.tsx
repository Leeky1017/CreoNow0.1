import React from "react";
import { useTranslation } from "react-i18next";

import { LAYOUT_SHORTCUTS } from "../../config/shortcuts";
import {
  useLayoutStore,
  LAYOUT_DEFAULTS,
  type DialogType,
} from "../../stores/layoutStore";
import { IconBar } from "./IconBar";
import { LayoutShell } from "./LayoutShell";
import { LeftPanelDialogShell } from "./LeftPanelDialogShell";
import { NavigationController } from "./NavigationController";
import {
  PanelOrchestrator,
  usePanelVisibilityActions,
} from "./PanelOrchestrator";
import { RightPanel } from "./RightPanel";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { RegionErrorBoundary } from "../patterns/RegionErrorBoundary";
import { CharacterCardListContainer } from "../../features/character/CharacterCardListContainer";
import { CommandPalette } from "../../features/commandPalette/CommandPalette";
import type {
  CommandItem,
  CommandPaletteLayoutActions,
  CommandPaletteDialogActions,
  CommandPaletteDocumentActions,
} from "../../features/commandPalette/CommandPalette";
import { KnowledgeGraphPanel } from "../../features/kg/KnowledgeGraphPanel";
import { MemoryPanel } from "../../features/memory/MemoryPanel";
import {
  readRecentCommandIds,
  recordRecentCommandId,
} from "../../features/commandPalette/recentItems";
import { DashboardPage } from "../../features/dashboard";
import { DiffViewPanel } from "../../features/diff/DiffViewPanel";
import { EditorPane } from "../../features/editor/EditorPane";
import {
  SettingsDialog,
  type SettingsTab,
} from "../../features/settings-dialog/SettingsDialog";
import { ExportDialog } from "../../features/export/ExportDialog";
import { CreateProjectDialog } from "../../features/projects/CreateProjectDialog";
import { SearchPanel } from "../../features/search/SearchPanel";
import { VersionHistoryContainer } from "../../features/version-history/VersionHistoryContainer";
import { ZenMode } from "../../features/zen-mode/ZenMode";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import {
  useConfirmDialog,
  type UseConfirmDialogReturn,
} from "../../hooks/useConfirmDialog";
import { RESTORE_VERSION_CONFIRM_COPY } from "../../features/version-history/restoreConfirmCopy";
import {
  useVersionCompare,
  type CompareState,
} from "../../features/version-history/useVersionCompare";
import {
  useProjectStore,
  type ProjectInfo,
  type ProjectListItem,
} from "../../stores/projectStore";
import { useFileStore } from "../../stores/fileStore";
import { useEditorStore } from "../../stores/editorStore";
import { useAiStore, type AiProposal } from "../../stores/aiStore";
import { useVersionPreferencesStore } from "../../stores/versionPreferencesStore";
import { applySelection } from "../../features/ai/applySelection";
import {
  applyHunkDecisions,
  computeDiffHunks,
  unifiedDiff,
  type DiffHunkDecision,
} from "../../lib/diff/unifiedDiff";
import { runFireAndForget } from "../../lib/fireAndForget";
import { invoke } from "../../lib/ipcClient";
import { extractZenModeContent, getModKey } from "./appShellLayoutHelpers";
import "../../i18n";

type FileItem = {
  documentId: string;
  title: string;
  type: string;
};

let hasWarnedInvalidZenContent = false;

function warnInvalidZenContent(error: unknown): void {
  if (hasWarnedInvalidZenContent) {
    return;
  }
  hasWarnedInvalidZenContent = true;
  console.warn("[A2-L-001] Failed to parse ZenMode content JSON", error);
}

function assertNeverDialogType(value: never): never {
  throw new Error(`Unhandled dialog type: ${String(value)}`);
}

/**
 * ZenModeOverlay - Connects ZenMode to editor state.
 *
 * Why: Separates overlay wiring from AppShell complexity; pulls content from
 * editorStore and autosaveStatus for the status bar.
 */
function ZenModeOverlay(props: {
  open: boolean;
  onExit: () => void;
}): JSX.Element | null {
  const { t } = useTranslation();
  const editor = useEditorStore((s) => s.editor);
  const autosaveStatus = useEditorStore((s) => s.autosaveStatus);
  const documentContentJson = useEditorStore((s) => s.documentContentJson);

  // Get current time for status bar
  const [currentTime, setCurrentTime] = React.useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );

  React.useEffect(() => {
    if (!props.open) return;

    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [props.open]);

  // Extract content from editor or fallback to stored JSON
  const content = React.useMemo(() => {
    if (editor) {
      const json = JSON.stringify(editor.getJSON());
      return extractZenModeContent(json, warnInvalidZenContent);
    }
    return extractZenModeContent(documentContentJson, warnInvalidZenContent);
  }, [editor, documentContentJson]);

  // Map autosave status to display text
  const saveStatus = React.useMemo(() => {
    switch (autosaveStatus) {
      case "saving":
        return t("workbench.appShell.savingStatus");
      case "saved":
        return t("workbench.appShell.savedStatus");
      case "error":
        return t("workbench.appShell.saveFailedStatus");
      default:
        return t("workbench.appShell.savedStatus");
    }
  }, [autosaveStatus, t]);

  // Calculate read time (average 200 words per minute)
  const readTimeMinutes = Math.max(1, Math.ceil(content.wordCount / 200));

  return (
    <ZenMode
      open={props.open}
      onExit={props.onExit}
      content={{
        title: content.title,
        paragraphs: content.paragraphs,
        showCursor: true,
      }}
      stats={{
        wordCount: content.wordCount,
        saveStatus,
        readTimeMinutes,
      }}
      currentTime={currentTime}
    />
  );
}

/**
 * Build the static command palette entries (non-file items).
 */
export function buildCommandEntries(args: {
  modKey: string;
  t: ReturnType<typeof useTranslation>["t"];
  currentProjectId: string | null;
  zenMode: boolean;
  openSettingsDialog: (tab: SettingsTab) => void;
  setExportDialogOpen: (open: boolean) => void;
  toggleSidebarVisibility: () => void;
  toggleAiPanel: () => void;
  setZenMode: (v: boolean) => void;
  createDocument: (args: { projectId: string }) => Promise<{ ok: boolean }>;
  openVersionHistoryPanel: () => void;
  setCreateProjectDialogOpen: (open: boolean) => void;
  openGlobalSearch: () => void;
  close: () => void;
}): CommandItem[] {
  return [
    {
      id: "open-settings",
      label: args.t("workbench.appShell.command.openSettings"),
      shortcut: `${args.modKey},`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.openSettingsDialog("general");
        args.close();
      },
    },
    {
      id: "export",
      label: args.t("workbench.appShell.command.export"),
      group: "command",
      category: "command",
      onSelect: () => {
        args.setExportDialogOpen(true);
        args.close();
      },
    },
    {
      id: "toggle-sidebar",
      label: args.t("workbench.appShell.command.toggleSidebar"),
      shortcut: `${args.modKey}\\`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.toggleSidebarVisibility();
        args.close();
      },
    },
    {
      id: "toggle-right-panel",
      label: args.t("workbench.appShell.command.toggleRightPanel"),
      shortcut: `${args.modKey}L`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.toggleAiPanel();
        args.close();
      },
    },
    {
      id: "toggle-zen-mode",
      label: args.t("workbench.appShell.command.toggleZenMode"),
      shortcut: "F11",
      group: "command",
      category: "command",
      onSelect: () => {
        args.setZenMode(!args.zenMode);
        args.close();
      },
    },
    {
      id: "open-global-search",
      label: args.t("search.shortcut.label"),
      shortcut: LAYOUT_SHORTCUTS.globalSearch.display(),
      group: "command",
      category: "command",
      onSelect: () => {
        args.openGlobalSearch();
        args.close();
      },
    },
    {
      id: "create-new-document",
      label: args.t("workbench.appShell.command.createNewDocument"),
      shortcut: `${args.modKey}N`,
      group: "command",
      category: "command",
      onSelect: async () => {
        if (!args.currentProjectId) return;
        await args.createDocument({ projectId: args.currentProjectId });
        args.close();
      },
    },
    {
      id: "open-version-history",
      label: args.t("workbench.appShell.command.openVersionHistory"),
      group: "command",
      category: "command",
      onSelect: () => {
        args.openVersionHistoryPanel();
        args.close();
      },
    },
    {
      id: "create-new-project",
      label: args.t("workbench.appShell.command.createNewProject"),
      shortcut: `${args.modKey}Shift+N`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.setCreateProjectDialogOpen(true);
        args.close();
      },
    },
    {
      id: "open-folder",
      label: args.t("workbench.appShell.command.openFolder"),
      group: "command",
      category: "command",
      onSelect: async () => {
        await invoke("dialog:folder:open", {});
        args.close();
      },
    },
  ];
}

/**
 * Build file entries for the command palette.
 */
function buildFileEntries(args: {
  fileItems: FileItem[];
  currentProjectId: string | null;
  setCurrentDocument: (a: {
    projectId: string;
    documentId: string;
  }) => Promise<{ ok: boolean }>;
  openEditorDocument: (a: {
    projectId: string;
    documentId: string;
  }) => Promise<void>;
  close: () => void;
}): CommandItem[] {
  const safeFileItems = Array.isArray(args.fileItems) ? args.fileItems : [];
  return [...safeFileItems]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map<CommandItem>((item) => ({
      id: `file-${item.documentId}`,
      label: item.title,
      subtext: item.type,
      icon: (
        <span
          aria-hidden="true"
          className="inline-flex h-4 w-4 items-center justify-center text-[9px] font-semibold text-[var(--color-fg-muted)]"
        >
          {item.type[0]?.toUpperCase() ?? "D"}
        </span>
      ),
      group: "file",
      category: "file",
      onSelect: async () => {
        if (!args.currentProjectId) return;
        const res = await args.setCurrentDocument({
          projectId: args.currentProjectId,
          documentId: item.documentId,
        });
        if (!res.ok) return;
        await args.openEditorDocument({
          projectId: args.currentProjectId,
          documentId: item.documentId,
        });
        args.close();
      },
    }));
}

/**
 * AppShellOverlays – all overlay dialogs/panels rendered by AppShell.
 */
function AppShellOverlays(props: {
  spotlightOpen: boolean;
  searchFocusNonce: number;
  currentProjectId: string | null;
  onCloseSpotlight: () => void;
  dialogType: DialogType | null;
  onCloseDialog: () => void;
  dialogTitleResolver: (d: DialogType) => string;
  dialogContentRenderer: (d: DialogType) => JSX.Element;
  commandPaletteKey: number;
  commandPaletteOpen: boolean;
  onCommandPaletteOpenChange: (open: boolean) => void;
  commandPaletteCommands: CommandItem[];
  layoutActions: CommandPaletteLayoutActions;
  dialogActions: CommandPaletteDialogActions;
  documentActions: CommandPaletteDocumentActions;
  settingsDialogOpen: boolean;
  onSettingsDialogOpenChange: (open: boolean) => void;
  settingsDefaultTab: SettingsTab;
  exportDialogOpen: boolean;
  onExportDialogOpenChange: (open: boolean) => void;
  documentId: string | null;
  createProjectDialogOpen: boolean;
  onCreateProjectDialogOpenChange: (open: boolean) => void;
  zenMode: boolean;
  onExitZenMode: () => void;
  compareMode: boolean;
  dialogProps: ReturnType<typeof useConfirmDialog>["dialogProps"];
  t: ReturnType<typeof useTranslation>["t"];
}): JSX.Element {
  return (
    <>
      {props.spotlightOpen ? (
        <div data-testid="leftpanel-spotlight-search">
          <SearchPanel
            projectId={props.currentProjectId ?? "__no_project__"}
            open={true}
            focusNonce={props.searchFocusNonce}
            onClose={props.onCloseSpotlight}
          />
        </div>
      ) : null}

      {props.dialogType ? (
        <LeftPanelDialogShell
          open={true}
          title={props.dialogTitleResolver(props.dialogType)}
          testId={`leftpanel-dialog-${props.dialogType}`}
          onOpenChange={(open) => {
            if (!open) props.onCloseDialog();
          }}
        >
          {props.dialogContentRenderer(props.dialogType)}
        </LeftPanelDialogShell>
      ) : null}

      <CommandPalette
        key={props.commandPaletteKey}
        open={props.commandPaletteOpen}
        onOpenChange={props.onCommandPaletteOpenChange}
        commands={props.commandPaletteCommands}
        layoutActions={props.layoutActions}
        dialogActions={props.dialogActions}
        documentActions={props.documentActions}
      />

      <SettingsDialog
        open={props.settingsDialogOpen}
        onOpenChange={props.onSettingsDialogOpenChange}
        defaultTab={props.settingsDefaultTab}
      />

      <ExportDialog
        open={props.exportDialogOpen}
        onOpenChange={props.onExportDialogOpenChange}
        projectId={props.currentProjectId}
        documentId={props.documentId}
        documentTitle={props.t("workbench.export.currentDocument")}
      />

      <CreateProjectDialog
        open={props.createProjectDialogOpen}
        onOpenChange={props.onCreateProjectDialogOpenChange}
      />

      <ZenModeOverlay open={props.zenMode} onExit={props.onExitZenMode} />
      {!props.compareMode ? <SystemDialog {...props.dialogProps} /> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// useAppShellAiCompare – AI compare state, memos, effects and callbacks
// ---------------------------------------------------------------------------
function useAppShellAiCompare() {
  const aiProposal = useAiStore((s) => s.proposal);
  const setAiProposal = useAiStore((s) => s.setProposal);
  const setAiSelectionSnapshot = useAiStore((s) => s.setSelectionSnapshot);
  const persistAiApply = useAiStore((s) => s.persistAiApply);
  const setAiError = useAiStore((s) => s.setError);
  const logAiApplyConflict = useAiStore((s) => s.logAiApplyConflict);
  const editor = useEditorStore((s) => s.editor);
  const documentId = useEditorStore((s) => s.documentId);
  const setCompareMode = useEditorStore((s) => s.setCompareMode);
  const compareMode = useEditorStore((s) => s.compareMode);
  const compareVersionId = useEditorStore((s) => s.compareVersionId);
  const currentProjectId = useProjectStore((s) => s.current)?.projectId ?? null;

  const lastMountedEditorRef = React.useRef<typeof editor>(null);
  const [aiHunkDecisions, setAiHunkDecisions] = React.useState<
    DiffHunkDecision[]
  >([]);

  const aiDiffText = React.useMemo(() => {
    if (!aiProposal) return "";
    return unifiedDiff({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
    });
  }, [aiProposal]);

  const aiHunks = React.useMemo(() => {
    if (!aiProposal) return [];
    return computeDiffHunks({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
    });
  }, [aiProposal]);

  React.useEffect(() => {
    if (editor) lastMountedEditorRef.current = editor;
  }, [editor]);

  React.useEffect(() => {
    if (!compareMode || compareVersionId) {
      if (aiHunkDecisions.length > 0) setAiHunkDecisions([]);
      return;
    }
    if (!aiProposal) {
      setCompareMode(false);
      return;
    }
    setAiHunkDecisions((prev) =>
      prev.length === aiHunks.length
        ? prev
        : Array.from({ length: aiHunks.length }, () => "pending" as const),
    );
  }, [
    aiHunkDecisions.length,
    aiHunks.length,
    aiProposal,
    compareMode,
    compareVersionId,
    setCompareMode,
  ]);

  const handleRejectAiSuggestion = React.useCallback(() => {
    setAiProposal(null);
    setAiSelectionSnapshot(null);
    setAiHunkDecisions([]);
    setCompareMode(false);
  }, [setAiProposal, setAiSelectionSnapshot, setCompareMode]);

  const handleAcceptAiSuggestion = React.useCallback(async () => {
    const effectiveEditor = editor ?? lastMountedEditorRef.current;
    if (!effectiveEditor || !documentId || !currentProjectId || !aiProposal)
      return;

    const normalizedDecisions = aiHunks.map((_, idx) => {
      const decision = aiHunkDecisions[idx] ?? "pending";
      return decision === "rejected" ? "rejected" : "accepted";
    });
    const replacementText = applyHunkDecisions({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
      decisions: normalizedDecisions,
    });

    const applied = applySelection({
      editor: effectiveEditor,
      selectionRef: aiProposal.selectionRef,
      replacementText,
    });
    if (!applied.ok) {
      setAiError(applied.error);
      if (applied.error.code === "CONFLICT") {
        await logAiApplyConflict({ documentId, runId: aiProposal.runId });
      }
      return;
    }

    await persistAiApply({
      projectId: currentProjectId,
      documentId,
      contentJson: JSON.stringify(effectiveEditor.getJSON()),
      runId: aiProposal.runId,
    });
    setCompareMode(false);
    setAiHunkDecisions([]);
  }, [
    aiHunkDecisions,
    aiHunks,
    aiProposal,
    currentProjectId,
    documentId,
    editor,
    logAiApplyConflict,
    persistAiApply,
    setAiError,
    setCompareMode,
  ]);

  return {
    aiProposal,
    aiDiffText,
    aiHunks,
    aiHunkDecisions,
    setAiHunkDecisions,
    handleRejectAiSuggestion,
    handleAcceptAiSuggestion,
  };
}

function useGlobalSearchFocusController(args: {
  setSpotlightOpen: (open: boolean) => void;
}) {
  const { setSpotlightOpen } = args;
  const [searchFocusNonce, setSearchFocusNonce] = React.useState(0);
  const [searchRestoreTarget, setSearchRestoreTarget] =
    React.useState<HTMLElement | null>(null);

  const openGlobalSearch = React.useCallback(() => {
    const activeElement =
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSearchRestoreTarget(activeElement);
    setSpotlightOpen(true);
    setSearchFocusNonce((value) => value + 1);
  }, [setSpotlightOpen]);

  const closeGlobalSearch = React.useCallback(() => {
    setSpotlightOpen(false);
    if (searchRestoreTarget) {
      queueMicrotask(() => {
        searchRestoreTarget.focus();
      });
    }
  }, [searchRestoreTarget, setSpotlightOpen]);

  return {
    searchFocusNonce,
    openGlobalSearch,
    closeGlobalSearch,
  };
}

// ---------------------------------------------------------------------------
// useAppShellController – all state, effects, callbacks and memos
// ---------------------------------------------------------------------------
function useAppShellController() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.current);
  const currentProjectId = currentProject?.projectId ?? null;
  const projectItems = useProjectStore((s) => s.items);
  const bootstrapStatus = useProjectStore((s) => s.bootstrapStatus);
  const bootstrapProjects = useProjectStore((s) => s.bootstrap);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const bootstrapFiles = useFileStore((s) => s.bootstrapForProject);
  const fileItems = useFileStore((s) =>
    Array.isArray(s.items) ? s.items : [],
  );
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

  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [commandPaletteKey, setCommandPaletteKey] = React.useState(0);
  const [recentCommandIds, setRecentCommandIds] = React.useState<string[]>(() =>
    readRecentCommandIds(),
  );
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] =
    React.useState<SettingsTab>("general");
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] =
    React.useState(false);

  const { compareState, closeCompare } = useVersionCompare();
  const { confirm, dialogProps } = useConfirmDialog();
  const aiCompare = useAppShellAiCompare();
  const { searchFocusNonce, openGlobalSearch, closeGlobalSearch } =
    useGlobalSearchFocusController({ setSpotlightOpen });

  // Bootstrap projects on mount
  React.useEffect(() => {
    if (bootstrapStatus === "idle") {
      runFireAndForget(() => bootstrapProjects(), {
        label: "appShell.bootstrapProjects",
      });
    }
  }, [bootstrapProjects, bootstrapStatus]);

  // Bootstrap files/editor when a project is selected
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
    [
      currentProjectId,
      openEditorDocument,
      openVersionHistoryPanel,
      setCurrentDocument,
    ],
  );

  const handleSwitchProject = React.useCallback(
    async (projectId: string) => {
      await setCurrentProject(projectId);
    },
    [setCurrentProject],
  );

  const openCommandPalette = React.useCallback(() => {
    setRecentCommandIds(readRecentCommandIds());
    setCommandPaletteKey((k) => k + 1);
    setCommandPaletteOpen(true);
  }, []);

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
    [
      openVersionHistoryPanel,
      setZenMode,
      toggleAiPanel,
      toggleSidebarVisibility,
      zenMode,
    ],
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
        if (!res.ok) throw new Error(`${res.error.code}: ${res.error.message}`);
      },
    }),
    [createDocument, currentProjectId],
  );

  const refreshRecentCommands = React.useCallback(() => {
    setRecentCommandIds(readRecentCommandIds());
  }, []);

  const withRecentTracking = React.useCallback(
    (command: CommandItem): CommandItem => ({
      ...command,
      onSelect: async () => {
        await command.onSelect();
        recordRecentCommandId(command.id);
        refreshRecentCommands();
      },
    }),
    [refreshRecentCommands],
  );

  const modKey = React.useMemo(() => getModKey(), []);
  const commandPaletteCommands = React.useMemo<CommandItem[]>(() => {
    const close = () => setCommandPaletteOpen(false);
    const commandEntries = buildCommandEntries({
      modKey,
      t,
      currentProjectId,
      zenMode,
      openSettingsDialog,
      setExportDialogOpen,
      toggleSidebarVisibility,
      toggleAiPanel,
      setZenMode,
      createDocument: async (a) => {
        const r = await createDocument(a);
        return { ok: r.ok };
      },
      openVersionHistoryPanel,
      setCreateProjectDialogOpen,
      openGlobalSearch,
      close,
    });
    const fileEntries = buildFileEntries({
      fileItems,
      currentProjectId,
      setCurrentDocument: async (a) => {
        const r = await setCurrentDocument(a);
        return { ok: r.ok };
      },
      openEditorDocument,
      close,
    });
    const trackedCommands = [
      ...commandEntries.map(withRecentTracking),
      ...fileEntries.map(withRecentTracking),
    ];
    const trackedById = new Map(trackedCommands.map((item) => [item.id, item]));
    const recentEntries = recentCommandIds
      .map((id) => trackedById.get(id))
      .filter((item): item is CommandItem => Boolean(item))
      .slice(0, 5)
      .map((item) => ({
        ...item,
        group: "recent",
        category: "recent" as const,
      }));
    return [
      ...recentEntries,
      ...fileEntries.map(withRecentTracking),
      ...commandEntries.map(withRecentTracking),
    ];
  }, [
    createDocument,
    currentProjectId,
    fileItems,
    modKey,
    openEditorDocument,
    openSettingsDialog,
    openVersionHistoryPanel,
    recentCommandIds,
    setCurrentDocument,
    setZenMode,
    t,
    toggleAiPanel,
    toggleSidebarVisibility,
    withRecentTracking,
    zenMode,
    openGlobalSearch,
  ]);

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
    openCommandPalette,
    openSettingsDialog,
    openGlobalSearch,
    closeGlobalSearch,
    searchFocusNonce,
    commandPaletteKey,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandPaletteCommands,
    layoutActions,
    dialogActionCallbacks,
    documentActionCallbacks,
    settingsDialogOpen,
    setSettingsDialogOpen,
    settingsDefaultTab,
    exportDialogOpen,
    setExportDialogOpen,
    createProjectDialogOpen,
    setCreateProjectDialogOpen,
  };
}

// ---------------------------------------------------------------------------
// AppShellMainContent – renders dashboard, diff, or editor pane
// ---------------------------------------------------------------------------
function AppShellMainContent(props: {
  currentProject: ProjectInfo | null;
  projectItems: ProjectListItem[];
  compareMode: boolean;
  compareVersionId: string | null;
  aiProposal: AiProposal | null;
  aiDiffText: string;
  handleRejectAiSuggestion: () => void;
  handleAcceptAiSuggestion: () => Promise<void>;
  aiHunkDecisions: DiffHunkDecision[];
  setAiHunkDecisions: React.Dispatch<React.SetStateAction<DiffHunkDecision[]>>;
  compareState: CompareState;
  closeCompare: () => void;
  showAiMarks: boolean;
  dialogProps: UseConfirmDialogReturn["dialogProps"];
  documentId: string | null;
  bootstrapEditor: (projectId: string) => Promise<void>;
  confirm: UseConfirmDialogReturn["confirm"];
}): JSX.Element {
  if (!props.currentProject || props.projectItems.length === 0) {
    return <DashboardPage />;
  }

  if (props.compareMode) {
    if (!props.compareVersionId && props.aiProposal) {
      return (
        <>
          <DiffViewPanel
            key={`ai-${props.aiProposal.runId}`}
            diffText={props.aiDiffText}
            mode="ai"
            onClose={props.handleRejectAiSuggestion}
            onRejectAll={props.handleRejectAiSuggestion}
            onAcceptAll={() => void props.handleAcceptAiSuggestion()}
            onAcceptHunk={(hunkIndex) =>
              props.setAiHunkDecisions((prev) =>
                prev.map((item, idx) =>
                  idx === hunkIndex ? "accepted" : item,
                ),
              )
            }
            onRejectHunk={(hunkIndex) =>
              props.setAiHunkDecisions((prev) =>
                prev.map((item, idx) =>
                  idx === hunkIndex ? "rejected" : item,
                ),
              )
            }
            hunkDecisions={props.aiHunkDecisions}
          />
          <SystemDialog {...props.dialogProps} />
        </>
      );
    }

    const handleRestore = async (): Promise<void> => {
      if (!props.documentId || !props.compareVersionId) return;
      const confirmed = await props.confirm(RESTORE_VERSION_CONFIRM_COPY);
      if (!confirmed) return;
      const res = await invoke("version:snapshot:rollback", {
        documentId: props.documentId,
        versionId: props.compareVersionId,
      });
      if (res.ok) {
        props.closeCompare();
        await props.bootstrapEditor(props.currentProject!.projectId);
      }
    };

    return (
      <>
        <DiffViewPanel
          key={props.compareVersionId ?? "compare"}
          diffText={props.compareState.diffText}
          onClose={props.closeCompare}
          onRestore={() => void handleRestore()}
          restoreInProgress={props.compareState.status === "loading"}
          lineUnderlineStyle={
            props.showAiMarks
              ? props.compareState.aiMarked
                ? "dashed"
                : "solid"
              : "none"
          }
        />
        <SystemDialog {...props.dialogProps} />
      </>
    );
  }

  return <EditorPane projectId={props.currentProject.projectId} />;
}

/**
 * AppShell renders the Workbench three-column layout (IconBar + Sidebar + Main
 * + RightPanel) and wires resizing, persistence, and P0 keyboard shortcuts.
 */
function resolveDialogTitle(
  activeDialogType: DialogType,
  t: (key: string) => string,
): string {
  switch (activeDialogType) {
    case "memory":
      return t("workbench.appShell.dialogTitle.memory");
    case "characters":
      return t("workbench.appShell.dialogTitle.characters");
    case "knowledgeGraph":
      return t("workbench.appShell.dialogTitle.knowledgeGraph");
    case "versionHistory":
      return t("workbench.appShell.dialogTitle.versionHistory");
    default:
      return assertNeverDialogType(activeDialogType);
  }
}

function renderDialogContent(
  activeDialogType: DialogType,
  currentProjectId: string | null,
  t: (key: string) => string,
): JSX.Element {
  switch (activeDialogType) {
    case "memory":
      return <MemoryPanel />;
    case "characters":
      if (!currentProjectId) {
        return (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            {t("workbench.appShell.noProjectCharacters")}
          </div>
        );
      }
      return <CharacterCardListContainer projectId={currentProjectId} />;
    case "knowledgeGraph":
      if (!currentProjectId) {
        return (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            {t("workbench.appShell.noProjectKg")}
          </div>
        );
      }
      return <KnowledgeGraphPanel projectId={currentProjectId} />;
    case "versionHistory":
      if (!currentProjectId) {
        return (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            {t("workbench.appShell.noDocumentHistory")}
          </div>
        );
      }
      return <VersionHistoryContainer projectId={currentProjectId} />;
    default:
      return assertNeverDialogType(activeDialogType);
  }
}

export function AppShell(): JSX.Element {
  const ctrl = useAppShellController();

  return (
    <>
      <NavigationController
        zenMode={ctrl.zenMode}
        canCreateDocument={Boolean(ctrl.currentProjectId)}
        onToggleSidebar={ctrl.toggleSidebarVisibility}
        onToggleRightPanel={ctrl.toggleAiPanel}
        onToggleZenMode={() => ctrl.setZenMode(!ctrl.zenMode)}
        onExitZenMode={() => ctrl.setZenMode(false)}
        onOpenCommandPalette={ctrl.openCommandPalette}
        onOpenSettings={() => ctrl.openSettingsDialog("general")}
        onOpenCreateProject={() => ctrl.setCreateProjectDialogOpen(true)}
        onCreateDocument={() => {
          if (!ctrl.currentProjectId) return;
          void ctrl.createDocument({ projectId: ctrl.currentProjectId });
        }}
        onOpenGlobalSearch={ctrl.openGlobalSearch}
      />

      <PanelOrchestrator>
        {(layout) => (
          <LayoutShell
            testId="app-shell"
            activityBar={
              <IconBar
                onOpenSettings={() => ctrl.openSettingsDialog("general")}
                settingsOpen={ctrl.settingsDialogOpen}
              />
            }
            left={
              <RegionErrorBoundary region="sidebar">
                <Sidebar
                  width={layout.effectiveSidebarWidth}
                  collapsed={layout.sidebarCollapsed}
                  projectId={ctrl.currentProjectId}
                  activePanel={ctrl.activeLeftPanel}
                  currentProjectId={ctrl.currentProjectId}
                  projects={ctrl.projectItems}
                  onSwitchProject={ctrl.handleSwitchProject}
                  onCreateProject={() => ctrl.setCreateProjectDialogOpen(true)}
                  onOpenVersionHistoryDocument={
                    ctrl.openVersionHistoryForDocument
                  }
                />
              </RegionErrorBoundary>
            }
            leftResizer={layout.sidebarResizer}
            main={
              <main
                className={`relative flex flex-1 bg-[var(--color-bg-base)] text-[var(--color-fg-muted)] text-[13px] ${
                  ctrl.currentProject
                    ? "items-stretch justify-stretch"
                    : ctrl.projectItems.length > 0
                      ? "items-stretch justify-stretch"
                      : "items-center justify-center"
                }`}
                style={{ minWidth: LAYOUT_DEFAULTS.mainMinWidth }}
              >
                <RegionErrorBoundary region="editor">
                  <AppShellMainContent
                    currentProject={ctrl.currentProject}
                    projectItems={ctrl.projectItems}
                    compareMode={ctrl.compareMode}
                    compareVersionId={ctrl.compareVersionId}
                    aiProposal={ctrl.aiProposal}
                    aiDiffText={ctrl.aiDiffText}
                    handleRejectAiSuggestion={ctrl.handleRejectAiSuggestion}
                    handleAcceptAiSuggestion={ctrl.handleAcceptAiSuggestion}
                    aiHunkDecisions={ctrl.aiHunkDecisions}
                    setAiHunkDecisions={ctrl.setAiHunkDecisions}
                    compareState={ctrl.compareState}
                    closeCompare={ctrl.closeCompare}
                    showAiMarks={ctrl.showAiMarks}
                    dialogProps={ctrl.dialogProps}
                    documentId={ctrl.documentId}
                    bootstrapEditor={ctrl.bootstrapEditor}
                    confirm={ctrl.confirm}
                  />
                </RegionErrorBoundary>
                <button
                  type="button"
                  aria-label={ctrl.t("workbench.appShell.aiPanelLabel")}
                  title={ctrl.t("workbench.appShell.aiPanelLabel")}
                  onClick={ctrl.toggleAiPanel}
                  className={`absolute top-2 right-2 min-w-6 min-h-6 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] z-10 ${
                    !layout.panelCollapsed && ctrl.activeRightPanel === "ai"
                      ? "text-[var(--color-fg-accent)] bg-[var(--color-bg-selected)]"
                      : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </main>
            }
            rightResizer={layout.panelResizer}
            right={
              <RegionErrorBoundary region="panel">
                <RightPanel
                  width={layout.effectivePanelWidth}
                  collapsed={layout.panelCollapsed}
                  onOpenSettings={(tab) =>
                    ctrl.openSettingsDialog(tab ?? "general")
                  }
                  onOpenVersionHistory={ctrl.openVersionHistoryPanel}
                  onCollapse={layout.panelVisibility.collapseRightPanel}
                />
              </RegionErrorBoundary>
            }
            bottomBar={<StatusBar />}
            overlays={
              <AppShellOverlays
                spotlightOpen={ctrl.spotlightOpen}
                searchFocusNonce={ctrl.searchFocusNonce}
                currentProjectId={ctrl.currentProjectId}
                onCloseSpotlight={ctrl.closeGlobalSearch}
                dialogType={ctrl.dialogType}
                onCloseDialog={() => ctrl.setDialogType(null)}
                dialogTitleResolver={(d) => resolveDialogTitle(d, ctrl.t)}
                dialogContentRenderer={(d) =>
                  renderDialogContent(d, ctrl.currentProjectId, ctrl.t)
                }
                commandPaletteKey={ctrl.commandPaletteKey}
                commandPaletteOpen={ctrl.commandPaletteOpen}
                onCommandPaletteOpenChange={ctrl.setCommandPaletteOpen}
                commandPaletteCommands={ctrl.commandPaletteCommands}
                layoutActions={ctrl.layoutActions}
                dialogActions={ctrl.dialogActionCallbacks}
                documentActions={ctrl.documentActionCallbacks}
                settingsDialogOpen={ctrl.settingsDialogOpen}
                onSettingsDialogOpenChange={ctrl.setSettingsDialogOpen}
                settingsDefaultTab={ctrl.settingsDefaultTab}
                exportDialogOpen={ctrl.exportDialogOpen}
                onExportDialogOpenChange={ctrl.setExportDialogOpen}
                documentId={ctrl.documentId}
                createProjectDialogOpen={ctrl.createProjectDialogOpen}
                onCreateProjectDialogOpenChange={
                  ctrl.setCreateProjectDialogOpen
                }
                zenMode={ctrl.zenMode}
                onExitZenMode={() => ctrl.setZenMode(false)}
                compareMode={ctrl.compareMode}
                dialogProps={ctrl.dialogProps}
                t={ctrl.t}
              />
            }
          />
        )}
      </PanelOrchestrator>
    </>
  );
}

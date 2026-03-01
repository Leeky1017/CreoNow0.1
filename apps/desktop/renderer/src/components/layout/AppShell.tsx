import React from "react";
import { useTranslation } from "react-i18next";

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
import { WelcomeScreen } from "../../features/welcome/WelcomeScreen";
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
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { RESTORE_VERSION_CONFIRM_COPY } from "../../features/version-history/restoreConfirmCopy";
import { useVersionCompare } from "../../features/version-history/useVersionCompare";
import { useProjectStore } from "../../stores/projectStore";
import { useFileStore } from "../../stores/fileStore";
import { useEditorStore } from "../../stores/editorStore";
import { useAiStore } from "../../stores/aiStore";
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
        return "Saving...";
      case "saved":
        return "Saved";
      case "error":
        return "Save failed";
      default:
        return "Saved";
    }
  }, [autosaveStatus]);

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
 * AppShell renders the Workbench three-column layout (IconBar + Sidebar + Main
 * + RightPanel) and wires resizing, persistence, and P0 keyboard shortcuts.
 */
export function AppShell(): JSX.Element {
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
  const editor = useEditorStore((s) => s.editor);
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

  const aiProposal = useAiStore((s) => s.proposal);
  const setAiProposal = useAiStore((s) => s.setProposal);
  const setAiSelectionSnapshot = useAiStore((s) => s.setSelectionSnapshot);
  const persistAiApply = useAiStore((s) => s.persistAiApply);
  const setAiError = useAiStore((s) => s.setError);
  const logAiApplyConflict = useAiStore((s) => s.logAiApplyConflict);
  const showAiMarks = useVersionPreferencesStore((s) => s.showAiMarks);

  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  // Counter to force CommandPalette remount on each open (ensures fresh state)
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
  const lastMountedEditorRef = React.useRef<typeof editor>(null);

  // File store for creating documents
  const createDocument = useFileStore((s) => s.createAndSetCurrent);
  const setCurrentDocument = useFileStore((s) => s.setCurrent);
  const openEditorDocument = useEditorStore((s) => s.openDocument);

  // Version compare hook
  const { compareState, closeCompare } = useVersionCompare();
  const { confirm, dialogProps } = useConfirmDialog();
  const [aiHunkDecisions, setAiHunkDecisions] = React.useState<
    DiffHunkDecision[]
  >([]);

  const aiDiffText = React.useMemo(() => {
    if (!aiProposal) {
      return "";
    }
    return unifiedDiff({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
    });
  }, [aiProposal]);

  const aiHunks = React.useMemo(() => {
    if (!aiProposal) {
      return [];
    }
    return computeDiffHunks({
      oldText: aiProposal.selectionText,
      newText: aiProposal.replacementText,
    });
  }, [aiProposal]);

  React.useEffect(() => {
    if (editor) {
      lastMountedEditorRef.current = editor;
    }
  }, [editor]);

  React.useEffect(() => {
    if (!compareMode || compareVersionId) {
      if (aiHunkDecisions.length > 0) {
        setAiHunkDecisions([]);
      }
      return;
    }
    if (!aiProposal) {
      setCompareMode(false);
      return;
    }
    setAiHunkDecisions((prev) =>
      prev.length === aiHunks.length
        ? prev
        : Array.from({ length: aiHunks.length }, () => "pending"),
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
    if (!effectiveEditor || !documentId || !currentProjectId || !aiProposal) {
      return;
    }

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

  const openVersionHistoryPanel = React.useCallback(() => {
    setDialogType("versionHistory");
    setSpotlightOpen(false);
  }, [setDialogType, setSpotlightOpen]);

  const toggleSidebarVisibility = React.useCallback(() => {
    panelVisibility.toggleSidebar();
  }, [panelVisibility]);

  /** Three-way AI panel toggle: collapsed→expand+ai, expanded+ai→collapse, expanded+other→switch to ai */
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
    (documentId: string) => {
      if (!currentProjectId) {
        openVersionHistoryPanel();
        return;
      }

      runFireAndForget(async () => {
        await setCurrentDocument({ projectId: currentProjectId, documentId });
        await openEditorDocument({ projectId: currentProjectId, documentId });
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
    if (!currentProjectId) {
      return;
    }

    runFireAndForget(async () => {
      await bootstrapFiles(currentProjectId);
      await bootstrapEditor(currentProjectId);
    });
  }, [bootstrapEditor, bootstrapFiles, currentProjectId]);

  const openCommandPalette = React.useCallback(() => {
    setRecentCommandIds(readRecentCommandIds());
    setCommandPaletteKey((k) => k + 1); // Force remount for fresh state
    setCommandPaletteOpen(true);
  }, []);

  const openSettingsDialog = React.useCallback((tab: SettingsTab = "general") => {
    setSettingsDefaultTab(tab);
    setSettingsDialogOpen(true);
  }, []);

  // Callbacks for CommandPalette
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

  const documentActionCallbacks =
    React.useMemo<CommandPaletteDocumentActions>(() => {
      return {
        onCreateDocument: async () => {
          if (!currentProjectId) {
            throw new Error("No project selected");
          }
          const res = await createDocument({ projectId: currentProjectId });
          if (!res.ok) {
            throw new Error(`${res.error.code}: ${res.error.message}`);
          }
        },
      };
    }, [createDocument, currentProjectId]);

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
    const commandEntries: CommandItem[] = [
      {
        id: "open-settings",
        label: "Open Settings",
        shortcut: `${modKey},`,
        group: "command",
        category: "command",
        onSelect: () => {
          openSettingsDialog("general");
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "export",
        label: "Export…",
        group: "command",
        category: "command",
        onSelect: () => {
          setExportDialogOpen(true);
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "toggle-sidebar",
        label: "Toggle Sidebar",
        shortcut: `${modKey}\\`,
        group: "command",
        category: "command",
        onSelect: () => {
          toggleSidebarVisibility();
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "toggle-right-panel",
        label: "Toggle Right Panel",
        shortcut: `${modKey}L`,
        group: "command",
        category: "command",
        onSelect: () => {
          toggleAiPanel();
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "toggle-zen-mode",
        label: "Toggle Zen Mode",
        shortcut: "F11",
        group: "command",
        category: "command",
        onSelect: () => {
          setZenMode(!zenMode);
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "create-new-document",
        label: "Create New Document",
        shortcut: `${modKey}N`,
        group: "command",
        category: "command",
        onSelect: async () => {
          if (!currentProjectId) {
            return;
          }
          await createDocument({ projectId: currentProjectId });
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "open-version-history",
        label: "Open Version History",
        group: "command",
        category: "command",
        onSelect: () => {
          openVersionHistoryPanel();
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "create-new-project",
        label: "Create New Project",
        shortcut: `${modKey}Shift+N`,
        group: "command",
        category: "command",
        onSelect: () => {
          setCreateProjectDialogOpen(true);
          setCommandPaletteOpen(false);
        },
      },
    ];

    const safeFileItems = Array.isArray(fileItems) ? fileItems : [];
    const fileEntries = [...safeFileItems]
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
          if (!currentProjectId) {
            return;
          }
          const setCurrentRes = await setCurrentDocument({
            projectId: currentProjectId,
            documentId: item.documentId,
          });
          if (!setCurrentRes.ok) {
            return;
          }
          await openEditorDocument({
            projectId: currentProjectId,
            documentId: item.documentId,
          });
          setCommandPaletteOpen(false);
        },
      }));

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
    toggleAiPanel,
    toggleSidebarVisibility,
    withRecentTracking,
    zenMode,
  ]);

  /**
   * Determine which main content to render based on project state.
   *
   * Why: Different views for no projects, dashboard, and editor states.
   */
  function renderMainContent(): JSX.Element {
    // No projects at all - show welcome/create project screen
    if (projectItems.length === 0 && bootstrapStatus === "ready") {
      return <WelcomeScreen />;
    }

    // Projects exist but no current project - show dashboard
    if (!currentProject) {
      return <DashboardPage />;
    }

    // Current project in compare mode
    if (compareMode) {
      if (!compareVersionId && aiProposal) {
        return (
          <>
            <DiffViewPanel
              key={`ai-${aiProposal.runId}`}
              diffText={aiDiffText}
              mode="ai"
              onClose={handleRejectAiSuggestion}
              onRejectAll={handleRejectAiSuggestion}
              onAcceptAll={() => void handleAcceptAiSuggestion()}
              onAcceptHunk={(hunkIndex) =>
                setAiHunkDecisions((prev) =>
                  prev.map((item, idx) =>
                    idx === hunkIndex ? "accepted" : item,
                  ),
                )
              }
              onRejectHunk={(hunkIndex) =>
                setAiHunkDecisions((prev) =>
                  prev.map((item, idx) =>
                    idx === hunkIndex ? "rejected" : item,
                  ),
                )
              }
              hunkDecisions={aiHunkDecisions}
            />
            <SystemDialog {...dialogProps} />
          </>
        );
      }

      const handleRestore = async (): Promise<void> => {
        if (!documentId || !compareVersionId) return;

        const confirmed = await confirm(RESTORE_VERSION_CONFIRM_COPY);
        if (!confirmed) {
          return;
        }

        const res = await invoke("version:snapshot:rollback", {
          documentId,
          versionId: compareVersionId,
        });
        if (res.ok) {
          closeCompare();
          // Re-bootstrap editor to load restored content
          await bootstrapEditor(currentProject.projectId);
        }
      };

      return (
        <>
          <DiffViewPanel
            key={compareVersionId ?? "compare"}
            diffText={compareState.diffText}
            onClose={closeCompare}
            onRestore={() => void handleRestore()}
            restoreInProgress={compareState.status === "loading"}
            lineUnderlineStyle={
              showAiMarks
                ? compareState.aiMarked
                  ? "dashed"
                  : "solid"
                : "none"
            }
          />
          <SystemDialog {...dialogProps} />
        </>
      );
    }

    // Normal editor
    return <EditorPane projectId={currentProject.projectId} />;
  }

  function renderDialogContent(activeDialogType: DialogType): JSX.Element {
    switch (activeDialogType) {
      case "memory":
        return <MemoryPanel />;
      case "characters":
        if (!currentProjectId) {
          return (
            <div className="p-3 text-xs text-[var(--color-fg-muted)]">
              Open a project to manage characters
            </div>
          );
        }
        return <CharacterCardListContainer projectId={currentProjectId} />;
      case "knowledgeGraph":
        if (!currentProjectId) {
          return (
            <div className="p-3 text-xs text-[var(--color-fg-muted)]">
              Open a project to view knowledge graph
            </div>
          );
        }
        return <KnowledgeGraphPanel projectId={currentProjectId} />;
      case "versionHistory":
        if (!currentProjectId) {
          return (
            <div className="p-3 text-xs text-[var(--color-fg-muted)]">
              Open a document to view history
            </div>
          );
        }
        return <VersionHistoryContainer projectId={currentProjectId} />;
      default:
        return assertNeverDialogType(activeDialogType);
    }
  }

  function resolveDialogTitle(activeDialogType: DialogType): string {
    switch (activeDialogType) {
      case "memory":
        return "Memory";
      case "characters":
        return "Characters";
      case "knowledgeGraph":
        return "Knowledge Graph";
      case "versionHistory":
        return "Version History";
      default:
        return assertNeverDialogType(activeDialogType);
    }
  }

  return (
    <>
      <NavigationController
        zenMode={zenMode}
        canCreateDocument={Boolean(currentProjectId)}
        onToggleSidebar={toggleSidebarVisibility}
        onToggleRightPanel={toggleAiPanel}
        onToggleZenMode={() => setZenMode(!zenMode)}
        onExitZenMode={() => setZenMode(false)}
        onOpenCommandPalette={openCommandPalette}
        onOpenSettings={() => openSettingsDialog("general")}
        onOpenCreateProject={() => setCreateProjectDialogOpen(true)}
        onCreateDocument={() => {
          if (!currentProjectId) {
            return;
          }
          void createDocument({ projectId: currentProjectId });
        }}
      />

      <PanelOrchestrator>
        {(layout) => (
          <LayoutShell
            testId="app-shell"
            activityBar={
              <IconBar
                onOpenSettings={() => openSettingsDialog("general")}
                settingsOpen={settingsDialogOpen}
              />
            }
            left={
              <Sidebar
                width={layout.effectiveSidebarWidth}
                collapsed={layout.sidebarCollapsed}
                projectId={currentProjectId}
                activePanel={activeLeftPanel}
                currentProjectId={currentProjectId}
                projects={projectItems}
                onSwitchProject={handleSwitchProject}
                onCreateProject={() => setCreateProjectDialogOpen(true)}
                onOpenVersionHistoryDocument={openVersionHistoryForDocument}
              />
            }
            leftResizer={layout.sidebarResizer}
            main={
              <main
                className={`relative flex flex-1 bg-[var(--color-bg-base)] text-[var(--color-fg-muted)] text-[13px] ${
                  currentProject
                    ? "items-stretch justify-stretch"
                    : projectItems.length > 0
                      ? "items-stretch justify-stretch"
                      : "items-center justify-center"
                }`}
                style={{ minWidth: LAYOUT_DEFAULTS.mainMinWidth }}
              >
                {renderMainContent()}
                <button
                  type="button"
                  aria-label="AI Panel (Ctrl+L)"
                  title="AI Panel (Ctrl+L)"
                  onClick={toggleAiPanel}
                  className={`absolute top-2 right-2 min-w-6 min-h-6 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] z-10 ${
                    !layout.panelCollapsed && activeRightPanel === "ai"
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
              <RightPanel
                width={layout.effectivePanelWidth}
                collapsed={layout.panelCollapsed}
                onOpenSettings={(tab) => openSettingsDialog(tab ?? "general")}
                onOpenVersionHistory={openVersionHistoryPanel}
                onCollapse={layout.panelVisibility.collapseRightPanel}
              />
            }
            bottomBar={<StatusBar />}
            overlays={
              <>
                {spotlightOpen ? (
                  <div data-testid="leftpanel-spotlight-search">
                    <SearchPanel
                      projectId={currentProjectId ?? "__no_project__"}
                      open={true}
                      onClose={() => setSpotlightOpen(false)}
                    />
                  </div>
                ) : null}

                {dialogType ? (
                  <LeftPanelDialogShell
                    open={true}
                    title={resolveDialogTitle(dialogType)}
                    testId={`leftpanel-dialog-${dialogType}`}
                    onOpenChange={(open) => {
                      if (!open) {
                        setDialogType(null);
                      }
                    }}
                  >
                    {renderDialogContent(dialogType)}
                  </LeftPanelDialogShell>
                ) : null}

                <CommandPalette
                  key={commandPaletteKey}
                  open={commandPaletteOpen}
                  onOpenChange={setCommandPaletteOpen}
                  commands={commandPaletteCommands}
                  layoutActions={layoutActions}
                  dialogActions={dialogActionCallbacks}
                  documentActions={documentActionCallbacks}
                />

                {/* Dialogs */}
                <SettingsDialog
                  open={settingsDialogOpen}
                  onOpenChange={setSettingsDialogOpen}
                  defaultTab={settingsDefaultTab}
                />

                <ExportDialog
                  open={exportDialogOpen}
                  onOpenChange={setExportDialogOpen}
                  projectId={currentProjectId}
                  documentId={documentId}
                  documentTitle={t("workbench.export.currentDocument")}
                />

                <CreateProjectDialog
                  open={createProjectDialogOpen}
                  onOpenChange={setCreateProjectDialogOpen}
                />

                {/* Zen Mode Overlay */}
                <ZenModeOverlay
                  open={zenMode}
                  onExit={() => setZenMode(false)}
                />
                {!compareMode ? <SystemDialog {...dialogProps} /> : null}
              </>
            }
          />
        )}
      </PanelOrchestrator>
    </>
  );
}

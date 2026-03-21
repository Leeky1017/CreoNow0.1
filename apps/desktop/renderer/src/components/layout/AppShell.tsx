import { IconBar } from "./IconBar";
import { LayoutShell } from "./LayoutShell";
import { NavigationController } from "./NavigationController";
import { PanelOrchestrator } from "./PanelOrchestrator";
import { StatusBar } from "./StatusBar";
import { useAppShellLayout } from "./useAppShellLayout";
import { useAppShellKeyboard } from "./useAppShellKeyboard";
import {
  AppShellOverlays,
  resolveDialogTitle,
  renderDialogContent,
} from "./AppShellOverlays";
import { AppShellMainArea } from "./AppShellMainArea";
import { AppShellLeftPanel } from "./AppShellLeftPanel";
import { AppShellRightPanel } from "./AppShellRightPanel";
import "../../i18n";

// Re-export for backward compatibility (used by tests)
export { buildCommandEntries } from "./appShellCommands";

/**
 * AppShell – top-level workbench layout orchestrator.
 *
 * Composes the three-column layout (IconBar + Sidebar + Main + RightPanel)
 * and wires keyboard shortcuts, dialogs, and panel state.
 */
export function AppShell(): JSX.Element {
  const layout = useAppShellLayout();
  const keyboard = useAppShellKeyboard(layout);

  return (
    <>
      <NavigationController
        zenMode={layout.zenMode}
        canCreateDocument={Boolean(layout.currentProjectId)}
        onToggleSidebar={layout.toggleSidebarVisibility}
        onToggleRightPanel={layout.toggleAiPanel}
        onToggleZenMode={() => layout.setZenMode(!layout.zenMode)}
        onExitZenMode={() => layout.setZenMode(false)}
        onOpenCommandPalette={keyboard.openCommandPalette}
        onOpenSettings={() => layout.openSettingsDialog("general")}
        onOpenCreateProject={() => layout.setCreateProjectDialogOpen(true)}
        onCreateDocument={() => {
          if (!layout.currentProjectId) return;
          void layout.createDocument({ projectId: layout.currentProjectId });
        }}
        onOpenGlobalSearch={keyboard.openGlobalSearch}
      />

      <PanelOrchestrator>
        {(panels) => (
          <LayoutShell
            testId="app-shell"
            activityBar={
              <IconBar
                onOpenSettings={() => layout.openSettingsDialog("general")}
                settingsOpen={layout.settingsDialogOpen}
              />
            }
            left={
              <AppShellLeftPanel
                width={panels.effectiveSidebarWidth}
                collapsed={panels.sidebarCollapsed}
                projectId={layout.currentProjectId}
                activePanel={layout.activeLeftPanel}
                currentProjectId={layout.currentProjectId}
                projects={layout.projectItems}
                onSwitchProject={layout.handleSwitchProject}
                onCreateProject={() => layout.setCreateProjectDialogOpen(true)}
                onOpenVersionHistoryDocument={
                  layout.openVersionHistoryForDocument
                }
              />
            }
            leftResizer={panels.sidebarResizer}
            main={
              <AppShellMainArea
                currentProject={layout.currentProject}
                projectItems={layout.projectItems}
                compareMode={layout.compareMode}
                compareVersionId={layout.compareVersionId}
                aiProposal={layout.aiProposal}
                aiDiffText={layout.aiDiffText}
                handleRejectAiSuggestion={layout.handleRejectAiSuggestion}
                handleAcceptAiSuggestion={layout.handleAcceptAiSuggestion}
                aiHunkDecisions={layout.aiHunkDecisions}
                setAiHunkDecisions={layout.setAiHunkDecisions}
                compareState={layout.compareState}
                closeCompare={layout.closeCompare}
                showAiMarks={layout.showAiMarks}
                dialogProps={layout.dialogProps}
                documentId={layout.documentId}
                bootstrapEditor={layout.bootstrapEditor}
                confirm={layout.confirm}
                panelCollapsed={layout.panelCollapsed}
                activeRightPanel={layout.activeRightPanel}
                toggleAiPanel={layout.toggleAiPanel}
                t={layout.t}
              />
            }
            rightResizer={panels.panelResizer}
            right={
              <AppShellRightPanel
                width={panels.effectivePanelWidth}
                collapsed={panels.panelCollapsed}
                onOpenSettings={layout.openSettingsDialog}
                onOpenVersionHistory={layout.openVersionHistoryPanel}
                panelVisibility={panels.panelVisibility}
              />
            }
            bottomBar={<StatusBar />}
            overlays={
              <AppShellOverlays
                spotlightOpen={layout.spotlightOpen}
                searchFocusNonce={keyboard.searchFocusNonce}
                currentProjectId={layout.currentProjectId}
                onCloseSpotlight={keyboard.closeGlobalSearch}
                dialogType={layout.dialogType}
                onCloseDialog={() => layout.setDialogType(null)}
                dialogTitleResolver={(d) => resolveDialogTitle(d, layout.t)}
                dialogContentRenderer={(d) =>
                  renderDialogContent(d, layout.currentProjectId, layout.t)
                }
                commandPaletteKey={keyboard.commandPaletteKey}
                commandPaletteOpen={keyboard.commandPaletteOpen}
                onCommandPaletteOpenChange={keyboard.setCommandPaletteOpen}
                commandPaletteCommands={keyboard.commandPaletteCommands}
                layoutActions={layout.layoutActions}
                dialogActions={layout.dialogActionCallbacks}
                documentActions={layout.documentActionCallbacks}
                settingsDialogOpen={layout.settingsDialogOpen}
                onSettingsDialogOpenChange={layout.setSettingsDialogOpen}
                settingsDefaultTab={layout.settingsDefaultTab}
                exportDialogOpen={layout.exportDialogOpen}
                onExportDialogOpenChange={layout.setExportDialogOpen}
                documentId={layout.documentId}
                createProjectDialogOpen={layout.createProjectDialogOpen}
                onCreateProjectDialogOpenChange={
                  layout.setCreateProjectDialogOpen
                }
                zenMode={layout.zenMode}
                onExitZenMode={() => layout.setZenMode(false)}
                compareMode={layout.compareMode}
                dialogProps={layout.dialogProps}
                t={layout.t}
              />
            }
          />
        )}
      </PanelOrchestrator>
    </>
  );
}

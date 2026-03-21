import React from "react";
import { useTranslation } from "react-i18next";

import type { DialogType } from "../../stores/layoutStore";
import { useEditorStore } from "../../stores/editorStore";
import { LeftPanelDialogShell } from "./LeftPanelDialogShell";
import { CharacterCardListContainer } from "../../features/character/CharacterCardListContainer";
import { KnowledgeGraphPanel } from "../../features/kg/KnowledgeGraphPanel";
import { MemoryPanel } from "../../features/memory/MemoryPanel";
import { SearchPanel } from "../../features/search/SearchPanel";
import { VersionHistoryContainer } from "../../features/version-history/VersionHistoryContainer";
import { ZenMode } from "../../features/zen-mode/ZenMode";
import {
  SettingsDialog,
  type SettingsTab,
} from "../../features/settings-dialog/SettingsDialog";
import { ExportDialog } from "../../features/export/ExportDialog";
import { CreateProjectDialog } from "../../features/projects/CreateProjectDialog";
import { CommandPalette } from "../../features/commandPalette/CommandPalette";
import type {
  CommandItem,
  CommandPaletteLayoutActions,
  CommandPaletteDialogActions,
  CommandPaletteDocumentActions,
} from "../../features/commandPalette/CommandPalette";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import type { UseConfirmDialogReturn } from "../../hooks/useConfirmDialog";
import { extractZenModeContent } from "./appShellLayoutHelpers";

let hasWarnedInvalidZenContent = false;

function warnInvalidZenContent(error: unknown): void {
  if (hasWarnedInvalidZenContent) return;
  hasWarnedInvalidZenContent = true;
  console.warn("[A2-L-001] Failed to parse ZenMode content JSON", error);
}

function assertNeverDialogType(value: never): never {
  throw new Error(`Unhandled dialog type: ${String(value)}`);
}

function ZenModeOverlay(props: {
  open: boolean;
  onExit: () => void;
}): JSX.Element | null {
  const { t } = useTranslation();
  const editor = useEditorStore((s) => s.editor);
  const autosaveStatus = useEditorStore((s) => s.autosaveStatus);
  const documentContentJson = useEditorStore((s) => s.documentContentJson);

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

  const content = React.useMemo(() => {
    if (editor) {
      const json = JSON.stringify(editor.getJSON());
      return extractZenModeContent(json, warnInvalidZenContent);
    }
    return extractZenModeContent(documentContentJson, warnInvalidZenContent);
  }, [editor, documentContentJson]);

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

  const readTimeMinutes = Math.max(1, Math.ceil(content.wordCount / 200));

  return (
    <ZenMode
      open={props.open}
      onExit={props.onExit}
      editor={editor}
      title={content.title}
      isEmpty={content.wordCount === 0 && content.paragraphs.length === 0}
      stats={{
        wordCount: content.wordCount,
        saveStatus,
        readTimeMinutes,
      }}
      currentTime={currentTime}
    />
  );
}

export function resolveDialogTitle(
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

export function renderDialogContent(
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

/**
 * AppShellOverlays – all overlay dialogs/panels rendered by AppShell.
 */
export function AppShellOverlays(props: {
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
  dialogProps: UseConfirmDialogReturn["dialogProps"];
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

import React from "react";

import { LAYOUT_DEFAULTS } from "../../stores/layoutStore";
import { useEditorStore } from "../../stores/editorStore";
import type { AiProposal } from "../../stores/aiStore";
import type { ProjectInfo, ProjectListItem } from "../../stores/projectStore";
import type { DiffHunkDecision } from "../../lib/diff/unifiedDiff";
import type { CompareState } from "../../features/version-history/useVersionCompare";
import type { UseConfirmDialogReturn } from "../../hooks/useConfirmDialog";
import { RegionErrorBoundary } from "../patterns/RegionErrorBoundary";
import { DashboardPage } from "../../features/dashboard";
import { DiffViewPanel } from "../../features/diff/DiffViewPanel";
import { EditorPane } from "../../features/editor/EditorPane";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { RESTORE_VERSION_CONFIRM_COPY } from "../../features/version-history/restoreConfirmCopy";
import { invoke } from "../../lib/ipcClient";

type AppShellMainContentProps = {
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
};

function AppShellMainContent(props: AppShellMainContentProps): JSX.Element {
  const documentCoverImageUrl = useEditorStore((s) => s.documentCoverImageUrl);

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

  return (
    <EditorPane
      projectId={props.currentProject.projectId}
      coverImage={documentCoverImageUrl}
    />
  );
}

type AppShellMainAreaProps = AppShellMainContentProps & {
  panelCollapsed: boolean;
  activeRightPanel: string | null;
  toggleAiPanel: () => void;
  t: (key: string) => string;
};

/**
 * AppShellMainArea – central editor region (dashboard / diff / editor + AI toggle).
 */
export function AppShellMainArea(props: AppShellMainAreaProps): JSX.Element {
  return (
    <main
      id="main-content"
      className={`relative flex flex-1 bg-[var(--color-bg-base)] text-[var(--color-fg-muted)] text-[13px] ${
        props.currentProject
          ? "items-stretch justify-stretch"
          : props.projectItems.length > 0
            ? "items-stretch justify-stretch"
            : "items-center justify-center"
      }`}
      style={{ minWidth: LAYOUT_DEFAULTS.mainMinWidth }}
    >
      <RegionErrorBoundary region="editor">
        <AppShellMainContent
          currentProject={props.currentProject}
          projectItems={props.projectItems}
          compareMode={props.compareMode}
          compareVersionId={props.compareVersionId}
          aiProposal={props.aiProposal}
          aiDiffText={props.aiDiffText}
          handleRejectAiSuggestion={props.handleRejectAiSuggestion}
          handleAcceptAiSuggestion={props.handleAcceptAiSuggestion}
          aiHunkDecisions={props.aiHunkDecisions}
          setAiHunkDecisions={props.setAiHunkDecisions}
          compareState={props.compareState}
          closeCompare={props.closeCompare}
          showAiMarks={props.showAiMarks}
          dialogProps={props.dialogProps}
          documentId={props.documentId}
          bootstrapEditor={props.bootstrapEditor}
          confirm={props.confirm}
        />
      </RegionErrorBoundary>
      {/* eslint-disable-next-line creonow/no-native-html-element -- Layout: small inline icon button for AI panel toggle */}
      <button
        type="button"
        aria-label={props.t("workbench.appShell.aiPanelLabel")}
        title={props.t("workbench.appShell.aiPanelLabel")}
        onClick={props.toggleAiPanel}
        className={`absolute top-2 right-2 min-w-6 min-h-6 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] z-10 ${
          !props.panelCollapsed && props.activeRightPanel === "ai"
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
  );
}

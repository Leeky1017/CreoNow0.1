import type { ProjectListItem } from "../../stores/projectStore";
import type { LeftPanelType } from "../../stores/layoutStore";
import { RegionErrorBoundary } from "../patterns/RegionErrorBoundary";
import { Sidebar } from "./Sidebar";

type AppShellLeftPanelProps = {
  width: number;
  collapsed: boolean;
  projectId: string | null;
  activePanel: LeftPanelType;
  currentProjectId: string | null;
  projects: ProjectListItem[];
  onSwitchProject: (projectId: string) => Promise<void>;
  onCreateProject: () => void;
  onOpenVersionHistoryDocument: (documentId: string) => void;
};

/**
 * AppShellLeftPanel – left sidebar region (file tree / panel switcher).
 */
export function AppShellLeftPanel(props: AppShellLeftPanelProps): JSX.Element {
  return (
    <RegionErrorBoundary region="sidebar">
      <Sidebar
        width={props.width}
        collapsed={props.collapsed}
        projectId={props.projectId}
        activePanel={props.activePanel}
        currentProjectId={props.currentProjectId}
        projects={props.projects}
        onSwitchProject={props.onSwitchProject}
        onCreateProject={props.onCreateProject}
        onOpenVersionHistoryDocument={props.onOpenVersionHistoryDocument}
      />
    </RegionErrorBoundary>
  );
}

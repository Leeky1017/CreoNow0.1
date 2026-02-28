import { CharacterCardListContainer } from "../../features/character/CharacterCardListContainer";
import { FileTreePanel } from "../../features/files/FileTreePanel";
import { KnowledgeGraphPanel } from "../../features/kg/KnowledgeGraphPanel";
import { MemoryPanel } from "../../features/memory/MemoryPanel";
import { OutlinePanelContainer } from "../../features/outline/OutlinePanelContainer";
import { ProjectSwitcher } from "../../features/projects/ProjectSwitcher";
import { SearchPanel } from "../../features/search/SearchPanel";
import { VersionHistoryContainer } from "../../features/version-history/VersionHistoryContainer";
import { ScrollArea } from "../primitives";
import { LAYOUT_DEFAULTS, type LeftPanelType } from "../../stores/layoutStore";
import type { ProjectListItem } from "../../stores/projectStore";

/**
 * Left panel header showing the current view name.
 */
function LeftPanelHeader(props: { title: string }): JSX.Element {
  return (
    <div
      data-testid="sidebar-panel-header"
      className="flex items-center h-10 px-3 border-b border-[var(--color-separator)]"
    >
      <span className="text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
        {props.title}
      </span>
    </div>
  );
}

/**
 * Panel titles mapping.
 */
const PANEL_TITLES: Record<LeftPanelType, string> = {
  files: "Explorer",
  search: "Search",
  outline: "Outline",
  versionHistory: "Version History",
  memory: "Memory",
  characters: "Characters",
  knowledgeGraph: "Knowledge Graph",
};

/**
 * Sidebar (LeftPanel) is the left panel container.
 *
 * Renders the active panel based on activePanel prop.
 * No internal tabs - IconBar controls which panel is shown.
 *
 * Behavior:
 * - Panels requiring projectId show empty state when no project
 * - Settings and Memory (global scope) work without project
 */
export function Sidebar(props: {
  width: number;
  collapsed: boolean;
  projectId: string | null;
  activePanel: LeftPanelType;
  currentProjectId?: string | null;
  projects?: ProjectListItem[];
  onSwitchProject?: (projectId: string) => Promise<void>;
  onCreateProject?: () => void;
  onOpenVersionHistoryDocument?: (documentId: string) => void;
  onCloseSearch?: () => void;
}): JSX.Element {

  if (props.collapsed) {
    return (
      <aside
        data-testid="layout-sidebar"
        className="hidden w-0"
      />
    );
  }

  /**
   * Render the content for the active panel.
   *
   * Some panels require projectId, others work globally.
   */
  const renderPanelContent = () => {
    switch (props.activePanel) {
      case "files":
        return props.projectId ? (
          <FileTreePanel
            projectId={props.projectId}
            onOpenVersionHistory={props.onOpenVersionHistoryDocument}
          />
        ) : (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            No project open
          </div>
        );

      case "search":
        return props.projectId ? (
          <SearchPanel
            projectId={props.projectId}
            open={true}
            onClose={props.onCloseSearch}
          />
        ) : (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            Open a project to search
          </div>
        );

      case "outline":
        return props.projectId ? (
          <OutlinePanelContainer />
        ) : (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            Open a document to view outline
          </div>
        );

      case "versionHistory":
        return props.projectId ? (
          <VersionHistoryContainer projectId={props.projectId} />
        ) : (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            Open a document to view history
          </div>
        );

      case "memory":
        return <MemoryPanel />;

      case "characters":
        return props.projectId ? (
          <CharacterCardListContainer projectId={props.projectId} />
        ) : (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            Open a project to manage characters
          </div>
        );

      case "knowledgeGraph":
        return props.projectId ? (
          <KnowledgeGraphPanel projectId={props.projectId} />
        ) : (
          <div className="p-3 text-xs text-[var(--color-fg-muted)]">
            Open a project to view knowledge graph
          </div>
        );

      default: {
        // Exhaustive check
        const _exhaustive: never = props.activePanel;
        return _exhaustive;
      }
    }
  };

  return (
    <aside
      data-testid="layout-sidebar"
      className="flex flex-col bg-[var(--color-bg-surface)] border-r border-[var(--color-separator)]"
      style={{
        width: props.width,
        minWidth: LAYOUT_DEFAULTS.sidebar.min,
        maxWidth: LAYOUT_DEFAULTS.sidebar.max,
      }}
    >
      <div
        data-testid="sidebar-project-switcher"
        className="relative z-[var(--z-dropdown)] border-b border-[var(--color-separator)] p-2"
      >
        <ProjectSwitcher
          currentProjectId={props.currentProjectId ?? props.projectId}
          projects={props.projects ?? []}
          onSwitch={props.onSwitchProject ?? (async () => {})}
          onCreateProject={props.onCreateProject}
        />
      </div>
      <LeftPanelHeader title={PANEL_TITLES[props.activePanel]} />
      <ScrollArea
        data-testid="sidebar-scroll"
        viewportTestId="sidebar-scroll-viewport"
        className="flex-1 min-h-0"
      >
        {renderPanelContent()}
      </ScrollArea>
    </aside>
  );
}

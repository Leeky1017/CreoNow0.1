import React from "react";

import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import {
  Button,
  Input,
  Text,
  Spinner,
  DropdownMenu,
  ContextMenu,
  type DropdownMenuItem,
  type ContextMenuItem,
} from "../../components/primitives";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { invoke } from "../../lib/ipcClient";
import { CreateProjectDialog } from "../projects/CreateProjectDialog";
import { DeleteProjectDialog } from "../projects/DeleteProjectDialog";
import { RenameProjectDialog } from "./RenameProjectDialog";
import {
  useProjectStore,
  type ProjectListItem,
} from "../../stores/projectStore";

// =============================================================================
// Types
// =============================================================================

interface DashboardPageProps {
  /** Called when a project is selected to open */
  onProjectSelect?: (projectId: string) => void;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * SearchBar - Global search input for projects.
 */
function SearchBar(props: {
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 text-[var(--color-fg-muted)]">
      <svg
        className="w-4 h-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <Input
        data-testid="dashboard-search"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder="Search across projects..."
        className="bg-transparent border-none text-sm w-[300px] placeholder:text-[var(--color-fg-faint)]"
      />
    </div>
  );
}

/**
 * HeroCard - Featured "Continue Writing" card for the most recent project.
 */
function HeroCard(props: {
  project: ProjectListItem;
  onClick: () => void;
}): JSX.Element {
  const { project, onClick } = props;
  const lastEdited = formatRelativeTime(project.updatedAt);

  return (
    <div
      data-testid="dashboard-hero-card"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
      className="border border-[var(--color-border-default)] min-h-[280px] flex cursor-pointer transition-all duration-300 hover:border-[var(--color-fg-muted)] animate-fade-in-up"
    >
      <div className="flex-1 p-10 flex flex-col justify-center">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-faint)] mb-3">
          Last edited {lastEdited}
        </div>
        <h2 className="text-[28px] font-normal tracking-[-0.02em] text-[var(--color-fg-default)] mb-4 leading-tight">
          {project.name || "Untitled Project"}
        </h2>
        <p className="text-[15px] text-[var(--color-fg-muted)] leading-relaxed max-w-[500px] mb-8">
          Continue where you left off. Your creative journey awaits.
        </p>
        <div className="flex gap-3">
          <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-fg-faint)] border border-[var(--color-border-default)] px-2.5 py-1 rounded-full">
            {formatStageTag(project.stage)}
          </span>
        </div>
      </div>
      <div className="w-[35%] bg-[var(--color-bg-surface)] border-l border-[var(--color-border-default)] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-faint)]">
          <svg
            className="w-16 h-16 opacity-20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Three-dot menu icon for project actions.
 */
function MoreIcon(): JSX.Element {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
    </svg>
  );
}

/**
 * ProjectCard - Standard project card for the grid.
 *
 * Supports both click-triggered menu (three dots) and right-click context menu.
 */
function ProjectCard(props: {
  project: ProjectListItem;
  onClick: () => void;
  onRename?: (projectId: string) => void;
  onDuplicate?: (projectId: string) => void;
  onArchiveToggle?: (projectId: string, archived: boolean) => void;
  onDelete?: (projectId: string) => void;
}): JSX.Element {
  const { project, onClick, onRename, onDuplicate, onArchiveToggle, onDelete } =
    props;
  const dateStr = formatDate(project.updatedAt);
  const isArchived = typeof project.archivedAt === "number";

  /**
   * Build menu items for both dropdown and context menu.
   *
   * Why: Consistent actions across both interaction patterns.
   */
  const menuItems: (DropdownMenuItem | ContextMenuItem)[] =
    React.useMemo(() => {
      const items: (DropdownMenuItem | ContextMenuItem)[] = [
        {
          key: "open",
          label: "Open",
          onSelect: onClick,
        },
      ];

      if (onRename) {
        items.push({
          key: "rename",
          label: "Rename",
          onSelect: () => onRename(project.projectId),
        });
      }

      if (onDuplicate) {
        items.push({
          key: "duplicate",
          label: "Duplicate",
          onSelect: () => onDuplicate(project.projectId),
        });
      }

      if (onArchiveToggle) {
        items.push({
          key: "archive",
          label: isArchived ? "Unarchive" : "Archive",
          onSelect: () => onArchiveToggle(project.projectId, !isArchived),
        });
      }

      if (onDelete) {
        items.push({
          key: "delete",
          label: "Delete",
          onSelect: () => onDelete(project.projectId),
          destructive: true,
        });
      }

      return items;
    }, [
      onClick,
      onRename,
      onDuplicate,
      onArchiveToggle,
      onDelete,
      project.projectId,
      isArchived,
    ]);

  const cardContent = (
    <div
      data-testid="dashboard-project-card"
      data-project-id={project.projectId}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
      className="border border-[var(--color-border-default)] p-6 h-[200px] flex flex-col cursor-pointer transition-all duration-300 hover:border-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
          {dateStr}
        </div>
        <DropdownMenu
          trigger={
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-[var(--color-fg-faint)] hover:text-[var(--color-fg-default)] transition-colors p-1 -m-1 rounded"
              data-testid="project-card-menu-trigger"
            >
              <MoreIcon />
            </button>
          }
          items={menuItems}
          testId="project-card-menu"
        />
      </div>

      <h3 className="text-[16px] text-[var(--color-fg-default)] mb-2 leading-snug line-clamp-2">
        {project.name || "Untitled Project"}
      </h3>

      <p className="text-[13px] text-[var(--color-fg-muted)] leading-relaxed line-clamp-3 flex-1">
        Open this project to continue writing.
      </p>

      <div className="mt-auto pt-4 border-t border-[var(--color-border-default)] flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-fg-faint)]">
          {formatStageTag(project.stage)}
        </span>
      </div>
    </div>
  );

  // Wrap with ContextMenu for right-click support
  return <ContextMenu items={menuItems}>{cardContent}</ContextMenu>;
}

/**
 * NewDraftCard - Dashed card for creating new projects.
 */
function NewDraftCard(props: { onClick: () => void }): JSX.Element {
  return (
    <div
      data-testid="dashboard-new-draft"
      onClick={props.onClick}
      onKeyDown={(e) => e.key === "Enter" && props.onClick()}
      role="button"
      tabIndex={0}
      className="border-2 border-dashed border-[var(--color-border-default)] p-6 h-[200px] flex flex-col items-center justify-center cursor-pointer opacity-50 hover:opacity-100 hover:border-[var(--color-fg-muted)] transition-all duration-300"
    >
      <div className="text-[32px] font-light text-[var(--color-fg-faint)] mb-3">
        +
      </div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
        New Draft
      </div>
    </div>
  );
}

/**
 * SectionTitle - Consistent section header with optional action.
 */
function SectionTitle(props: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={`text-sm font-medium text-[var(--color-fg-default)] mb-6 flex justify-between items-center ${props.className ?? ""}`}
    >
      <span>{props.children}</span>
      {props.action}
    </div>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format timestamp to relative time string.
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatDate(timestamp);
}

/**
 * Format timestamp to short date string.
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

function formatStageTag(
  stage: "outline" | "draft" | "revision" | "final" | undefined,
): string {
  switch (stage) {
    case "outline":
      return "大纲";
    case "draft":
      return "初稿";
    case "revision":
      return "修改";
    case "final":
      return "定稿";
    default:
      return "项目";
  }
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * DashboardPage - Project overview and selection screen.
 *
 * Why: After onboarding, users need a central hub to see their projects,
 * continue recent work, or start new drafts. Based on design/Variant/designs/05-dashboard-sidebar-full.html.
 */
export function DashboardPage(props: DashboardPageProps): JSX.Element {
  const items = useProjectStore((s) => s.items);
  const bootstrapStatus = useProjectStore((s) => s.bootstrapStatus);
  const bootstrap = useProjectStore((s) => s.bootstrap);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const setProjectArchived = useProjectStore((s) => s.setProjectArchived);
  const lastError = useProjectStore((s) => s.lastError);
  const clearError = useProjectStore((s) => s.clearError);

  const { confirm, dialogProps } = useConfirmDialog();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [renameTargetProject, setRenameTargetProject] =
    React.useState<ProjectListItem | null>(null);
  const [renameSubmitting, setRenameSubmitting] = React.useState(false);
  const [renameErrorText, setRenameErrorText] = React.useState<string | null>(
    null,
  );
  const [archivedExpanded, setArchivedExpanded] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);
  const [deleteTargetProject, setDeleteTargetProject] =
    React.useState<ProjectListItem | null>(null);

  // Bootstrap projects on mount
  React.useEffect(() => {
    if (bootstrapStatus === "idle") {
      void bootstrap();
    }
  }, [bootstrap, bootstrapStatus]);

  // Filter projects by search query
  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((p) => p.name?.toLowerCase().includes(query));
  }, [items, searchQuery]);

  // Sort by updatedAt descending (most recent first)
  const sortedProjects = React.useMemo(() => {
    return [...filteredProjects].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [filteredProjects]);

  const activeProjects = React.useMemo(
    () => sortedProjects.filter((project) => project.archivedAt == null),
    [sortedProjects],
  );

  const archivedProjects = React.useMemo(
    () => sortedProjects.filter((project) => project.archivedAt != null),
    [sortedProjects],
  );

  // Most recent active project for hero card
  const heroProject = activeProjects[0] ?? null;

  // Remaining active projects for grid (exclude hero)
  const gridProjects = activeProjects.slice(1);

  /**
   * Handle project selection.
   */
  const handleProjectSelect = React.useCallback(
    async (projectId: string) => {
      const res = await setCurrentProject(projectId);
      if (res.ok) {
        props.onProjectSelect?.(projectId);
      }
    },
    [props, setCurrentProject],
  );

  /**
   * Handle project rename.
   */
  const handleRename = React.useCallback(
    (projectId: string) => {
      const project = items.find(
        (candidate) => candidate.projectId === projectId,
      );
      if (!project) {
        return;
      }
      setRenameTargetProject(project);
      setRenameErrorText(null);
      setRenameDialogOpen(true);
    },
    [items],
  );

  /**
   * Submit rename request to project store.
   */
  const handleRenameSubmit = React.useCallback(
    async (name: string) => {
      if (!renameTargetProject) {
        return;
      }
      setRenameSubmitting(true);
      setRenameErrorText(null);
      const res = await renameProject({
        projectId: renameTargetProject.projectId,
        name,
      });
      setRenameSubmitting(false);
      if (!res.ok) {
        setRenameErrorText(`${res.error.code}: ${res.error.message}`);
        return;
      }
      setRenameDialogOpen(false);
      setRenameTargetProject(null);
    },
    [renameProject, renameTargetProject],
  );

  /**
   * Handle project duplicate.
   */
  const handleDuplicate = React.useCallback(
    async (projectId: string) => {
      await duplicateProject({ projectId });
    },
    [duplicateProject],
  );

  /**
   * Handle project archive/unarchive with confirmation dialog.
   */
  const handleArchiveToggle = React.useCallback(
    async (projectId: string, archived: boolean) => {
      const project = items.find(
        (candidate) => candidate.projectId === projectId,
      );
      const projectName =
        project?.name?.trim().length && project.name
          ? project.name
          : "Untitled Project";
      const title = archived ? "Archive project?" : "Unarchive project?";
      const description = archived
        ? `"${projectName}" will move to Archived projects.`
        : `"${projectName}" will be restored to active projects.`;
      const confirmed = await confirm({
        title,
        description,
        primaryLabel: archived ? "Archive" : "Unarchive",
        secondaryLabel: "Cancel",
      });
      if (!confirmed) {
        return;
      }
      await setProjectArchived({ projectId, archived });
    },
    [confirm, items, setProjectArchived],
  );

  /**
   * Handle project delete.
   */
  const handleDelete = React.useCallback(
    async (projectId: string) => {
      const project = items.find((candidate) => candidate.projectId === projectId);
      if (!project) {
        return;
      }
      setDeleteTargetProject(project);
      setDeleteDialogOpen(true);
    },
    [items],
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTargetProject) {
      return;
    }

    setDeleteSubmitting(true);
    await deleteProject(deleteTargetProject.projectId);
    setDeleteSubmitting(false);
    setDeleteDialogOpen(false);
    setDeleteTargetProject(null);
  }, [deleteProject, deleteTargetProject]);

  // Loading state
  if (bootstrapStatus === "loading") {
    return (
      <div
        data-testid="dashboard-loading"
        className="flex-1 flex items-center justify-center"
      >
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state (no projects)
  if (items.length === 0) {
    return (
      <>
        <div
          data-testid="dashboard-empty"
          className="flex-1 flex flex-col items-center justify-center p-12"
        >
          {lastError ? (
            <div role="alert" className="w-full max-w-xl mb-8">
              <div className="p-3 border border-[var(--color-separator)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)]">
                <Text size="small" className="mb-2 block">
                  {lastError.code}: {lastError.message}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => clearError()}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}

          <div className="text-[var(--color-fg-faint)] mb-8">
            <svg
              className="w-20 h-20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <Text
            as="div"
            size="body"
            color="default"
            className="text-lg font-medium mb-2"
          >
            开始创建你的第一个创作项目
          </Text>
          <Text size="small" color="muted" className="mb-8 text-center">
            从一个新项目开始你的创作流程。
          </Text>
          <Button
            data-testid="dashboard-create-first"
            variant="secondary"
            size="md"
            onClick={() => setCreateDialogOpen(true)}
          >
            新建项目
          </Button>
          <Button
            data-testid="dashboard-open-folder"
            variant="secondary"
            size="md"
            className="mt-3"
            onClick={async () => {
              await invoke("dialog:folder:open", {});
            }}
          >
            打开文件夹
          </Button>
        </div>

        <CreateProjectDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
        <SystemDialog {...dialogProps} />
      </>
    );
  }

  return (
    <>
      <div
        data-testid="dashboard-page"
        className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg-base)]"
      >
        {/* Toolbar */}
        <header className="h-20 border-b border-[var(--color-border-default)] flex items-center justify-between px-12">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="flex gap-4 items-center">
            <Button
              data-testid="dashboard-create-new"
              variant="secondary"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-full px-5"
            >
              Create New
            </Button>
          </div>
        </header>

        {lastError ? (
          <div
            role="alert"
            className="px-12 py-3 border-b border-[var(--color-border-default)]"
          >
            <Text size="small" className="mb-2 block">
              {lastError.code}: {lastError.message}
            </Text>
            <Button variant="secondary" size="sm" onClick={() => clearError()}>
              Dismiss
            </Button>
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12">
          {/* Continue Writing (Hero) */}
          {heroProject && (
            <>
              <SectionTitle
                action={
                  <button className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors cursor-pointer">
                    View All
                  </button>
                }
                className="animate-fade-in-up"
              >
                Continue Writing
              </SectionTitle>
              <div className="mb-16">
                <HeroCard
                  project={heroProject}
                  onClick={() =>
                    void handleProjectSelect(heroProject.projectId)
                  }
                />
              </div>
            </>
          )}

          {/* Recent Projects Grid */}
          {(gridProjects.length > 0 || searchQuery) && (
            <>
              <SectionTitle
                action={
                  <div className="flex gap-3">
                    <button
                      className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
                      title="Grid View"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </button>
                    <button
                      className="text-[var(--color-fg-faint)] hover:text-[var(--color-fg-default)] transition-colors"
                      title="List View"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </button>
                  </div>
                }
                className="mt-8 animate-fade-in-up animation-delay-200"
              >
                Recent Projects
              </SectionTitle>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 animate-fade-in-up animation-delay-300">
                {gridProjects.map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    onClick={() => void handleProjectSelect(project.projectId)}
                    onRename={handleRename}
                    onDuplicate={handleDuplicate}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={handleDelete}
                  />
                ))}
                <NewDraftCard onClick={() => setCreateDialogOpen(true)} />
              </div>

              {/* No results */}
              {searchQuery && filteredProjects.length === 0 && (
                <div className="text-center py-12">
                  <Text size="body" color="muted">
                    未找到匹配结果
                  </Text>
                </div>
              )}
            </>
          )}

          {/* Only hero, show new draft prominently */}
          {gridProjects.length === 0 && !searchQuery && heroProject && (
            <div className="mt-8">
              <SectionTitle className="animate-fade-in-up animation-delay-200">
                Start Something New
              </SectionTitle>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 animate-fade-in-up animation-delay-300">
                <NewDraftCard onClick={() => setCreateDialogOpen(true)} />
              </div>
            </div>
          )}

          {archivedProjects.length > 0 ? (
            <div className="mt-10">
              <SectionTitle
                action={
                  <button
                    type="button"
                    data-testid="dashboard-archived-toggle"
                    className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
                    onClick={() => setArchivedExpanded((prev) => !prev)}
                  >
                    {archivedExpanded ? "Collapse" : "Expand"}
                  </button>
                }
                className="animate-fade-in-up animation-delay-200"
              >
                Archived ({archivedProjects.length})
              </SectionTitle>
              {archivedExpanded ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 animate-fade-in-up animation-delay-300">
                  {archivedProjects.map((project) => (
                    <ProjectCard
                      key={project.projectId}
                      project={project}
                      onClick={() =>
                        void handleProjectSelect(project.projectId)
                      }
                      onRename={handleRename}
                      onDuplicate={handleDuplicate}
                      onArchiveToggle={handleArchiveToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <RenameProjectDialog
        open={renameDialogOpen}
        initialName={renameTargetProject?.name ?? ""}
        submitting={renameSubmitting}
        errorText={renameErrorText}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) {
            setRenameTargetProject(null);
            setRenameErrorText(null);
          }
        }}
        onSubmit={handleRenameSubmit}
      />
      <DeleteProjectDialog
        open={deleteDialogOpen}
        projectName={deleteTargetProject?.name ?? ""}
        documentCount={0}
        submitting={deleteSubmitting}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTargetProject(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
      <SystemDialog {...dialogProps} />
    </>
  );
}

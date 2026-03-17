import React from "react";
import { useTranslation } from "react-i18next";

import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import {
  Button,
  Input,
  Text,
  DropdownMenu,
  ContextMenu,
  type DropdownMenuItem,
  type ContextMenuItem,
} from "../../components/primitives";
import { useDeferredLoading } from "../../lib/useDeferredLoading";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import type { UseConfirmDialogReturn } from "../../hooks/useConfirmDialog";
import { invoke } from "../../lib/ipcClient";
import { CreateProjectDialog } from "../projects/CreateProjectDialog";
import { DeleteProjectDialog } from "../projects/DeleteProjectDialog";
import { RenameProjectDialog } from "./RenameProjectDialog";
import {
  useProjectStore,
  type ProjectListItem,
} from "../../stores/projectStore";

import { FilePlus, MoreHorizontal, PenTool, Search } from "lucide-react";
import { i18n } from "../../i18n";
import { getHumanErrorMessage } from "../../lib/errorMessages";

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
 * DashboardLoadingState — shows nothing for the first 200ms,
 * then fades in a skeleton layout to avoid flash.
 */
function DashboardLoadingState(): JSX.Element {
  const showSkeleton = useDeferredLoading(true, 200);

  if (!showSkeleton) {
    return (
      <div
        data-testid="dashboard-loading"
        className="flex-1 flex items-center justify-center"
      />
    );
  }

  return (
    <div data-testid="dashboard-loading" className="flex-1">
      <DashboardSkeleton />
    </div>
  );
}

/**
 * SearchBar - Global search input for projects.
 */
function SearchBar(props: {
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-[var(--color-fg-muted)]">
      <Search className="w-4 h-4 shrink-0" size={16} strokeWidth={1.5} />
      <Input
        data-testid="dashboard-search"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={t("dashboard.searchPlaceholder")}
        className="bg-transparent border-none text-sm w-75 placeholder:text-[var(--color-fg-faint)]"
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
  const { t } = useTranslation();
  const { project, onClick } = props;
  const lastEdited = formatRelativeTime(project.updatedAt, t);

  return (
    <div
      data-testid="dashboard-hero-card"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
      className="border border-transparent min-h-0 flex cursor-pointer transition-colors duration-300 hover:border-[var(--color-fg-muted)] animate-fade-in-up"
    >
      <div className="flex-1 min-w-0 p-10 flex flex-col justify-center">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-faint)] mb-3">
          {t("dashboard.heroLastEdited", { time: lastEdited })}
        </div>
        <h2 className="text-[28px] font-normal tracking-[-0.02em] text-[var(--color-fg-default)] mb-4 leading-tight">
          {project.name || t("dashboard.untitledProject")}
        </h2>
        {/* eslint-disable-next-line creonow/no-hardcoded-dimension -- hero description width per design spec */}
        <p className="text-[15px] text-[var(--color-fg-muted)] leading-relaxed max-w-[500px] mb-8">
          {t("dashboard.heroSubtitle")}
        </p>
        <div className="flex gap-3">
          <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-fg-faint)] border border-[var(--color-separator)] px-2.5 py-1 rounded-full">
            {formatStageTag(project.stage, t)}
          </span>
        </div>
      </div>
      <div className="w-[35%] max-w-70 hidden lg:block bg-[var(--color-bg-surface)] border-l border-[var(--color-separator)] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-faint)]">
          <PenTool
            className="w-16 h-16 opacity-20"
            size={24}
            strokeWidth={1.5}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Three-dot menu icon for project actions.
 */
function MoreIcon(): JSX.Element {
  return <MoreHorizontal className="w-4 h-4" size={16} strokeWidth={1.5} />;
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
  const { t } = useTranslation();
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
          label: t("dashboard.menu.open"),
          onSelect: onClick,
        },
      ];

      if (onRename) {
        items.push({
          key: "rename",
          label: t("dashboard.menu.rename"),
          onSelect: () => onRename(project.projectId),
        });
      }

      if (onDuplicate) {
        items.push({
          key: "duplicate",
          label: t("dashboard.menu.duplicate"),
          onSelect: () => onDuplicate(project.projectId),
        });
      }

      if (onArchiveToggle) {
        items.push({
          key: "archive",
          label: isArchived
            ? t("dashboard.menu.unarchive")
            : t("dashboard.menu.archive"),
          onSelect: () => onArchiveToggle(project.projectId, !isArchived),
        });
      }

      if (onDelete) {
        items.push({
          key: "delete",
          label: t("dashboard.menu.delete"),
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
      t,
    ]);

  const cardContent = (
    <div
      data-testid="dashboard-project-card"
      data-project-id={project.projectId}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
      className="border border-transparent p-6 h-50 flex flex-col cursor-pointer transition-colors duration-300 hover:border-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
          {dateStr}
        </div>
        <DropdownMenu
          trigger={
            // eslint-disable-next-line creonow/no-native-html-element -- specialized button
            <button
              onClick={(e) => e.stopPropagation()}
              className="focus-ring text-[var(--color-fg-faint)] hover:text-[var(--color-fg-default)] transition-colors p-1 -m-1 rounded"
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
        {project.name || t("dashboard.untitledProject")}
      </h3>

      <p className="text-[13px] text-[var(--color-fg-muted)] leading-relaxed line-clamp-3 flex-1">
        {t("dashboard.openProjectHint")}
      </p>

      <div className="mt-auto pt-4 border-t border-[var(--color-separator)] flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-fg-faint)]">
          {formatStageTag(project.stage, t)}
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
  const { t } = useTranslation();
  return (
    <div
      data-testid="dashboard-new-draft"
      onClick={props.onClick}
      onKeyDown={(e) => e.key === "Enter" && props.onClick()}
      role="button"
      tabIndex={0}
      className="border-2 border-dashed border-[var(--color-separator)] p-6 h-50 flex flex-col items-center justify-center cursor-pointer opacity-50 hover:opacity-100 hover:border-[var(--color-fg-muted)] transition-[opacity,border-color] duration-300"
    >
      <div className="text-[32px] font-light text-[var(--color-fg-faint)] mb-3">
        +
      </div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
        {t("dashboard.newDraft")}
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

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Format timestamp to relative time string using i18n keys.
 *
 * Why: Relative time strings ("just now", "5 minutes ago") vary by locale.
 */
export function formatRelativeTime(
  timestamp: number,
  t: TFunction,
  now: number = Date.now(),
): string {
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t("dashboard.time.justNow");
  if (minutes < 60) return t("dashboard.time.minutesAgo", { count: minutes });
  if (hours < 24) return t("dashboard.time.hoursAgo", { count: hours });
  if (days < 7) return t("dashboard.time.daysAgo", { count: days });

  return formatDate(timestamp);
}

/**
 * Format timestamp to short date string.
 *
 * Why: Uses i18n.language so the month name matches the user's locale.
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const locale = i18n.language === "zh-CN" ? "zh-CN" : i18n.language;
  const month = date.toLocaleString(locale, { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Map project stage to an i18n-keyed display label.
 */
function formatStageTag(
  stage: "outline" | "draft" | "revision" | "final" | undefined,
  t: TFunction,
): string {
  switch (stage) {
    case "outline":
      return t("dashboard.stage.outline");
    case "draft":
      return t("dashboard.stage.draft");
    case "revision":
      return t("dashboard.stage.revision");
    case "final":
      return t("dashboard.stage.final");
    default:
      return t("dashboard.stage.default");
  }
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Encapsulates rename, duplicate, archive, and delete action state/handlers.
 */
function useDashboardActions() {
  const items = useProjectStore((s) => s.items);
  const renameProject = useProjectStore((s) => s.renameProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const setProjectArchived = useProjectStore((s) => s.setProjectArchived);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const { confirm, dialogProps } = useConfirmDialog();
  const { t } = useTranslation();

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [renameTargetProject, setRenameTargetProject] =
    React.useState<ProjectListItem | null>(null);
  const [renameSubmitting, setRenameSubmitting] = React.useState(false);
  const [renameErrorText, setRenameErrorText] = React.useState<string | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);
  const [deleteTargetProject, setDeleteTargetProject] =
    React.useState<ProjectListItem | null>(null);

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
        setRenameErrorText(getHumanErrorMessage(res.error));
        return;
      }
      setRenameDialogOpen(false);
      setRenameTargetProject(null);
    },
    [renameProject, renameTargetProject],
  );

  const handleDuplicate = React.useCallback(
    async (projectId: string) => {
      await duplicateProject({ projectId });
    },
    [duplicateProject],
  );

  const handleArchiveToggle = React.useCallback(
    async (projectId: string, archived: boolean) => {
      const project = items.find(
        (candidate) => candidate.projectId === projectId,
      );
      const projectName =
        project?.name?.trim().length && project.name
          ? project.name
          : t("dashboard.untitledProject");
      const title = archived
        ? t("dashboard.confirm.archiveTitle")
        : t("dashboard.confirm.unarchiveTitle");
      const description = archived
        ? t("dashboard.confirm.archiveDesc", { name: projectName })
        : t("dashboard.confirm.unarchiveDesc", { name: projectName });
      const confirmed = await confirm({
        title,
        description,
        primaryLabel: archived
          ? t("dashboard.confirm.archiveAction")
          : t("dashboard.confirm.unarchiveAction"),
        secondaryLabel: t("dashboard.confirm.cancel"),
      });
      if (!confirmed) {
        return;
      }
      await setProjectArchived({ projectId, archived });
    },
    [confirm, items, setProjectArchived, t],
  );

  const handleDelete = React.useCallback(
    async (projectId: string) => {
      const project = items.find(
        (candidate) => candidate.projectId === projectId,
      );
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

  const handleProjectSelect = React.useCallback(
    async (projectId: string, onSuccess?: (projectId: string) => void) => {
      const res = await setCurrentProject(projectId);
      if (res.ok) {
        onSuccess?.(projectId);
      }
    },
    [setCurrentProject],
  );

  return {
    handleProjectSelect,
    dialogProps,
    renameDialogOpen,
    setRenameDialogOpen,
    renameTargetProject,
    setRenameTargetProject,
    renameSubmitting,
    renameErrorText,
    setRenameErrorText,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteSubmitting,
    deleteTargetProject,
    setDeleteTargetProject,
    handleRename,
    handleRenameSubmit,
    handleDuplicate,
    handleArchiveToggle,
    handleDelete,
    handleDeleteConfirm,
  };
}

/**
 * Renders the create / rename / delete / system dialog cluster.
 */
function DashboardDialogs(props: {
  createDialogOpen: boolean;
  setCreateDialogOpen: (v: boolean) => void;
  renameDialogOpen: boolean;
  renameTargetProject: ProjectListItem | null;
  renameSubmitting: boolean;
  renameErrorText: string | null;
  setRenameDialogOpen: (v: boolean) => void;
  setRenameTargetProject: (v: ProjectListItem | null) => void;
  setRenameErrorText: (v: string | null) => void;
  handleRenameSubmit: (name: string) => Promise<void>;
  deleteDialogOpen: boolean;
  deleteTargetProject: ProjectListItem | null;
  deleteSubmitting: boolean;
  setDeleteDialogOpen: (v: boolean) => void;
  setDeleteTargetProject: (v: ProjectListItem | null) => void;
  handleDeleteConfirm: () => Promise<void>;
  dialogProps: UseConfirmDialogReturn["dialogProps"];
}): JSX.Element {
  return (
    <>
      <CreateProjectDialog
        open={props.createDialogOpen}
        onOpenChange={props.setCreateDialogOpen}
      />
      <RenameProjectDialog
        open={props.renameDialogOpen}
        initialName={props.renameTargetProject?.name ?? ""}
        submitting={props.renameSubmitting}
        errorText={props.renameErrorText}
        onOpenChange={(open) => {
          props.setRenameDialogOpen(open);
          if (!open) {
            props.setRenameTargetProject(null);
            props.setRenameErrorText(null);
          }
        }}
        onSubmit={props.handleRenameSubmit}
      />
      <DeleteProjectDialog
        open={props.deleteDialogOpen}
        projectName={props.deleteTargetProject?.name ?? ""}
        documentCount={0}
        submitting={props.deleteSubmitting}
        onOpenChange={(open) => {
          props.setDeleteDialogOpen(open);
          if (!open) {
            props.setDeleteTargetProject(null);
          }
        }}
        onConfirm={props.handleDeleteConfirm}
      />
      <SystemDialog {...props.dialogProps} />
    </>
  );
}

/**
 * DashboardPage - Project overview and selection screen.
 *
 * Why: After onboarding, users need a central hub to see their projects,
 * continue recent work, or start new drafts. Based on design/Variant/designs/05-dashboard-sidebar-full.html.
 */
export function DashboardPage(props: DashboardPageProps): JSX.Element {
  const { t } = useTranslation();
  const {
    dialogProps,
    renameDialogOpen,
    setRenameDialogOpen,
    renameTargetProject,
    setRenameTargetProject,
    renameSubmitting,
    renameErrorText,
    setRenameErrorText,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteSubmitting,
    deleteTargetProject,
    setDeleteTargetProject,
    handleRename,
    handleRenameSubmit,
    handleDuplicate,
    handleArchiveToggle,
    handleDelete,
    handleDeleteConfirm,
    handleProjectSelect: hookHandleProjectSelect,
  } = useDashboardActions();
  const items = useProjectStore((s) => s.items);
  const bootstrapStatus = useProjectStore((s) => s.bootstrapStatus);
  const bootstrap = useProjectStore((s) => s.bootstrap);
  const lastError = useProjectStore((s) => s.lastError);
  const clearError = useProjectStore((s) => s.clearError);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [archivedExpanded, setArchivedExpanded] = React.useState(false);

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

  // Loading state
  if (bootstrapStatus === "loading") {
    return <DashboardLoadingState />;
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
                  {getHumanErrorMessage(lastError)}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => clearError()}
                >
                  {t("dashboard.dismiss")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="text-[var(--color-fg-faint)] mb-8">
            <FilePlus className="w-20 h-20" size={24} strokeWidth={1.5} />
          </div>
          <Text
            as="div"
            size="body"
            color="default"
            className="text-lg font-medium mb-2"
          >
            {t("dashboard.emptyTitle")}
          </Text>
          <Text size="small" color="muted" className="mb-8 text-center">
            {t("dashboard.emptySubtitle")}
          </Text>
          <Button
            data-testid="dashboard-create-first"
            variant="secondary"
            size="md"
            onClick={() => setCreateDialogOpen(true)}
          >
            {t("dashboard.createFirst")}
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
            {t("dashboard.openFolder")}
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
        <header className="h-20 border-b border-[var(--color-separator)] flex items-center justify-between px-12">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="flex gap-4 items-center">
            <Button
              data-testid="dashboard-create-new"
              variant="secondary"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-full px-5"
            >
              {t("dashboard.createNew")}
            </Button>
          </div>
        </header>

        {lastError ? (
          <div
            role="alert"
            className="px-12 py-3 border-b border-[var(--color-separator)]"
          >
            <Text size="small" className="mb-2 block">
              {getHumanErrorMessage(lastError)}
            </Text>
            <Button variant="secondary" size="sm" onClick={() => clearError()}>
              {t("dashboard.dismiss")}
            </Button>
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12">
          {/* Continue Writing (Hero) */}
          {heroProject && (
            <>
              <SectionTitle className="animate-fade-in-up">
                {t("dashboard.continueWriting")}
              </SectionTitle>
              <div className="mb-16">
                <HeroCard
                  project={heroProject}
                  onClick={() =>
                    void hookHandleProjectSelect(
                      heroProject.projectId,
                      props.onProjectSelect,
                    )
                  }
                />
              </div>
            </>
          )}

          {/* Recent Projects Grid */}
          {(gridProjects.length > 0 || searchQuery) && (
            <>
              <SectionTitle className="mt-8 animate-fade-in-up animation-delay-200">
                {t("dashboard.recentProjects")}
              </SectionTitle>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 animate-fade-in-up animation-delay-300">
                {gridProjects.map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    onClick={() =>
                      void hookHandleProjectSelect(
                        project.projectId,
                        props.onProjectSelect,
                      )
                    }
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
                    {t("dashboard.noResults")}
                  </Text>
                </div>
              )}
            </>
          )}

          {/* Only hero, show new draft prominently */}
          {gridProjects.length === 0 && !searchQuery && heroProject && (
            <div className="mt-8">
              <SectionTitle className="animate-fade-in-up animation-delay-200">
                {t("dashboard.startSomethingNew")}
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
                  // eslint-disable-next-line creonow/no-native-html-element -- specialized button
                  <button
                    type="button"
                    data-testid="dashboard-archived-toggle"
                    className="focus-ring text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
                    onClick={() => setArchivedExpanded((prev) => !prev)}
                  >
                    {archivedExpanded
                      ? t("dashboard.collapse")
                      : t("dashboard.expand")}
                  </button>
                }
                className="animate-fade-in-up animation-delay-200"
              >
                {t("dashboard.archived", { count: archivedProjects.length })}
              </SectionTitle>
              {archivedExpanded ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 animate-fade-in-up animation-delay-300">
                  {archivedProjects.map((project) => (
                    <ProjectCard
                      key={project.projectId}
                      project={project}
                      onClick={() =>
                        void hookHandleProjectSelect(
                          project.projectId,
                          props.onProjectSelect,
                        )
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

      <DashboardDialogs
        createDialogOpen={createDialogOpen}
        setCreateDialogOpen={setCreateDialogOpen}
        renameDialogOpen={renameDialogOpen}
        renameTargetProject={renameTargetProject}
        renameSubmitting={renameSubmitting}
        renameErrorText={renameErrorText}
        setRenameDialogOpen={setRenameDialogOpen}
        setRenameTargetProject={setRenameTargetProject}
        setRenameErrorText={setRenameErrorText}
        handleRenameSubmit={handleRenameSubmit}
        deleteDialogOpen={deleteDialogOpen}
        deleteTargetProject={deleteTargetProject}
        deleteSubmitting={deleteSubmitting}
        setDeleteDialogOpen={setDeleteDialogOpen}
        setDeleteTargetProject={setDeleteTargetProject}
        handleDeleteConfirm={handleDeleteConfirm}
        dialogProps={dialogProps}
      />
    </>
  );
}

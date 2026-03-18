import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Text } from "../../components/primitives";
import { useProjectStore } from "../../stores/projectStore";
import { getHumanErrorMessage } from "../../lib/errorMessages";

import { HeroCard } from "./DashboardHero";
import {
  ProjectCard,
  NewDraftCard,
  SectionTitle,
} from "./DashboardProjectGrid";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { DashboardLoadingState, SearchBar } from "./DashboardInternals";
import { useDashboardActions, DashboardDialogs } from "./useDashboardActions";
import { useDashboardLayout } from "./useDashboardLayout";

// Re-export for backward compatibility
export { formatRelativeTime } from "./dashboardUtils";

// =============================================================================
// Types
// =============================================================================

interface DashboardPageProps {
  /** Called when a project is selected to open */
  onProjectSelect?: (projectId: string) => void;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * DashboardPage — Project overview and selection screen.
 *
 * Composition shell: delegates to DashboardHero, DashboardProjectGrid,
 * DashboardSidebar, and DashboardEmptyState sub-components.
 * Layout: fixed sidebar + scrollable content (AC-1).
 */
export function DashboardPage(props: DashboardPageProps): JSX.Element {
  const { t } = useTranslation();
  const actions = useDashboardActions();
  const layout = useDashboardLayout();

  const items = useProjectStore((s) => s.items);
  const bootstrapStatus = useProjectStore((s) => s.bootstrapStatus);
  const bootstrap = useProjectStore((s) => s.bootstrap);
  const lastError = useProjectStore((s) => s.lastError);
  const clearError = useProjectStore((s) => s.clearError);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [archivedExpanded, setArchivedExpanded] = React.useState(false);

  React.useEffect(() => {
    if (bootstrapStatus === "idle") {
      void bootstrap();
    }
  }, [bootstrap, bootstrapStatus]);

  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((p) => p.name?.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const sortedProjects = React.useMemo(
    () => [...filteredProjects].sort((a, b) => b.updatedAt - a.updatedAt),
    [filteredProjects],
  );

  const activeProjects = React.useMemo(
    () => sortedProjects.filter((p) => p.archivedAt == null),
    [sortedProjects],
  );

  const archivedProjects = React.useMemo(
    () => sortedProjects.filter((p) => p.archivedAt != null),
    [sortedProjects],
  );

  const heroProject = activeProjects[0] ?? null;
  const gridProjects = activeProjects.slice(1);

  const handleProjectClick = React.useCallback(
    (projectId: string) => {
      void actions.handleProjectSelect(projectId, props.onProjectSelect);
    },
    [actions, props.onProjectSelect],
  );

  if (bootstrapStatus === "loading") {
    return <DashboardLoadingState />;
  }

  if (items.length === 0) {
    return (
      <>
        <DashboardEmptyState
          lastError={lastError}
          onClearError={() => clearError()}
          onCreateProject={() => setCreateDialogOpen(true)}
        />
        <DashboardDialogs
          createDialogOpen={createDialogOpen}
          setCreateDialogOpen={setCreateDialogOpen}
          {...actions}
        />
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
        <header className="h-20 border-b border-[var(--color-separator)] flex items-center justify-between px-[var(--space-12)]">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="flex gap-[var(--space-4)] items-center">
            <Button
              data-testid="dashboard-create-new"
              variant="secondary"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-full px-[var(--space-5)]"
            >
              {t("dashboard.createNew")}
            </Button>
          </div>
        </header>

        {lastError ? (
          <div
            role="alert"
            className="px-[var(--space-12)] py-[var(--space-3)] border-b border-[var(--color-separator)]"
          >
            <Text size="small" className="mb-[var(--space-2)] block">
              {getHumanErrorMessage(lastError)}
            </Text>
            <Button variant="secondary" size="sm" onClick={() => clearError()}>
              {t("dashboard.dismiss")}
            </Button>
          </div>
        ) : null}

        {/* Content: main area + sidebar (AC-1: fixed sidebar layout) */}
        <div className="flex-1 flex min-h-0">
          {/* Scrollable main content */}
          <div className="flex-1 overflow-y-auto p-[var(--space-12)]">
            {heroProject && (
              <>
                <SectionTitle className="animate-fade-in-up">
                  {t("dashboard.continueWriting")}
                </SectionTitle>
                <div className="mb-[var(--space-16)]">
                  <HeroCard
                    project={heroProject}
                    onClick={() => handleProjectClick(heroProject.projectId)}
                  />
                </div>
              </>
            )}

            {(gridProjects.length > 0 || searchQuery) && (
              <>
                <SectionTitle className="mt-[var(--space-8)] animate-fade-in-up animation-delay-200">
                  {t("dashboard.recentProjects")}
                </SectionTitle>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[var(--space-6)] animate-fade-in-up animation-delay-300">
                  {gridProjects.map((project) => (
                    <ProjectCard
                      key={project.projectId}
                      project={project}
                      onClick={() => handleProjectClick(project.projectId)}
                      onRename={actions.handleRename}
                      onDuplicate={actions.handleDuplicate}
                      onArchiveToggle={actions.handleArchiveToggle}
                      onDelete={actions.handleDelete}
                    />
                  ))}
                  <NewDraftCard onClick={() => setCreateDialogOpen(true)} />
                </div>

                {searchQuery && filteredProjects.length === 0 && (
                  <div className="text-center py-[var(--space-12)]">
                    <Text size="body" color="muted">
                      {t("dashboard.noResults")}
                    </Text>
                  </div>
                )}
              </>
            )}

            {gridProjects.length === 0 && !searchQuery && heroProject && (
              <div className="mt-[var(--space-8)]">
                <SectionTitle className="animate-fade-in-up animation-delay-200">
                  {t("dashboard.startSomethingNew")}
                </SectionTitle>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[var(--space-6)] animate-fade-in-up animation-delay-300">
                  <NewDraftCard onClick={() => setCreateDialogOpen(true)} />
                </div>
              </div>
            )}

            {archivedProjects.length > 0 ? (
              <div className="mt-[var(--space-10)]">
                <SectionTitle
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="dashboard-archived-toggle"
                      onClick={() => setArchivedExpanded((prev) => !prev)}
                    >
                      {archivedExpanded
                        ? t("dashboard.collapse")
                        : t("dashboard.expand")}
                    </Button>
                  }
                  className="animate-fade-in-up animation-delay-200"
                >
                  {t("dashboard.archived", { count: archivedProjects.length })}
                </SectionTitle>
                {archivedExpanded ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[var(--space-6)] animate-fade-in-up animation-delay-300">
                    {archivedProjects.map((project) => (
                      <ProjectCard
                        key={project.projectId}
                        project={project}
                        onClick={() => handleProjectClick(project.projectId)}
                        onRename={actions.handleRename}
                        onDuplicate={actions.handleDuplicate}
                        onArchiveToggle={actions.handleArchiveToggle}
                        onDelete={actions.handleDelete}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Fixed sidebar (AC-1) — hidden during search to focus on results */}
          {layout.sidebarVisible && !searchQuery && (
            <DashboardSidebar
              projects={activeProjects}
              onCreateProject={() => setCreateDialogOpen(true)}
              onProjectSelect={handleProjectClick}
            />
          )}
        </div>
      </div>

      <DashboardDialogs
        createDialogOpen={createDialogOpen}
        setCreateDialogOpen={setCreateDialogOpen}
        {...actions}
      />
    </>
  );
}

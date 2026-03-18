import React from "react";
import { useTranslation } from "react-i18next";
import { FileText, Plus, FolderOpen } from "lucide-react";

import { Button, Text } from "../../components/primitives";
import { invoke } from "../../lib/ipcClient";
import type { ProjectListItem } from "../../stores/projectStore";

// =============================================================================
// Types
// =============================================================================

interface DashboardSidebarProps {
  projects: ProjectListItem[];
  onCreateProject: () => void;
  onProjectSelect: (projectId: string) => void;
}

// =============================================================================
// StatItem
// =============================================================================

function StatItem(props: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <span
        className="uppercase tracking-[var(--text-label-letter-spacing)] text-[var(--color-fg-muted)] font-[var(--text-label-weight)]"
        style={{ fontSize: "var(--text-label-size)" }}
      >
        {props.label}
      </span>
      <span
        className="text-[var(--color-fg-default)]"
        style={{
          fontSize: "var(--text-subtitle-size)",
          fontFamily: "var(--font-family-mono)",
        }}
      >
        {props.value}
      </span>
    </div>
  );
}

// =============================================================================
// DashboardSidebar
// =============================================================================

/**
 * DashboardSidebar — Right context panel: recent documents, quick actions, statistics.
 *
 * Layout per design mockup `05-dashboard-sidebar-full.html` .context-panel spec.
 * Stat values use monospace font (AC-5: monospace meta).
 */
export function DashboardSidebar(props: DashboardSidebarProps): JSX.Element {
  const { t } = useTranslation();
  const { projects, onCreateProject, onProjectSelect } = props;

  const recentDocs = React.useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [projects],
  );

  const totalProjects = projects.length;

  return (
    <aside
      data-testid="dashboard-sidebar"
      className="w-70 border-l border-[var(--color-separator)] p-[var(--space-6)] flex flex-col gap-[var(--space-12)] bg-[var(--color-bg-base)] shrink-0"
    >
      {/* Recent Documents */}
      <div>
        <div
          className="uppercase tracking-[var(--text-label-letter-spacing)] text-[var(--color-fg-muted)] mb-[var(--space-4)] font-[var(--text-label-weight)]"
          style={{ fontSize: "var(--text-label-size)" }}
        >
          {t("dashboard.sidebar.recentDocs")}
        </div>
        <ul className="flex flex-col gap-[var(--space-2)]">
          {recentDocs.map((project) => (
            <li key={project.projectId}>
              <Button
                variant="ghost"
                size="sm"
                aria-label={project.name || t("dashboard.untitledProject")}
                onClick={() => onProjectSelect(project.projectId)}
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <Text size="small" color="muted" className="truncate">
                  {project.name || t("dashboard.untitledProject")}
                </Text>
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div>
        <div
          className="uppercase tracking-[var(--text-label-letter-spacing)] text-[var(--color-fg-muted)] mb-[var(--space-4)] font-[var(--text-label-weight)]"
          style={{ fontSize: "var(--text-label-size)" }}
        >
          {t("dashboard.sidebar.quickActions")}
        </div>
        <div className="flex flex-col gap-[var(--space-2)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateProject}
            className="justify-start"
            aria-label={t("dashboard.sidebar.newProject")}
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            {t("dashboard.sidebar.newProject")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={async () => {
              await invoke("dialog:folder:open", {});
            }}
            aria-label={t("dashboard.sidebar.openFolder")}
          >
            <FolderOpen className="w-4 h-4" strokeWidth={1.5} />
            {t("dashboard.sidebar.openFolder")}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-separator)]" />

      {/* Statistics (AC-5: stat display + monospace meta) */}
      <div>
        <div
          className="uppercase tracking-[var(--text-label-letter-spacing)] text-[var(--color-fg-muted)] mb-[var(--space-4)] font-[var(--text-label-weight)]"
          style={{ fontSize: "var(--text-label-size)" }}
        >
          {t("dashboard.sidebar.statistics")}
        </div>
        <div className="flex flex-col gap-[var(--space-5)]">
          <StatItem
            label={t("dashboard.sidebar.totalProjects")}
            value={String(totalProjects)}
          />
        </div>
      </div>
    </aside>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, FilePlus } from "lucide-react";

import {
  Button,
  DropdownMenu,
  ContextMenu,
  type DropdownMenuItem,
  type ContextMenuItem,
} from "../../components/primitives";
import type { ProjectListItem } from "../../stores/projectStore";
import { formatDate, formatStageTag } from "./dashboardUtils";

// =============================================================================
// Helper Components
// =============================================================================

function MoreIcon(): JSX.Element {
  return <MoreHorizontal className="w-4 h-4" size={16} strokeWidth={1.5} />;
}

/**
 * SectionTitle — Consistent section header with optional action.
 */
export function SectionTitle(props: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={`text-sm font-medium text-[var(--color-fg-default)] mb-[var(--space-6)] flex justify-between items-center ${props.className ?? ""}`}
    >
      <span>{props.children}</span>
      {props.action}
    </div>
  );
}

// =============================================================================
// ProjectCard
// =============================================================================

/**
 * ProjectCard — Standard project card for the grid.
 *
 * Hover effect: border brightening + shadow elevation dual feedback (AC-4).
 * Menu trigger + archived toggle use Button primitive (AC-3).
 */
export function ProjectCard(props: {
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
      className="border border-transparent p-[var(--space-6)] h-50 flex flex-col cursor-pointer transition-[border-color,background-color,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-default)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)] hover:shadow-sm"
    >
      <div className="flex justify-between items-start mb-(--space-4)">
        <div
          className="uppercase tracking-(--text-label-letter-spacing) text-(--color-fg-muted) font-(--text-label-weight)"
          style={{ fontSize: "var(--text-label-size)" }}
        >
          {dateStr}
        </div>
        <DropdownMenu
          trigger={
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              data-testid="project-card-menu-trigger"
            >
              <MoreIcon />
            </Button>
          }
          items={menuItems}
          testId="project-card-menu"
        />
      </div>

      <h3
        className="text-[var(--color-fg-default)] mb-[var(--space-2)] leading-snug line-clamp-2 font-[var(--text-card-title-weight)]"
        style={{
          fontSize: "var(--text-card-title-size)",
          letterSpacing: "var(--text-card-title-letter-spacing)",
        }}
      >
        {project.name || t("dashboard.untitledProject")}
      </h3>

      <p
        className="text-(--color-fg-muted) leading-relaxed line-clamp-3 flex-1"
        style={{ fontSize: "var(--text-body-size)" }}
      >
        {t("dashboard.openProjectHint")}
      </p>

      <div className="mt-auto pt-[var(--space-4)] border-t border-[var(--color-separator)] flex justify-between items-center">
        <span
          className="uppercase text-[var(--color-fg-faint)]"
          style={{
            fontSize: "var(--text-status-size)",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {formatStageTag(project.stage, t)}
        </span>
      </div>
    </div>
  );

  return <ContextMenu items={menuItems}>{cardContent}</ContextMenu>;
}

// =============================================================================
// NewDraftCard
// =============================================================================

/**
 * NewDraftCard — Dashed card for creating new projects.
 * Includes plus-grid decoration pattern (AC-5).
 */
export function NewDraftCard(props: { onClick: () => void }): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      data-testid="dashboard-new-draft"
      onClick={props.onClick}
      onKeyDown={(e) => e.key === "Enter" && props.onClick()}
      role="button"
      tabIndex={0}
      className="group relative border-2 border-dashed border-[var(--color-separator)] p-[var(--space-6)] h-50 flex flex-col items-center justify-center cursor-pointer opacity-50 hover:opacity-100 hover:border-[var(--color-fg-muted)] transition-[opacity,border-color] duration-[var(--duration-slow)] ease-[var(--ease-default)] overflow-hidden"
    >
      {/* Plus-grid decoration pattern (AC-5) */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-slow)]">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[var(--color-fg-faint)] opacity-20"
            style={{ fontSize: "var(--text-caption-size)" }}
          >
            +
          </div>
        ))}
      </div>
      <FilePlus
        className="w-[var(--space-8)] h-[var(--space-8)] text-[var(--color-fg-faint)] mb-[var(--space-3)] relative"
        strokeWidth={1.5}
      />
      <div
        className="uppercase tracking-(--text-label-letter-spacing) text-(--color-fg-muted) relative font-(--text-label-weight)"
        style={{ fontSize: "var(--text-label-size)" }}
      >
        {t("dashboard.newDraft")}
      </div>
    </div>
  );
}

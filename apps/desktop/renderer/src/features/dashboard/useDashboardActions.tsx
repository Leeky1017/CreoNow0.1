import React from "react";
import { useTranslation } from "react-i18next";

import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { CreateProjectDialog } from "../projects/CreateProjectDialog";
import { DeleteProjectDialog } from "../projects/DeleteProjectDialog";
import { RenameProjectDialog } from "./RenameProjectDialog";
import {
  useProjectStore,
  type ProjectListItem,
} from "../../stores/projectStore";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import type { UseConfirmDialogReturn } from "../../hooks/useConfirmDialog";
import { getHumanErrorMessage } from "../../lib/errorMessages";

// =============================================================================
// useDashboardActions
// =============================================================================

/**
 * Encapsulates rename, duplicate, archive, and delete action state/handlers.
 */
export function useDashboardActions() {
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

// =============================================================================
// DashboardDialogs
// =============================================================================

/**
 * Renders the create / rename / delete / system dialog cluster.
 */
export function DashboardDialogs(props: {
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

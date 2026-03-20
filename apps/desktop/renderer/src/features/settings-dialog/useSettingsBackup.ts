import React from "react";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "../../stores/projectStore";
import { useAppToast } from "../../components/providers/AppToastProvider";
import { invoke } from "../../lib/ipcClient";

/**
 * Custom hook encapsulating manual backup & restore logic.
 */
export function useSettingsBackup() {
  const { t } = useTranslation();
  const { showToast } = useAppToast();
  const currentProjectId = useProjectStore((s) => s.current?.projectId ?? null);

  const [manualBackupLoading, setManualBackupLoading] =
    React.useState<boolean>(false);
  const [manualRestoreLoading, setManualRestoreLoading] =
    React.useState<boolean>(false);

  const handleManualBackup = React.useCallback(async () => {
    if (!currentProjectId) {
      showToast({
        title: t("toast.settings.backup.noProject.title"),
        variant: "warning",
      });
      return;
    }

    setManualBackupLoading(true);
    try {
      const label = `manual-${new Date().toISOString()}`;
      const result = await invoke("backup:snapshot:create", {
        projectId: currentProjectId,
        label,
      });
      if (!result.ok) {
        showToast({
          title: t("toast.settings.backup.createError.title"),
          description: result.error.message,
          variant: "error",
        });
        return;
      }
      showToast({
        title: t("toast.settings.backup.createSuccess.title"),
        variant: "success",
      });
    } finally {
      setManualBackupLoading(false);
    }
  }, [currentProjectId, showToast, t]);

  const handleManualRestore = React.useCallback(async () => {
    if (!currentProjectId) {
      showToast({
        title: t("toast.settings.backup.noProject.title"),
        variant: "warning",
      });
      return;
    }

    setManualRestoreLoading(true);
    try {
      const listResult = await invoke("backup:snapshot:list", {
        projectId: currentProjectId,
      });
      if (!listResult.ok) {
        showToast({
          title: t("toast.settings.backup.restoreError.title"),
          description: listResult.error.message,
          variant: "error",
        });
        return;
      }

      const latest = listResult.data[0];
      if (!latest) {
        showToast({
          title: t("toast.settings.backup.noSnapshot.title"),
          variant: "warning",
        });
        return;
      }

      const restoreResult = await invoke("backup:snapshot:restore", {
        backupId: latest.id,
      });
      if (!restoreResult.ok) {
        showToast({
          title: t("toast.settings.backup.restoreError.title"),
          description: restoreResult.error.message,
          variant: "error",
        });
        return;
      }

      showToast({
        title: t("toast.settings.backup.restoreSuccess.title"),
        variant: "success",
      });
    } finally {
      setManualRestoreLoading(false);
    }
  }, [currentProjectId, showToast, t]);

  return {
    currentProjectId,
    manualBackupLoading,
    manualRestoreLoading,
    handleManualBackup,
    handleManualRestore,
  };
}

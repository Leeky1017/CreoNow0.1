import React from "react";
import { useTranslation } from "react-i18next";

import { useAppToast } from "../components/providers/AppToastProvider";
import { useEditorStore } from "../stores/editorStore";
import { useOptionalAiStore } from "../stores/aiStore";

/**
 * useAutoSaveToast — 监听 editorStore.autosaveStatus 变化，触发 Toast
 *
 * - "error" → error toast with retry action（同一 documentId 连续失败仅触发一次）
 * - retry 成功 → success toast（"保存已恢复"）
 */
export function useAutoSaveToast(): void {
  const { t } = useTranslation();
  const { showToast } = useAppToast();
  const autosaveStatus = useEditorStore((s) => s.autosaveStatus);
  const documentId = useEditorStore((s) => s.documentId);
  const retryLastAutosave = useEditorStore((s) => s.retryLastAutosave);
  const prevStatusRef = React.useRef(autosaveStatus);
  const errorToastedDocIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = autosaveStatus;

    if (prev === autosaveStatus) {
      return;
    }

    if (autosaveStatus === "error") {
      // 同一文档连续失败只触发一次 Toast
      if (errorToastedDocIdRef.current === documentId) {
        return;
      }
      errorToastedDocIdRef.current = documentId;

      showToast({
        title: t("autosave.toast.error.title"),
        description: t("autosave.toast.error.description"),
        variant: "error",
        action: {
          label: t("autosave.toast.error.retry"),
          onClick: () => {
            retryLastAutosave();
          },
        },
      });
    } else if (autosaveStatus === "saved" && prev === "saving") {
      // 仅在从 error→saving→saved 路径（重试成功）时显示恢复 Toast
      // 清除去重标记以允许后续失败再触发
      if (errorToastedDocIdRef.current !== null) {
        errorToastedDocIdRef.current = null;
        showToast({
          title: t("autosave.toast.retrySuccess.title"),
          variant: "success",
        });
      }
    }
  }, [autosaveStatus, documentId, showToast, t, retryLastAutosave]);

  // 文档切换时重置去重标记
  React.useEffect(() => {
    errorToastedDocIdRef.current = null;
  }, [documentId]);
}

/**
 * useAiErrorToast — 监听 aiStore.status 变化到 "error"，触发 Toast
 */
export function useAiErrorToast(): void {
  const { t } = useTranslation();
  const { showToast } = useAppToast();
  const aiStatus = useOptionalAiStore((s) => s.status) ?? "idle";
  const prevStatusRef = React.useRef(aiStatus);

  React.useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = aiStatus;

    if (prev === aiStatus) {
      return;
    }

    if (aiStatus === "error") {
      showToast({
        title: t("toast.ai.error.title"),
        description: t("toast.ai.error.description"),
        variant: "error",
      });
    }
  }, [aiStatus, showToast, t]);
}

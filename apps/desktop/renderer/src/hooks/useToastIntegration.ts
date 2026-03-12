import React from "react";
import { useTranslation } from "react-i18next";

import { useAppToast } from "../components/providers/AppToastProvider";
import { useEditorStore } from "../stores/editorStore";
import { useOptionalAiStore } from "../stores/aiStore";

/**
 * useAutoSaveToast — 监听 editorStore.autosaveStatus 变化，触发 Toast
 *
 * - "saved" → success toast
 * - "error" → error toast with retry action (deduped per documentId)
 */
export function useAutoSaveToast(): void {
  const { t } = useTranslation();
  const { showToast } = useAppToast();
  const autosaveStatus = useEditorStore((s) => s.autosaveStatus);
  const documentId = useEditorStore((s) => s.documentId);
  const retryLastAutosave = useEditorStore((s) => s.retryLastAutosave);
  const prevStatusRef = React.useRef(autosaveStatus);
  const lastErrorDocIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = autosaveStatus;

    // 只在状态真正变化时触发
    if (prev === autosaveStatus) {
      return;
    }

    if (autosaveStatus === "saved") {
      // 如果之前是 error → saved，说明 retry 成功
      if (prev === "error") {
        lastErrorDocIdRef.current = null;
        showToast({
          title: t("toast.autosave.retrySuccess.title"),
          variant: "success",
        });
      } else {
        showToast({
          title: t("toast.save.success.title"),
          variant: "success",
        });
      }
    } else if (autosaveStatus === "error") {
      // Dedup: 同一 documentId 连续失败只弹一次 toast
      if (lastErrorDocIdRef.current === documentId) {
        return;
      }
      lastErrorDocIdRef.current = documentId;

      showToast({
        title: t("toast.save.error.title"),
        description: t("toast.save.error.description"),
        variant: "error",
        action: {
          label: t("toast.save.error.retry"),
          onClick: () => {
            retryLastAutosave();
          },
        },
      });
    } else {
      // 非 error 状态时重置 dedup 标记
      if (autosaveStatus !== "saving") {
        lastErrorDocIdRef.current = null;
      }
    }
  }, [autosaveStatus, documentId, showToast, t, retryLastAutosave]);
}

/**
 * useFlushErrorToast — 监听文档切换时 flush 失败，显示警告 toast
 *
 * 当 autosaveError 存在且 documentId 发生变化时触发
 */
export function useFlushErrorToast(): void {
  const { t } = useTranslation();
  const { showToast } = useAppToast();
  const autosaveError = useEditorStore((s) => s.autosaveError);
  const documentId = useEditorStore((s) => s.documentId);
  const prevDocIdRef = React.useRef(documentId);

  React.useEffect(() => {
    const prevDocId = prevDocIdRef.current;
    prevDocIdRef.current = documentId;

    // 文档切换后，如果仍有 autosaveError，说明上一篇的 flush 失败
    if (prevDocId !== null && documentId !== prevDocId && autosaveError) {
      showToast({
        title: t("toast.autosave.flushError.title"),
        description: t("toast.autosave.flushError.description"),
        variant: "warning",
      });
    }
  }, [documentId, autosaveError, showToast, t]);
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

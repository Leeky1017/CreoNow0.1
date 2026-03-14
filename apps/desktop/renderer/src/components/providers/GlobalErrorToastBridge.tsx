import React from "react";
import { useTranslation } from "react-i18next";

import { useAppToast } from "./AppToastProvider";

/**
 * GlobalErrorToastBridge — 桥接全局错误兜底与 Toast
 *
 * 监听 window 上的 `cn:global-error-toast` custom event，
 * 由 installGlobalErrorHandlers 的 onToast 回调触发。
 * 将事件转化为 error variant Toast 通知。
 */
export function GlobalErrorToastBridge(): null {
  const { showToast } = useAppToast();
  const { t } = useTranslation();

  React.useEffect(() => {
    function onGlobalErrorToast(): void {
      showToast({
        title: t("globalError.toast.title"),
        description: t("globalError.toast.description"),
        variant: "error",
      });
    }

    window.addEventListener("cn:global-error-toast", onGlobalErrorToast);
    return () => {
      window.removeEventListener("cn:global-error-toast", onGlobalErrorToast);
    };
  }, [showToast, t]);

  return null;
}

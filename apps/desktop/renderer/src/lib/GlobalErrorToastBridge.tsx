import React from "react";
import { useTranslation } from "react-i18next";

import { useToast, Toast, ToastProvider, ToastViewport } from "../components/primitives";
import {
  GLOBAL_ERROR_TOAST_EVENT,
  type GlobalErrorToastDetail,
} from "./globalErrorHandlers";

/**
 * React bridge that listens for global error toast events
 * dispatched by installGlobalErrorHandlers (which runs outside React)
 * and renders them via the Toast primitive.
 */
export function GlobalErrorToastBridge(): JSX.Element {
  const { t } = useTranslation();
  const { toast, showToast, setOpen } = useToast();

  React.useEffect(() => {
    function handler(event: Event): void {
      const detail = (event as CustomEvent<GlobalErrorToastDetail>).detail;
      if (!detail) {
        return;
      }
      showToast({
        title: t("globalError.toast.title"),
        description: t("globalError.toast.description"),
        variant: "error",
      });
    }

    window.addEventListener(GLOBAL_ERROR_TOAST_EVENT, handler);
    return () => {
      window.removeEventListener(GLOBAL_ERROR_TOAST_EVENT, handler);
    };
  }, [showToast, t]);

  return (
    <ToastProvider>
      <Toast
        open={toast.open}
        onOpenChange={setOpen}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />
      <ToastViewport />
    </ToastProvider>
  );
}

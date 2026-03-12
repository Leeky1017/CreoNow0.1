import "./styles/main.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { App } from "./App";
import { ErrorBoundary } from "./components/patterns";
import { i18n } from "./i18n";
import {
  installGlobalErrorHandlers,
  type GlobalErrorEntry,
} from "./lib/globalErrorHandlers";
import { fireGlobalErrorToast } from "./lib/globalErrorToastBridge";

// ─── 全局错误兜底（AC-8: 在 ReactDOM.createRoot().render() 之前注册）───

installGlobalErrorHandlers({
  onError: (entry: GlobalErrorEntry) => {
    const invoke = window.creonow?.invoke;
    if (invoke) {
      invoke("log:renderererror:write", {
        source: entry.source,
        name: entry.name,
        message: entry.message,
        stack: entry.stack,
        timestamp: entry.timestamp,
      }).catch((err: unknown) => {
        console.error("Failed to log renderer error via IPC", err);
      });
    }
  },
  onToast: () => {
    fireGlobalErrorToast({
      title: i18n.t("globalError.toast.title"),
      description: i18n.t("globalError.toast.description"),
    });
  },
});

// Signal that React app has mounted
if (typeof window.__CN_E2E__ !== "object") {
  window.__CN_E2E__ = { ready: true };
} else {
  window.__CN_E2E__.ready = true;
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

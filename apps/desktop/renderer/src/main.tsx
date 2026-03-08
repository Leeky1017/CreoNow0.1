import "./styles/main.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { App } from "./App";
import { ErrorBoundary } from "./components/patterns";
import { i18n } from "./i18n";
import {
  installGlobalErrorHandlers,
  GLOBAL_ERROR_TOAST_EVENT,
  type GlobalErrorToastDetail,
} from "./lib/globalErrorHandlers";
import { invoke } from "./lib/ipcClient";

// Install global error handlers BEFORE React mount (AC-8)
installGlobalErrorHandlers({
  onError: (entry) => {
    try {
      void invoke("log:renderer-error", {
        source: entry.source,
        name: entry.name,
        message: entry.message,
        stack: entry.stack,
        timestamp: entry.timestamp,
      }).catch((err: unknown) => {
        console.error("[globalErrorHandler] IPC log failed:", err);
      });
    } catch (err) {
      console.error("[globalErrorHandler] IPC log sync error:", err);
    }
  },
  showToast: (title, description) => {
    const detail: GlobalErrorToastDetail = { title, description };
    window.dispatchEvent(
      new CustomEvent(GLOBAL_ERROR_TOAST_EVENT, { detail }),
    );
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

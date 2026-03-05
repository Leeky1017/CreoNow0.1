import React from "react";
import { useTranslation } from "react-i18next";

import { invoke } from "../../lib/ipcClient";
import { useProjectStore } from "../../stores/projectStore";

type WindowControlState = {
  controlsEnabled: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
  platform: string;
};

function MinimizeIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6.75h8v1.5H2z" fill="currentColor" />
    </svg>
  );
}

function MaximizeIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect
        x="2.25"
        y="2.25"
        width="7.5"
        height="7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RestoreIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M4 2.25h5.75v5.75H8.25v1.5H2.25V3.75H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M4 2.25v1.5h4.25V8h1.5V2.25z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.47 3.53L3.53 2.47 6 4.94l2.47-2.47 1.06 1.06L7.06 6l2.47 2.47-1.06 1.06L6 7.06 3.53 9.53 2.47 8.47 4.94 6z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Frameless window title bar used on Windows builds.
 *
 * Why: BrowserWindow frame is disabled on Windows and we need custom drag area
 * and control buttons in renderer.
 */
export function WindowTitleBar(): JSX.Element | null {
  const { t } = useTranslation();
  const currentProjectId = useProjectStore((s) => s.current?.projectId ?? null);
  const projectItems = useProjectStore((s) => s.items);
  const [state, setState] = React.useState<WindowControlState | null>(null);
  const currentProjectName = React.useMemo(() => {
    if (!currentProjectId) {
      return null;
    }
    return (
      projectItems.find((item) => item.projectId === currentProjectId)?.name ??
      null
    );
  }, [currentProjectId, projectItems]);

  const refreshWindowState = React.useCallback(async () => {
    const response = await invoke("app:window:getstate", {});
    if (!response.ok) {
      setState(null);
      return;
    }
    setState(response.data);
  }, []);

  React.useEffect(() => {
    void refreshWindowState();
  }, [refreshWindowState]);

  React.useEffect(() => {
    function onResize(): void {
      void refreshWindowState();
    }

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [refreshWindowState]);

  const handleMinimize = React.useCallback(async () => {
    await invoke("app:window:minimize", {});
  }, []);

  const handleToggleMaximized = React.useCallback(async () => {
    const result = await invoke("app:window:togglemaximized", {});
    if (result.ok) {
      await refreshWindowState();
    }
  }, [refreshWindowState]);

  const handleClose = React.useCallback(async () => {
    await invoke("app:window:close", {});
  }, []);

  if (!state?.controlsEnabled) {
    return null;
  }

  return (
    <header
      data-testid="window-titlebar"
      className="cn-window-titlebar cn-window-drag"
      onDoubleClick={() => void handleToggleMaximized()}
    >
      <div className="cn-window-titlebar__title">
        {currentProjectName ?? "CreoNow"}
      </div>

      <div className="cn-window-controls cn-window-no-drag">
        <button
          type="button"
          className="cn-window-control-btn"
          aria-label={t('workbench.titleBar.minimize')}
          onClick={() => void handleMinimize()}
        >
          <MinimizeIcon />
        </button>

        <button
          type="button"
          className="cn-window-control-btn"
          aria-label={state.isMaximized ? "Restore" : "Maximize"}
          onClick={() => void handleToggleMaximized()}
        >
          {state.isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>

        <button
          type="button"
          className="cn-window-control-btn cn-window-control-btn--close"
          aria-label={t('workbench.titleBar.close')}
          onClick={() => void handleClose()}
        >
          <CloseIcon />
        </button>
      </div>
    </header>
  );
}

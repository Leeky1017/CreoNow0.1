import React from "react";

import { LAYOUT_DEFAULTS, useLayoutStore } from "../../stores/layoutStore";
import {
  clamp,
  computePanelMax,
  computeSidebarMax,
} from "./appShellLayoutHelpers";
import { Resizer } from "./Resizer";

export function computeNextSidebarWidth(args: {
  deltaX: number;
  startWidth: number;
  windowWidth: number;
  panelWidth: number;
  panelCollapsed: boolean;
}): number {
  const nextRaw = args.startWidth + args.deltaX;
  const max = computeSidebarMax(
    args.windowWidth,
    args.panelWidth,
    args.panelCollapsed,
  );
  return clamp(nextRaw, LAYOUT_DEFAULTS.sidebar.min, max);
}

export function computeNextPanelWidth(args: {
  deltaX: number;
  startWidth: number;
  windowWidth: number;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
}): number {
  const nextRaw = args.startWidth - args.deltaX;
  const max = computePanelMax(
    args.windowWidth,
    args.sidebarWidth,
    args.sidebarCollapsed,
  );
  return clamp(nextRaw, LAYOUT_DEFAULTS.panel.min, max);
}

export type PanelVisibilityActions = {
  toggleSidebar: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
  toggleRightPanel: () => void;
  expandRightPanel: () => void;
  collapseRightPanel: () => void;
};

export function usePanelVisibilityActions(): PanelVisibilityActions {
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const panelCollapsed = useLayoutStore((s) => s.panelCollapsed);
  const setSidebarCollapsed = useLayoutStore((s) => s.setSidebarCollapsed);
  const setPanelCollapsed = useLayoutStore((s) => s.setPanelCollapsed);

  return React.useMemo(
    () => ({
      toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
      expandSidebar: () => setSidebarCollapsed(false),
      collapseSidebar: () => setSidebarCollapsed(true),
      toggleRightPanel: () => setPanelCollapsed(!panelCollapsed),
      expandRightPanel: () => setPanelCollapsed(false),
      collapseRightPanel: () => setPanelCollapsed(true),
    }),
    [panelCollapsed, setPanelCollapsed, setSidebarCollapsed, sidebarCollapsed],
  );
}

type PanelOrchestratorRenderState = {
  sidebarCollapsed: boolean;
  panelCollapsed: boolean;
  effectiveSidebarWidth: number;
  effectivePanelWidth: number;
  sidebarResizer: React.ReactNode;
  panelResizer: React.ReactNode;
  panelVisibility: PanelVisibilityActions;
};

type PanelOrchestratorProps = {
  children: (state: PanelOrchestratorRenderState) => React.ReactNode;
};

/**
 * PanelOrchestrator is the only place that performs panel sizing orchestration.
 *
 * It owns width constraints, collapse affordances, and editor min-width protection.
 */
export function PanelOrchestrator(props: PanelOrchestratorProps): JSX.Element {
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth);
  const panelWidth = useLayoutStore((s) => s.panelWidth);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const panelCollapsed = useLayoutStore((s) => s.panelCollapsed);
  const panelVisibility = usePanelVisibilityActions();

  const setSidebarWidth = useLayoutStore((s) => s.setSidebarWidth);
  const setPanelWidth = useLayoutStore((s) => s.setPanelWidth);
  const resetSidebarWidth = useLayoutStore((s) => s.resetSidebarWidth);
  const resetPanelWidth = useLayoutStore((s) => s.resetPanelWidth);

  const effectiveSidebarWidth = sidebarCollapsed ? 0 : sidebarWidth;
  const effectivePanelWidth = panelCollapsed ? 0 : panelWidth;

  const sidebarResizer = !sidebarCollapsed ? (
    <Resizer
      testId="resize-handle-sidebar"
      onDrag={(deltaX, startWidth) =>
        computeNextSidebarWidth({
          deltaX,
          startWidth,
          windowWidth: window.innerWidth,
          panelWidth,
          panelCollapsed,
        })
      }
      onCommit={(nextWidth) => setSidebarWidth(nextWidth)}
      onDoubleClick={() => resetSidebarWidth()}
      getStartWidth={() => sidebarWidth}
    />
  ) : null;

  const panelResizer = !panelCollapsed ? (
    <Resizer
      testId="resize-handle-panel"
      onDrag={(deltaX, startWidth) =>
        computeNextPanelWidth({
          deltaX,
          startWidth,
          windowWidth: window.innerWidth,
          sidebarWidth,
          sidebarCollapsed,
        })
      }
      onCommit={(nextWidth) => setPanelWidth(nextWidth)}
      onDoubleClick={() => resetPanelWidth()}
      getStartWidth={() => panelWidth}
    />
  ) : null;

  return (
    <>
      {props.children({
        sidebarCollapsed,
        panelCollapsed,
        effectiveSidebarWidth,
        effectivePanelWidth,
        sidebarResizer,
        panelResizer,
        panelVisibility,
      })}
    </>
  );
}

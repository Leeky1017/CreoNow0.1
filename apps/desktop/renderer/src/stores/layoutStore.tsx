import React from "react";
import { create } from "zustand";
import { z } from "zod";

import type { PreferenceStore } from "../lib/preferences";

const APP_ID = "creonow" as const;

export const LAYOUT_DEFAULTS = {
  iconBarWidth: 48,
  statusBarHeight: 28,
  sidebar: { min: 180, max: 400, default: 240 },
  panel: { min: 280, max: 480, default: 320 },
  mainMinWidth: 400,
} as const;

/**
 * Left panel view types.
 *
 * Each type corresponds to an icon in IconBar and a view in LeftPanel.
 */
export type LeftPanelType = "files" | "outline";

export type DialogType =
  | "memory"
  | "characters"
  | "knowledgeGraph"
  | "versionHistory";

/**
 * Right panel tab types.
 *
 * Only AI Assistant, Info, and Quality Gates are shown in the right panel.
 */
export type RightPanelType = "ai" | "info" | "quality";

export type LayoutState = {
  sidebarWidth: number;
  panelWidth: number;
  sidebarCollapsed: boolean;
  panelCollapsed: boolean;
  zenMode: boolean;
  activeLeftPanel: LeftPanelType;
  activeRightPanel: RightPanelType;
  dialogType: DialogType | null;
  spotlightOpen: boolean;
  layoutResetNotice: boolean;
};

export type LayoutActions = {
  setSidebarWidth: (width: number) => void;
  setPanelWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  setZenMode: (enabled: boolean) => void;
  resetSidebarWidth: () => void;
  resetPanelWidth: () => void;
  setActiveLeftPanel: (panel: LeftPanelType) => void;
  setDialogType: (dialog: DialogType | null) => void;
  setSpotlightOpen: (open: boolean) => void;
  /**
   * Set the active right panel tab.
   *
   * If the panel is collapsed, it will be automatically expanded.
   */
  setActiveRightPanel: (panel: RightPanelType) => void;
  dismissLayoutResetNotice: () => void;
};

export type LayoutStore = LayoutState & LayoutActions;

export type UseLayoutStore = ReturnType<typeof createLayoutStore>;

const LayoutStoreContext = React.createContext<UseLayoutStore | null>(null);

/**
 * Build a strongly-typed preference key for layout settings.
 */
function prefKey(
  name:
    | "sidebarWidth"
    | "panelWidth"
    | "sidebarCollapsed"
    | "panelCollapsed"
    | "activeRightPanel"
    | "activeLeftPanel",
): `${typeof APP_ID}.layout.${typeof name}` {
  return `${APP_ID}.layout.${name}` as const;
}

const LEFT_PANEL_VALUES = ["files", "outline"] as const;

const RIGHT_PANEL_VALUES = ["ai", "info", "quality"] as const;

const sidebarWidthSchema = z
  .number()
  .min(LAYOUT_DEFAULTS.sidebar.min)
  .max(LAYOUT_DEFAULTS.sidebar.max);
const panelWidthSchema = z
  .number()
  .min(LAYOUT_DEFAULTS.panel.min)
  .max(LAYOUT_DEFAULTS.panel.max);
const booleanSchema = z.boolean();
const leftPanelSchema = z.enum(LEFT_PANEL_VALUES);
const rightPanelSchema = z.enum(RIGHT_PANEL_VALUES);

/**
 * Create a zustand store for layout.
 *
 * Why: layout state must be shared between AppShell and resizers, and must
 * persist synchronously to keep E2E stable and avoid drag jank.
 */
export function createLayoutStore(preferences: PreferenceStore) {
  let zenRestore: {
    sidebarCollapsed: boolean;
    panelCollapsed: boolean;
  } | null = null;

  let hadReset = false;

  function validateOrDefault<T>(
    schema: z.ZodType<T>,
    raw: unknown,
    fallback: T,
    key: string,
  ): T {
    const result = schema.safeParse(raw);
    if (result.success) {
      return result.data;
    }
    hadReset = true;
    preferences.set(key as Parameters<typeof preferences.set>[0], fallback);
    return fallback;
  }

  const rawSidebarWidth = preferences.get<unknown>(prefKey("sidebarWidth"));
  const initialSidebarWidth =
    rawSidebarWidth == null
      ? LAYOUT_DEFAULTS.sidebar.default
      : validateOrDefault(
          sidebarWidthSchema,
          rawSidebarWidth,
          LAYOUT_DEFAULTS.sidebar.default,
          prefKey("sidebarWidth"),
        );

  const rawPanelWidth = preferences.get<unknown>(prefKey("panelWidth"));
  const initialPanelWidth =
    rawPanelWidth == null
      ? LAYOUT_DEFAULTS.panel.default
      : validateOrDefault(
          panelWidthSchema,
          rawPanelWidth,
          LAYOUT_DEFAULTS.panel.default,
          prefKey("panelWidth"),
        );

  const rawSidebarCollapsed = preferences.get<unknown>(
    prefKey("sidebarCollapsed"),
  );
  const initialSidebarCollapsed =
    rawSidebarCollapsed == null
      ? false
      : validateOrDefault(
          booleanSchema,
          rawSidebarCollapsed,
          false,
          prefKey("sidebarCollapsed"),
        );

  const rawPanelCollapsed = preferences.get<unknown>(prefKey("panelCollapsed"));
  const initialPanelCollapsed =
    rawPanelCollapsed == null
      ? false
      : validateOrDefault(
          booleanSchema,
          rawPanelCollapsed,
          false,
          prefKey("panelCollapsed"),
        );

  const rawActiveRightPanel = preferences.get<unknown>(
    prefKey("activeRightPanel"),
  );
  const initialActiveRightPanel =
    rawActiveRightPanel == null
      ? "ai"
      : validateOrDefault(
          rightPanelSchema,
          rawActiveRightPanel,
          "ai" as RightPanelType,
          prefKey("activeRightPanel"),
        );

  const rawActiveLeftPanel = preferences.get<unknown>(
    prefKey("activeLeftPanel"),
  );
  const initialActiveLeftPanel =
    rawActiveLeftPanel == null
      ? "files"
      : validateOrDefault(
          leftPanelSchema,
          rawActiveLeftPanel,
          "files" as LeftPanelType,
          prefKey("activeLeftPanel"),
        );

  return create<LayoutStore>((set, get) => ({
    sidebarWidth: initialSidebarWidth,
    panelWidth: initialPanelWidth,
    sidebarCollapsed: initialSidebarCollapsed,
    panelCollapsed: initialPanelCollapsed,
    zenMode: false,
    activeLeftPanel: initialActiveLeftPanel,
    activeRightPanel: initialActiveRightPanel,
    dialogType: null,
    spotlightOpen: false,
    layoutResetNotice: hadReset,

    setSidebarWidth: (width) => {
      set({ sidebarWidth: width });
      preferences.set(prefKey("sidebarWidth"), width);
    },
    setPanelWidth: (width) => {
      set({ panelWidth: width });
      preferences.set(prefKey("panelWidth"), width);
    },
    setSidebarCollapsed: (collapsed) => {
      set({ sidebarCollapsed: collapsed });
      preferences.set(prefKey("sidebarCollapsed"), collapsed);
    },
    setPanelCollapsed: (collapsed) => {
      set({ panelCollapsed: collapsed });
      preferences.set(prefKey("panelCollapsed"), collapsed);
    },
    setZenMode: (enabled) => {
      if (enabled) {
        const current = get();
        if (current.zenMode) {
          return;
        }
        zenRestore = {
          sidebarCollapsed: current.sidebarCollapsed,
          panelCollapsed: current.panelCollapsed,
        };
        set({ zenMode: true, sidebarCollapsed: true, panelCollapsed: true });
        return;
      }

      const current = get();
      if (!current.zenMode) {
        return;
      }

      set({
        zenMode: false,
        sidebarCollapsed:
          zenRestore?.sidebarCollapsed ?? current.sidebarCollapsed,
        panelCollapsed: zenRestore?.panelCollapsed ?? current.panelCollapsed,
      });
      zenRestore = null;
    },
    resetSidebarWidth: () => {
      set({ sidebarWidth: LAYOUT_DEFAULTS.sidebar.default });
      preferences.set(prefKey("sidebarWidth"), LAYOUT_DEFAULTS.sidebar.default);
    },
    resetPanelWidth: () => {
      set({ panelWidth: LAYOUT_DEFAULTS.panel.default });
      preferences.set(prefKey("panelWidth"), LAYOUT_DEFAULTS.panel.default);
    },
    setActiveLeftPanel: (panel) => {
      set({ activeLeftPanel: panel });
      preferences.set(prefKey("activeLeftPanel"), panel);
    },
    setDialogType: (dialog) => {
      set({ dialogType: dialog });
    },
    setSpotlightOpen: (open) => {
      set({ spotlightOpen: open });
    },
    setActiveRightPanel: (panel) => {
      const current = get();
      // Auto-expand if collapsed when switching tabs
      if (current.panelCollapsed) {
        set({ activeRightPanel: panel, panelCollapsed: false });
      } else {
        set({ activeRightPanel: panel });
      }
      preferences.set(prefKey("activeRightPanel"), panel);
    },
    dismissLayoutResetNotice: () => {
      set({ layoutResetNotice: false });
    },
  }));
}

/**
 * Provide a layout store instance for the Workbench UI.
 */
export function LayoutStoreProvider(props: {
  store: UseLayoutStore;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <LayoutStoreContext.Provider value={props.store}>
      {props.children}
    </LayoutStoreContext.Provider>
  );
}

/**
 * Read values from the injected layout store.
 */
export function useLayoutStore<T>(selector: (state: LayoutStore) => T): T {
  const store = React.useContext(LayoutStoreContext);
  if (!store) {
    throw new Error("LayoutStoreProvider is missing");
  }
  return store(selector);
}

/**
 * Read values from layout store when provider exists, otherwise return null.
 *
 * Why: editor-only surfaces may render without layout context in unit tests.
 */
export function useOptionalLayoutStore<T>(
  selector: (state: LayoutStore) => T,
): T | null {
  const store = React.useContext(LayoutStoreContext);
  if (!store) {
    return null;
  }
  return store(selector);
}

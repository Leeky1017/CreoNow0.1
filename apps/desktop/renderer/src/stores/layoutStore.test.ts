import { describe, expect, it } from "vitest";

import type { PreferenceKey, PreferenceStore } from "../lib/preferences";
import {
  createLayoutStore,
  LAYOUT_DEFAULTS,
  type LeftPanelType,
} from "./layoutStore";

/**
 * Build an in-memory preference store stub for deterministic layout tests.
 */
function createPreferenceStub(
  initial: Partial<Record<PreferenceKey, unknown>>,
): {
  preferences: PreferenceStore;
  setCalls: Array<[PreferenceKey, unknown]>;
  values: Map<PreferenceKey, unknown>;
} {
  const values = new Map<PreferenceKey, unknown>();
  const setCalls: Array<[PreferenceKey, unknown]> = [];

  for (const [key, value] of Object.entries(initial)) {
    values.set(key as PreferenceKey, value);
  }

  const preferences: PreferenceStore = {
    get: <T>(key: PreferenceKey) =>
      values.has(key) ? (values.get(key) as T) : null,
    set: <T>(key: PreferenceKey, value: T) => {
      setCalls.push([key, value as unknown]);
      values.set(key, value);
    },
    remove: (key: PreferenceKey) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    },
  };

  return {
    preferences,
    setCalls,
    values,
  };
}

describe("layoutStore persistence", () => {
  it("should restore sidebarCollapsed and sidebarWidth when persisted layout preferences exist", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.sidebarCollapsed": true,
      "creonow.layout.sidebarWidth": 312,
    });

    const store = createLayoutStore(preferences);
    const state = store.getState();

    expect(state.sidebarCollapsed).toBe(true);
    expect(state.sidebarWidth).toBe(312);
  });

  it("should persist sidebarCollapsed key when collapsing sidebar", () => {
    const { preferences, setCalls } = createPreferenceStub({});
    const store = createLayoutStore(preferences);

    store.getState().setSidebarCollapsed(true);

    expect(setCalls).toContainEqual(["creonow.layout.sidebarCollapsed", true]);
    expect(store.getState().sidebarCollapsed).toBe(true);
  });

  it("should persist sidebarWidth key when sidebar width is updated", () => {
    const { preferences, setCalls, values } = createPreferenceStub({});
    const store = createLayoutStore(preferences);

    store.getState().setSidebarWidth(280);

    expect(setCalls).toContainEqual(["creonow.layout.sidebarWidth", 280]);
    expect(values.get("creonow.layout.sidebarWidth")).toBe(280);
  });

  it("should fallback to default sidebar width when persisted width is missing", () => {
    const { preferences } = createPreferenceStub({});
    const store = createLayoutStore(preferences);

    expect(store.getState().sidebarWidth).toBe(LAYOUT_DEFAULTS.sidebar.default);
  });
});

describe("layoutStore activeRightPanel persistence", () => {
  it("should persist activeRightPanel when switching tabs", () => {
    const { preferences, setCalls } = createPreferenceStub({});
    const store = createLayoutStore(preferences);

    store.getState().setActiveRightPanel("info");

    expect(setCalls).toContainEqual([
      "creonow.layout.activeRightPanel",
      "info",
    ]);
  });

  it("should restore activeRightPanel from preferences on startup", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.activeRightPanel": "info",
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().activeRightPanel).toBe("info");
  });

  it("should fallback to ai when persisted activeRightPanel is invalid", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.activeRightPanel": "broken-value",
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().activeRightPanel).toBe("ai");
  });
});

describe("layoutStore zod validation and fallback", () => {
  it("should fallback sidebarWidth to default when persisted value is negative", () => {
    const { preferences, setCalls } = createPreferenceStub({
      "creonow.layout.sidebarWidth": -100,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().sidebarWidth).toBe(LAYOUT_DEFAULTS.sidebar.default);
    expect(setCalls).toContainEqual([
      "creonow.layout.sidebarWidth",
      LAYOUT_DEFAULTS.sidebar.default,
    ]);
  });

  it("should fallback sidebarWidth to default when persisted value exceeds max", () => {
    const { preferences, setCalls } = createPreferenceStub({
      "creonow.layout.sidebarWidth": 9999,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().sidebarWidth).toBe(LAYOUT_DEFAULTS.sidebar.default);
    expect(setCalls).toContainEqual([
      "creonow.layout.sidebarWidth",
      LAYOUT_DEFAULTS.sidebar.default,
    ]);
  });

  it("should fallback sidebarWidth to default when persisted value is not a number", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.sidebarWidth": "not-a-number",
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().sidebarWidth).toBe(LAYOUT_DEFAULTS.sidebar.default);
  });

  it("should fallback panelWidth to default when persisted value is below min", () => {
    const { preferences, setCalls } = createPreferenceStub({
      "creonow.layout.panelWidth": 10,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().panelWidth).toBe(LAYOUT_DEFAULTS.panel.default);
    expect(setCalls).toContainEqual([
      "creonow.layout.panelWidth",
      LAYOUT_DEFAULTS.panel.default,
    ]);
  });

  it("should fallback panelWidth to default when persisted value exceeds max", () => {
    const { preferences, setCalls } = createPreferenceStub({
      "creonow.layout.panelWidth": 9999,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().panelWidth).toBe(LAYOUT_DEFAULTS.panel.default);
    expect(setCalls).toContainEqual([
      "creonow.layout.panelWidth",
      LAYOUT_DEFAULTS.panel.default,
    ]);
  });

  it("should fallback sidebarCollapsed to default when persisted value is not boolean", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.sidebarCollapsed": "yes",
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().sidebarCollapsed).toBe(false);
  });

  it("should fallback panelCollapsed to default when persisted value is not boolean", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.panelCollapsed": 42,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().panelCollapsed).toBe(false);
  });

  it("should accept valid sidebarWidth within range", () => {
    const { preferences, setCalls } = createPreferenceStub({
      "creonow.layout.sidebarWidth": 300,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().sidebarWidth).toBe(300);
    const correctionCall = setCalls.find(
      ([key]) => key === "creonow.layout.sidebarWidth",
    );
    expect(correctionCall).toBeUndefined();
  });

  it("should write corrected default back to preferences on zod failure", () => {
    const { preferences, setCalls } = createPreferenceStub({
      "creonow.layout.sidebarWidth": -100,
      "creonow.layout.panelWidth": -200,
    });
    createLayoutStore(preferences);

    expect(setCalls).toContainEqual([
      "creonow.layout.sidebarWidth",
      LAYOUT_DEFAULTS.sidebar.default,
    ]);
    expect(setCalls).toContainEqual([
      "creonow.layout.panelWidth",
      LAYOUT_DEFAULTS.panel.default,
    ]);
  });

  it("should signal layout-reset when any zod validation fails", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.sidebarWidth": -100,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().layoutResetNotice).toBe(true);
  });

  it("should not signal layout-reset when all values are valid", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.sidebarWidth": 240,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().layoutResetNotice).toBe(false);
  });

  it("should allow dismissing layout-reset notice", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.sidebarWidth": -100,
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().layoutResetNotice).toBe(true);
    store.getState().dismissLayoutResetNotice();
    expect(store.getState().layoutResetNotice).toBe(false);
  });
});

describe("layoutStore activeLeftPanel persistence", () => {
  it("should persist activeLeftPanel when switching panels", () => {
    const { preferences, setCalls } = createPreferenceStub({});
    const store = createLayoutStore(preferences);

    store.getState().setActiveLeftPanel("outline" as LeftPanelType);

    expect(setCalls).toContainEqual([
      "creonow.layout.activeLeftPanel",
      "outline",
    ]);
  });

  it("should restore activeLeftPanel from preferences on startup", () => {
    const { preferences } = createPreferenceStub({
      "creonow.layout.activeLeftPanel": "outline",
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().activeLeftPanel).toBe("outline");
  });

  it("should fallback to files when persisted activeLeftPanel is invalid", () => {
    const { preferences, setCalls } = createPreferenceStub({
      "creonow.layout.activeLeftPanel": "nonexistent-panel",
    });
    const store = createLayoutStore(preferences);

    expect(store.getState().activeLeftPanel).toBe("files");
    expect(setCalls).toContainEqual([
      "creonow.layout.activeLeftPanel",
      "files",
    ]);
  });
});

describe("layoutStore transient popup state", () => {
  it("should default dialogType to null and spotlightOpen to false", () => {
    const { preferences } = createPreferenceStub({});
    const store = createLayoutStore(preferences);

    expect(store.getState().dialogType).toBeNull();
    expect(store.getState().spotlightOpen).toBe(false);
  });

  it("should update dialogType and spotlightOpen in memory only", () => {
    const { preferences, setCalls } = createPreferenceStub({});
    const store = createLayoutStore(preferences);

    store.getState().setDialogType("memory");
    store.getState().setSpotlightOpen(true);

    expect(store.getState().dialogType).toBe("memory");
    expect(store.getState().spotlightOpen).toBe(true);
    expect(
      setCalls.find(([key]) => key === "creonow.layout.activeLeftPanel"),
    ).toBeUndefined();
  });
});

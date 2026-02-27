import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadKgViewPreferences,
  saveKgViewPreferences,
  type KgViewPreferences,
} from "./kgViewPreferences";

const projectId = "project-1";

const DEFAULT_PREFERENCES: KgViewPreferences = {
  graphTransform: {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  timelineOrder: [],
  lastDraggedNodeId: null,
};

describe("kgViewPreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns default preferences when localStorage.getItem throws", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(loadKgViewPreferences(projectId)).toEqual(DEFAULT_PREFERENCES);
  });

  it("keeps current preferences when localStorage.setItem throws", () => {
    const stored: KgViewPreferences = {
      graphTransform: {
        scale: 1.25,
        translateX: 12,
        translateY: -4,
      },
      timelineOrder: ["node-a"],
      lastDraggedNodeId: "node-a",
    };

    window.localStorage.setItem(
      `creonow.kg.view.${projectId}`,
      JSON.stringify(stored),
    );

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    const result = saveKgViewPreferences(projectId, {
      graphTransform: { scale: 2, translateX: 99, translateY: 99 },
    });

    expect(result).toEqual(stored);
    expect(loadKgViewPreferences(projectId)).toEqual(stored);
  });
});

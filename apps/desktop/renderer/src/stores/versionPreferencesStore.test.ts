import { beforeEach, describe, expect, it } from "vitest";

import {
  VERSION_SHOW_AI_MARKS_KEY,
  useVersionPreferencesStore,
} from "./versionPreferencesStore";

describe("versionPreferencesStore", () => {
  beforeEach(() => {
    window.localStorage.removeItem(VERSION_SHOW_AI_MARKS_KEY);
    useVersionPreferencesStore.setState({ showAiMarks: false });
  });

  it("should default to false when preference is missing", () => {
    expect(useVersionPreferencesStore.getState().showAiMarks).toBe(false);
  });

  it("should persist showAiMarks to creonow.editor.showAiMarks", () => {
    const persisted = useVersionPreferencesStore.getState().setShowAiMarks(true);

    expect(persisted).toBe(true);
    expect(window.localStorage.getItem(VERSION_SHOW_AI_MARKS_KEY)).toBe("true");
    expect(useVersionPreferencesStore.getState().showAiMarks).toBe(true);
  });
});

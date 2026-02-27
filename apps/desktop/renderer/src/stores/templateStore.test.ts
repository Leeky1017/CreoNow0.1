import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEY, useTemplateStore } from "./templateStore";

const validTemplate = {
  id: "custom-valid",
  name: "Valid",
  type: "custom" as const,
  structure: {
    folders: ["chapters"],
    files: [{ path: "chapters/ch1.md", content: "# Ch1" }],
  },
  createdAt: 1,
};

describe("templateStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useTemplateStore.setState({
      customs: [],
      loading: false,
      error: null,
    });
  });

  it("loads only valid custom templates and repairs corrupted storage", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        validTemplate,
        {
          id: "broken",
          type: "custom",
          structure: { folders: [], files: [] },
        },
      ]),
    );

    await useTemplateStore.getState().loadTemplates();

    const customs = useTemplateStore.getState().customs;
    expect(customs).toHaveLength(1);
    expect(customs[0]?.id).toBe("custom-valid");

    const repaired = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown[];
    expect(repaired).toHaveLength(1);
  });

  it("clears malformed JSON from storage instead of keeping broken state", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{bad-json");

    await useTemplateStore.getState().loadTemplates();

    expect(useTemplateStore.getState().customs).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

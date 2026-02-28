import { describe, expect, it, vi } from "vitest";

import { createPreferenceStore } from "./preferences";

function createMockStorage(overrides?: Partial<Storage>): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
    ...overrides,
  };
}

describe("createPreferenceStore", () => {
  it("PREF-S0-MIG-S1 migration storage error should not throw", () => {
    const storage = createMockStorage({
      getItem: () => {
        throw new Error("blocked");
      },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => createPreferenceStore(storage)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      "PreferenceStore.migrate failed",
      expect.objectContaining({ error: expect.any(Error) }),
    );

    errorSpy.mockRestore();
  });

  it("PREF-S0-MIG-S2 migration setItem error should not break get/set API", () => {
    const storage = createMockStorage({
      setItem: () => {
        throw new Error("quota exceeded");
      },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const store = createPreferenceStore(storage);

    expect(() => store.get("creonow.theme.mode")).not.toThrow();
    expect(() => store.remove("creonow.theme.mode")).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      "PreferenceStore.migrate failed",
      expect.objectContaining({ error: expect.any(Error) }),
    );

    errorSpy.mockRestore();
  });
});

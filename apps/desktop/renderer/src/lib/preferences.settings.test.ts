import { describe, expect, it, vi } from "vitest";

import { createPreferenceStore } from "./preferences";

function createMockStorage(): Storage {
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
  };
}

describe("PreferenceStore — settings.* keys", () => {
  it("A0-14-KEY-01 isCreonowKey recognizes creonow.settings.focusMode", () => {
    const storage = createMockStorage();
    const store = createPreferenceStore(storage);

    store.set("creonow.settings.focusMode", true);
    expect(store.get<boolean>("creonow.settings.focusMode")).toBe(true);
  });

  it("A0-14-KEY-02 isCreonowKey recognizes all settings.* keys", () => {
    const storage = createMockStorage();
    const store = createPreferenceStore(storage);

    const keys = [
      "creonow.settings.focusMode",
      "creonow.settings.typewriterScroll",
      "creonow.settings.smartPunctuation",
      "creonow.settings.localAutoSave",
      "creonow.settings.backupInterval",
      "creonow.settings.defaultFont",
      "creonow.settings.interfaceScale",
      "creonow.settings.language",
    ] as const;

    for (const key of keys) {
      store.set(key, "test-value");
      expect(store.get<string>(key)).toBe("test-value");
    }
  });

  it("A0-14-ROUNDTRIP-01 read-write roundtrip persists values", () => {
    const storage = createMockStorage();
    const store = createPreferenceStore(storage);

    store.set("creonow.settings.focusMode", false);
    store.set("creonow.settings.backupInterval", "15min");
    store.set("creonow.settings.interfaceScale", 110);

    // Create a new store over the same storage to prove persistence
    const store2 = createPreferenceStore(storage);
    expect(store2.get<boolean>("creonow.settings.focusMode")).toBe(false);
    expect(store2.get<string>("creonow.settings.backupInterval")).toBe("15min");
    expect(store2.get<number>("creonow.settings.interfaceScale")).toBe(110);
  });

  it("A0-14-DEFAULT-01 returns null when no stored value exists", () => {
    const storage = createMockStorage();
    const store = createPreferenceStore(storage);

    expect(store.get<boolean>("creonow.settings.focusMode")).toBeNull();
    expect(store.get<string>("creonow.settings.backupInterval")).toBeNull();
  });

  it("A0-14-CORRUPT-01 returns null and removes key on corrupt JSON", () => {
    const storage = createMockStorage();
    const store = createPreferenceStore(storage);

    // Inject corrupt data directly into storage AFTER store creation
    storage.setItem("creonow.settings.focusMode", "{broken-json");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(store.get<boolean>("creonow.settings.focusMode")).toBeNull();
    expect(storage.getItem("creonow.settings.focusMode")).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "PreferenceStore.get failed to parse value",
      expect.objectContaining({ key: "creonow.settings.focusMode" }),
    );

    errorSpy.mockRestore();
  });

  it("A0-14-CLEAR-01 clear() removes settings.* keys", () => {
    const storage = createMockStorage();
    const store = createPreferenceStore(storage);

    store.set("creonow.settings.focusMode", true);
    store.set("creonow.settings.language", "en");
    store.clear();

    expect(store.get<boolean>("creonow.settings.focusMode")).toBeNull();
    expect(store.get<string>("creonow.settings.language")).toBeNull();
  });
});

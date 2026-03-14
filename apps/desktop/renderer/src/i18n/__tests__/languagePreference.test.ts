import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLanguagePreference,
  setLanguagePreference,
} from "../languagePreference";

const LANGUAGE_KEY = "creonow.settings.language";

describe("languagePreference", () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      key: vi.fn((index: number) => Object.keys(mockStorage)[index] ?? null),
      get length() {
        return Object.keys(mockStorage).length;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads language from the shared PreferenceStore key", () => {
    mockStorage["creonow.version"] = "1";
    mockStorage[LANGUAGE_KEY] = JSON.stringify("en");
    expect(getLanguagePreference()).toBe("en");
  });

  it("falls back to zh-CN when storage is empty", () => {
    expect(getLanguagePreference()).toBe("zh-CN");
  });

  it("falls back to zh-CN for unsupported values", () => {
    mockStorage["creonow.version"] = "1";
    mockStorage[LANGUAGE_KEY] = JSON.stringify("fr");
    expect(getLanguagePreference()).toBe("zh-CN");
  });

  it("returns zh-CN when localStorage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      get length() {
        return 0;
      },
    });
    expect(getLanguagePreference()).toBe("zh-CN");
  });

  it("persists language to the shared PreferenceStore key", () => {
    setLanguagePreference("en");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      LANGUAGE_KEY,
      JSON.stringify("en"),
    );
  });

  it("does not throw when localStorage.setItem fails", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      get length() {
        return 0;
      },
    });
    expect(() => setLanguagePreference("en")).not.toThrow();
  });
});

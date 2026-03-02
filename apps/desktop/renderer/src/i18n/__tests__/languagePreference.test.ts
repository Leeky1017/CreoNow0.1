import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLanguagePreference,
  setLanguagePreference,
} from "../languagePreference";

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
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads language from localStorage", () => {
    mockStorage["creonow-language"] = "en";
    expect(getLanguagePreference()).toBe("en");
  });

  it("falls back to zh-CN when localStorage is empty", () => {
    expect(getLanguagePreference()).toBe("zh-CN");
  });

  it("falls back to zh-CN for unsupported values", () => {
    mockStorage["creonow-language"] = "fr";
    expect(getLanguagePreference()).toBe("zh-CN");
  });

  it("returns zh-CN when localStorage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: vi.fn(),
    });
    expect(getLanguagePreference()).toBe("zh-CN");
  });

  it("persists language to localStorage", () => {
    setLanguagePreference("en");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "creonow-language",
      "en",
    );
  });

  it("does not throw when localStorage.setItem fails", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(() => setLanguagePreference("en")).not.toThrow();
  });
});

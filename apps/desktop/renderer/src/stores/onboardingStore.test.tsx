import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";

import { createPreferenceStore } from "../lib/preferences";
import {
  createOnboardingStore,
  OnboardingStoreProvider,
  useOnboardingStore,
} from "./onboardingStore";

/**
 * Create a mock storage for testing.
 */
function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("onboardingStore", () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  describe("createOnboardingStore", () => {
    it("should initialize with completed=false when no preference exists", () => {
      const preferences = createPreferenceStore(mockStorage);
      const store = createOnboardingStore(preferences);

      expect(store.getState().completed).toBe(false);
      expect(store.getState().status).toBe("ready");
    });

    it("should initialize with completed=true when preference exists", () => {
      // Set version first to prevent migration from clearing keys
      mockStorage.setItem("creonow.version", '"1"');
      mockStorage.setItem("creonow.onboarding.completed", "true");
      const preferences = createPreferenceStore(mockStorage);
      const store = createOnboardingStore(preferences);

      expect(store.getState().completed).toBe(true);
    });

    it("should persist completed=true to preferences on complete()", () => {
      const preferences = createPreferenceStore(mockStorage);
      const store = createOnboardingStore(preferences);

      store.getState().complete();

      expect(store.getState().completed).toBe(true);
      expect(mockStorage.getItem("creonow.onboarding.completed")).toBe("true");
    });

    it("should remove preference and reset state on reset()", () => {
      // Set version first to prevent migration from clearing keys
      mockStorage.setItem("creonow.version", '"1"');
      mockStorage.setItem("creonow.onboarding.completed", "true");
      const preferences = createPreferenceStore(mockStorage);
      const store = createOnboardingStore(preferences);

      expect(store.getState().completed).toBe(true);

      store.getState().reset();

      expect(store.getState().completed).toBe(false);
      expect(mockStorage.getItem("creonow.onboarding.completed")).toBeNull();
    });
  });

  describe("useOnboardingStore", () => {
    it("should throw error when used outside provider", () => {
      expect(() => {
        renderHook(() => useOnboardingStore((s) => s.completed));
      }).toThrow("OnboardingStoreProvider is missing");
    });

    it("should return store values when used inside provider", () => {
      const preferences = createPreferenceStore(mockStorage);
      const store = createOnboardingStore(preferences);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingStoreProvider store={store}>
          {children}
        </OnboardingStoreProvider>
      );

      const { result } = renderHook(
        () => useOnboardingStore((s) => s.completed),
        {
          wrapper,
        },
      );

      expect(result.current).toBe(false);
    });

    it("should update when complete() is called", () => {
      const preferences = createPreferenceStore(mockStorage);
      const store = createOnboardingStore(preferences);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingStoreProvider store={store}>
          {children}
        </OnboardingStoreProvider>
      );

      const { result } = renderHook(
        () => ({
          completed: useOnboardingStore((s) => s.completed),
          complete: useOnboardingStore((s) => s.complete),
        }),
        { wrapper },
      );

      expect(result.current.completed).toBe(false);

      act(() => {
        result.current.complete();
      });

      expect(result.current.completed).toBe(true);
    });
  });
});

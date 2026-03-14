import { createContext, useContext } from "react";

import {
  createPreferenceStore,
  type PreferenceStore,
} from "../lib/preferences";

function createMemoryStorage(): Storage {
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

const fallbackStore = createPreferenceStore(createMemoryStorage());

const PreferencesContext = createContext<PreferenceStore>(fallbackStore);

export const PreferencesProvider = PreferencesContext.Provider;

export function usePreferences(): PreferenceStore {
  return useContext(PreferencesContext);
}

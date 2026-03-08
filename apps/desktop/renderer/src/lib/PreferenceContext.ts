import React from "react";

import type { PreferenceStore } from "./preferences";

const PreferenceContext = React.createContext<PreferenceStore | null>(null);

export const PreferenceProvider = PreferenceContext.Provider;

export function usePreferenceStore(): PreferenceStore {
  const store = React.useContext(PreferenceContext);
  if (!store) {
    throw new Error("usePreferenceStore must be used within a PreferenceProvider");
  }
  return store;
}

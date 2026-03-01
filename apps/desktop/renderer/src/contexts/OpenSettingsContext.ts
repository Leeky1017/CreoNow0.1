import React from "react";
import type { SettingsTab } from "../features/settings-dialog/SettingsDialog";

export type OpenSettingsTarget = SettingsTab;

type OpenSettingsHandler = (target?: OpenSettingsTarget) => void;

export const OpenSettingsContext =
  React.createContext<OpenSettingsHandler | null>(null);

const noopOpenSettings: OpenSettingsHandler = () => {};

export function useOpenSettings(): OpenSettingsHandler {
  return React.useContext(OpenSettingsContext) ?? noopOpenSettings;
}

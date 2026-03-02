import i18next from "i18next";
import type { i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import { getLanguagePreference } from "./languagePreference";
import zhCN from "./locales/zh-CN.json";

export const i18n: I18nInstance = i18next.createInstance();

let initPromise: Promise<I18nInstance> | null = null;

/**
 * Initialize renderer i18n exactly once.
 */
export function initializeI18n(): Promise<I18nInstance> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = i18n
    .use(initReactI18next)
    .init({
      resources: {
        "zh-CN": { translation: zhCN },
        en: { translation: en },
      },
      lng: getLanguagePreference(),
      fallbackLng: "en",
      supportedLngs: ["zh-CN", "en"],
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
    })
    .then(() => i18n);

  return initPromise;
}

void initializeI18n();

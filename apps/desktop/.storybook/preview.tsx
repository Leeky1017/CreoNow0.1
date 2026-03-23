import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n, initializeI18n } from "../renderer/src/i18n";
import { AppToastProvider } from "../renderer/src/components/providers/AppToastProvider";

// Initialize i18n for Storybook — async but i18next renders synchronously with fallbacks
initializeI18n();

// Import global styles including design tokens
import "../renderer/src/styles/tokens.css";
import "../renderer/src/styles/main.css";

/**
 * Decorator that sets data-theme on documentElement to enable CSS variable theming.
 * CSS tokens use :root[data-theme="dark"] selector, so data-theme must be on <html>.
 */
function ThemeDecorator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set theme on :root (html element) so CSS variables activate
    document.documentElement.setAttribute("data-theme", "dark");
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  return <div style={{ padding: "1rem" }}>{children}</div>;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#080808" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <AppToastProvider>
          <ThemeDecorator>
            <Story />
          </ThemeDecorator>
        </AppToastProvider>
      </I18nextProvider>
    ),
  ],
};

export default preview;

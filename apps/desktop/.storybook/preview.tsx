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
function ThemeDecorator({
  theme,
  children,
}: {
  theme: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [theme]);

  return <div style={{ padding: "1rem" }}>{children}</div>;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "light", title: "Light", icon: "sun" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "dark",
  },
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
        { name: "dark", value: "hsl(0 0% 3.1%)" },
        { name: "light", value: "hsl(0 0% 100%)" },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) || "dark";
      return (
        <I18nextProvider i18n={i18n}>
          <AppToastProvider>
            <ThemeDecorator theme={theme}>
              <Story />
            </ThemeDecorator>
          </AppToastProvider>
        </I18nextProvider>
      );
    },
  ],
};

export default preview;

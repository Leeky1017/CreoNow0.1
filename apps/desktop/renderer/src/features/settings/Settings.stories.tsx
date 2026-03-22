/**
 * Settings Stories — AiSettingsSection, AppearanceSection, JudgeSection
 *
 * @demo-only This story uses a static replica because the real component
 * depends on Electron IPC and Zustand stores that cannot be easily mocked
 * in Storybook. See docs/references/testing/README.md for guidelines.
 *
 * @module features/settings/Settings.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Heading } from "../../components/primitives/Heading";
import { Input } from "../../components/primitives/Input";
import { Text } from "../../components/primitives/Text";
import { Select, type SelectOption } from "../../components/primitives/Select";
import { FormField } from "../../components/composites/FormField";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const PROVIDER_OPTIONS: SelectOption[] = [
  { value: "openai-compatible", label: "OpenAI Compatible (Proxy)" },
  { value: "openai-byok", label: "OpenAI (BYOK)" },
  { value: "anthropic-byok", label: "Anthropic (BYOK)" },
];

/* ------------------------------------------------------------------ */
/*  AI Settings demo                                                  */
/* ------------------------------------------------------------------ */

/**
 * Static replica of AiSettingsSection.
 * Renders provider selector, URL/key inputs, and action buttons.
 */
function AiSettingsDemo(): JSX.Element {
  const [providerMode, setProviderMode] = React.useState("openai-compatible");

  return (
    <Card
      data-testid="settings-ai-section"
      variant="raised"
      className="flex flex-col gap-2.5 p-3 rounded-[var(--radius-lg)]"
    >
      <Text size="body" weight="bold">
        AI Configuration
      </Text>

      <FormField label="Provider" htmlFor="ai-provider-mode">
        <Select
          data-testid="ai-provider-mode"
          value={providerMode}
          onValueChange={setProviderMode}
          options={PROVIDER_OPTIONS}
          fullWidth
        />
      </FormField>

      <FormField label="Base URL" htmlFor="ai-base-url">
        <Input
          id="ai-base-url"
          data-testid="ai-base-url"
          defaultValue="https://api.openai.com"
          placeholder="https://api.openai.com"
          fullWidth
        />
      </FormField>

      <FormField label="API Key" htmlFor="ai-api-key">
        <Input
          id="ai-api-key"
          data-testid="ai-api-key"
          type="password"
          placeholder="Configured ✓"
          fullWidth
        />
      </FormField>

      <div className="flex gap-2">
        <Button data-testid="ai-save-btn" variant="secondary" size="sm">
          Save
        </Button>
        <Button data-testid="ai-test-btn" variant="secondary" size="sm">
          Test Connection
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Appearance demo                                                   */
/* ------------------------------------------------------------------ */

/**
 * Static replica of AppearanceSection.
 * Renders theme toggle buttons with data-testid attributes.
 */
function AppearanceDemo(): JSX.Element {
  const [mode, setMode] = React.useState<"system" | "dark" | "light">("dark");

  return (
    <section
      data-testid="settings-appearance-section"
      className="flex flex-col gap-2.5 p-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
    >
      <Heading level="h4" className="font-bold">
        Appearance
      </Heading>

      <div className="flex items-center gap-2">
        <Text size="small" color="muted">
          Theme
        </Text>

        <div className="ml-auto flex gap-2">
          <Button
            data-testid="theme-mode-system"
            variant={mode === "system" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("system")}
            className={
              mode === "system"
                ? "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]"
                : ""
            }
          >
            System
          </Button>
          <Button
            data-testid="theme-mode-dark"
            variant={mode === "dark" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("dark")}
            className={
              mode === "dark"
                ? "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]"
                : ""
            }
          >
            Dark
          </Button>
          <Button
            data-testid="theme-mode-light"
            variant={mode === "light" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("light")}
            className={
              mode === "light"
                ? "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]"
                : ""
            }
          >
            Light
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Judge demo                                                        */
/* ------------------------------------------------------------------ */

/**
 * Static replica of JudgeSection.
 * Renders judge model status and ensure button.
 */
function JudgeDemo(props: {
  status: "ready" | "downloading" | "not_ready" | "error";
}): JSX.Element {
  const statusLabel: Record<typeof props.status, string> = {
    ready: "ready",
    downloading: "downloading",
    not_ready: "not_ready",
    error: "error (MODEL_INIT_FAILED)",
  };

  return (
    <section
      data-testid="settings-judge-section"
      className="p-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
    >
      <Heading level="h4" className="mb-1.5 font-bold">
        Judge Model
      </Heading>
      <Text size="small" color="muted" as="div" className="mb-2.5">
        Status:{" "}
        <Text data-testid="judge-status" size="small" color="default" as="span">
          {statusLabel[props.status]}
        </Text>
      </Text>

      <div className="flex items-center gap-2">
        <Button
          data-testid="judge-ensure"
          variant="secondary"
          size="sm"
          className="bg-[var(--color-bg-selected)]"
          disabled={props.status === "downloading"}
          loading={props.status === "downloading"}
        >
          Ensure Model
        </Button>

        {props.status === "error" && (
          <Text data-testid="judge-error" size="small" color="muted">
            Model initialization failed. Try again.
          </Text>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Storybook meta                                                    */
/* ------------------------------------------------------------------ */

/** Shell container for settings stories. */
function SettingsShell(props: { children?: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        width: 480,
        padding: "var(--space-section-gap, 24px)",
        backgroundColor: "var(--color-bg-surface)",
      }}
    >
      {props.children}
    </div>
  );
}

const meta = {
  title: "Features/Settings",
  component: SettingsShell,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "hsl(0 0% 3.1%)" }],
    },
    docs: {
      description: {
        component: `**Visual Demo (Static Replicas)**

These stories render visual replicas of AiSettingsSection, AppearanceSection, and JudgeSection.
The real components depend on IPC channels and Zustand stores that are unavailable in Storybook.
Each replica mirrors the original component's \`data-testid\` contract and visual layout
to enable visual regression testing and design review.

To test real behavior, use the desktop app: \`Cmd/Ctrl+,\` → Settings dialog.`,
      },
    },
  },
  tags: ["autodocs", "demo-only"],
} satisfies Meta<typeof SettingsShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/*  Stories                                                           */
/* ------------------------------------------------------------------ */

/** All three settings sections rendered together. */
export const SettingsOverview: Story = {
  name: "Overview — All Sections",
  render: () => (
    <SettingsShell>
      <div className="flex flex-col gap-4">
        <AiSettingsDemo />
        <AppearanceDemo />
        <JudgeDemo status="ready" />
      </div>
    </SettingsShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-ai-section")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("settings-appearance-section"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("settings-judge-section"),
    ).toBeInTheDocument();
  },
};

/** AI settings section with provider select and input fields. */
export const AiSettingsDefault: Story = {
  name: "AI Settings — Default",
  render: () => (
    <SettingsShell>
      <AiSettingsDemo />
    </SettingsShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-ai-section")).toBeInTheDocument();
    await expect(canvas.getByTestId("ai-save-btn")).toBeInTheDocument();
    await expect(canvas.getByTestId("ai-test-btn")).toBeInTheDocument();
  },
};

/** Appearance section with theme mode toggle buttons. */
export const AppearanceDefault: Story = {
  name: "Appearance — Default",
  render: () => (
    <SettingsShell>
      <AppearanceDemo />
    </SettingsShell>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Judge section showing model ready state. */
export const JudgeReady: Story = {
  name: "Judge — Ready",
  render: () => (
    <SettingsShell>
      <JudgeDemo status="ready" />
    </SettingsShell>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Judge section showing error state with retry option. */
export const JudgeError: Story = {
  name: "Judge — Error",
  render: () => (
    <SettingsShell>
      <JudgeDemo status="error" />
    </SettingsShell>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

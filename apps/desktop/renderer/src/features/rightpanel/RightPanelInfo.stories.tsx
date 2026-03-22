/**
 * RightPanel Info Stories
 *
 * @demo-only This story uses a static replica because the real component
 * depends on Electron IPC and Zustand stores. The replica mirrors the
 * original's data-testid contract for visual regression testing.
 * See docs/references/testing/README.md for guidelines.
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { Card } from "../../components/primitives/Card";
import { Text } from "../../components/primitives/Text";
import { Button } from "../../components/primitives/Button";
import { PanelHeader } from "../../components/patterns/PanelHeader";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const MOCK_DOCUMENT = {
  title: "The Architecture of Silence",
  updatedAt: "Jan 15, 2025, 10:42 AM",
};

const MOCK_STATS = {
  wordsWritten: "1,247",
  writingTime: "42m 18s",
  skillsUsed: 3,
  documentsCreated: 2,
};

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function StatRow(props: {
  label: string;
  value: React.ReactNode;
  testId?: string;
}): JSX.Element {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-[var(--color-separator)] last:border-b-0">
      <Text size="small" color="muted">
        {props.label}
      </Text>
      <Text
        data-testid={props.testId}
        size="small"
        color="default"
        className="font-medium"
      >
        {props.value}
      </Text>
    </div>
  );
}

function RightPanelShell(props: { children?: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        width: 320,
        height: 600,
        backgroundColor: "var(--color-bg-surface)",
        borderLeft: "1px solid var(--color-separator)",
        overflow: "hidden",
      }}
    >
      {props.children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  InfoPanel demo                                                    */
/* ------------------------------------------------------------------ */

function InfoPanelDemo(props: {
  state: "default" | "loading" | "empty" | "error";
}): JSX.Element {
  const { state } = props;

  return (
    <div data-testid="info-panel" className="flex flex-col h-full">
      <PanelHeader title="Document Info" />

      <div className="flex flex-col gap-[var(--space-section-gap)] p-4 overflow-auto">
        <section>
          <Text
            size="small"
            weight="semibold"
            color="muted"
            as="p"
            className="mb-2"
          >
            Current Document
          </Text>
          <Card className="p-3 rounded-[var(--radius-md)]">
            {state === "empty" ? (
              <Text
                data-testid="info-panel-no-document"
                size="small"
                color="muted"
                className="text-center"
              >
                No document selected
              </Text>
            ) : (
              <>
                <StatRow
                  label="Title"
                  value={MOCK_DOCUMENT.title}
                  testId="info-panel-doc-title"
                />
                <StatRow
                  label="Updated"
                  value={MOCK_DOCUMENT.updatedAt}
                  testId="info-panel-doc-updated"
                />
              </>
            )}
          </Card>
        </section>

        <section>
          <Text
            size="small"
            weight="semibold"
            color="muted"
            as="p"
            className="mb-2"
          >
            Today&apos;s Progress
          </Text>
          <Card
            className={`p-3 rounded-[var(--radius-md)]${
              state === "error" ? " border-[var(--color-error)]/20" : ""
            }`}
          >
            {state === "loading" ? (
              <Text size="small" color="muted" className="text-center">
                Loading statistics…
              </Text>
            ) : state === "error" ? (
              <Text
                data-testid="info-panel-stats-error"
                size="small"
                color="muted"
                className="text-center"
              >
                Failed to load statistics (STATS_FETCH_ERROR)
              </Text>
            ) : state === "empty" ? (
              <Text size="small" color="muted" className="text-center">
                No stats available
              </Text>
            ) : (
              <>
                <StatRow
                  label="Words Written"
                  value={MOCK_STATS.wordsWritten}
                  testId="info-panel-words-written"
                />
                <StatRow
                  label="Writing Time"
                  value={MOCK_STATS.writingTime}
                  testId="info-panel-writing-time"
                />
                <StatRow
                  label="Skills Used"
                  value={MOCK_STATS.skillsUsed}
                  testId="info-panel-skills-used"
                />
                <StatRow
                  label="Documents Created"
                  value={MOCK_STATS.documentsCreated}
                  testId="info-panel-docs-created"
                />
              </>
            )}
          </Card>
        </section>

        <Button
          type="button"
          className="self-start text-xs text-[var(--color-info)] hover:underline disabled:text-[var(--color-fg-placeholder)] disabled:no-underline"
          disabled={state === "empty"}
        >
          Open Version History
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Storybook meta                                                    */
/* ------------------------------------------------------------------ */

const meta = {
  title: "Features/RightPanel/Info",
  component: RightPanelShell,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "hsl(0 0% 3.1%)" }],
    },
    docs: {
      description: {
        component: `**Visual Demo (Static Replica)**

This story renders a visual replica of the Info panel.
The real component depends on IPC channels and Zustand stores unavailable in Storybook.
The replica mirrors the original's \`data-testid\` contract for visual regression testing.`,
      },
    },
  },
  tags: ["autodocs", "demo-only"],
} satisfies Meta<typeof RightPanelShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/*  InfoPanel stories                                                 */
/* ------------------------------------------------------------------ */

/** InfoPanel with document info and today's writing statistics. */
export const InfoPanelDefault: Story = {
  name: "InfoPanel — Default",
  render: () => (
    <RightPanelShell>
      <InfoPanelDemo state="default" />
    </RightPanelShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("info-panel")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("info-panel-doc-title"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("info-panel-words-written"),
    ).toBeInTheDocument();
  },
};

/** InfoPanel while statistics are being fetched. */
export const InfoPanelLoading: Story = {
  name: "InfoPanel — Loading",
  render: () => (
    <RightPanelShell>
      <InfoPanelDemo state="loading" />
    </RightPanelShell>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** InfoPanel with no document selected. */
export const InfoPanelEmpty: Story = {
  name: "InfoPanel — Empty",
  render: () => (
    <RightPanelShell>
      <InfoPanelDemo state="empty" />
    </RightPanelShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId("info-panel-no-document"),
    ).toBeInTheDocument();
  },
};

/** InfoPanel when stats fetch fails. */
export const InfoPanelError: Story = {
  name: "InfoPanel — Error",
  render: () => (
    <RightPanelShell>
      <InfoPanelDemo state="error" />
    </RightPanelShell>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

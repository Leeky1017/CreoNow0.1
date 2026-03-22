/**
 * RightPanel Stories — InfoPanel & QualityPanel
 *
 * Static demo: IPC-dependent components rendered with mock data.
 * @module features/rightpanel/RightPanel.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { Card } from "../../components/primitives/Card";
import { Text } from "../../components/primitives/Text";
import { Button } from "../../components/primitives/Button";
import { Heading } from "../../components/primitives/Heading";
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

const MOCK_CONSTRAINTS = [
  "Max 80k words",
  "Formal tone",
  "No first-person",
  "Chicago style",
  "Academic citations",
  "12pt font minimum",
];

/* ------------------------------------------------------------------ */
/*  Shared demo sub-components                                        */
/* ------------------------------------------------------------------ */

/** Stat row matching InfoPanel's StatItem layout. */
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

/** Status dot matching QualityPanelSections' StatusDot. */
function StatusDot(props: {
  status: "ready" | "downloading" | "error" | "not_ready" | "loading";
}): JSX.Element {
  const colors: Record<typeof props.status, string> = {
    ready: "bg-[var(--color-success)]",
    downloading: "bg-[var(--color-info)]",
    error: "bg-[var(--color-error)]",
    not_ready: "bg-[var(--color-warning)]",
    loading: "bg-[var(--color-fg-muted)]",
  };
  const extra =
    props.status === "downloading" ? " animate-pulse" : "";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[props.status]}${extra}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  InfoPanel demo                                                    */
/* ------------------------------------------------------------------ */

/** Static InfoPanel matching the real component's visual structure. */
function InfoPanelDemo(props: {
  state: "default" | "loading" | "empty" | "error";
}): JSX.Element {
  const { state } = props;

  return (
    <div data-testid="info-panel" className="flex flex-col h-full">
      <PanelHeader title="Document Info" />

      <div className="flex flex-col gap-[var(--space-section-gap)] p-4 overflow-auto">
        {/* Document info section */}
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

        {/* Today's stats section */}
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

        {/* Version history button */}
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
/*  QualityPanel demo                                                 */
/* ------------------------------------------------------------------ */

/** Static QualityPanel matching the real component's visual structure. */
function QualityPanelDemo(props: {
  state: "with-data" | "no-project" | "loading";
}): JSX.Element {
  const { state } = props;

  if (state === "no-project") {
    return (
      <div
        data-testid="quality-panel"
        className="flex flex-col gap-4 p-4 h-full overflow-auto"
      >
        <Heading level="h3" className="font-bold text-[15px]">
          Quality
        </Heading>

        <Card className="p-4 rounded-[var(--radius-md)]">
          <Text
            data-testid="quality-panel-no-project"
            size="small"
            color="muted"
            className="text-center"
          >
            No project selected. Open a project to see quality analysis.
          </Text>
        </Card>

        {/* Judge section still visible without project */}
        <section>
          <Heading level="h4" className="mb-2 font-semibold text-[13px]">
            Judge Model
          </Heading>
          <Card className="p-3 rounded-[var(--radius-md)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot status="not_ready" />
                <Text size="small" color="default">
                  Judge Model:{" "}
                  <span
                    data-testid="quality-panel-judge-status"
                    className="font-medium"
                  >
                    Not Ready
                  </span>
                </Text>
              </div>
              <Button
                data-testid="quality-panel-judge-ensure"
                variant="secondary"
                size="sm"
              >
                Initialize
              </Button>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div data-testid="quality-panel" className="flex flex-col h-full">
      <div className="p-4 space-y-4 border-b border-[var(--color-separator)]">
        {/* Judge model status */}
        <section>
          <Heading level="h4" className="mb-2 font-semibold text-[13px]">
            Judge Model
          </Heading>
          <Card className="p-3 rounded-[var(--radius-md)]">
            {state === "loading" ? (
              <div className="flex items-center gap-2">
                <StatusDot status="loading" />
                <Text size="small" color="muted">
                  Loading judge status…
                </Text>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <StatusDot status="ready" />
                <Text size="small" color="default">
                  Judge Model:{" "}
                  <span
                    data-testid="quality-panel-judge-status"
                    className="font-medium"
                  >
                    Ready
                  </span>
                </Text>
              </div>
            )}
          </Card>
        </section>

        {/* Constraints */}
        <section>
          <Heading level="h4" className="mb-2 font-semibold text-[13px]">
            Project Constraints
          </Heading>
          <Card className="p-3 rounded-[var(--radius-md)]">
            {state === "loading" ? (
              <Text size="small" color="muted">
                Loading constraints…
              </Text>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Text size="small" color="default">
                    Constraints:{" "}
                    <span
                      data-testid="quality-panel-constraints-count"
                      className="font-medium"
                    >
                      {MOCK_CONSTRAINTS.length} rules
                    </span>
                  </Text>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {MOCK_CONSTRAINTS.slice(0, 5).map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)]"
                    >
                      {item}
                    </span>
                  ))}
                  {MOCK_CONSTRAINTS.length > 5 && (
                    <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)]">
                      +{MOCK_CONSTRAINTS.length - 5} more
                    </span>
                  )}
                </div>
              </>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Storybook meta                                                    */
/* ------------------------------------------------------------------ */

/**
 * Wrapper that lets Storybook select between InfoPanel and QualityPanel demos.
 */
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

const meta = {
  title: "Features/RightPanel",
  component: RightPanelShell,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#080808" }],
    },
  },
  tags: ["autodocs"],
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
    await expect(canvas.getByTestId("info-panel-doc-title")).toBeInTheDocument();
    await expect(canvas.getByTestId("info-panel-words-written")).toBeInTheDocument();
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
};

/* ------------------------------------------------------------------ */
/*  QualityPanel stories                                              */
/* ------------------------------------------------------------------ */

/** QualityPanel with judge ready and constraints loaded. */
export const QualityPanelWithData: Story = {
  name: "QualityPanel — With Data",
  render: () => (
    <RightPanelShell>
      <QualityPanelDemo state="with-data" />
    </RightPanelShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("quality-panel")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("quality-panel-judge-status"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("quality-panel-constraints-count"),
    ).toBeInTheDocument();
  },
};

/** QualityPanel when no project is selected. */
export const QualityPanelNoProject: Story = {
  name: "QualityPanel — No Project",
  render: () => (
    <RightPanelShell>
      <QualityPanelDemo state="no-project" />
    </RightPanelShell>
  ),
};

/** QualityPanel in loading state. */
export const QualityPanelLoading: Story = {
  name: "QualityPanel — Loading",
  render: () => (
    <RightPanelShell>
      <QualityPanelDemo state="loading" />
    </RightPanelShell>
  ),
};

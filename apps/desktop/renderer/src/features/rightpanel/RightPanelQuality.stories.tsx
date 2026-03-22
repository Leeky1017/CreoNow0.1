/**
 * RightPanel Stories — QualityPanel
 *
 * Static demo: IPC-dependent components rendered with mock data.
 * @module features/rightpanel/RightPanelQuality.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { Card } from "../../components/primitives/Card";
import { Text } from "../../components/primitives/Text";
import { Button } from "../../components/primitives/Button";
import { Heading } from "../../components/primitives/Heading";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const MOCK_CONSTRAINTS = [
  "Max 80k words",
  "Formal tone",
  "No first-person",
  "Chicago style",
  "Academic citations",
  "12pt font minimum",
];

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

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
  const extra = props.status === "downloading" ? " animate-pulse" : "";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[props.status]}${extra}`}
    />
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
/*  QualityPanel demo                                                 */
/* ------------------------------------------------------------------ */

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

const meta = {
  title: "Features/RightPanel/Quality",
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

This story renders a visual replica of the Quality panel.
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

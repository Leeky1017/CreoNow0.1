/**
 * RightPanelInfo Stories — InfoPanel
 *
 * Uses the real InfoPanel component with mocked IPC boundary (window.creonow.invoke)
 * and a seed FileStore state for current document.
 *
 * @module features/rightpanel/RightPanelInfo.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { InfoPanel } from "./InfoPanel";
import { FileStoreProvider, createFileStore } from "../../stores/fileStore";
import "../../i18n";

/* ------------------------------------------------------------------ */
/*  Mock IPC factory                                                   */
/* ------------------------------------------------------------------ */

type StatsSummary = {
  wordsWritten: number;
  writingSeconds: number;
  skillsUsed: number;
  documentsCreated: number;
};

type MockStatsOptions =
  | { kind: "success"; summary: StatsSummary }
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "empty" };

function createMockInfoIpc(statsOptions: MockStatsOptions) {
  return async (channel: string): Promise<unknown> => {
    if (channel === "stats:day:gettoday") {
      if (statsOptions.kind === "loading") {
        return new Promise(() => {});
      }
      if (statsOptions.kind === "error") {
        return {
          ok: false,
          error: { code: statsOptions.code, message: statsOptions.message },
        };
      }
      if (statsOptions.kind === "empty") {
        return {
          ok: true,
          data: {
            date: new Date().toISOString().split("T")[0],
            summary: {
              wordsWritten: 0,
              writingSeconds: 0,
              skillsUsed: 0,
              documentsCreated: 0,
            },
          },
        };
      }
      return {
        ok: true,
        data: {
          date: new Date().toISOString().split("T")[0],
          summary: statsOptions.summary,
        },
      };
    }
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: `Unhandled: ${String(channel)}` },
    };
  };
}

/* ------------------------------------------------------------------ */
/*  Wrapper                                                            */
/* ------------------------------------------------------------------ */

function InfoPanelWrapper(props: {
  statsOptions: MockStatsOptions;
  currentDocumentId?: string | null;
  hasDocument?: boolean;
}): JSX.Element {
  const mockInvoke = React.useMemo(
    () => createMockInfoIpc(props.statsOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [fileStore] = React.useState(() => {
    const store = createFileStore({
      invoke: mockInvoke as Parameters<typeof createFileStore>[0]["invoke"],
    });
    store.setState({
      projectId: "project-story",
      items:
        props.hasDocument !== false
          ? [
              {
                documentId: "doc-1",
                type: "chapter" as const,
                title: "第一章 · 起始之处",
                status: "draft" as const,
                sortOrder: 0,
                parentId: undefined,
                updatedAt: Date.now() - 3600000,
              },
            ]
          : [],
      currentDocumentId:
        props.currentDocumentId ??
        (props.hasDocument !== false ? "doc-1" : null),
      bootstrapStatus: "ready",
      lastError: null,
    });
    return store;
  });

  React.useEffect(() => {
    const prev = window.creonow;
    window.creonow = {
      invoke: mockInvoke as NonNullable<Window["creonow"]>["invoke"],
    };
    return () => {
      window.creonow = prev;
    };
  }, [mockInvoke]);

  return (
    <FileStoreProvider store={fileStore}>
      <div
        style={{
          width: 320,
          height: 560,
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-default)",
          overflow: "hidden",
        }}
      >
        <InfoPanel />
      </div>
    </FileStoreProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Meta                                                               */
/* ------------------------------------------------------------------ */

const meta: Meta<typeof InfoPanel> = {
  title: "Features/RightPanel/Info",
  component: InfoPanel,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof InfoPanel>;

/* ------------------------------------------------------------------ */
/*  Stories                                                            */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  render: () => (
    <InfoPanelWrapper
      statsOptions={{
        kind: "success",
        summary: {
          wordsWritten: 1240,
          writingSeconds: 2700,
          skillsUsed: 3,
          documentsCreated: 1,
        },
      }}
    />
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

export const NoDocument: Story = {
  render: () => (
    <InfoPanelWrapper
      statsOptions={{
        kind: "success",
        summary: {
          wordsWritten: 0,
          writingSeconds: 0,
          skillsUsed: 0,
          documentsCreated: 0,
        },
      }}
      currentDocumentId={null}
      hasDocument={false}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("info-panel")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("info-panel-no-document"),
    ).toBeInTheDocument();
  },
};

export const StatsError: Story = {
  render: () => (
    <InfoPanelWrapper
      statsOptions={{
        kind: "error",
        code: "INTERNAL",
        message: "Failed to load stats",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("info-panel")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("info-panel-stats-error"),
    ).toBeInTheDocument();
  },
};

export const EmptyDay: Story = {
  render: () => <InfoPanelWrapper statsOptions={{ kind: "empty" }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("info-panel")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("info-panel-doc-title"),
    ).toBeInTheDocument();
  },
};

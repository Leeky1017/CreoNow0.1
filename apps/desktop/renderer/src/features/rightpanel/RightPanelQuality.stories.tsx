/**
 * RightPanelQuality Stories — QualityPanel
 *
 * Uses the real QualityPanel component with mocked IPC boundary (window.creonow.invoke)
 * and a seed ProjectStore state.
 *
 * @module features/rightpanel/RightPanelQuality.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { QualityPanel } from "./QualityPanel";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
import type { IpcInvokeResult } from "@shared/types/ipc-generated";
import "../../i18n";

/* ------------------------------------------------------------------ */
/*  Mock IPC factory                                                   */
/* ------------------------------------------------------------------ */

type JudgeStatusOption = "ready" | "not_ready" | "downloading" | "error";

type ConstraintsOption =
  | { kind: "with-data"; items: string[] }
  | { kind: "empty" }
  | { kind: "error" };

function createMockQualityIpc(opts: {
  judgeStatus: JudgeStatusOption;
  constraints: ConstraintsOption;
}) {
  return async (channel: string): Promise<unknown> => {
    if (channel === "judge:model:getstate") {
      if (opts.judgeStatus === "error") {
        return {
          ok: true,
          data: {
            state: {
              status: "error",
              error: { code: "INTERNAL", message: "MODEL_INIT_FAILED" },
            },
          },
        };
      }
      return { ok: true, data: { state: { status: opts.judgeStatus } } };
    }

    if (channel === "judge:model:ensure") {
      return { ok: true, data: { state: { status: "ready" } } };
    }

    if (channel === "constraints:policy:get") {
      if (opts.constraints.kind === "error") {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "Constraints not found" },
        };
      }
      return {
        ok: true,
        data: {
          constraints: {
            items:
              opts.constraints.kind === "with-data"
                ? opts.constraints.items
                : [],
            version: 1 as const,
          },
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

function QualityPanelWrapper(props: {
  projectId: string | null;
  judgeStatus?: JudgeStatusOption;
  constraints?: ConstraintsOption;
}): JSX.Element {
  const {
    projectId,
    judgeStatus = "ready",
    constraints = {
      kind: "with-data",
      items: ["每章不超过3000字", "避免重复词汇", "保持视角统一"],
    },
  } = props;

  const mockInvoke = React.useMemo(
    () => createMockQualityIpc({ judgeStatus, constraints }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [projectStore] = React.useState(() => {
    const store = createProjectStore({
      invoke: async () =>
        ({
          ok: false,
          error: { code: "NOT_FOUND", message: "unused in story" },
        }) as IpcInvokeResult<"project:project:getcurrent">,
    });
    if (projectId) {
      store.setState((prev) => ({
        ...prev,
        current: { projectId, rootPath: "/tmp/story-project" },
        bootstrapStatus: "ready",
      }));
    } else {
      store.setState((prev) => ({
        ...prev,
        current: null,
        bootstrapStatus: "ready",
      }));
    }
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
    <ProjectStoreProvider store={projectStore}>
      <div
        style={{
          width: 320,
          height: 640,
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-default)",
          overflow: "hidden",
        }}
      >
        <QualityPanel />
      </div>
    </ProjectStoreProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Meta                                                               */
/* ------------------------------------------------------------------ */

const meta: Meta<typeof QualityPanel> = {
  title: "Features/RightPanel/Quality",
  component: QualityPanel,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof QualityPanel>;

/* ------------------------------------------------------------------ */
/*  Stories                                                            */
/* ------------------------------------------------------------------ */

export const WithProject: Story = {
  render: () => (
    <QualityPanelWrapper
      projectId="project-story"
      judgeStatus="ready"
      constraints={{
        kind: "with-data",
        items: ["每章不超过3000字", "避免重复词汇", "保持视角统一"],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("quality-panel")).toBeInTheDocument();
  },
};

export const NoProject: Story = {
  render: () => (
    <QualityPanelWrapper
      projectId={null}
      judgeStatus="ready"
      constraints={{ kind: "empty" }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("quality-panel")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("quality-panel-no-project"),
    ).toBeInTheDocument();
  },
};

export const JudgeNotReady: Story = {
  render: () => (
    <QualityPanelWrapper
      projectId="project-story"
      judgeStatus="not_ready"
      constraints={{ kind: "empty" }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("quality-panel")).toBeInTheDocument();
  },
};

export const JudgeError: Story = {
  render: () => (
    <QualityPanelWrapper
      projectId="project-story"
      judgeStatus="error"
      constraints={{ kind: "with-data", items: ["避免重复词汇"] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("quality-panel")).toBeInTheDocument();
  },
};

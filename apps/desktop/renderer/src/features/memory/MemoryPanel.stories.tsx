import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import type {
  IpcInvokeResult,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
import { MemoryPanel } from "./MemoryPanel";
import { expect } from "@storybook/test";

type SemanticRule = IpcResponseData<"memory:semantic:list">["items"][number];

type StoryState = {
  projectId: string;
  rules: SemanticRule[];
  conflictCount: number;
  preferenceLearningEnabled: boolean;
};

function createRule(overrides: Partial<SemanticRule>): SemanticRule {
  return {
    id: "rule-default",
    projectId: "proj-story",
    scope: "project",
    version: 1,
    rule: "动作场景偏好短句",
    category: "pacing",
    confidence: 0.87,
    supportingEpisodes: ["ep-1", "ep-2"],
    contradictingEpisodes: [],
    userConfirmed: false,
    userModified: false,
    createdAt: 1700000000000,
    updatedAt: 1700000001000,
    ...overrides,
  };
}

function createPanelInvoke(state: StoryState) {
  return async (channel: string, payload: unknown): Promise<unknown> => {
    if (channel === "memory:semantic:list") {
      return {
        ok: true,
        data: {
          items: state.rules,
          conflictQueue: Array.from(
            { length: state.conflictCount },
            (_, index) => ({
              id: `conflict-${index}`,
              ruleIds: ["rule-default"],
              status: "pending",
            }),
          ),
        },
      };
    }

    if (channel === "memory:settings:get") {
      return {
        ok: true,
        data: {
          injectionEnabled: true,
          preferenceLearningEnabled: state.preferenceLearningEnabled,
          privacyModeEnabled: false,
          preferenceLearningThreshold: 3,
        },
      };
    }

    if (channel === "memory:settings:update") {
      const req = payload as {
        patch: { preferenceLearningEnabled?: boolean };
      };
      state.preferenceLearningEnabled =
        req.patch.preferenceLearningEnabled ?? state.preferenceLearningEnabled;
      return {
        ok: true,
        data: {
          injectionEnabled: true,
          preferenceLearningEnabled: state.preferenceLearningEnabled,
          privacyModeEnabled: false,
          preferenceLearningThreshold: 3,
        },
      };
    }

    if (channel === "memory:semantic:update") {
      const req = payload as {
        projectId: string;
        ruleId: string;
        patch: Partial<SemanticRule>;
      };
      const target = state.rules.find((rule) => rule.id === req.ruleId);
      const item: SemanticRule = target
        ? {
            ...target,
            ...req.patch,
            updatedAt: Date.now(),
          }
        : createRule({ id: req.ruleId, projectId: req.projectId });
      state.rules = state.rules.map((rule) =>
        rule.id === item.id ? item : rule,
      );
      return { ok: true, data: { item } };
    }

    if (channel === "memory:semantic:delete") {
      const req = payload as { ruleId: string };
      state.rules = state.rules.filter((rule) => rule.id !== req.ruleId);
      return { ok: true, data: { deleted: true } };
    }

    if (channel === "memory:semantic:add") {
      const req = payload as {
        projectId: string;
        rule: string;
        category: SemanticRule["category"];
        confidence: number;
        scope?: SemanticRule["scope"];
        supportingEpisodes?: string[];
        contradictingEpisodes?: string[];
        userConfirmed?: boolean;
        userModified?: boolean;
      };
      const item = createRule({
        id: `rule-${state.rules.length + 1}`,
        projectId: req.projectId,
        scope: req.scope ?? "project",
        rule: req.rule,
        category: req.category,
        confidence: req.confidence,
        supportingEpisodes: req.supportingEpisodes ?? [],
        contradictingEpisodes: req.contradictingEpisodes ?? [],
        userConfirmed: req.userConfirmed ?? false,
        userModified: req.userModified ?? false,
        updatedAt: Date.now(),
      });
      state.rules = [item, ...state.rules];
      return { ok: true, data: { item } };
    }

    if (channel === "memory:semantic:distill") {
      return {
        ok: true,
        data: {
          accepted: true,
          runId: "story-run-1",
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Unhandled story channel: ${String(channel)}`,
      },
    };
  };
}

function MemoryPanelStoryWrapper(props: { state: StoryState }): JSX.Element {
  const { state } = props;

  const [projectStore] = React.useState(() => {
    const store = createProjectStore({
      invoke: async () =>
        ({
          ok: false,
          error: { code: "NOT_FOUND", message: "unused in story" },
        }) as IpcInvokeResult<"project:project:getcurrent">,
    });
    store.setState((prev) => ({
      ...prev,
      current: {
        projectId: state.projectId,
        rootPath: "/tmp/story-project",
      },
      bootstrapStatus: "ready",
      items: [],
      lastError: null,
    }));
    return store;
  });

  React.useEffect(() => {
    const previous = window.creonow;
    window.creonow = {
      invoke: createPanelInvoke(state) as NonNullable<
        Window["creonow"]
      >["invoke"],
    };
    return () => {
      window.creonow = previous;
    };
  }, [state]);

  return (
    <ProjectStoreProvider store={projectStore}>
      <div
        style={{
          width: 360,
          height: 720,
          backgroundColor: "var(--color-bg-surface)",
        }}
        className="border border-[var(--color-border-default)]"
      >
        <MemoryPanel />
      </div>
    </ProjectStoreProvider>
  );
}

const meta: Meta<typeof MemoryPanel> = {
  title: "Features/MemoryPanel",
  component: MemoryPanel,
};

export default meta;

type Story = StoryObj<typeof MemoryPanel>;

export const Default: Story = {
  render: () => (
    <MemoryPanelStoryWrapper
      state={{
        projectId: "proj-story",
        preferenceLearningEnabled: true,
        conflictCount: 0,
        rules: [
          createRule({
            id: "rule-1",
            category: "pacing",
            rule: "动作场景偏好短句",
          }),
          createRule({
            id: "rule-2",
            category: "style",
            rule: "对白尽量口语化",
            confidence: 0.91,
          }),
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Empty: Story = {
  render: () => (
    <MemoryPanelStoryWrapper
      state={{
        projectId: "proj-story",
        preferenceLearningEnabled: true,
        conflictCount: 0,
        rules: [],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const PausedLearning: Story = {
  render: () => (
    <MemoryPanelStoryWrapper
      state={{
        projectId: "proj-story",
        preferenceLearningEnabled: false,
        conflictCount: 0,
        rules: [createRule({ id: "rule-1", category: "pacing" })],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const ConflictNotice: Story = {
  render: () => (
    <MemoryPanelStoryWrapper
      state={{
        projectId: "proj-story",
        preferenceLearningEnabled: true,
        conflictCount: 1,
        rules: [
          createRule({ id: "rule-1", category: "style", rule: "偏好长句" }),
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

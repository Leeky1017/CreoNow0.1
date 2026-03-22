import type { Meta, StoryObj } from "@storybook/react";
import { NotepadText } from "lucide-react";
import { QualityGatesPanel } from "./QualityGatesPanel";
import {
  SAMPLE_CHECK_GROUPS,
  ALL_PASSED_GROUPS,
  RUNNING_GROUPS,
} from "./qualityGatesStoryData";
import { expect } from "@storybook/test";

const meta: Meta<typeof QualityGatesPanel> = {
  title: "Features/QualityGates/Overview",
  component: QualityGatesPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "质量门禁面板 - 用于检查和管理文档质量约束，包括风格、一致性和完整性检查。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)]">
        <div className="flex-1 h-full flex flex-col relative">
          <div className="h-14 border-b border-[var(--color-separator)] flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded bg-[var(--color-info)]/20 text-[var(--color-info)] flex items-center justify-center">
                <NotepadText size={16} strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-[var(--color-fg-muted)]">
                The Architecture of Silence
              </span>
            </div>
          </div>
          <div className="flex-1 p-12 overflow-hidden flex justify-center">
            <div className="w-full max-w-3xl h-full bg-[var(--color-bg-surface)] rounded-t-lg border-x border-t border-[var(--color-separator)] shadow-[var(--shadow-2xl)] p-16 relative">
              <div className="w-1/3 h-8 bg-[var(--color-bg-overlay)] rounded mb-10" />
              <div className="w-full h-3 bg-[var(--color-separator)] rounded mb-4" />
              <div className="w-full h-3 bg-[var(--color-separator)] rounded mb-4" />
              <div className="w-5/6 h-3 bg-[var(--color-separator)] rounded mb-4" />
              <div className="w-full h-3 bg-[var(--color-separator)] rounded mb-8" />
              <div className="w-1/4 h-5 bg-[var(--color-separator)] rounded mb-6" />
              <div className="w-full h-3 bg-[var(--color-separator)] rounded mb-4" />
              <div className="w-11/12 h-3 bg-[var(--color-separator)] rounded mb-4" />
              <div className="w-full h-3 bg-[var(--color-separator)] rounded mb-4" />
            </div>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onToggleCheck: { action: "onToggleCheck" },
    onFixIssue: { action: "onFixIssue" },
    onIgnoreIssue: { action: "onIgnoreIssue" },
    onViewInEditor: { action: "onViewInEditor" },
    onRunAllChecks: { action: "onRunAllChecks" },
    onClose: { action: "onClose" },
    onSettingsChange: { action: "onSettingsChange" },
    onToggleSettings: { action: "onToggleSettings" },
  },
};

export default meta;
type Story = StoryObj<typeof QualityGatesPanel>;

/** 有 2 个问题的默认状态 */
export const DefaultWithIssues: Story = {
  args: {
    checkGroups: SAMPLE_CHECK_GROUPS,
    panelStatus: "issues-found",
    issuesCount: 2,
    expandedCheckId: "character-names",
    settings: {
      runOnSave: true,
      blockOnErrors: false,
      frequency: "on-demand",
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 全部通过 */
export const AllPassed: Story = {
  args: {
    checkGroups: ALL_PASSED_GROUPS,
    panelStatus: "all-passed",
    issuesCount: 0,
    settings: {
      runOnSave: true,
      blockOnErrors: false,
      frequency: "on-demand",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '全部通过状态。顶部显示绿色圆点和 "All Passed"，所有检查项显示绿色勾号，并显示鼓励文案。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 检查进行中 */
export const CheckRunning: Story = {
  args: {
    checkGroups: RUNNING_GROUPS,
    panelStatus: "running",
    settings: {
      runOnSave: true,
      blockOnErrors: false,
      frequency: "on-demand",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '检查进行中状态。顶部显示 spinner 和 "Running checks..."，正在检查的项目显示加载动画。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 多个问题展示 */
export const MultipleIssues: Story = {
  args: {
    checkGroups: [
      {
        id: "consistency",
        name: "Consistency",
        checks: [
          {
            id: "character-names",
            name: "Character Names",
            description: "Ensures consistent naming conventions...",
            status: "error",
            issues: [
              {
                id: "issue-1",
                description: '"Elara" 在 Chapter 3 被写成 "Elera"',
                location: "Chapter 3, Paragraph 5",
                severity: "error",
              },
              {
                id: "issue-2",
                description: '"Kaelen" 在 Chapter 5 有不一致的拼写',
                location: "Chapter 5, Paragraph 2",
                severity: "warning",
              },
              {
                id: "issue-3",
                description: '"Darius" 在 Chapter 7 被错误地称为 "Darus"',
                location: "Chapter 7, Paragraph 8",
                severity: "warning",
              },
            ],
          },
        ],
      },
    ],
    panelStatus: "errors",
    issuesCount: 3,
    expandedCheckId: "character-names",
    settings: {
      runOnSave: true,
      blockOnErrors: true,
      frequency: "after-edit",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "多个问题展示。展示同一检查项下有多个问题时的界面，包括错误和警告级别的问题。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Error 级别问题 — 严重错误（阻止发布） */
export const ErrorLevelIssues: Story = {
  args: {
    checkGroups: [
      {
        id: "consistency",
        name: "Consistency",
        checks: [
          {
            id: "character-names",
            name: "Character Names",
            description: "Ensures consistent naming conventions...",
            status: "error",
            issues: [
              {
                id: "issue-1",
                description:
                  '严重错误: 主角名字 "Alex" 在第 5 章突然变成了 "Max"，导致读者困惑',
                location: "Chapter 5, Paragraph 1",
                severity: "error",
              },
              {
                id: "issue-2",
                description:
                  '严重错误: 反派 "Dr. Kane" 在结局被写成 "Dr. Cane"',
                location: "Chapter 12, Paragraph 15",
                severity: "error",
              },
            ],
          },
          {
            id: "timeline",
            name: "Timeline",
            description: "Validates chronological consistency of events.",
            status: "error",
            issues: [
              {
                id: "issue-3",
                description:
                  "时间线错误: 故事开始于 2024 年，但第 3 章提到 2023 年的事件发生在未来",
                location: "Chapter 3, Paragraph 8",
                severity: "error",
              },
            ],
          },
        ],
      },
    ],
    panelStatus: "errors",
    issuesCount: 3,
    expandedCheckId: "character-names",
    settings: {
      runOnSave: true,
      blockOnErrors: true,
      frequency: "on-demand",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "严重错误展示。检查项显示红色 X 图标，问题卡片有红色边框，顶部显示 'Errors Found'。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 所有问题已忽略 */
export const AllIgnored: Story = {
  args: {
    checkGroups: [
      {
        id: "consistency",
        name: "Consistency",
        checks: [
          {
            id: "character-names",
            name: "Character Names",
            description: "Ensures consistent naming conventions...",
            status: "passed",
            ignoredCount: 2,
            issues: [
              {
                id: "issue-1",
                description: '"Elara" 在 Chapter 3 被写成 "Elera"',
                location: "Chapter 3, Paragraph 5",
                severity: "warning",
                ignored: true,
              },
              {
                id: "issue-2",
                description: '"Kaelen" 在 Chapter 5 有不一致的拼写',
                location: "Chapter 5, Paragraph 2",
                severity: "warning",
                ignored: true,
              },
            ],
          },
          {
            id: "timeline",
            name: "Timeline",
            description: "Validates chronological consistency of events.",
            status: "passed",
          },
        ],
      },
      {
        id: "completeness",
        name: "Completeness",
        checks: [
          {
            id: "plot-threads",
            name: "Plot Threads",
            description: "Tracks unresolved plot threads...",
            status: "passed",
          },
        ],
      },
    ],
    panelStatus: "all-passed",
    issuesCount: 0,
    expandedCheckId: "character-names",
    settings: {
      runOnSave: true,
      blockOnErrors: false,
      frequency: "on-demand",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '所有问题已忽略。检查项显示 "2 Ignored" 标签，问题有删除线样式，顶部状态为绿色。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

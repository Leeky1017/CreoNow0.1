import type { Meta, StoryObj } from "@storybook/react";
import { NotepadText } from "lucide-react";
import React from "react";
import {
  QualityGatesPanel,
  type CheckGroup,
  type QualitySettings,
} from "./QualityGatesPanel";

/**
 * Sample check data based on design spec
 *
 * Check groups:
 * - Style (2 checks): Passive Voice, Sentence Variety
 * - Consistency (3 checks): Character Names (1 issue), Timeline, Settings
 * - Completeness (2 checks): Plot Threads (1 issue), Character Arcs
 */
const SAMPLE_CHECK_GROUPS: CheckGroup[] = [
  {
    id: "style",
    name: "Style",
    checks: [
      {
        id: "passive-voice",
        name: "Passive Voice",
        description: "Detects overuse of passive voice (threshold: 15%)",
        status: "passed",
        resultValue: "8%",
      },
      {
        id: "sentence-variety",
        name: "Sentence Variety",
        description: "Analyzes sentence length distribution...",
        status: "passed",
        resultValue: "76%",
      },
    ],
  },
  {
    id: "consistency",
    name: "Consistency",
    checks: [
      {
        id: "character-names",
        name: "Character Names",
        description: "Ensures consistent naming conventions...",
        status: "warning",
        issues: [
          {
            id: "issue-1",
            description: '"Elara" 在 Chapter 3 被写成 "Elera"',
            location: "Chapter 3, Paragraph 5",
            severity: "warning",
          },
        ],
      },
      {
        id: "timeline",
        name: "Timeline",
        description: "Validates chronological consistency of events.",
        status: "passed",
      },
      {
        id: "settings-consistency",
        name: "Settings",
        description:
          "Checks for consistent descriptions of locations and settings.",
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
        description: "Tracks unresolved plot threads and story arcs...",
        status: "warning",
        issues: [
          {
            id: "issue-2",
            description:
              "The mystery of the Crystal Key is introduced but never resolved.",
            location: "Chapter 1 - Chapter 12",
            severity: "warning",
          },
        ],
      },
      {
        id: "character-arcs",
        name: "Character Arcs",
        description: "Monitors character development and arc completeness.",
        status: "passed",
      },
    ],
  },
];

/**
 * All checks passed data
 */
const ALL_PASSED_GROUPS: CheckGroup[] = [
  {
    id: "style",
    name: "Style",
    checks: [
      {
        id: "passive-voice",
        name: "Passive Voice",
        description: "Detects overuse of passive voice (threshold: 15%)",
        status: "passed",
        resultValue: "8%",
      },
      {
        id: "sentence-variety",
        name: "Sentence Variety",
        description: "Analyzes sentence length distribution...",
        status: "passed",
        resultValue: "76%",
      },
    ],
  },
  {
    id: "consistency",
    name: "Consistency",
    checks: [
      {
        id: "character-names",
        name: "Character Names",
        description: "Ensures consistent naming conventions...",
        status: "passed",
      },
      {
        id: "timeline",
        name: "Timeline",
        description: "Validates chronological consistency of events.",
        status: "passed",
      },
      {
        id: "settings-consistency",
        name: "Settings",
        description:
          "Checks for consistent descriptions of locations and settings.",
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
        description: "Tracks unresolved plot threads and story arcs...",
        status: "passed",
      },
      {
        id: "character-arcs",
        name: "Character Arcs",
        description: "Monitors character development and arc completeness.",
        status: "passed",
      },
    ],
  },
];

/**
 * Running checks data
 */
const RUNNING_GROUPS: CheckGroup[] = [
  {
    id: "style",
    name: "Style",
    checks: [
      {
        id: "passive-voice",
        name: "Passive Voice",
        description: "Detects overuse of passive voice (threshold: 15%)",
        status: "running",
      },
      {
        id: "sentence-variety",
        name: "Sentence Variety",
        description: "Analyzes sentence length distribution...",
        status: "passed",
        resultValue: "76%",
      },
    ],
  },
  {
    id: "consistency",
    name: "Consistency",
    checks: [
      {
        id: "character-names",
        name: "Character Names",
        description: "Ensures consistent naming conventions...",
        status: "passed",
      },
      {
        id: "timeline",
        name: "Timeline",
        description: "Validates chronological consistency of events.",
        status: "passed",
      },
      {
        id: "settings-consistency",
        name: "Settings",
        description:
          "Checks for consistent descriptions of locations and settings.",
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
        description: "Tracks unresolved plot threads and story arcs...",
        status: "passed",
      },
      {
        id: "character-arcs",
        name: "Character Arcs",
        description: "Monitors character development and arc completeness.",
        status: "passed",
      },
    ],
  },
];

const meta: Meta<typeof QualityGatesPanel> = {
  title: "Features/QualityGatesPanel",
  component: QualityGatesPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "质量门禁面板 - 用于检查和管理文档质量约束，包括风格、一致性和完整性检查。对应设计稿: 35-constraints-panel.html",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)]">
        {/* Main content area placeholder */}
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
            <div className="w-full max-w-3xl h-full bg-[#121212] rounded-t-lg border-x border-t border-[var(--color-separator)] shadow-[var(--shadow-2xl)] p-16 relative">
              <div className="w-1/3 h-8 bg-[rgba(255,255,255,0.08)] rounded mb-10" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-5/6 h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-8" />

              <div className="w-1/4 h-5 bg-[rgba(255,255,255,0.06)] rounded mb-6" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-11/12 h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
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

/**
 * Scene 1: DefaultWithIssues
 *
 * 有 2 个问题的状态
 * - 验证顶部黄色圆点 + "2 Issues Found"
 * - 验证 Consistency 分组展开，显示问题
 * - 验证 Character Names 检查项有黄色警告图标
 * - 验证问题数量 badge "1"
 */
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
};

/**
 * Scene 2: AllPassed
 *
 * 全部通过
 * - 验证顶部绿色圆点 + "All Passed"
 * - 验证所有检查项显示绿色勾号
 * - 验证鼓励文案 "Your content meets all quality standards."
 */
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
};

/**
 * Scene 3: CheckRunning
 *
 * 检查进行中
 * - 验证顶部显示 spinner
 * - 验证文案 "Running checks..."
 * - 验证当前检查项显示进度动画
 */
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
};

/**
 * Render component for ExpandedIssueDetail story
 */
function ExpandedIssueDetailRender() {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    "character-names",
  );

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1" />
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={2}
        expandedCheckId={expandedId}
        onToggleCheck={(id) => setExpandedId(expandedId === id ? null : id)}
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
      />
    </div>
  );
}

/**
 * Scene 4: ExpandedIssueDetail
 *
 * 展开问题详情
 * - 点击 "Character Names" 检查项
 * - 验证展开问题详情卡片
 * - 验证显示 Location "Chapter 3, Paragraph 5"
 * - 验证 Fix Issue/Ignore/View in Editor 三个按钮
 */
export const ExpandedIssueDetail: Story = {
  render: () => <ExpandedIssueDetailRender />,
  parameters: {
    docs: {
      description: {
        story:
          '展开问题详情。点击 "Character Names" 检查项可展开问题详情卡片，显示问题描述、位置和操作按钮。',
      },
    },
  },
};

/**
 * Render component for FixIssueAction story
 */
function FixIssueActionRender() {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    "character-names",
  );
  const [fixingId, setFixingId] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState(SAMPLE_CHECK_GROUPS);

  const handleFix = (checkId: string, issueId: string) => {
    setFixingId(issueId);
    // Simulate fixing
    setTimeout(() => {
      setFixingId(null);
      // Update the check to passed
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          checks: g.checks.map((c) =>
            c.id === checkId
              ? {
                  ...c,
                  status: "passed" as const,
                  issues: c.issues?.filter((i) => i.id !== issueId),
                }
              : c,
          ),
        })),
      );
    }, 1500);
  };

  const totalIssues = groups.reduce(
    (acc, g) =>
      acc +
      g.checks.reduce(
        (a, c) => a + (c.issues?.filter((i) => !i.ignored).length ?? 0),
        0,
      ),
    0,
  );

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--color-fg-muted)] text-sm text-center">
          <p>Click &quot;Fix Issue&quot; to simulate fixing</p>
          <p className="mt-2">
            Current issues: <strong>{totalIssues}</strong>
          </p>
        </div>
      </div>
      <QualityGatesPanel
        checkGroups={groups}
        panelStatus={totalIssues > 0 ? "issues-found" : "all-passed"}
        issuesCount={totalIssues}
        expandedCheckId={expandedId}
        onToggleCheck={(id) => setExpandedId(expandedId === id ? null : id)}
        onFixIssue={handleFix}
        fixingIssueId={fixingId}
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
      />
    </div>
  );
}

/**
 * Scene 5: FixIssueAction
 *
 * 修复问题操作
 * - 点击 "Fix Issue" 按钮
 * - 验证按钮变为 loading 状态
 * - 验证修复完成后检查项变绿
 */
export const FixIssueAction: Story = {
  render: () => <FixIssueActionRender />,
  parameters: {
    docs: {
      description: {
        story:
          '修复问题操作。点击 "Fix Issue" 按钮后，按钮显示 loading 状态，修复完成后检查项状态变为绿色通过。',
      },
    },
  },
};

/**
 * Render component for IgnoreIssueAction story
 */
function IgnoreIssueActionRender() {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    "character-names",
  );
  const [groups, setGroups] = React.useState(SAMPLE_CHECK_GROUPS);

  const handleIgnore = (checkId: string, issueId: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        checks: g.checks.map((c) =>
          c.id === checkId
            ? {
                ...c,
                ignoredCount: (c.ignoredCount ?? 0) + 1,
                issues: c.issues?.map((i) =>
                  i.id === issueId ? { ...i, ignored: true } : i,
                ),
              }
            : c,
        ),
      })),
    );
  };

  const totalIssues = groups.reduce(
    (acc, g) =>
      acc +
      g.checks.reduce(
        (a, c) => a + (c.issues?.filter((i) => !i.ignored).length ?? 0),
        0,
      ),
    0,
  );

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--color-fg-muted)] text-sm text-center">
          <p>Click &quot;Ignore&quot; to ignore an issue</p>
          <p className="mt-2">
            Active issues: <strong>{totalIssues}</strong>
          </p>
        </div>
      </div>
      <QualityGatesPanel
        checkGroups={groups}
        panelStatus={totalIssues > 0 ? "issues-found" : "all-passed"}
        issuesCount={totalIssues}
        expandedCheckId={expandedId}
        onToggleCheck={(id) => setExpandedId(expandedId === id ? null : id)}
        onIgnoreIssue={handleIgnore}
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
      />
    </div>
  );
}

/**
 * Scene 6: IgnoreIssueAction
 *
 * 忽略问题操作
 * - 点击 "Ignore" 按钮
 * - 验证问题消失
 * - 验证检查项显示 "1 Ignored" 小标签
 */
export const IgnoreIssueAction: Story = {
  render: () => <IgnoreIssueActionRender />,
  parameters: {
    docs: {
      description: {
        story:
          '忽略问题操作。点击 "Ignore" 按钮后，问题项会变为删除线样式，检查项显示忽略数量标签。',
      },
    },
  },
};

/**
 * Render component for SettingsExpanded story
 */
function SettingsExpandedRender() {
  const [settingsExpanded, setSettingsExpanded] = React.useState(true);
  const [settings, setSettings] = React.useState<QualitySettings>({
    runOnSave: true,
    blockOnErrors: false,
    frequency: "on-demand",
  });

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--color-fg-muted)] text-sm text-center space-y-2">
          <p>Current settings:</p>
          <p>
            Run on save: <strong>{settings.runOnSave ? "Yes" : "No"}</strong>
          </p>
          <p>
            Block on errors:{" "}
            <strong>{settings.blockOnErrors ? "Yes" : "No"}</strong>
          </p>
          <p>
            Frequency: <strong>{settings.frequency}</strong>
          </p>
        </div>
      </div>
      <QualityGatesPanel
        checkGroups={SAMPLE_CHECK_GROUPS}
        panelStatus="issues-found"
        issuesCount={2}
        settingsExpanded={settingsExpanded}
        onToggleSettings={() => setSettingsExpanded(!settingsExpanded)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}

/**
 * Scene 7: SettingsExpanded
 *
 * 展开设置区域
 * - 点击 Settings 折叠区
 * - 验证 Toggle 控件显示
 * - 验证下拉选择可用
 * - 切换 Toggle，验证状态
 */
export const SettingsExpanded: Story = {
  render: () => <SettingsExpandedRender />,
  parameters: {
    docs: {
      description: {
        story:
          "展开设置区域。Settings 区域展开后显示 Toggle 控件和下拉选择，可以配置检查行为。",
      },
    },
  },
};

/**
 * Render component for RunAllChecks story
 */
function RunAllChecksRender() {
  const [panelStatus, setPanelStatus] = React.useState<
    "all-passed" | "issues-found" | "running"
  >("issues-found");
  const [groups, setGroups] = React.useState(SAMPLE_CHECK_GROUPS);

  const handleRunAll = () => {
    setPanelStatus("running");
    // Set all checks to running
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        checks: g.checks.map((c) => ({ ...c, status: "running" as const })),
      })),
    );

    // Simulate checks completing one by one
    let delay = 500;
    SAMPLE_CHECK_GROUPS.forEach((group) => {
      group.checks.forEach((check) => {
        setTimeout(() => {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === group.id
                ? {
                    ...g,
                    checks: g.checks.map((c) =>
                      c.id === check.id ? { ...c, status: check.status } : c,
                    ),
                  }
                : g,
            ),
          );
        }, delay);
        delay += 500;
      });
    });

    // Complete all checks
    setTimeout(() => {
      setGroups(SAMPLE_CHECK_GROUPS);
      setPanelStatus("issues-found");
    }, delay);
  };

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--color-fg-muted)] text-sm text-center">
          <p>Click &quot;Run All Checks&quot; to simulate check execution</p>
        </div>
      </div>
      <QualityGatesPanel
        checkGroups={groups}
        panelStatus={panelStatus}
        issuesCount={2}
        onRunAllChecks={handleRunAll}
        settings={{
          runOnSave: true,
          blockOnErrors: false,
          frequency: "on-demand",
        }}
      />
    </div>
  );
}

/**
 * Scene 8: RunAllChecks
 *
 * 运行所有检查
 * - 点击 "Run All Checks" 按钮
 * - 验证按钮变为 loading 状态
 * - 验证所有分组依次显示检查动画
 * - 验证完成后状态更新
 */
export const RunAllChecks: Story = {
  render: () => <RunAllChecksRender />,
  parameters: {
    docs: {
      description: {
        story:
          '运行所有检查。点击 "Run All Checks" 按钮后，按钮显示 loading 状态，所有检查项依次显示检查动画，完成后状态更新。',
      },
    },
  },
};

/**
 * Additional Scene: Multiple Issues
 *
 * 多个问题展示
 * - 验证多个问题的展示
 * - 验证问题卡片的不同状态
 */
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
};

// =============================================================================
// P3: 补充场景
// =============================================================================

/**
 * Error 级别问题
 *
 * 展示严重错误（阻止发布）的样式。
 *
 * 验证点：
 * - 检查项显示红色错误图标（X）
 * - 问题卡片有红色边框
 * - 顶部状态显示红色圆点
 * - "Block on Errors" 设置为 true
 *
 * 浏览器测试步骤：
 * 1. 验证检查项图标为红色 X
 * 2. 验证问题卡片边框为红色
 * 3. 验证顶部状态显示 "Errors Found"
 */
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
};

/**
 * 所有问题已忽略
 *
 * 展示所有问题都被忽略后的状态。
 *
 * 验证点：
 * - 检查项显示 "2 Ignored" 标签
 * - 问题项有删除线样式
 * - 顶部状态显示 "All Passed"（因为活跃问题为 0）
 * - 可以取消忽略
 *
 * 浏览器测试步骤：
 * 1. 验证检查项显示 "2 Ignored" 灰色标签
 * 2. 展开检查项，验证问题有删除线
 * 3. 验证顶部状态为绿色 "All Passed"
 */
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
};

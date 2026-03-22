import type { Meta, StoryObj } from "@storybook/react";
import { NotepadText } from "lucide-react";
import React from "react";
import { QualityGatesPanel, type QualitySettings } from "./QualityGatesPanel";
import { SAMPLE_CHECK_GROUPS } from "./qualityGatesStoryData";
import { expect } from "@storybook/test";

const meta: Meta<typeof QualityGatesPanel> = {
  title: "Features/QualityGates/Actions",
  component: QualityGatesPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "质量门禁面板交互场景 — 展开详情、修复、忽略、设置、运行检查等交互操作。",
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
            <div className="w-full max-w-3xl h-full bg-[var(--color-bg-surface)] rounded-t-lg border-x border-t border-[var(--color-separator)] shadow-[var(--shadow-xl)] p-16 relative">
              <div className="w-1/3 h-8 bg-white/8 rounded mb-10" />
              <div className="w-full h-3 bg-white/[0.04] rounded mb-4" />
              <div className="w-full h-3 bg-white/[0.04] rounded mb-4" />
              <div className="w-5/6 h-3 bg-white/[0.04] rounded mb-4" />
              <div className="w-full h-3 bg-white/[0.04] rounded mb-8" />
              <div className="w-1/4 h-5 bg-white/[0.06] rounded mb-6" />
              <div className="w-full h-3 bg-white/[0.04] rounded mb-4" />
              <div className="w-11/12 h-3 bg-white/[0.04] rounded mb-4" />
              <div className="w-full h-3 bg-white/[0.04] rounded mb-4" />
            </div>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QualityGatesPanel>;

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

/** 展开问题详情 */
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function FixIssueActionRender() {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    "character-names",
  );
  const [fixingId, setFixingId] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState(SAMPLE_CHECK_GROUPS);

  const handleFix = (checkId: string, issueId: string) => {
    setFixingId(issueId);
    setTimeout(() => {
      setFixingId(null);
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

/** 修复问题操作 */
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

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

/** 忽略问题操作 */
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

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

/** 展开设置区域 */
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function RunAllChecksRender() {
  const [panelStatus, setPanelStatus] = React.useState<
    "all-passed" | "issues-found" | "running"
  >("issues-found");
  const [groups, setGroups] = React.useState(SAMPLE_CHECK_GROUPS);

  const handleRunAll = () => {
    setPanelStatus("running");
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        checks: g.checks.map((c) => ({ ...c, status: "running" as const })),
      })),
    );

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

/** 运行所有检查 */
export const RunAllChecks: Story = {
  render: () => <RunAllChecksRender />,
  parameters: {
    docs: {
      description: {
        story:
          '运行所有检查。点击 "Run All Checks" 按钮后，所有检查项依次显示检查动画，完成后状态更新。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

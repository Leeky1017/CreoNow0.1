import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  DiffView,
  UnifiedDiffView,
  parseDiffLines,
  getChangePositions,
} from "./DiffView";
import { DiffViewPanel } from "./DiffViewPanel";
import { DiffHeader, type DiffViewMode, type VersionInfo } from "./DiffHeader";
import { DiffFooter } from "./DiffFooter";
import { SplitDiffView } from "./SplitDiffView";
import { layoutDecorator } from "../../components/layout/test-utils";

/**
 * DiffView 基础展示 Stories
 *
 * 功能：
 * - 显示统一 diff 文本，带语法高亮
 * - 添加行（绿色背景）、删除行（红色背景 + 删除线）
 * - 头部信息（灰色）、上下文行（暗色）
 * - 双列行号（旧/新）
 * - +/- 指示器
 */
const meta = {
  title: "Features/DiffView/Basic",
  component: DiffView,
  decorators: [layoutDecorator],
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    diffText: {
      control: "text",
      description: "Unified diff text to display",
    },
  },
} satisfies Meta<typeof DiffView>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleDiff = `--- a/file.txt
+++ b/file.txt
@@ -1,5 +1,5 @@
 Line 1
-Line 2 (old)
+Line 2 (new)
 Line 3
 Line 4
 Line 5`;

const longDiff = `--- a/document.md
+++ b/document.md
@@ -42,15 +42,16 @@

 # The Architecture of Silence

-Intrigued by beauty, fascinated by technology and
-fuelled with an everlasting devotion to digital
-craftsmanship.
+Driven by aesthetics, fascinated by AI and fueled
+with an eternal devotion to digital art.

-Design is not just about making things look good. It is
+Design isn't merely about aesthetics. It is fundamentally
 about how things work. In the digital sphere, this
-translates to the seamless integration of form and
-function.
+translates to the seamless integration of form,
+function, and emotion.

 We build immersive environments where typography
 leads the eye and imagery sets the mood.`;

const mockVersions: VersionInfo[] = [
  { id: "2h", label: "Version from 2h ago", type: "auto" },
  { id: "yesterday", label: "Yesterday, 4:20 PM", type: "manual" },
  { id: "3days", label: "3 days ago", type: "auto" },
  { id: "current", label: "Current Version", type: "current" },
];

/**
 * Legacy DiffView（向后兼容）
 */
export const Default: Story = {
  args: {
    diffText: sampleDiff,
  },
  render: (args) => (
    <div
      style={{
        width: "400px",
        backgroundColor: "var(--color-bg-surface)",
        padding: "16px",
      }}
    >
      <DiffView {...args} />
    </div>
  ),
};

/**
 * 空 diff
 */
export const Empty: Story = {
  args: {
    diffText: "",
  },
  render: (args) => (
    <div
      style={{
        width: "400px",
        backgroundColor: "var(--color-bg-surface)",
        padding: "16px",
      }}
    >
      <DiffView {...args} />
    </div>
  ),
};

/**
 * 完整 DiffViewPanel（统一视图）
 *
 * 包含：Header + UnifiedDiffView + Footer
 */
export const FullPanelUnified: Story = {
  args: {
    diffText: longDiff,
  },
  render: (args) => (
    <div style={{ width: "900px", height: "600px" }}>
      <DiffViewPanel
        diffText={args.diffText}
        versions={mockVersions}
        initialViewMode="unified"
        onClose={() => console.log("Close clicked")}
        onRestore={() => console.log("Restore clicked")}
      />
    </div>
  ),
};

/**
 * 完整 DiffViewPanel（分屏视图）
 *
 * 包含：Header + SplitDiffView + Footer
 */
export const FullPanelSplit: Story = {
  args: {
    diffText: longDiff,
  },
  render: (args) => (
    <div style={{ width: "1100px", height: "600px" }}>
      <DiffViewPanel
        diffText={args.diffText}
        versions={mockVersions}
        initialViewMode="split"
        onClose={() => console.log("Close clicked")}
        onRestore={() => console.log("Restore clicked")}
      />
    </div>
  ),
};

/**
 * UnifiedDiffView 组件
 *
 * 带双列行号和 +/- 指示器
 */
export const UnifiedViewOnly: Story = {
  args: {
    diffText: longDiff,
  },
  render: (args) => {
    const { lines } = parseDiffLines(args.diffText);
    const changePositions = getChangePositions(lines);
    return (
      <div
        style={{ width: "700px", height: "400px" }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-separator)] rounded-lg overflow-hidden"
      >
        <UnifiedDiffView
          lines={lines}
          currentChangeIndex={0}
          changePositions={changePositions}
        />
      </div>
    );
  },
};

/**
 * SplitDiffView 组件
 *
 * 左右分屏 Before/After 视图
 */
export const SplitViewOnly: Story = {
  args: {
    diffText: longDiff,
  },
  render: (args) => {
    const { lines } = parseDiffLines(args.diffText);
    return (
      <div
        style={{ width: "900px", height: "400px" }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-separator)] rounded-lg overflow-hidden flex flex-col"
      >
        <SplitDiffView lines={lines} />
      </div>
    );
  },
};

/**
 * DiffHeader 组件
 *
 * 版本选择、视图切换、导航
 */
export const HeaderOnly: Story = {
  args: {
    diffText: sampleDiff,
  },
  render: () => <HeaderOnlyDemo />,
};

function HeaderOnlyDemo(): JSX.Element {
  const [viewMode, setViewMode] = React.useState<DiffViewMode>("unified");
  const [currentChange, setCurrentChange] = React.useState(2);
  const [beforeVersion, setBeforeVersion] = React.useState("2h");

  return (
    <div style={{ width: "900px" }} className="bg-[var(--color-bg-surface)]">
      <DiffHeader
        versions={mockVersions}
        selectedBeforeVersion={beforeVersion}
        selectedAfterVersion="current"
        onBeforeVersionChange={setBeforeVersion}
        onAfterVersionChange={() => {}}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentChangeIndex={currentChange}
        totalChanges={12}
        onPreviousChange={() => setCurrentChange((c) => Math.max(0, c - 1))}
        onNextChange={() => setCurrentChange((c) => Math.min(11, c + 1))}
        onClose={() => console.log("Close clicked")}
      />
    </div>
  );
}

/**
 * DiffFooter 组件
 *
 * 统计信息和操作按钮
 */
export const FooterOnly: Story = {
  args: {
    diffText: sampleDiff,
  },
  render: () => (
    <div style={{ width: "900px" }} className="bg-[var(--color-bg-surface)]">
      <DiffFooter
        stats={{ addedLines: 42, removedLines: 18, changedHunks: 3 }}
        onClose={() => console.log("Close clicked")}
        onRestore={() => console.log("Restore clicked")}
      />
    </div>
  ),
};

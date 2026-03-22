import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { NotepadText } from "lucide-react";
import { VersionHistoryPanel, type TimeGroup } from "./VersionHistoryPanel";

/** Sample version data based on design spec */
const SAMPLE_TIME_GROUPS: TimeGroup[] = [
  {
    label: "",
    versions: [
      {
        id: "current",
        timestamp: "Just now",
        authorType: "user",
        authorName: "You",
        description: "Fixed typo in the executive summary and updated...",
        wordChange: { type: "none", count: 0 },
        isCurrent: true,
        reason: "manual-save",
      },
    ],
  },
  {
    label: "Earlier Today",
    versions: [
      {
        id: "v-1042",
        timestamp: "10:42 AM",
        authorType: "ai",
        authorName: "AI Assistant",
        description:
          'Generated new section on "Security Protocols" based on compliance requirements...',
        wordChange: { type: "added", count: 124 },
        reason: "ai-apply:run-abc123",
        affectedParagraphs: 3,
        diffSummary:
          '+ "安全协议" 章节新增：包括数据加密、访问控制、审计日志等内容...',
      },
      {
        id: "v-0915",
        timestamp: "9:15 AM",
        authorType: "user",
        authorName: "Sarah M.",
        description:
          "Removed redundant paragraph in introduction. Cleaned up formatting.",
        wordChange: { type: "removed", count: 12 },
        reason: "manual-save",
        affectedParagraphs: 1,
      },
      {
        id: "v-0800",
        timestamp: "8:00 AM",
        authorType: "auto-save",
        authorName: "Auto-Save",
        description: "System checkpoint created automatically.",
        wordChange: { type: "none", count: 0 },
        reason: "autosave",
      },
    ],
  },
  {
    label: "Yesterday",
    versions: [
      {
        id: "v-y-1620",
        timestamp: "4:20 PM",
        authorType: "user",
        authorName: "You",
        description:
          "Added initial scope definitions and stakeholder requirements...",
        wordChange: { type: "added", count: 54 },
        reason: "manual-save",
        affectedParagraphs: 2,
      },
      {
        id: "v-y-1445",
        timestamp: "2:45 PM",
        authorType: "ai",
        authorName: "AI Assistant",
        description:
          "First draft generation of the technical specifications outline.",
        wordChange: { type: "added", count: 312 },
        reason: "ai-apply:run-xyz789",
        affectedParagraphs: 5,
        diffSummary:
          "+ 技术规格大纲生成：包括系统架构、API 设计、数据模型等...",
      },
      {
        id: "v-y-1100",
        timestamp: "11:00 AM",
        authorType: "user",
        authorName: "You",
        description: "Created blank document.",
        wordChange: { type: "added", count: 15 },
        reason: "manual-save",
      },
    ],
  },
];

/** Word count variations data */
const WORD_COUNT_VARIATIONS: TimeGroup[] = [
  {
    label: "Word Count Examples",
    versions: [
      {
        id: "wc-added",
        timestamp: "10:42 AM",
        authorType: "ai",
        authorName: "AI Assistant",
        description: "Added extensive content about security protocols.",
        wordChange: { type: "added", count: 124 },
      },
      {
        id: "wc-removed",
        timestamp: "9:15 AM",
        authorType: "user",
        authorName: "Sarah M.",
        description: "Removed redundant paragraph in introduction.",
        wordChange: { type: "removed", count: 12 },
      },
      {
        id: "wc-none",
        timestamp: "8:00 AM",
        authorType: "auto-save",
        authorName: "Auto-Save",
        description: "System checkpoint created automatically.",
        wordChange: { type: "none", count: 0 },
      },
    ],
  },
];

const meta: Meta<typeof VersionHistoryPanel> = {
  title: "Features/VersionHistory/List",
  component: VersionHistoryPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "版本历史面板 - 列表与显示场景。对应设计稿: 23-version-history.html",
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
                Project Requirements.docx
              </span>
            </div>
          </div>
          <div className="flex-1 p-12 overflow-hidden flex justify-center">
            <div className="w-full max-w-3xl h-full bg-[#121212] rounded-t-lg border-x border-t border-[var(--color-separator)] shadow-2xl p-16 relative">
              <div className="w-1/3 h-8 bg-[rgba(255,255,255,0.08)] rounded mb-10" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-5/6 h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-8" />
              <div className="w-1/4 h-5 bg-[rgba(255,255,255,0.06)] rounded mb-6" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-11/12 h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="w-full h-3 bg-[rgba(255,255,255,0.04)] rounded mb-4" />
              <div className="absolute top-64 left-16 right-16 h-24 bg-[var(--color-info)]/5 border-l-2 border-[var(--color-info)]/30" />
            </div>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSelect: { action: "onSelect" },
    onRestore: { action: "onRestore" },
    onCompare: { action: "onCompare" },
    onPreview: { action: "onPreview" },
    onClose: { action: "onClose" },
    onConfigureAutoSave: { action: "onConfigureAutoSave" },
  },
};

export default meta;
type Story = StoryObj<typeof VersionHistoryPanel>;

/** Scene 1: DefaultWithHistory — 完整版本历史 */
export const DefaultWithHistory: Story = {
  args: {
    documentTitle: "Project Requirements.docx",
    timeGroups: SAMPLE_TIME_GROUPS,
    selectedId: "v-1042",
    lastSavedText: "2m ago",
    autoSaveEnabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId("version-history-panel"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("version-card-v-1042"),
    ).toBeInTheDocument();
  },
};

/** Scene 2: SelectedVersionExpanded — 选中版本展开操作 */
export const SelectedVersionExpanded: Story = {
  args: {
    documentTitle: "Project Requirements.docx",
    timeGroups: SAMPLE_TIME_GROUPS,
    selectedId: "v-1042",
    lastSavedText: "2m ago",
    autoSaveEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "选中版本的展开状态。选中 10:42 AM AI Assistant 版本，显示左侧蓝色指示器和 Restore/Compare/Preview 操作按钮。",
      },
    },
  },
};

function HoverShowQuickActionsRender() {
  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1" />
      <VersionHistoryPanel
        documentTitle="Project Requirements.docx"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId={null}
        lastSavedText="2m ago"
        autoSaveEnabled
      />
    </div>
  );
}

/** Scene 3: HoverShowQuickActions — 悬停显示快速操作 */
export const HoverShowQuickActions: Story = {
  render: () => <HoverShowQuickActionsRender />,
  parameters: {
    docs: {
      description: {
        story:
          "悬停显示快速操作。将鼠标悬停在未选中的版本卡片上，会显示带有模糊背景的操作浮层（Restore/Compare/Preview 图标按钮）。",
      },
    },
  },
};

/** Scene 4: WordCountVariations — 不同变更量显示 */
export const WordCountVariations: Story = {
  args: {
    documentTitle: "Word Count Examples",
    timeGroups: WORD_COUNT_VARIATIONS,
    selectedId: null,
    lastSavedText: "5m ago",
    autoSaveEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "不同变更量的显示样式。+124 words 显示为绿色，-12 words 显示为红色，No changes 显示为灰色。",
      },
    },
  },
};

function generateManyVersions(): TimeGroup[] {
  const groups: TimeGroup[] = [
    {
      label: "",
      versions: [
        {
          id: "current",
          timestamp: "Just now",
          authorType: "user",
          authorName: "You",
          description: "Latest changes to the document...",
          wordChange: { type: "added", count: 5 },
          isCurrent: true,
        },
      ],
    },
    {
      label: "Earlier Today",
      versions: Array.from({ length: 8 }, (_, i) => ({
        id: `today-${i}`,
        timestamp: `${10 - i}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")} AM`,
        authorType: (["user", "ai", "auto-save"] as const)[i % 3],
        authorName: ["You", "AI Assistant", "Auto-Save"][i % 3],
        description: `Version ${i + 1} changes from earlier today with some description...`,
        wordChange: {
          type: (["added", "removed", "none"] as const)[i % 3],
          count: i % 3 === 2 ? 0 : Math.floor(Math.random() * 200),
        },
      })),
    },
    {
      label: "Yesterday",
      versions: Array.from({ length: 6 }, (_, i) => ({
        id: `yesterday-${i}`,
        timestamp: `${6 - i}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")} PM`,
        authorType: (["user", "ai", "auto-save"] as const)[i % 3],
        authorName: ["You", "AI Assistant", "Auto-Save"][i % 3],
        description: `Yesterday's version ${i + 1} with various edits and changes...`,
        wordChange: {
          type: (["added", "removed", "none"] as const)[i % 3],
          count: i % 3 === 2 ? 0 : Math.floor(Math.random() * 150),
        },
      })),
    },
    {
      label: "Last Week",
      versions: Array.from({ length: 5 }, (_, i) => ({
        id: `lastweek-${i}`,
        timestamp: `Jan ${28 - i}`,
        authorType: (["user", "ai"] as const)[i % 2],
        authorName: ["You", "AI Assistant"][i % 2],
        description: `Changes from last week, version ${i + 1}...`,
        wordChange: {
          type: (["added", "removed"] as const)[i % 2],
          count: Math.floor(Math.random() * 100),
        },
      })),
    },
  ];
  return groups;
}

/** Scene 7: ScrollAndSticky — 滚动和粘性标题 */
export const ScrollAndSticky: Story = {
  args: {
    documentTitle: "Large Document History.docx",
    timeGroups: generateManyVersions(),
    selectedId: null,
    lastSavedText: "1m ago",
    autoSaveEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "滚动和粘性标题测试。包含大量版本条目，用于测试滚动行为和分组标题的粘性效果。滚动时分组标题会固定在顶部。",
      },
    },
  },
};

/** Scene 8: AutoSaveDisabled — 自动保存关闭状态 */
export const AutoSaveDisabled: Story = {
  args: {
    documentTitle: "Project Requirements.docx",
    timeGroups: SAMPLE_TIME_GROUPS,
    selectedId: null,
    lastSavedText: "10m ago",
    autoSaveEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "自动保存关闭状态。底部显示 'Auto-save off'，状态指示器为灰色圆点。",
      },
    },
  },
};

function EmptyHistoryRender() {
  const emptyGroups: TimeGroup[] = [
    {
      label: "",
      versions: [
        {
          id: "current",
          timestamp: "Just now",
          authorType: "user",
          authorName: "You",
          description: "Created blank document.",
          wordChange: { type: "added", count: 0 },
          isCurrent: true,
        },
      ],
    },
  ];

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1" />
      <VersionHistoryPanel
        documentTitle="New Document.docx"
        timeGroups={emptyGroups}
        selectedId={null}
        lastSavedText="Just now"
        autoSaveEnabled
      />
    </div>
  );
}

/** Scene 9: EmptyHistory — 仅有当前版本的新文档 */
export const EmptyHistory: Story = {
  render: () => <EmptyHistoryRender />,
  parameters: {
    docs: {
      description: {
        story:
          "新文档仅有当前版本的状态。用于展示刚创建的文档，只有一个初始版本。",
      },
    },
  },
};

/** Rich version info showcasing reason, affectedParagraphs, and diffSummary */
const RICH_VERSION_INFO: TimeGroup[] = [
  {
    label: "丰富版本信息示例",
    versions: [
      {
        id: "rich-ai",
        timestamp: "10:42 AM",
        authorType: "ai",
        authorName: "AI Assistant",
        description: '生成了"安全协议"章节，包含数据加密和访问控制内容。',
        wordChange: { type: "added", count: 256 },
        reason: "ai-apply:run-abc123",
        affectedParagraphs: 4,
        diffSummary:
          '+ 第三章"安全协议"：本章详细描述了系统的安全机制，包括数据加密标准、用户权限管理...',
      },
      {
        id: "rich-manual",
        timestamp: "9:30 AM",
        authorType: "user",
        authorName: "You",
        description: "手动保存：修改了项目范围定义和利益相关者章节。",
        wordChange: { type: "added", count: 78 },
        reason: "manual-save",
        affectedParagraphs: 2,
        diffSummary: "+ 项目范围扩展至包含移动端应用...",
      },
      {
        id: "rich-auto",
        timestamp: "9:15 AM",
        authorType: "auto-save",
        authorName: "Auto-Save",
        description: "自动保存：系统检测到内容变化后自动保存。",
        wordChange: { type: "added", count: 12 },
        reason: "autosave",
        affectedParagraphs: 1,
      },
    ],
  },
];

/** Scene 11: RichVersionInfo — 丰富的版本信息展示 */
export const RichVersionInfo: Story = {
  args: {
    documentTitle: "项目需求文档.docx",
    timeGroups: RICH_VERSION_INFO,
    selectedId: "rich-ai",
    lastSavedText: "刚刚",
    autoSaveEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "丰富的版本信息展示。选中的版本卡片会显示：修改原因（如手动保存、自动保存、AI 修改）、受影响的段落数量、以及变更预览摘要。",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { NotepadText } from "lucide-react";
import React from "react";
import {
  VersionHistoryPanel,
  type TimeGroup,
} from "./VersionHistoryPanel";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../../components/primitives";

/**
 * Sample version data based on design spec
 *
 * Document: "Project Requirements.docx"
 *
 * Version groups:
 * - Just now: Current version (You, 0 words changed)
 * - Earlier Today:
 *   - 10:42 AM: AI Assistant (+124 words) - selected
 *   - 9:15 AM: Sarah M. (-12 words)
 *   - 8:00 AM: Auto-Save (No changes)
 * - Yesterday:
 *   - 4:20 PM: You (+54 words)
 *   - 2:45 PM: AI Assistant (+312 words)
 *   - 11:00 AM: You (+15 words)
 */
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
        diffSummary: '+ "安全协议" 章节新增：包括数据加密、访问控制、审计日志等内容...',
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
        diffSummary: '+ 技术规格大纲生成：包括系统架构、API 设计、数据模型等...',
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

/**
 * Minimal version data for word count variations story
 */
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
  title: "Features/VersionHistoryPanel",
  component: VersionHistoryPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "版本历史面板 - 用于查看和管理文档版本历史，包括恢复、对比和预览功能。对应设计稿: 23-version-history.html",
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
                Project Requirements.docx
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

/**
 * Scene 1: DefaultWithHistory
 *
 * 完整版本历史
 * - 验证时间分组标题 "Earlier Today" / "Yesterday"
 * - 验证当前版本 "Current" 标签样式（蓝色背景）
 * - 验证 AI 生成版本的蓝色图标
 * - 验证用户编辑版本的白色头像图标
 * - 验证 Auto-Save 版本的灰色图标
 */
export const DefaultWithHistory: Story = {
  args: {
    documentTitle: "Project Requirements.docx",
    timeGroups: SAMPLE_TIME_GROUPS,
    selectedId: "v-1042",
    lastSavedText: "2m ago",
    autoSaveEnabled: true,
  },
};

/**
 * Scene 2: SelectedVersionExpanded
 *
 * 选中版本展开操作
 * - 选中 10:42 AM AI 版本
 * - 验证左侧蓝色边框指示器
 * - 验证展开的 Restore/Compare/Preview 按钮
 * - 验证按钮 3 列布局
 */
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

/**
 * Render component for HoverShowQuickActions story
 */
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

/**
 * Scene 3: HoverShowQuickActions
 *
 * 悬停显示快速操作
 * - 悬停未选中的版本卡片
 * - 验证显示浮层操作按钮（Restore/Compare/Preview 图标）
 * - 验证浮层背景模糊效果
 */
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

/**
 * Scene 4: WordCountVariations
 *
 * 不同变更量显示
 * - +124 words: 绿色字体 + 绿色背景
 * - -12 words: 红色字体 + 红色背景
 * - No changes: 灰色字体
 */
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

/**
 * Restore confirmation dialog component
 */
function RestoreConfirmDialog({
  open,
  onOpenChange,
  versionTimestamp,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionTimestamp: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-[400px] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-2xl)] p-6 focus:outline-none">
          <Dialog.Title className="text-lg font-medium text-[var(--color-fg-default)] mb-2">
            Restore Version?
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[var(--color-fg-muted)] mb-6">
            Are you sure you want to restore the version from {versionTimestamp}
            ? Your current changes will be saved as a new version.
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Restore
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Render component for RestoreConfirmation story
 */
function RestoreConfirmationRender() {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>("v-1042");
  const [restored, setRestored] = React.useState(false);

  const selectedVersion = SAMPLE_TIME_GROUPS.flatMap((g) => g.versions).find(
    (v) => v.id === selectedId,
  );

  const handleRestore = (versionId: string) => {
    setSelectedId(versionId);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setRestored(true);
    setTimeout(() => setRestored(false), 3000);
  };

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1 flex items-center justify-center">
        {restored && (
          <div className="px-4 py-2 bg-[var(--color-success-subtle)] text-[var(--color-success)] rounded-md text-sm">
            Version restored successfully!
          </div>
        )}
      </div>
      <VersionHistoryPanel
        documentTitle="Project Requirements.docx"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRestore={handleRestore}
        lastSavedText="2m ago"
        autoSaveEnabled
      />
      <RestoreConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        versionTimestamp={selectedVersion?.timestamp ?? ""}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

/**
 * Scene 5: RestoreConfirmation
 *
 * 恢复版本确认
 * - 点击 Restore 按钮
 * - 验证弹出确认对话框
 * - 验证对话框文案
 */
export const RestoreConfirmation: Story = {
  render: () => <RestoreConfirmationRender />,
  parameters: {
    docs: {
      description: {
        story:
          '恢复版本确认流程。点击选中版本的 Restore 按钮，会弹出确认对话框。点击 Restore 确认恢复，或点击 Cancel 取消。',
      },
    },
  },
};

/**
 * Render component for CompareWithCurrent story
 */
function CompareWithCurrentRender() {
  const [selectedId, setSelectedId] = React.useState<string | null>("v-1042");
  const [comparing, setComparing] = React.useState<string | null>(null);

  const handleCompare = (versionId: string) => {
    setComparing(versionId);
    // In real app, this would open a diff view
  };

  const comparedVersion = SAMPLE_TIME_GROUPS.flatMap((g) => g.versions).find(
    (v) => v.id === comparing,
  );

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {comparing ? (
          <div className="text-center">
            <div className="text-[var(--color-fg-default)] mb-2">
              Comparing with version from{" "}
              <strong>{comparedVersion?.timestamp}</strong>
            </div>
            <div className="text-sm text-[var(--color-fg-muted)] mb-4">
              Diff view would appear here
            </div>
            <Button variant="secondary" onClick={() => setComparing(null)}>
              Close Compare View
            </Button>
          </div>
        ) : (
          <div className="text-[var(--color-fg-muted)] text-sm">
            Click &quot;Compare&quot; on a version to see differences
          </div>
        )}
      </div>
      <VersionHistoryPanel
        documentTitle="Project Requirements.docx"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCompare={handleCompare}
        lastSavedText="2m ago"
        autoSaveEnabled
      />
    </div>
  );
}

/**
 * Scene 6: CompareWithCurrent
 *
 * 与当前版本对比
 * - 点击 Compare 按钮
 * - 验证触发 onCompare 回调
 * - 验证按钮状态变化
 */
export const CompareWithCurrent: Story = {
  render: () => <CompareWithCurrentRender />,
  parameters: {
    docs: {
      description: {
        story:
          '与当前版本对比功能。点击选中版本的 Compare 按钮，触发对比模式（实际应用中会打开 Diff 视图）。',
      },
    },
  },
};

/**
 * Generate many versions for scroll testing
 */
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

/**
 * Scene 7: ScrollAndSticky
 *
 * 滚动和粘性标题
 * - 滚动列表
 * - 验证分组标题 sticky 行为
 * - 验证滚动条样式（6px 宽度）
 */
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

/**
 * Scene 8: AutoSaveDisabled
 *
 * 自动保存关闭状态
 * - 验证底部状态显示 "Auto-save off"
 * - 验证状态指示器为灰色
 */
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

/**
 * Render component for EmptyHistory story
 */
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

/**
 * Scene 9: EmptyHistory (only current version)
 *
 * 仅有当前版本的新文档
 * - 验证空状态只显示当前版本
 */
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

/**
 * Render component for PreviewVersion story
 */
function PreviewVersionRender() {
  const [selectedId, setSelectedId] = React.useState<string | null>("v-1042");
  const [previewing, setPreviewing] = React.useState<string | null>(null);

  const handlePreview = (versionId: string) => {
    setPreviewing(versionId);
  };

  const previewedVersion = SAMPLE_TIME_GROUPS.flatMap((g) => g.versions).find(
    (v) => v.id === previewing,
  );

  return (
    <div className="h-screen flex bg-[var(--color-bg-base)]">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {previewing ? (
          <div className="text-center max-w-md">
            <div className="text-[var(--color-fg-default)] mb-2">
              Previewing version from{" "}
              <strong>{previewedVersion?.timestamp}</strong>
            </div>
            <div className="text-sm text-[var(--color-fg-muted)] mb-2">
              {previewedVersion?.description}
            </div>
            <div className="text-xs text-[var(--color-fg-placeholder)] mb-4">
              Read-only preview mode
            </div>
            <Button variant="secondary" onClick={() => setPreviewing(null)}>
              Exit Preview
            </Button>
          </div>
        ) : (
          <div className="text-[var(--color-fg-muted)] text-sm">
            Click &quot;Preview&quot; on a version to view it
          </div>
        )}
      </div>
      <VersionHistoryPanel
        documentTitle="Project Requirements.docx"
        timeGroups={SAMPLE_TIME_GROUPS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onPreview={handlePreview}
        lastSavedText="2m ago"
        autoSaveEnabled
      />
    </div>
  );
}

/**
 * Scene 10: PreviewVersion
 *
 * 预览版本功能
 * - 点击 Preview 按钮
 * - 验证触发 onPreview 回调
 */
export const PreviewVersion: Story = {
  render: () => <PreviewVersionRender />,
  parameters: {
    docs: {
      description: {
        story:
          '预览版本功能。点击选中版本的 Preview 按钮，进入只读预览模式（实际应用中会显示该版本的文档内容）。',
      },
    },
  },
};

/**
 * Rich version info data showcasing reason, affectedParagraphs, and diffSummary
 */
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
        diffSummary: '+ 第三章"安全协议"：本章详细描述了系统的安全机制，包括数据加密标准、用户权限管理...',
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
        diffSummary: '+ 项目范围扩展至包含移动端应用...',
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

/**
 * Scene 11: RichVersionInfo
 *
 * 丰富的版本信息展示
 * - 显示修改原因（reason）
 * - 显示受影响段落数（affectedParagraphs）
 * - 显示 diff 摘要预览（diffSummary）
 */
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

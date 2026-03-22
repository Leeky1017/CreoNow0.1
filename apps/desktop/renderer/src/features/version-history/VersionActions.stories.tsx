import type { Meta, StoryObj } from "@storybook/react";
import { NotepadText } from "lucide-react";
import React from "react";
import { VersionHistoryPanel, type TimeGroup } from "./VersionHistoryPanel";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../../components/primitives";

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

const meta: Meta<typeof VersionHistoryPanel> = {
  title: "Features/VersionHistory/Actions",
  component: VersionHistoryPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "版本历史面板 - 交互操作场景（恢复、对比、预览）。对应设计稿: 23-version-history.html",
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
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-[400px] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-2xl p-6 focus:outline-none">
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
          "恢复版本确认流程。点击选中版本的 Restore 按钮，会弹出确认对话框。点击 Restore 确认恢复，或点击 Cancel 取消。",
      },
    },
  },
};

function CompareWithCurrentRender() {
  const [selectedId, setSelectedId] = React.useState<string | null>("v-1042");
  const [comparing, setComparing] = React.useState<string | null>(null);

  const handleCompare = (versionId: string) => {
    setComparing(versionId);
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
          "与当前版本对比功能。点击选中版本的 Compare 按钮，触发对比模式（实际应用中会打开 Diff 视图）。",
      },
    },
  },
};

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
          "预览版本功能。点击选中版本的 Preview 按钮，进入只读预览模式（实际应用中会显示该版本的文档内容）。",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { fn } from "@storybook/test";
import { ArrowUp, Clock, Plus } from "lucide-react";
import { SkillPicker } from "./SkillPicker";
import { layoutDecorator } from "../../components/layout/test-utils";

/**
 * SkillPicker 组件 Story
 *
 * SKILL 选择器从工具栏按钮上方弹出，用于选择 AI 技能。
 * 布局与 AiPanel 保持一致。
 */
const meta: Meta<typeof SkillPicker> = {
  title: "Features/SkillPicker",
  component: SkillPicker,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    onOpenChange: fn(),
    onSelectSkillId: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof SkillPicker>;

const sampleSkills = [
  {
    id: "default",
    name: "Default",
    enabled: true,
    valid: true,
    scope: "global" as const,
    packageId: "pkg-1",
    version: "1.0.0",
  },
  {
    id: "rewrite",
    name: "Rewrite",
    enabled: true,
    valid: true,
    scope: "global" as const,
    packageId: "pkg-2",
    version: "1.0.0",
  },
  {
    id: "summarize",
    name: "Summarize",
    enabled: true,
    valid: true,
    scope: "project" as const,
    packageId: "pkg-3",
    version: "1.0.0",
  },
  {
    id: "disabled-skill",
    name: "Disabled Skill",
    enabled: false,
    valid: true,
    scope: "global" as const,
    packageId: "pkg-4",
    version: "1.0.0",
  },
  {
    id: "invalid-skill",
    name: "Invalid Skill",
    enabled: true,
    valid: false,
    scope: "global" as const,
    packageId: "pkg-5",
    version: "1.0.0",
  },
];

function SkillPickerDemo(props: {
  skills: typeof sampleSkills;
  selectedSkillId: string;
  defaultOpen?: boolean;
}): JSX.Element {
  const [open, setOpen] = React.useState(props.defaultOpen ?? false);
  const [selectedId, setSelectedId] = React.useState(props.selectedSkillId);

  return (
    <div
      style={{ width: "360px", height: "100vh" }}
      className="bg-[var(--color-bg-surface)]"
    >
      <section className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center h-8 px-2 border-b border-[var(--color-separator)] shrink-0">
          <div className="flex items-center gap-3 h-full">
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-default)] border-b border-[var(--color-accent)]">
              Assistant
            </button>
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] border-b border-transparent">
              Info
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {/* History button */}
            <button
              type="button"
              title="History"
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] rounded transition-colors"
            >
              <Clock size={16} strokeWidth={1.5} />
            </button>
            {/* New Chat button */}
            <button
              type="button"
              title="New Chat"
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] rounded transition-colors"
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <span className="text-[13px] text-[var(--color-fg-muted)]">
            Ask the AI to help with your writing
          </span>
        </div>

        {/* Input Area with SKILL Picker */}
        <div className="shrink-0 px-1.5 pb-1.5 pt-2 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] px-3 py-2 bg-transparent border-none resize-none text-[13px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded">
                  Ask
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded">
                  GPT-5.2
                </button>
                {/* SKILL button with picker */}
                <div className="relative">
                  <button
                    onClick={() => setOpen((v) => !v)}
                    className={`px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      open
                        ? "text-[var(--color-fg-default)] bg-[var(--color-bg-selected)]"
                        : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    SKILL
                  </button>
                  <SkillPicker
                    open={open}
                    items={props.skills}
                    selectedSkillId={selectedId}
                    onOpenChange={setOpen}
                    onSelectSkillId={(id) => {
                      setSelectedId(id);
                      setOpen(false);
                    }}
                  />
                </div>
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]">
                <ArrowUp size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * 默认状态
 *
 * SKILL 选择器关闭，点击 SKILL 按钮可打开
 */
export const Default: Story = {
  render: () => (
    <SkillPickerDemo skills={sampleSkills} selectedSkillId="default" />
  ),
};

/**
 * 打开状态
 *
 * SKILL 选择器已打开，从按钮上方弹出
 */
export const Open: Story = {
  render: () => (
    <SkillPickerDemo
      skills={sampleSkills}
      selectedSkillId="default"
      defaultOpen
    />
  ),
};

/**
 * 选中 Rewrite
 *
 * 选中 Rewrite 技能
 */
export const SelectedRewrite: Story = {
  render: () => (
    <SkillPickerDemo
      skills={sampleSkills}
      selectedSkillId="rewrite"
      defaultOpen
    />
  ),
};

/**
 * 空列表
 *
 * 无 SKILL 可选
 */
export const EmptyList: Story = {
  render: () => <SkillPickerDemo skills={[]} selectedSkillId="" defaultOpen />,
};

/**
 * 多项禁用
 *
 * 多个 SKILL 禁用或无效
 */
export const ManyDisabled: Story = {
  render: () => (
    <SkillPickerDemo
      skills={[
        {
          id: "enabled",
          name: "Enabled Skill",
          enabled: true,
          valid: true,
          scope: "global" as const,
          packageId: "pkg-1",
          version: "1.0.0",
        },
        {
          id: "disabled-1",
          name: "Disabled 1",
          enabled: false,
          valid: true,
          scope: "global" as const,
          packageId: "pkg-2",
          version: "1.0.0",
        },
        {
          id: "disabled-2",
          name: "Disabled 2",
          enabled: false,
          valid: true,
          scope: "global" as const,
          packageId: "pkg-3",
          version: "1.0.0",
        },
        {
          id: "invalid-1",
          name: "Invalid 1",
          enabled: true,
          valid: false,
          scope: "global" as const,
          packageId: "pkg-4",
          version: "1.0.0",
        },
        {
          id: "invalid-2",
          name: "Invalid 2",
          enabled: true,
          valid: false,
          scope: "global" as const,
          packageId: "pkg-5",
          version: "1.0.0",
        },
      ]}
      selectedSkillId="enabled"
      defaultOpen
    />
  ),
};

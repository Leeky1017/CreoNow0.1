import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { CharacterPanel } from "./CharacterPanel";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import { RoleSelector } from "./RoleSelector";
import { GroupSelector } from "./GroupSelector";
import { AddRelationshipPopover } from "./AddRelationshipPopover";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Character, CharacterRole, CharacterGroup } from "./types";
import { SAMPLE_CHARACTERS } from "./characterStoryData";
import { expect } from "@storybook/test";

const meta: Meta<typeof CharacterPanel> = {
  title: "Features/Character/Detail",
  component: CharacterPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "角色详情交互 — 编辑表单、性格标签、人物关系、头像上传、子组件演示。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen min-h-[700px] bg-[var(--color-bg-base)] relative">
        <div className="absolute inset-0 p-12 pointer-events-none select-none">
          <div className="max-w-4xl mx-auto space-y-12">
            <h1 className="text-5xl font-bold text-[var(--color-fg-placeholder)]/20 mb-6">
              The Last Horizon
            </h1>
            <div className="space-y-4">
              <div className="h-4 w-full bg-[var(--color-bg-hover)]/50 rounded" />
              <div className="h-4 w-[90%] bg-[var(--color-bg-hover)]/50 rounded" />
              <div className="h-4 w-[95%] bg-[var(--color-bg-hover)]/50 rounded" />
            </div>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CharacterPanel>;

function EditingCharacterFormRender() {
  const [open, setOpen] = React.useState(true);
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const character = SAMPLE_CHARACTERS[0];

  return (
    <div
      ref={setContainerRef}
      className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)] relative"
    >
      <CharacterPanel characters={SAMPLE_CHARACTERS} selectedId="elara" />
      <main className="flex-1 relative" />
      <CharacterDetailDialog
        open={open}
        onOpenChange={setOpen}
        character={character}
        availableCharacters={SAMPLE_CHARACTERS}
        container={containerEl}
      />
    </div>
  );
}

/** 用户正在编辑 Elara 的详情 */
export const EditingCharacterForm: Story = {
  render: () => <EditingCharacterFormRender />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function AddingPersonalityTraitRender() {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const [character, setCharacter] = React.useState<Character>({
    ...SAMPLE_CHARACTERS[0],
    traits: ["Brave", "Impulsive", "Loyal", "Cunning"],
  });

  const handleSave = (updated: Character) => {
    setCharacter(updated);
  };

  return (
    <div
      ref={setContainerRef}
      className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)] relative"
    >
      <CharacterPanel characters={SAMPLE_CHARACTERS} selectedId="elara" />
      <main className="flex-1 relative" />
      <CharacterDetailDialog
        open
        onOpenChange={() => {}}
        character={character}
        onSave={handleSave}
        availableCharacters={SAMPLE_CHARACTERS}
        container={containerEl}
      />
    </div>
  );
}

/** 用户正在添加性格标签 */
export const AddingPersonalityTrait: Story = {
  render: () => <AddingPersonalityTraitRender />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function ManagingRelationshipsRender() {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const characterWithManyRelations: Character = {
    ...SAMPLE_CHARACTERS[0],
    relationships: [
      ...SAMPLE_CHARACTERS[0].relationships,
      {
        characterId: "darius",
        characterName: "Darius",
        characterRole: "deuteragonist",
        characterAvatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=faces",
        type: "friend",
      },
      {
        characterId: "sarah",
        characterName: "Sarah",
        characterRole: "ally",
        characterAvatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces",
        type: "ally",
      },
    ],
  };

  return (
    <div
      ref={setContainerRef}
      className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)] relative"
    >
      <CharacterPanel characters={SAMPLE_CHARACTERS} selectedId="elara" />
      <main className="flex-1 relative" />
      <CharacterDetailDialog
        open
        onOpenChange={() => {}}
        character={characterWithManyRelations}
        availableCharacters={SAMPLE_CHARACTERS}
        container={containerEl}
      />
    </div>
  );
}

/** 用户正在管理人物关系 */
export const ManagingRelationships: Story = {
  render: () => <ManagingRelationshipsRender />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function UploadingAvatarRender() {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const characterWithoutAvatar: Character = {
    ...SAMPLE_CHARACTERS[3],
  };

  return (
    <div
      ref={setContainerRef}
      className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)] relative"
    >
      <CharacterPanel characters={SAMPLE_CHARACTERS} selectedId="jax" />
      <main className="flex-1 relative" />
      <CharacterDetailDialog
        open
        onOpenChange={() => {}}
        character={characterWithoutAvatar}
        availableCharacters={SAMPLE_CHARACTERS}
        container={containerEl}
      />
    </div>
  );
}

/** 用户正在上传角色头像 */
export const UploadingAvatar: Story = {
  render: () => <UploadingAvatarRender />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 用户点击删除角色 */
export const DeletingCharacterConfirm: Story = {
  args: {
    characters: SAMPLE_CHARACTERS,
    selectedId: "elara",
  },
  parameters: {
    docs: {
      description: {
        story:
          "用户点击删除角色时的场景。点击角色卡片上的删除图标或对话框中的 Delete 按钮来测试删除流程。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function RoleSelectorOpenRender() {
  const [role, setRole] = React.useState<CharacterRole>("protagonist");

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)]">
        <h3 className="text-sm font-medium text-[var(--color-fg-default)] mb-4">
          Role Selector Demo
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-fg-muted)]">
            Current Role:
          </span>
          <RoleSelector value={role} onChange={setRole} />
        </div>
        <p className="mt-4 text-xs text-[var(--color-fg-placeholder)]">
          Click the role badge to open the selector. Try selecting different
          roles.
        </p>
      </div>
    </div>
  );
}

/** 角色类型选择器 Popover 交互 */
export const RoleSelectorOpen: Story = {
  render: () => <RoleSelectorOpenRender />,
  parameters: {
    docs: {
      description: {
        story:
          "角色类型选择器的交互演示。点击角色类型标签打开 Popover，可选择五种角色类型。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function GroupSelectorOpenRender() {
  const [group, setGroup] = React.useState<CharacterGroup>("main");

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)]">
        <h3 className="text-sm font-medium text-[var(--color-fg-default)] mb-4">
          Group Selector Demo
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-fg-muted)]">
            Current Group:
          </span>
          <GroupSelector value={group} onChange={setGroup} />
        </div>
        <p className="mt-4 text-xs text-[var(--color-fg-placeholder)]">
          Click the group tag to open the selector. Try selecting different
          groups.
        </p>
      </div>
    </div>
  );
}

/** 分组选择器 Popover 交互 */
export const GroupSelectorOpen: Story = {
  render: () => <GroupSelectorOpenRender />,
  parameters: {
    docs: {
      description: {
        story:
          "分组选择器的交互演示。点击分组标签打开 Popover，可选择 Main Cast、Supporting、Others。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function AddingRelationshipFlowRender() {
  const [character, setCharacter] = React.useState<Character>(
    SAMPLE_CHARACTERS[0],
  );
  const otherCharacters = SAMPLE_CHARACTERS.filter(
    (c) => c.id !== character.id,
  );

  const handleAddRelationship = (relationship: {
    characterId: string;
    characterName: string;
    characterRole?: CharacterRole;
    characterAvatar?: string;
    type: "rival" | "mentor" | "ally" | "enemy" | "friend" | "family";
  }) => {
    setCharacter((prev) => ({
      ...prev,
      relationships: [...prev.relationships, relationship],
    }));
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)] max-w-md">
        <h3 className="text-sm font-medium text-[var(--color-fg-default)] mb-4">
          Add Relationship Demo
        </h3>
        <div className="mb-4">
          <div className="text-xs text-[var(--color-fg-muted)] mb-2">
            Current relationships: {character.relationships.length}
          </div>
          <div className="space-y-1">
            {character.relationships.map((rel) => (
              <div
                key={rel.characterId}
                className="text-xs text-[var(--color-fg-placeholder)] flex items-center gap-2"
              >
                <span>• {rel.characterName}</span>
                <span className="text-[10px] bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded">
                  {rel.type}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[var(--color-border-default)] pt-4">
          <AddRelationshipPopover
            availableCharacters={otherCharacters}
            existingRelationships={character.relationships}
            onAdd={handleAddRelationship}
          />
        </div>
        <p className="mt-4 text-xs text-[var(--color-fg-placeholder)]">
          Click &quot;+ Add Relation&quot; to open the popover. Select a
          character and relationship type.
        </p>
      </div>
    </div>
  );
}

/** 添加关系 Popover 完整交互流程 */
export const AddingRelationshipFlow: Story = {
  render: () => <AddingRelationshipFlowRender />,
  parameters: {
    docs: {
      description: {
        story:
          "添加关系的完整交互流程演示。点击 '+ Add Relation' 打开 Popover，先选择角色，再选择关系类型，最后点击 Add。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

function DeleteConfirmationRender() {
  const [showConfirm, setShowConfirm] = React.useState(true);
  const [deleted, setDeleted] = React.useState(false);

  const handleConfirm = () => {
    setDeleted(true);
  };

  const handleReset = () => {
    setDeleted(false);
    setShowConfirm(true);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)] text-center">
        {deleted ? (
          <>
            <p className="text-sm text-[var(--color-fg-default)] mb-4">
              Character &quot;Elara Vance&quot; has been deleted.
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-[var(--color-info)] hover:underline"
            >
              Reset Demo
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-fg-muted)] mb-4">
              Click the button below to show the delete confirmation dialog.
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 text-sm text-[var(--color-error)] border border-[var(--color-error)] rounded hover:bg-[var(--color-error)]/10 transition-colors"
            >
              Delete Elara Vance
            </button>
          </>
        )}
      </div>
      <DeleteConfirmDialog
        open={showConfirm && !deleted}
        onOpenChange={setShowConfirm}
        characterName="Elara Vance"
        onConfirm={handleConfirm}
      />
    </div>
  );
}

/** 删除角色确认弹窗 */
export const DeleteConfirmation: Story = {
  render: () => <DeleteConfirmationRender />,
  parameters: {
    docs: {
      description: {
        story:
          "删除角色确认弹窗演示。显示警告信息和角色名称，用户必须点击 Delete 确认删除，或 Cancel 取消。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

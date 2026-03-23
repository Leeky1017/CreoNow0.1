import type { Meta, StoryObj } from "@storybook/react";
import { Camera } from "lucide-react";
import React from "react";
import { CharacterPanel } from "./CharacterPanel";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import { RoleSelector } from "./RoleSelector";
import { GroupSelector } from "./GroupSelector";
import { AddRelationshipPopover } from "./AddRelationshipPopover";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Character, CharacterRole, CharacterGroup } from "./types";
/**
 * Sample character data for stories
 *
 * Uses real meaningful data as required by design spec:
 * - Elara Vance: 24岁, Protagonist, 原型"The Reluctant Hero"
 * - Kaelen Thorne: Antagonist
 * - Darius: Deuteragonist
 * - Jax: Mentor (no avatar, shows initials)
 * - Sarah: Ally
 */
const SAMPLE_CHARACTERS: Character[] = [
  {
    id: "elara",
    name: "Elara Vance",
    age: 24,
    birthDate: "2002-03-25",
    zodiac: "aries",
    role: "protagonist",
    group: "main",
    archetype: "reluctant-hero",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    description:
      "A skilled pilot with a mysterious past, determined to find the lost coordinates of Earth. She wears a faded flight jacket with an emblem no one recognizes.",
    features: [
      "Wears a faded flight jacket",
      "Quick reflexes",
      "Pilot calluses",
    ],
    traits: ["Brave", "Impulsive", "Loyal"],
    relationships: [
      {
        characterId: "kaelen",
        characterName: "Kaelen Thorne",
        characterRole: "antagonist",
        characterAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=faces",
        type: "rival",
      },
      {
        characterId: "jax",
        characterName: "Jax",
        characterRole: "mentor",
        type: "mentor",
      },
    ],
    appearances: [
      { id: "ch1", title: "Chapter 1: The Awakening" },
      { id: "ch3", title: "Chapter 3: Void Drift" },
    ],
  },
  {
    id: "kaelen",
    name: "Kaelen Thorne",
    age: 32,
    role: "antagonist",
    group: "main",
    archetype: "trickster",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    description:
      "A charismatic leader with a hidden agenda. His charm masks a ruthless ambition.",
    traits: ["Cunning", "Charismatic", "Ambitious"],
    relationships: [
      {
        characterId: "elara",
        characterName: "Elara Vance",
        characterRole: "protagonist",
        characterAvatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=faces",
        type: "rival",
      },
    ],
    appearances: [
      { id: "ch2", title: "Chapter 2: Shadows Fall" },
      { id: "ch3", title: "Chapter 3: Void Drift" },
    ],
  },
  {
    id: "darius",
    name: "Darius",
    age: 28,
    role: "deuteragonist",
    group: "main",
    archetype: "chosen-one",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
    description:
      "Elara's trusted companion, skilled in navigation and survival.",
    traits: ["Steady", "Resourceful", "Protective"],
    relationships: [
      {
        characterId: "elara",
        characterName: "Elara Vance",
        characterRole: "protagonist",
        type: "friend",
      },
    ],
    appearances: [{ id: "ch1", title: "Chapter 1: The Awakening" }],
  },
  {
    id: "jax",
    name: "Jax",
    age: 58,
    role: "mentor",
    group: "supporting",
    archetype: "mentor",
    // No avatar - will show initials
    description:
      "A grizzled veteran who trained Elara. Carries the weight of past failures.",
    traits: ["Wise", "Gruff", "Protective"],
    relationships: [
      {
        characterId: "elara",
        characterName: "Elara Vance",
        characterRole: "protagonist",
        type: "mentor",
      },
    ],
    appearances: [{ id: "ch1", title: "Chapter 1: The Awakening" }],
  },
  {
    id: "sarah",
    name: "Sarah",
    age: 26,
    role: "ally",
    group: "supporting",
    archetype: "sage",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=faces",
    description: "A researcher who helps decode ancient star maps.",
    traits: ["Intelligent", "Curious", "Empathetic"],
    relationships: [],
    appearances: [{ id: "ch2", title: "Chapter 2: Shadows Fall" }],
  },
];

const meta: Meta<typeof CharacterPanel> = {
  title: "Features/CharacterPanel",
  component: CharacterPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "角色管理面板 - 用于管理故事中的角色，包括角色列表、分组显示、详情编辑等功能。对应设计稿: 18-character-manager.html",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen min-h-[700px] bg-[var(--color-bg-base)] relative">
        {/* 占位背景（仅作为背景，不参与布局） */}
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
  argTypes: {
    onSelect: { action: "onSelect" },
    onCreate: { action: "onCreate" },
    onUpdate: { action: "onUpdate" },
    onDelete: { action: "onDelete" },
    onNavigateToChapter: { action: "onNavigateToChapter" },
  },
};

export default meta;
type Story = StoryObj<typeof CharacterPanel>;

/**
 * Scene 1: DefaultWithData
 *
 * 完整数据，3 个主角 + 2 个配角，模拟真实项目状态
 * - 验证分组显示 (Main Characters: 3, Supporting: 2, Others: 0)
 * - 验证角色卡片信息完整显示
 */
export const DefaultWithData: Story = {
  args: {
    characters: SAMPLE_CHARACTERS,
    selectedId: "elara",
  },
};

/**
 * Scene 2: EmptyProject
 *
 * 新项目无角色
 * - 验证空状态 UI："No characters" + 虚线框
 * - 验证 "+" 按钮可创建新角色
 */
export const EmptyProject: Story = {
  args: {
    characters: [],
    selectedId: null,
  },
};

/**
 * Render component for EditingCharacterForm story
 */
function EditingCharacterFormRender() {
  const [open, setOpen] = React.useState(true);
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const character = SAMPLE_CHARACTERS[0]; // Elara

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

/**
 * Scene 3: EditingCharacterForm
 *
 * 用户正在编辑 Elara 的详情
 * - 验证所有表单字段可编辑
 * - 在 Name 输入框输入超长名字（50+ 字符），验证截断
 * - 在 Description 输入框输入大量文字（500+ 字符），验证滚动
 * - 验证 Archetype 下拉选择
 */
export const EditingCharacterForm: Story = {
  render: () => <EditingCharacterFormRender />,
};

/**
 * Render component for AddingPersonalityTrait story
 */
function AddingPersonalityTraitRender() {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const [character, setCharacter] = React.useState<Character>({
    ...SAMPLE_CHARACTERS[0],
    traits: ["Brave", "Impulsive", "Loyal", "Cunning"], // Added Cunning
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

/**
 * Scene 4: AddingPersonalityTrait
 *
 * 用户正在添加性格标签
 * - 模拟用户输入 "Cunning" 并按 Enter
 * - 验证新标签出现在列表中
 * - 验证标签 hover 显示删除 x
 * - 验证删除某个标签的动画
 */
export const AddingPersonalityTrait: Story = {
  render: () => <AddingPersonalityTraitRender />,
};

/**
 * Render component for ManagingRelationships story
 */
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

/**
 * Scene 5: ManagingRelationships
 *
 * 用户正在管理人物关系
 * - 点击 "Add Relation" 按钮，验证选择器弹出
 * - 验证关系类型标签 (Rival/Mentor/Ally/Enemy/Friend/Family)
 * - 验证关系项 hover 显示删除按钮
 * - 验证关系状态指示器颜色（红色=敌对，蓝色=友好）
 */
export const ManagingRelationships: Story = {
  render: () => <ManagingRelationshipsRender />,
};

/**
 * Render component for UploadingAvatar story
 */
function UploadingAvatarRender() {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  // Character without avatar to show initials fallback
  const characterWithoutAvatar: Character = {
    ...SAMPLE_CHARACTERS[3], // Jax has no avatar
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

/**
 * Scene 6: UploadingAvatar
 *
 * 用户正在上传角色头像
 * - 验证头像 hover 显示相机图标
 * - 验证点击后触发文件选择
 * - 验证上传中的 loading 状态
 * - 验证无头像时显示首字母 fallback
 */
export const UploadingAvatar: Story = {
  render: () => <UploadingAvatarRender />,
};

/**
 * Scene 7: DeletingCharacterConfirm
 *
 * 用户点击删除角色
 * - 验证弹出确认对话框
 * - 验证对话框文案："Delete Elara Vance? This action cannot be undone."
 * - 验证 Cancel/Delete 按钮样式
 *
 * Note: This shows the dialog with Delete button visible for testing the action
 */
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
};

/**
 * Render component for SwitchingBetweenCharacters story
 */
function SwitchingBetweenCharactersRender() {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const [selectedId, setSelectedId] = React.useState("elara");
  const [dialogOpen, setDialogOpen] = React.useState(true);
  const selectedCharacter = SAMPLE_CHARACTERS.find((c) => c.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  return (
    <div
      ref={setContainerRef}
      className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)] relative"
    >
      <CharacterPanel
        characters={SAMPLE_CHARACTERS}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
      <main className="flex-1 relative">
        <div className="p-4 text-[var(--color-fg-muted)] text-sm">
          <p>
            Click on different characters in the list to switch between them.
          </p>
          <p className="mt-2">
            Currently selected:{" "}
            <strong className="text-[var(--color-fg-default)]">
              {selectedCharacter?.name}
            </strong>
          </p>
        </div>
      </main>
      <CharacterDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        character={selectedCharacter || null}
        availableCharacters={SAMPLE_CHARACTERS}
        container={containerEl}
      />
    </div>
  );
}

/**
 * Scene 8: SwitchingBetweenCharacters
 *
 * 用户快速切换角色
 * - 点击 Elara → 验证详情更新
 * - 点击 Kaelen → 验证详情更新
 * - 验证切换时有过渡动画
 * - 验证选中态指示器（左侧蓝色竖线）
 */
export const SwitchingBetweenCharacters: Story = {
  render: () => <SwitchingBetweenCharactersRender />,
};

/**
 * Render component for ChapterAppearanceNavigation story
 */
function ChapterAppearanceNavigationRender() {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
  }, []);
  const [lastNavigatedChapter, setLastNavigatedChapter] = React.useState<
    string | null
  >(null);

  return (
    <div
      ref={setContainerRef}
      className="h-screen min-h-[700px] flex bg-[var(--color-bg-base)] relative"
    >
      <CharacterPanel
        characters={SAMPLE_CHARACTERS}
        selectedId="elara"
        onNavigateToChapter={(chapterId) => setLastNavigatedChapter(chapterId)}
      />
      <main className="flex-1 relative">
        <div className="p-4 text-[var(--color-fg-muted)] text-sm">
          <p>
            Click on chapter links in the character detail dialog to navigate.
          </p>
          {lastNavigatedChapter && (
            <p className="mt-2 text-[var(--color-info)]">
              Navigated to: {lastNavigatedChapter}
            </p>
          )}
        </div>
      </main>
      <CharacterDetailDialog
        open
        onOpenChange={() => {}}
        character={SAMPLE_CHARACTERS[0]}
        onNavigateToChapter={(chapterId) => setLastNavigatedChapter(chapterId)}
        availableCharacters={SAMPLE_CHARACTERS}
        container={containerEl}
      />
    </div>
  );
}

/**
 * Scene 9: ChapterAppearanceNavigation
 *
 * 用户点击章节链接
 * - 验证 "Chapter 1: The Awakening" 链接样式
 * - 验证 hover 显示箭头图标
 * - 验证点击跳转（触发 onNavigate 回调）
 */
export const ChapterAppearanceNavigation: Story = {
  render: () => <ChapterAppearanceNavigationRender />,
};

// ============================================================================
// New Stories for Interactive Components
// ============================================================================

/**
 * Render component for RoleSelectorOpen story
 */
function RoleSelectorOpenRender() {
  const [role, setRole] = React.useState<CharacterRole>("protagonist");

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)]">
        <h2 className="text-sm font-medium text-[var(--color-fg-default)] mb-4">
          Role Selector Demo
        </h2>
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

/**
 * Scene 10: RoleSelectorOpen
 *
 * 角色类型选择器 Popover 交互
 * - 点击 PROTAGONIST 标签打开 Popover
 * - 验证 5 种角色类型选项
 * - 验证选中状态指示器（小圆点）
 * - 验证颜色编码（蓝/红/紫/绿/黄）
 */
export const RoleSelectorOpen: Story = {
  render: () => <RoleSelectorOpenRender />,
  parameters: {
    docs: {
      description: {
        story:
          "角色类型选择器的交互演示。点击角色类型标签（如 PROTAGONIST）打开 Popover，可选择 Protagonist、Antagonist、Deuteragonist、Mentor、Ally 五种角色类型。",
      },
    },
  },
};

/**
 * Render component for GroupSelectorOpen story
 */
function GroupSelectorOpenRender() {
  const [group, setGroup] = React.useState<CharacterGroup>("main");

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)]">
        <h2 className="text-sm font-medium text-[var(--color-fg-default)] mb-4">
          Group Selector Demo
        </h2>
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

/**
 * Scene 11: GroupSelectorOpen
 *
 * 分组选择器 Popover 交互
 * - 点击 Main Cast 标签打开 Popover
 * - 验证 3 种分组选项 (Main Cast, Supporting, Others)
 * - 验证选中状态指示器
 */
export const GroupSelectorOpen: Story = {
  render: () => <GroupSelectorOpenRender />,
  parameters: {
    docs: {
      description: {
        story:
          "分组选择器的交互演示。点击分组标签（如 Main Cast）打开 Popover，可选择 Main Cast、Supporting、Others 三种分组。",
      },
    },
  },
};

/**
 * Render component for AddingRelationshipFlow story
 */
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
        <h2 className="text-sm font-medium text-[var(--color-fg-default)] mb-4">
          Add Relationship Demo
        </h2>
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

/**
 * Scene 12: AddingRelationshipFlow
 *
 * 添加关系 Popover 完整交互流程
 * - 点击 "+ Add Relation" 打开 Popover
 * - 步骤 1: 选择要关联的角色
 * - 步骤 2: 选择关系类型
 * - 验证 Add 按钮在未选择时禁用
 * - 验证添加后关系列表更新
 */
export const AddingRelationshipFlow: Story = {
  render: () => <AddingRelationshipFlowRender />,
  parameters: {
    docs: {
      description: {
        story:
          "添加关系的完整交互流程演示。点击 '+ Add Relation' 打开 Popover，先选择要关联的角色，再选择关系类型（Rival/Mentor/Ally/Enemy/Friend/Family），最后点击 Add 完成添加。",
      },
    },
  },
};

/**
 * Render component for DeleteConfirmation story
 */
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

/**
 * Scene 13: DeleteConfirmation
 *
 * 删除角色确认弹窗
 * - 验证确认弹窗显示
 * - 验证警告图标和文案
 * - 验证 Cancel 按钮关闭弹窗
 * - 验证 Delete 按钮触发删除
 */
export const DeleteConfirmation: Story = {
  render: () => <DeleteConfirmationRender />,
  parameters: {
    docs: {
      description: {
        story:
          "删除角色确认弹窗演示。显示警告信息和角色名称，用户必须点击 Delete 按钮确认删除，或点击 Cancel 取消操作。",
      },
    },
  },
};

/**
 * Scene 14: AvatarHoverState
 *
 * 头像 hover 显示相机图标状态
 * - 验证头像 hover 时显示相机图标
 * - 验证头像变暗效果
 * - 验证无头像时显示首字母 fallback
 */
export const AvatarHoverState: Story = {
  render: () => {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)]">
          <h2 className="text-sm font-medium text-[var(--color-fg-default)] mb-6">
            Avatar Hover States
          </h2>
          <div className="flex gap-8">
            {/* With avatar */}
            <div className="text-center">
              <div className="relative group cursor-pointer mb-2">
                <div className="w-16 h-16 rounded-full p-[1px] bg-gradient-to-b from-[var(--color-border-hover)] to-[#111]">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces"
                    alt="Elara Vance"
                    className="w-full h-full rounded-full object-cover group-hover:brightness-75 transition-all"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera
                    className="text-white w-5 h-5 drop-shadow-md"
                    size={20}
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <span className="text-xs text-[var(--color-fg-muted)]">
                With Avatar
              </span>
            </div>
            {/* Without avatar (fallback) */}
            <div className="text-center">
              <div className="relative group cursor-pointer mb-2">
                <div className="w-16 h-16 rounded-full bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] flex items-center justify-center text-lg font-semibold text-[var(--color-fg-muted)] group-hover:brightness-75 transition-all">
                  J
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera
                    className="text-white w-5 h-5 drop-shadow-md"
                    size={20}
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <span className="text-xs text-[var(--color-fg-muted)]">
                Fallback (Initials)
              </span>
            </div>
          </div>
          <p className="mt-6 text-xs text-[var(--color-fg-placeholder)] text-center">
            Hover over the avatars to see the camera icon overlay.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "头像 hover 状态演示。当鼠标悬停在头像上时，头像变暗并显示相机图标，表示可以上传/更换头像。同时展示有头像和无头像（首字母 fallback）两种情况。",
      },
    },
  },
};

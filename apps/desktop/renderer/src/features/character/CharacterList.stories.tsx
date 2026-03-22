import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { Camera } from "lucide-react";
import React from "react";
import { CharacterPanel } from "./CharacterPanel";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import { SAMPLE_CHARACTERS } from "./characterStoryData";

const meta: Meta<typeof CharacterPanel> = {
  title: "Features/Character/List",
  component: CharacterPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "角色管理面板 - 角色列表、分组显示、切换和导航功能。",
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

/** 完整数据，3 个主角 + 2 个配角 */
export const DefaultWithData: Story = {
  args: {
    characters: SAMPLE_CHARACTERS,
    selectedId: "elara",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("character-panel")).toBeInTheDocument();
    await expect(canvas.getByTestId("character-card-elara")).toBeInTheDocument();
  },
};

/** 新项目无角色 */
export const EmptyProject: Story = {
  args: {
    characters: [],
    selectedId: null,
  },
};

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

/** 用户快速切换角色 */
export const SwitchingBetweenCharacters: Story = {
  render: () => <SwitchingBetweenCharactersRender />,
};

/** 头像 hover 显示相机图标状态 */
export const AvatarHoverState: Story = {
  render: () => {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="p-8 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)]">
          <h3 className="text-sm font-medium text-[var(--color-fg-default)] mb-6">
            Avatar Hover States
          </h3>
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
          "头像 hover 状态演示。当鼠标悬停在头像上时，头像变暗并显示相机图标。同时展示有头像和无头像（首字母 fallback）两种情况。",
      },
    },
  },
};

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

/** 用户点击章节链接 */
export const ChapterAppearanceNavigation: Story = {
  render: () => <ChapterAppearanceNavigationRender />,
};

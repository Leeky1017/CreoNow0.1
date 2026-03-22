import type { Meta, StoryObj } from "@storybook/react";
import { OutlinePanel, type OutlineItem } from "./OutlinePanel";

/**
 * Sample outline data based on design spec
 */
const SAMPLE_OUTLINE_DATA: OutlineItem[] = [
  {
    id: "h1-aesthetics",
    title: "The Aesthetics of Silence",
    level: "h1",
    children: [
      { id: "h2-intro", title: "1. Introduction", level: "h2" },
      {
        id: "h2-historical",
        title: "2. Historical Context",
        level: "h2",
        children: [
          { id: "h3-early", title: "2.1 Early 20th Century", level: "h3" },
          { id: "h3-postwar", title: "2.2 Post-War Minimalism", level: "h3" },
        ],
      },
      {
        id: "h2-digital",
        title: "3. The Digital Age",
        level: "h2",
        children: [
          {
            id: "h3-interface",
            title: "3.1 Interface as Structure",
            level: "h3",
          },
        ],
      },
    ],
  },
  {
    id: "h1-conclusion",
    title: "Conclusion",
    level: "h1",
    children: [{ id: "h2-future", title: "Future Implications", level: "h2" }],
  },
];

/**
 * Flatten nested outline structure for the component
 */
function flattenOutline(items: OutlineItem[]): OutlineItem[] {
  const result: OutlineItem[] = [];
  const flatten = (itemList: OutlineItem[]) => {
    for (const item of itemList) {
      result.push({ id: item.id, title: item.title, level: item.level });
      if (item.children) {
        flatten(item.children);
      }
    }
  };
  flatten(items);
  return result;
}

const FLAT_SAMPLE_DATA = flattenOutline(SAMPLE_OUTLINE_DATA);

/**
 * Sample word counts for each section
 */
const SAMPLE_WORD_COUNTS: Record<string, number> = {
  "h1-aesthetics": 2450,
  "h2-intro": 320,
  "h2-historical": 890,
  "h3-early": 420,
  "h3-postwar": 470,
  "h2-digital": 680,
  "h3-interface": 680,
  "h1-conclusion": 560,
  "h2-future": 560,
};

/**
 * Extended data with a very long title for truncation testing
 */
const LONG_TITLE_DATA: OutlineItem[] = [
  ...FLAT_SAMPLE_DATA.slice(0, 2),
  {
    id: "h2-long",
    title:
      "This is a very long chapter title that should be truncated with ellipsis when it exceeds the available width",
    level: "h2",
  },
  ...FLAT_SAMPLE_DATA.slice(2),
];

/**
 * Large document data for performance testing
 */
function generateLargeOutline(): OutlineItem[] {
  const items: OutlineItem[] = [];
  for (let i = 1; i <= 10; i++) {
    items.push({
      id: `ch-${i}`,
      title: `Chapter ${i}: The Journey Continues`,
      level: "h1",
    });
    for (let j = 1; j <= 5; j++) {
      items.push({
        id: `ch-${i}-s-${j}`,
        title: `${i}.${j} Section Title Here`,
        level: "h2",
      });
      for (let k = 1; k <= 3; k++) {
        items.push({
          id: `ch-${i}-s-${j}-ss-${k}`,
          title: `${i}.${j}.${k} Subsection`,
          level: "h3",
        });
      }
    }
  }
  return items;
}

const LARGE_OUTLINE_DATA = generateLargeOutline();

const meta: Meta<typeof OutlinePanel> = {
  title: "Features/Outline/Basic",
  component: OutlinePanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `大纲侧边栏 - 基础展示。

**功能 (P0)**:
- 单节点展开/折叠
- 编辑器滚动同步接口

**功能 (P1)**:
- 字数统计显示

对应设计稿: 13-sidebar-outline.html`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen min-h-[600px] flex bg-[var(--color-bg-base)]">
        {/* Sidebar */}
        <div className="w-[260px] border-r border-[var(--color-separator)] shrink-0">
          <Story />
        </div>

        {/* Main content area placeholder */}
        <div className="flex-1 h-full flex flex-col relative overflow-hidden">
          <header className="h-14 border-b border-[var(--color-separator)] flex items-center justify-between px-8 bg-[var(--color-bg-base)]">
            <div className="flex items-center gap-4 text-[var(--color-fg-placeholder)]">
              <span className="text-xs uppercase tracking-widest">
                Draft / The Aesthetics of Silence
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[var(--color-bg-base)]">
            <div className="max-w-[720px] mx-auto py-16 px-8">
              <h1 className="text-4xl font-bold text-[var(--color-fg-default)] mb-8 tracking-tight">
                The Aesthetics of Silence
              </h1>
              <div className="space-y-6 text-[#bfbfbf] leading-relaxed text-lg font-light">
                <p>
                  In a world of noise, silence is a luxury. Our interfaces
                  recede, allowing the content to breathe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    onNavigate: { action: "onNavigate" },
    onDelete: { action: "onDelete" },
    onRename: { action: "onRename" },
    onReorder: { action: "onReorder" },
  },
};

export default meta;
type Story = StoryObj<typeof OutlinePanel>;

// =============================================================================
// P0 Stories
// =============================================================================

/**
 * Scene 1: DefaultMultiLevel
 *
 * 完整多层级大纲，验证基础渲染
 */
export const DefaultMultiLevel: Story = {
  args: {
    items: FLAT_SAMPLE_DATA,
    activeId: "h1-aesthetics",
    draggable: true,
  },
};

/**
 * Scene 2: EmptyDocument
 *
 * 空文档无大纲
 */
export const EmptyDocument: Story = {
  args: {
    items: [],
    activeId: null,
  },
};

/**
 * Scene 5: EditorScrollSync (P0)
 *
 * 编辑器滚动同步指示器
 */
export const EditorScrollSync: Story = {
  args: {
    items: FLAT_SAMPLE_DATA,
    activeId: "h2-historical",
    scrollSyncEnabled: true,
    draggable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "P0: 编辑器滚动同步。启用后底部显示绿色同步指示器，activeId 会随编辑器滚动自动更新。",
      },
    },
  },
};

// =============================================================================
// P1 Stories
// =============================================================================

/**
 * Scene 6: WordCountDisplay (P1)
 *
 * 字数统计显示
 */
export const WordCountDisplay: Story = {
  args: {
    items: FLAT_SAMPLE_DATA,
    activeId: "h1-aesthetics",
    wordCounts: SAMPLE_WORD_COUNTS,
    draggable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "P1: 字数统计显示。每个大纲项右侧显示该章节的字数（如 2.4k、320 等）。",
      },
    },
  },
};

/**
 * Scene 10: LongTitleTruncation
 *
 * 超长标题截断
 */
export const LongTitleTruncation: Story = {
  args: {
    items: LONG_TITLE_DATA,
    activeId: "h1-aesthetics",
    draggable: true,
  },
};

/**
 * Scene 11: LargeDocument
 *
 * 大文档性能测试 (50+ 章节)
 */
export const LargeDocument: Story = {
  args: {
    items: LARGE_OUTLINE_DATA,
    activeId: "ch-1",
    draggable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "大文档性能测试。包含 10 章 × 5 节 × 3 小节 = 180 个大纲项，测试滚动和渲染性能。",
      },
    },
  },
};

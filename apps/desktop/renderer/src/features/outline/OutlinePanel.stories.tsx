import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  OutlinePanel,
  type OutlineItem,
  type DropPosition,
} from "./OutlinePanel";

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
  title: "Features/OutlinePanel",
  component: OutlinePanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `大纲侧边栏 - 用于显示文档结构和快速导航。

**功能 (P0)**:
- 单节点展开/折叠
- 完整拖拽支持 (before/after/into)
- 编辑器滚动同步接口

**功能 (P1)**:
- 字数统计显示
- 搜索/过滤功能
- 多选批量操作 (Ctrl/Cmd+Click, Shift+Click)
- 完整键盘导航 (Arrow/F2/Delete)

对应设计稿: 13-sidebar-outline.html`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen min-h-[600px] flex bg-[var(--color-bg-base)]">
        {/* Sidebar */}
        <aside
          className="w-[260px] border-r border-[var(--color-separator)] shrink-0"
          aria-label="Outline sidebar"
        >
          <Story />
        </aside>

        {/* Main content area placeholder */}
        <main className="flex-1 h-full flex flex-col relative overflow-hidden">
          <div className="h-14 border-b border-[var(--color-separator)] flex items-center justify-between px-8 bg-[var(--color-bg-base)]">
            <div className="flex items-center gap-4 text-[var(--color-fg-placeholder)]">
              <span className="text-xs uppercase tracking-widest">
                Draft / The Aesthetics of Silence
              </span>
            </div>
          </div>

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
        </main>
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
 * Scene 3: SingleNodeCollapse (P0)
 *
 * 单节点展开/折叠功能
 * - 点击折叠箭头隐藏子项
 * - 再次点击展开
 */
function SingleNodeCollapseRender() {
  const [activeId, setActiveId] = React.useState<string>("h1-aesthetics");

  return (
    <OutlinePanel
      items={FLAT_SAMPLE_DATA}
      activeId={activeId}
      onNavigate={setActiveId}
      draggable={false}
    />
  );
}

export const SingleNodeCollapse: Story = {
  render: () => <SingleNodeCollapseRender />,
  parameters: {
    docs: {
      description: {
        story:
          "P0: 单节点展开/折叠。点击节点左侧的箭头可以折叠/展开该节点的子项。",
      },
    },
  },
};

/**
 * Scene 4: DragDropComplete (P0)
 *
 * 完整拖拽功能演示
 * - before: 拖到目标上方
 * - after: 拖到目标下方
 * - into: 拖到目标内部（作为子项）
 */
function DragDropCompleteRender() {
  const [items, setItems] = React.useState(FLAT_SAMPLE_DATA);
  const [activeId, setActiveId] = React.useState<string>("h1-aesthetics");

  const handleReorder = (
    draggedId: string,
    targetId: string,
    position: DropPosition,
  ) => {
    console.log(`Reorder: ${draggedId} -> ${position} ${targetId}`);
    // Simple reorder demo (actual implementation would be more complex)
    const newItems = [...items];
    const draggedIndex = newItems.findIndex((i) => i.id === draggedId);
    const targetIndex = newItems.findIndex((i) => i.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      newItems.splice(
        insertIndex > draggedIndex ? insertIndex - 1 : insertIndex,
        0,
        draggedItem,
      );
      setItems(newItems);
    }
  };

  return (
    <OutlinePanel
      items={items}
      activeId={activeId}
      onNavigate={setActiveId}
      onReorder={handleReorder}
      draggable
    />
  );
}

export const DragDropComplete: Story = {
  render: () => <DragDropCompleteRender />,
  parameters: {
    docs: {
      description: {
        story: `P0: 完整拖拽功能。
- 拖到目标顶部 1/4: before（插入到目标前）
- 拖到目标底部 1/4: after（插入到目标后）
- 拖到目标中间: into（作为目标的子项，仅 H1/H2 支持）`,
      },
    },
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
 * Scene 7: SearchFilter (P1)
 *
 * 搜索/过滤功能
 */
function SearchFilterRender() {
  const [activeId, setActiveId] = React.useState<string>("h1-aesthetics");

  return (
    <OutlinePanel
      items={FLAT_SAMPLE_DATA}
      activeId={activeId}
      onNavigate={setActiveId}
      draggable={false}
    />
  );
}

export const SearchFilter: Story = {
  render: () => <SearchFilterRender />,
  parameters: {
    docs: {
      description: {
        story:
          'P1: 搜索/过滤功能。在顶部搜索框输入关键词，大纲会实时过滤显示匹配项。输入 "Digital" 试试。',
      },
    },
  },
};

/**
 * Scene 8: MultiSelect (P1)
 *
 * 多选批量操作
 */
function MultiSelectRender() {
  const [items, setItems] = React.useState(FLAT_SAMPLE_DATA);
  const [activeId, setActiveId] = React.useState<string>("h1-aesthetics");

  const handleDelete = (ids: string[]) => {
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    console.log("Deleted:", ids);
  };

  return (
    <OutlinePanel
      items={items}
      activeId={activeId}
      onNavigate={setActiveId}
      onDelete={handleDelete}
      draggable={false}
    />
  );
}

export const MultiSelect: Story = {
  render: () => <MultiSelectRender />,
  parameters: {
    docs: {
      description: {
        story: `P1: 多选批量操作。
- Ctrl/Cmd + Click: 切换单项选择
- Shift + Click: 范围选择
- Ctrl/Cmd + A: 全选
- 选中后可批量删除`,
      },
    },
  },
};

/**
 * Scene 9: KeyboardNavigation (P1)
 *
 * 完整键盘导航
 */
function KeyboardNavigationRender() {
  const [activeId, setActiveId] = React.useState<string>("h1-aesthetics");

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <OutlinePanel
          items={FLAT_SAMPLE_DATA}
          activeId={activeId}
          onNavigate={setActiveId}
          draggable={false}
        />
      </div>
      <div className="p-3 border-t border-[var(--color-separator)] bg-[var(--color-bg-raised)] text-[10px] text-[var(--color-fg-muted)]">
        <div className="font-medium mb-1">键盘快捷键:</div>
        <div>
          ↑↓: 上下移动 | ←→: 折叠/展开 | Enter: 导航 | F2: 编辑 | Del: 删除
        </div>
      </div>
    </div>
  );
}

export const KeyboardNavigation: Story = {
  render: () => <KeyboardNavigationRender />,
  parameters: {
    docs: {
      description: {
        story: `P1: 完整键盘导航。
- ↑/↓: 在大纲项间移动焦点
- ←: 折叠当前项
- →: 展开当前项
- Enter: 导航到当前项
- F2: 编辑当前项标题
- Delete/Backspace: 删除当前项
- Escape: 清除多选
- Ctrl/Cmd + A: 全选`,
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

/**
 * Scene 12: AllFeaturesCombined
 *
 * 所有功能组合演示
 */
function AllFeaturesCombinedRender() {
  const [items, setItems] = React.useState(FLAT_SAMPLE_DATA);
  const [activeId, setActiveId] = React.useState<string>("h1-aesthetics");

  const handleReorder = (
    draggedId: string,
    targetId: string,
    position: DropPosition,
  ) => {
    const newItems = [...items];
    const draggedIndex = newItems.findIndex((i) => i.id === draggedId);
    const targetIndex = newItems.findIndex((i) => i.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      newItems.splice(
        insertIndex > draggedIndex ? insertIndex - 1 : insertIndex,
        0,
        draggedItem,
      );
      setItems(newItems);
    }
  };

  const handleRename = (id: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, title: newTitle } : item,
      ),
    );
  };

  const handleDelete = (ids: string[]) => {
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
  };

  return (
    <OutlinePanel
      items={items}
      activeId={activeId}
      wordCounts={SAMPLE_WORD_COUNTS}
      scrollSyncEnabled
      onNavigate={setActiveId}
      onReorder={handleReorder}
      onRename={handleRename}
      onDelete={handleDelete}
      draggable
    />
  );
}

export const AllFeaturesCombined: Story = {
  render: () => <AllFeaturesCombinedRender />,
  parameters: {
    docs: {
      description: {
        story:
          "所有功能组合演示：折叠/展开、拖拽、搜索、多选、键盘导航、字数统计、滚动同步。",
      },
    },
  },
};

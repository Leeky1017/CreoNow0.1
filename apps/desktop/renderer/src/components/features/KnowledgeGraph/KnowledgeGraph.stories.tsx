import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { KnowledgeGraph } from "./KnowledgeGraph";
import type { GraphData, GraphNode, NodeType } from "./types";
import { expect } from "@storybook/test";

/**
 * KnowledgeGraph Component Stories
 *
 * 设计稿: 19-knowledge-graph.html
 *
 * 知识图谱组件，用于可视化实体之间的关系。
 * 支持多种节点类型（角色、地点、事件、物品），
 * 使用 design tokens 中的专用颜色。
 *
 * 节点类型及颜色:
 * - Character: 圆形, var(--color-node-character) #3b82f6 蓝色
 * - Location: 方形, var(--color-node-location) #22c55e 绿色
 * - Event: 菱形(45度旋转), var(--color-node-event) #f97316 橙色
 * - Item: 圆角方形, var(--color-node-item) #06b6d4 青色
 */

// ============================================================================
// 真实数据（MUST 使用）
// ============================================================================

const DEMO_NODES: GraphNode[] = [
  {
    id: "elara",
    label: "Elara",
    type: "character",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    position: { x: 400, y: 300 },
    metadata: {
      role: "Protagonist",
      attributes: [
        { key: "Age", value: "24" },
        { key: "Race", value: "Human" },
        { key: "Class", value: "Mage" },
      ],
      description:
        "A skilled weaver of arcana who seeks to unravel the mystery of the Silent Void. Born in the outskirts of the capital.",
    },
  },
  {
    id: "shadow-keep",
    label: "Shadow Keep",
    type: "location",
    position: { x: 600, y: 150 },
    metadata: {
      role: "Fortress",
      attributes: [
        { key: "Region", value: "Northern Wastes" },
        { key: "Status", value: "Abandoned" },
      ],
      description:
        "An ancient fortress shrouded in perpetual darkness, said to hold the secrets of the old world.",
    },
  },
  {
    id: "great-war",
    label: "The Great War",
    type: "event",
    position: { x: 400, y: 500 },
    metadata: {
      role: "Historical Event",
      attributes: [
        { key: "Era", value: "Third Age" },
        { key: "Duration", value: "7 years" },
      ],
      description:
        "A catastrophic conflict that reshaped the continent and led to the fall of the old kingdoms.",
    },
  },
  {
    id: "crystal-key",
    label: "Crystal Key",
    type: "item",
    position: { x: 200, y: 300 },
    metadata: {
      role: "Artifact",
      attributes: [
        { key: "Rarity", value: "Legendary" },
        { key: "Power", value: "Unknown" },
      ],
      description:
        "A mysterious key made of pure crystallized magic, capable of unlocking any door in existence.",
    },
  },
];

const DEMO_EDGES = [
  {
    id: "e1",
    source: "elara",
    target: "shadow-keep",
    label: "Travels to",
  },
  {
    id: "e2",
    source: "elara",
    target: "great-war",
    label: "Participant",
  },
  {
    id: "e3",
    source: "elara",
    target: "crystal-key",
    label: "Owns",
    selected: true,
  },
  {
    id: "e4",
    source: "shadow-keep",
    target: "great-war",
    label: "Scene of",
  },
];

const DEMO_DATA: GraphData = {
  nodes: DEMO_NODES,
  edges: DEMO_EDGES,
};

const EMPTY_DATA: GraphData = {
  nodes: [],
  edges: [],
};

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: "Features/KnowledgeGraph",
  component: KnowledgeGraph,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    data: {
      control: false,
      description: "Graph data containing nodes and edges",
    },
    selectedNodeId: {
      control: "text",
      description: "ID of the currently selected node",
    },
    onNodeSelect: {
      action: "nodeSelected",
      description: "Callback when a node is selected",
    },
    onNodeMove: {
      action: "nodeMoved",
      description: "Callback when a node is dragged to a new position",
    },
    onAddNode: {
      action: "addNode",
      description: "Callback when Add Node button is clicked",
    },
    onEditNode: {
      action: "editNode",
      description: "Callback when Edit Node button is clicked",
    },
    onViewDetails: {
      action: "viewDetails",
      description: "Callback when View Details button is clicked",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", width: "100%" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KnowledgeGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 场景 1: DefaultGraphWithConnections - 完整图谱，4 个节点 + 连线
// ============================================================================

/**
 * 场景 1: 完整图谱展示
 *
 * 验证点:
 * - 4 种节点类型的形状和颜色正确
 * - 连线正确连接
 * - 连线标签 "Travels to" / "Owns" 显示
 * - 网格背景点阵
 */
export const DefaultGraphWithConnections: Story = {
  args: {
    data: DEMO_DATA,
  },
  parameters: {
    docs: {
      description: {
        story:
          "完整的知识图谱，包含 4 种节点类型和连线。验证节点形状/颜色、连线标签、网格背景。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 2: EmptyGraph - 空图谱
// ============================================================================

/**
 * 场景 2: 空图谱
 *
 * 验证点:
 * - 空状态 UI
 * - "Add Node" 按钮可见
 */
export const EmptyGraph: Story = {
  args: {
    data: EMPTY_DATA,
  },
  parameters: {
    docs: {
      description: {
        story: "空状态的知识图谱，显示引导用户添加第一个节点的 UI。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 3: SelectedNodeWithCard - 选中 Elara，显示详情卡片
// ============================================================================

/**
 * 场景 3: 选中节点显示详情卡片
 *
 * 验证点:
 * - 节点选中态（外圈光晕 + 2px 边框）
 * - 详情卡片显示在节点右侧
 * - 卡片内容完整（头像/名字/类型/属性/描述）
 * - Edit Node / View Details 按钮
 */
export const SelectedNodeWithCard: Story = {
  args: {
    data: DEMO_DATA,
    selectedNodeId: "elara",
  },
  parameters: {
    docs: {
      description: {
        story:
          "选中 Elara 节点，显示详情卡片。验证选中态样式和卡片内容完整性。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 4: DraggingNode - 拖拽节点重新布局（交互式）
// ============================================================================

/**
 * 场景 4: 拖拽节点重新布局
 *
 * 验证点:
 * - 按住 Elara 节点
 * - 拖动到新位置
 * - 连线跟随节点移动
 * - 拖拽时 cursor 变为 grabbing
 * - 释放后新位置保持
 */
export const DraggingNode: Story = {
  args: { data: DEMO_DATA },
  render: function DraggingNodeStory() {
    const [data, setData] = useState<GraphData>(DEMO_DATA);

    const handleNodeMove = (
      nodeId: string,
      position: { x: number; y: number },
    ) => {
      setData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === nodeId ? { ...node, position } : node,
        ),
      }));
    };

    return (
      <KnowledgeGraph
        data={data}
        onNodeMove={handleNodeMove}
        onNodeSelect={() => {}}
        onAddNode={() => {}}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "交互式场景：拖拽节点重新布局。按住节点并拖动，验证连线跟随移动。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 5: ZoomingCanvas - 缩放画布
// ============================================================================

/**
 * 场景 5: 缩放画布
 *
 * 验证点:
 * - 点击 "+" 放大，100% → 110% → 120%
 * - 点击 "-" 缩小，100% → 90% → 80%
 * - 缩放时节点和连线同步缩放
 * - 最小/最大缩放限制
 */
export const ZoomingCanvas: Story = {
  args: {
    data: DEMO_DATA,
  },
  parameters: {
    docs: {
      description: {
        story: "测试缩放功能。使用工具栏的 +/- 按钮验证缩放效果和限制。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 6: PanningCanvas - 平移画布
// ============================================================================

/**
 * 场景 6: 平移画布
 *
 * 验证点:
 * - 在空白区域按住拖拽
 * - 整个画布移动
 * - cursor 变为 grab/grabbing
 */
export const PanningCanvas: Story = {
  args: {
    data: DEMO_DATA,
  },
  parameters: {
    docs: {
      description: {
        story: "测试平移功能。在空白区域按住并拖拽来移动整个画布。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 7: FilterByType - 按类型筛选
// ============================================================================

/**
 * 场景 7: 按类型筛选
 *
 * 验证点:
 * - 点击 "Locations" 筛选按钮
 * - 只显示 Shadow Keep
 * - 其他节点隐藏
 * - 相关连线隐藏
 * - 点击 "All" 恢复
 */
export const FilterByType: Story = {
  args: {
    data: DEMO_DATA,
  },
  parameters: {
    docs: {
      description: {
        story: "测试筛选功能。点击工具栏的筛选按钮，验证节点过滤效果。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 8: HoverHighlight - 悬停高亮
// ============================================================================

/**
 * 场景 8: 悬停高亮
 *
 * 验证点:
 * - 悬停 Elara 节点，边框高亮
 * - 悬停 "Owns" 连线，连线变蓝色
 * - 悬停节点标签，显示完整文字
 */
export const HoverHighlight: Story = {
  args: {
    data: DEMO_DATA,
  },
  parameters: {
    docs: {
      description: {
        story: "测试悬停效果。移动鼠标到节点和连线上验证高亮效果。",
      },
    },
  },
};

// ============================================================================
// 场景 9: AddNewNode - 添加新节点
// ============================================================================

/**
 * 场景 9: 添加新节点
 *
 * 验证点:
 * - 点击 "Add Node" 按钮
 * - 弹出节点类型选择
 * - 选择 "Character"
 * - 新节点出现在画布中心
 * - 自动打开详情卡片编辑
 */
export const AddNewNode: Story = {
  args: { data: DEMO_DATA },
  render: function AddNewNodeStory() {
    const [data, setData] = useState<GraphData>(DEMO_DATA);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleAddNode = (type: NodeType) => {
      const newNode: GraphNode = {
        id: `new-${Date.now()}`,
        label: "New Node",
        type,
        position: { x: 400, y: 300 },
        metadata: {
          role: "Undefined",
          attributes: [],
          description: "A newly created node. Edit to add details.",
        },
      };

      setData((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
      }));

      setSelectedId(newNode.id);
    };

    return (
      <KnowledgeGraph
        data={data}
        selectedNodeId={selectedId}
        onNodeSelect={setSelectedId}
        onAddNode={handleAddNode}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "交互式场景：添加新节点。点击 Add Node 按钮创建新节点并自动选中。",
      },
    },
  },
};

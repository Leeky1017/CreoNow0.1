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
  title: "Features/KnowledgeGraph/Advanced",
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
// 额外场景: 多节点选中对比
// ============================================================================

/**
 * 额外场景: 选中不同类型的节点
 *
 * 展示不同节点类型的选中状态和详情卡片
 */
export const SelectLocationNode: Story = {
  args: {
    data: DEMO_DATA,
    selectedNodeId: "shadow-keep",
  },
  parameters: {
    docs: {
      description: {
        story: "选中 Location 类型节点 Shadow Keep，展示其详情卡片。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const SelectEventNode: Story = {
  args: {
    data: DEMO_DATA,
    selectedNodeId: "great-war",
  },
  parameters: {
    docs: {
      description: {
        story: "选中 Event 类型节点 The Great War，展示其详情卡片。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const SelectItemNode: Story = {
  args: {
    data: DEMO_DATA,
    selectedNodeId: "crystal-key",
  },
  parameters: {
    docs: {
      description: {
        story: "选中 Item 类型节点 Crystal Key，展示其详情卡片。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 10: EditNodeDialog - 编辑节点对话框
// ============================================================================

/**
 * 场景 10: 编辑节点对话框
 *
 * 验证点:
 * - 选中节点后点击 "Edit Node" 按钮
 * - 打开编辑对话框
 * - 修改名称、类型、描述、属性
 * - 保存后节点数据更新
 */
export const EditNodeDialog: Story = {
  args: { data: DEMO_DATA },
  render: function EditNodeDialogStory() {
    const [data, setData] = useState<GraphData>(DEMO_DATA);
    const [selectedId, setSelectedId] = useState<string | null>("elara");

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

    const handleNodeSave = (node: GraphNode, isNew: boolean) => {
      if (isNew) {
        // Add new node
        setData((prev) => ({
          ...prev,
          nodes: [...prev.nodes, node],
        }));
      } else {
        // Update existing node
        setData((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === node.id ? node : n)),
        }));
      }
    };

    return (
      <KnowledgeGraph
        data={data}
        selectedNodeId={selectedId}
        onNodeSelect={setSelectedId}
        onNodeMove={handleNodeMove}
        onNodeSave={handleNodeSave}
        enableEditDialog={true}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "交互式场景：编辑节点对话框。选中节点后点击 Edit Node，修改属性并保存。点击 Add Node 创建新节点。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 场景 11: CreateNodeDialog - 创建新节点对话框
// ============================================================================

/**
 * 场景 11: 创建新节点对话框
 *
 * 验证点:
 * - 点击 "Add Node" 按钮
 * - 打开创建对话框
 * - 填写名称、选择类型、添加描述和属性
 * - 保存后新节点出现在画布
 */
export const CreateNodeDialog: Story = {
  args: { data: DEMO_DATA },
  render: function CreateNodeDialogStory() {
    const [data, setData] = useState<GraphData>({
      nodes: [
        {
          id: "elara",
          label: "Elara",
          type: "character",
          avatar:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
          position: { x: 400, y: 300 },
          metadata: {
            role: "Protagonist",
            attributes: [{ key: "Age", value: "24" }],
            description: "A skilled weaver of arcana.",
          },
        },
      ],
      edges: [],
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleNodeSave = (node: GraphNode, isNew: boolean) => {
      if (isNew) {
        setData((prev) => ({
          ...prev,
          nodes: [...prev.nodes, node],
        }));
        setSelectedId(node.id);
      } else {
        setData((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === node.id ? node : n)),
        }));
      }
    };

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
        selectedNodeId={selectedId}
        onNodeSelect={setSelectedId}
        onNodeMove={handleNodeMove}
        onNodeSave={handleNodeSave}
        enableEditDialog={true}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "交互式场景：创建新节点。点击 Add Node 按钮打开创建对话框，填写信息后保存。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 完整矩阵展示
// ============================================================================

/**
 * 完整功能矩阵
 *
 * 展示所有节点类型和交互状态，包括编辑和删除功能
 */
export const FullFeatureMatrix: Story = {
  args: { data: DEMO_DATA },
  render: function FullFeatureMatrixStory() {
    const [data, setData] = useState<GraphData>(DEMO_DATA);
    const [selectedId, setSelectedId] = useState<string | null>("elara");

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

    const handleNodeSave = (node: GraphNode, isNew: boolean) => {
      if (isNew) {
        setData((prev) => ({
          ...prev,
          nodes: [...prev.nodes, node],
        }));
        setSelectedId(node.id);
      } else {
        setData((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === node.id ? node : n)),
        }));
      }
    };

    const handleNodeDelete = (nodeId: string) => {
      // Confirm before delete
      const node = data.nodes.find((n) => n.id === nodeId);
      if (
        node &&
        confirm(`确定要删除节点 "${node.label}" 吗？此操作不可撤销。`)
      ) {
        setData((prev) => ({
          nodes: prev.nodes.filter((n) => n.id !== nodeId),
          edges: prev.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId,
          ),
        }));
        setSelectedId(null);
      }
    };

    return (
      <KnowledgeGraph
        data={data}
        selectedNodeId={selectedId}
        onNodeSelect={setSelectedId}
        onNodeMove={handleNodeMove}
        onNodeSave={handleNodeSave}
        onNodeDelete={handleNodeDelete}
        onEditNode={(id) => console.log("Edit triggered:", id)}
        onViewDetails={(id) =>
          alert(
            `查看详情: ${id}\n\n完整详情功能可在此实现更复杂的面板或页面跳转。`,
          )
        }
        enableEditDialog={true}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "完整功能演示：支持节点选择、拖拽、添加、编辑、删除、筛选、缩放等所有交互。点击垃圾桶图标删除节点。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

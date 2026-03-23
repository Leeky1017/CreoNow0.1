import type { Meta, StoryObj } from "@storybook/react";

import { KnowledgeGraph } from "../../components/features/KnowledgeGraph/KnowledgeGraph";
import type { GraphData } from "../../components/features/KnowledgeGraph/types";
import {
  CharacterCardList,
  type CharacterCardSummary,
} from "../character/CharacterCardList";
import { expect } from "@storybook/test";

const graphMultiNodeData: GraphData = {
  nodes: [
    {
      id: "n-1",
      label: "林远",
      type: "character",
      position: { x: 320, y: 200 },
      metadata: { description: "前特种兵，冷静", role: "主角" },
    },
    {
      id: "n-2",
      label: "旧港",
      type: "location",
      position: { x: 520, y: 180 },
    },
    {
      id: "n-3",
      label: "废弃仓库事件",
      type: "event",
      position: { x: 420, y: 360 },
    },
  ],
  edges: [
    { id: "e-1", source: "n-1", target: "n-2", label: "活动于" },
    { id: "e-2", source: "n-1", target: "n-3", label: "参与" },
  ],
};

const graphMinimalData: GraphData = {
  nodes: [
    {
      id: "n-minimal",
      label: "林小雨",
      type: "character",
      position: { x: 380, y: 240 },
    },
  ],
  edges: [],
};

const graphEmptyData: GraphData = {
  nodes: [],
  edges: [],
};

const completeCharacterCards: CharacterCardSummary[] = [
  {
    id: "c-1",
    name: "林远",
    typeLabel: "角色",
    keyAttributes: ["年龄: 28", "定位: protagonist", "特征: 冷静 / 克制"],
    relationSummary: "关系 4 条",
  },
  {
    id: "c-2",
    name: "张薇",
    typeLabel: "角色",
    keyAttributes: ["年龄: 26", "定位: ally", "特征: 果断 / 敏锐"],
    relationSummary: "关系 2 条",
  },
];

const partialCharacterCards: CharacterCardSummary[] = [
  {
    id: "c-partial",
    name: "神秘老人",
    typeLabel: "角色",
    keyAttributes: ["暂无关键属性"],
    relationSummary: "关系 0 条",
  },
];

const meta = {
  title: "Features/KG/Views",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const GraphMultiNode: Story = {
  render: () => (
    <div className="h-screen w-full">
      <KnowledgeGraph data={graphMultiNodeData} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const GraphMinimal: Story = {
  render: () => (
    <div className="h-screen w-full">
      <KnowledgeGraph data={graphMinimalData} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const GraphEmpty: Story = {
  render: () => (
    <div className="h-screen w-full">
      <KnowledgeGraph data={graphEmptyData} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const CharacterCardComplete: Story = {
  render: () => (
    <div className="h-screen w-[340px]">
      <CharacterCardList cards={completeCharacterCards} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const CharacterCardPartial: Story = {
  render: () => (
    <div className="h-screen w-[340px]">
      <CharacterCardList cards={partialCharacterCards} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const CharacterCardEmpty: Story = {
  render: () => (
    <div className="h-screen w-[340px]">
      <CharacterCardList cards={[]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

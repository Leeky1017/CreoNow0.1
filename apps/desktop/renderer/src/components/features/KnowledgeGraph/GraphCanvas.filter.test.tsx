import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

import { GraphCanvas } from "./GraphCanvas";
import type { GraphData } from "./types";

const data: GraphData = {
  nodes: [
    {
      id: "n1",
      label: "Hero",
      type: "character",
      position: { x: 10, y: 20 },
    },
    {
      id: "n2",
      label: "Town",
      type: "location",
      position: { x: 200, y: 220 },
    },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", label: "arrives" }],
};

const baseProps = {
  data,
  selectedNodeId: null,
  transform: { scale: 1, translateX: 0, translateY: 0 },
  onNodeSelect: vi.fn(),
  onNodeMove: vi.fn(),
  onCanvasPan: vi.fn(),
  onCanvasZoom: vi.fn(),
};

describe("GraphCanvas filter", () => {
  it("过滤后只保留两端都可见的边", () => {
    const { container, rerender } = render(
      <GraphCanvas {...baseProps} filter="all" />,
    );

    expect(container.querySelector('[data-edge-id="e1"]')).toBeInTheDocument();

    rerender(<GraphCanvas {...baseProps} filter="location" />);

    expect(container.querySelector('[data-node-id="n2"]')).toBeInTheDocument();
    expect(container.querySelector('[data-node-id="n1"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-edge-id="e1"]')).not.toBeInTheDocument();
  });
});

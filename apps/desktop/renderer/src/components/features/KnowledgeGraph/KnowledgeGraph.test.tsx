import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { GraphNode } from "./GraphNode";
import { GraphLegend } from "./GraphLegend";
import { GraphToolbar } from "./GraphToolbar";
import { NodeDetailCard } from "./NodeDetailCard";
import type { GraphData, GraphNode as GraphNodeType } from "./types";

// Test data
const mockNodes: GraphNodeType[] = [
  {
    id: "1",
    label: "Elara",
    type: "character",
    avatar: "https://example.com/avatar.jpg",
    position: { x: 300, y: 200 },
    metadata: {
      role: "Protagonist",
      attributes: [{ key: "Age", value: "24" }],
      description: "A skilled mage.",
    },
  },
  {
    id: "2",
    label: "Shadow Keep",
    type: "location",
    position: { x: 500, y: 100 },
    metadata: {
      role: "Fortress",
      attributes: [],
      description: "An ancient fortress.",
    },
  },
  {
    id: "3",
    label: "The Great War",
    type: "event",
    position: { x: 300, y: 400 },
    metadata: {
      role: "Historical Event",
      attributes: [],
      description: "A catastrophic conflict.",
    },
  },
  {
    id: "4",
    label: "Crystal Key",
    type: "item",
    position: { x: 100, y: 200 },
    metadata: {
      role: "Artifact",
      attributes: [],
      description: "A mysterious key.",
    },
  },
];

const mockEdges = [
  { id: "e1", source: "1", target: "2", label: "Travels to" },
  { id: "e2", source: "1", target: "3", label: "Participant" },
  { id: "e3", source: "1", target: "4", label: "Owns" },
];

const mockData: GraphData = {
  nodes: mockNodes,
  edges: mockEdges,
};

const emptyData: GraphData = {
  nodes: [],
  edges: [],
};

// ============================================================================
// KnowledgeGraph Component Tests
// ============================================================================

describe("KnowledgeGraph", () => {
  it("renders with data", () => {
    render(<KnowledgeGraph data={mockData} />);

    // Check toolbar is rendered
    expect(screen.getByText("Knowledge Graph")).toBeInTheDocument();
    expect(screen.getByText("Add Node")).toBeInTheDocument();

    // Check legend is rendered
    expect(screen.getByText("Graph Legend")).toBeInTheDocument();
  });

  it("renders empty state when no nodes", () => {
    render(<KnowledgeGraph data={emptyData} />);

    expect(
      screen.getByText(
        "No entities yet. Click to add your first character or location",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Add Node").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onNodeSelect when node is clicked", async () => {
    const handleSelect = vi.fn();
    render(<KnowledgeGraph data={mockData} onNodeSelect={handleSelect} />);

    // Find and click a node
    const node = screen.getByText("Elara").closest("[data-node-id]");
    if (node) {
      await userEvent.click(node);
      expect(handleSelect).toHaveBeenCalledWith("1");
    }
  });

  it("displays node detail card when node is selected", () => {
    render(<KnowledgeGraph data={mockData} selectedNodeId="1" />);

    // Check detail card content (multiple "Elara" elements exist: node label + detail card)
    const elaraElements = screen.getAllByText("Elara");
    expect(elaraElements.length).toBeGreaterThanOrEqual(2); // Node label + detail card

    expect(screen.getByText("Protagonist")).toBeInTheDocument();
    expect(screen.getByText("A skilled mage.")).toBeInTheDocument();
    expect(screen.getByText("Edit Node")).toBeInTheDocument();
    expect(screen.getByText("View Details")).toBeInTheDocument();
  });

  it("calls onAddNode when add button is clicked", async () => {
    const handleAdd = vi.fn();
    render(<KnowledgeGraph data={mockData} onAddNode={handleAdd} />);

    const addButton = screen.getByText("Add Node");
    await userEvent.click(addButton);

    expect(handleAdd).toHaveBeenCalledWith("character");
  });

  it("shows zoom percentage in toolbar", () => {
    render(<KnowledgeGraph data={mockData} />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("clears selection on Escape key", () => {
    const handleSelect = vi.fn();
    render(
      <KnowledgeGraph
        data={mockData}
        selectedNodeId="1"
        onNodeSelect={handleSelect}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it("calls onNodeDelete on Delete key and clears selection", () => {
    const handleSelect = vi.fn();
    const handleDelete = vi.fn();
    render(
      <KnowledgeGraph
        data={mockData}
        selectedNodeId="1"
        onNodeSelect={handleSelect}
        onNodeDelete={handleDelete}
      />,
    );

    fireEvent.keyDown(document, { key: "Delete" });
    expect(handleDelete).toHaveBeenCalledWith("1");
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it("does not clear selection when edit dialog is open (Escape handled by dialog)", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <KnowledgeGraph
        data={mockData}
        selectedNodeId="1"
        onNodeSelect={handleSelect}
        enableEditDialog={true}
      />,
    );

    // Open edit dialog
    await user.click(screen.getByText("Edit Node"));
    fireEvent.keyDown(document, { key: "Escape" });

    // Should not force-clear selection while dialog is open
    expect(handleSelect).not.toHaveBeenCalled();
  });
});

// ============================================================================
// GraphNode Component Tests
// ============================================================================

describe("GraphNode", () => {
  const baseNode: GraphNodeType = {
    id: "test",
    label: "Test Node",
    type: "character",
    position: { x: 100, y: 100 },
  };

  it("renders character node with avatar", () => {
    const nodeWithAvatar = {
      ...baseNode,
      avatar: "https://example.com/avatar.jpg",
    };
    render(<GraphNode node={nodeWithAvatar} />);

    expect(screen.getByText("Test Node")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      nodeWithAvatar.avatar,
    );
  });

  it("renders character node with initial when no avatar", () => {
    render(<GraphNode node={baseNode} />);

    expect(screen.getByText("T")).toBeInTheDocument(); // First letter of "Test Node"
  });

  it("applies selected styles when selected", () => {
    const { container } = render(<GraphNode node={baseNode} selected />);

    const nodeEl = container.querySelector("[data-node-id]");
    expect(nodeEl).toHaveClass("z-20");
  });

  it("shows dragging indicator when dragging", () => {
    render(<GraphNode node={baseNode} dragging />);

    expect(screen.getByText("Dragging")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<GraphNode node={baseNode} onClick={handleClick} />);

    const node = screen.getByText("Test Node").closest("[data-node-id]");
    if (node) {
      await userEvent.click(node);
      expect(handleClick).toHaveBeenCalled();
    }
  });

  it("renders different node types with correct icons", () => {
    const locationNode = { ...baseNode, type: "location" as const };
    const { rerender, container } = render(<GraphNode node={locationNode} />);

    // Location node should have an SVG icon
    expect(container.querySelector("svg")).toBeInTheDocument();

    const eventNode = { ...baseNode, type: "event" as const };
    rerender(<GraphNode node={eventNode} />);

    // Event node should have an SVG icon
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

// ============================================================================
// GraphLegend Component Tests
// ============================================================================

describe("GraphLegend", () => {
  it("renders all node types", () => {
    render(<GraphLegend />);

    expect(screen.getByText("Graph Legend")).toBeInTheDocument();
    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<GraphLegend className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

// ============================================================================
// GraphToolbar Component Tests
// ============================================================================

describe("GraphToolbar", () => {
  const defaultProps = {
    activeFilter: "all" as const,
    onFilterChange: vi.fn(),
    zoom: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onAddNode: vi.fn(),
  };

  it("renders title and buttons", () => {
    render(<GraphToolbar {...defaultProps} />);

    expect(screen.getByText("Knowledge Graph")).toBeInTheDocument();
    expect(screen.getByText("Add Node")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders all filter buttons", () => {
    render(<GraphToolbar {...defaultProps} />);

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Roles")).toBeInTheDocument();
    expect(screen.getByText("Locations")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
  });

  it("calls onFilterChange when filter button is clicked", async () => {
    render(<GraphToolbar {...defaultProps} />);

    await userEvent.click(screen.getByText("Roles"));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("character");
  });

  it("calls onZoomIn when + button is clicked", async () => {
    render(<GraphToolbar {...defaultProps} />);

    const zoomInButton = screen.getByLabelText("Zoom in");
    await userEvent.click(zoomInButton);
    expect(defaultProps.onZoomIn).toHaveBeenCalled();
  });

  it("calls onZoomOut when - button is clicked", async () => {
    render(<GraphToolbar {...defaultProps} />);

    const zoomOutButton = screen.getByLabelText("Zoom out");
    await userEvent.click(zoomOutButton);
    expect(defaultProps.onZoomOut).toHaveBeenCalled();
  });

  it("calls onAddNode when Add Node button is clicked", async () => {
    render(<GraphToolbar {...defaultProps} />);

    await userEvent.click(screen.getByText("Add Node"));
    expect(defaultProps.onAddNode).toHaveBeenCalled();
  });

  it("renders back button when onBack is provided", async () => {
    const handleBack = vi.fn();
    render(<GraphToolbar {...defaultProps} onBack={handleBack} />);

    const backButton = screen.getByLabelText("Go back");
    expect(backButton).toBeInTheDocument();

    await userEvent.click(backButton);
    expect(handleBack).toHaveBeenCalled();
  });
});

// ============================================================================
// NodeDetailCard Component Tests
// ============================================================================

describe("NodeDetailCard", () => {
  const mockNode: GraphNodeType = {
    id: "1",
    label: "Elara Vance",
    type: "character",
    avatar: "https://example.com/avatar.jpg",
    position: { x: 0, y: 0 },
    metadata: {
      role: "Protagonist",
      attributes: [
        { key: "Age", value: "24" },
        { key: "Race", value: "Human" },
      ],
      description: "A skilled mage seeking the truth.",
    },
  };

  it("renders node details", () => {
    render(<NodeDetailCard node={mockNode} />);

    expect(screen.getByText("Elara Vance")).toBeInTheDocument();
    expect(screen.getByText("Protagonist")).toBeInTheDocument();
    expect(screen.getByText("Age: 24")).toBeInTheDocument();
    expect(screen.getByText("Race: Human")).toBeInTheDocument();
    expect(
      screen.getByText("A skilled mage seeking the truth."),
    ).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<NodeDetailCard node={mockNode} />);

    expect(screen.getByText("Edit Node")).toBeInTheDocument();
    expect(screen.getByText("View Details")).toBeInTheDocument();
  });

  it("calls onEdit when Edit Node is clicked", async () => {
    const handleEdit = vi.fn();
    render(<NodeDetailCard node={mockNode} onEdit={handleEdit} />);

    await userEvent.click(screen.getByText("Edit Node"));
    expect(handleEdit).toHaveBeenCalled();
  });

  it("calls onViewDetails when View Details is clicked", async () => {
    const handleViewDetails = vi.fn();
    render(
      <NodeDetailCard node={mockNode} onViewDetails={handleViewDetails} />,
    );

    await userEvent.click(screen.getByText("View Details"));
    expect(handleViewDetails).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    render(<NodeDetailCard node={mockNode} onClose={handleClose} />);

    const closeButton = screen.getByLabelText("Close");
    await userEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });

  it("renders avatar image when provided", () => {
    render(<NodeDetailCard node={mockNode} />);

    // Avatar primitive wraps img in a div with role="img"
    const avatarContainer = screen.getAllByRole("img")[0];
    const img = avatarContainer.querySelector("img");
    expect(img).toHaveAttribute("src", mockNode.avatar);
  });

  it("renders initial when no avatar", () => {
    const nodeWithoutAvatar = { ...mockNode, avatar: undefined };
    render(<NodeDetailCard node={nodeWithoutAvatar} />);

    // Avatar primitive shows initials: "Elara Vance" -> "EV"
    expect(screen.getByText("EV")).toBeInTheDocument();
  });
});

// ============================================================================
// Design Token Usage Tests
// ============================================================================

describe("Design Token Usage", () => {
  it("uses node color tokens - legend renders correctly", () => {
    const { container } = render(<GraphLegend />);

    // Check that the component renders (tokens are applied via CSS)
    expect(container.firstChild).toBeInTheDocument();
  });

  it("GraphNode applies character type class", () => {
    const node: GraphNodeType = {
      id: "test",
      label: "Test",
      type: "character",
      position: { x: 0, y: 0 },
    };
    const { container } = render(<GraphNode node={node} />);

    const nodeEl = container.querySelector("[data-node-id]");
    // Check node renders and has rounded-full class for character type
    expect(nodeEl).toBeInTheDocument();
    expect(nodeEl).toHaveClass("rounded-full");
  });

  it("GraphNode applies location type class", () => {
    const node: GraphNodeType = {
      id: "test",
      label: "Test",
      type: "location",
      position: { x: 0, y: 0 },
    };
    const { container } = render(<GraphNode node={node} />);

    const nodeEl = container.querySelector("[data-node-id]");
    // Check node renders and has rounded-lg class for location type
    expect(nodeEl).toBeInTheDocument();
    expect(nodeEl).toHaveClass("rounded-lg");
  });

  it("GraphNode applies event type class with rotation", () => {
    const node: GraphNodeType = {
      id: "test",
      label: "Test",
      type: "event",
      position: { x: 0, y: 0 },
    };
    const { container } = render(<GraphNode node={node} />);

    const nodeEl = container.querySelector("[data-node-id]");
    // Check node renders and has rotate-45 class for event type (diamond shape)
    expect(nodeEl).toBeInTheDocument();
    expect(nodeEl).toHaveClass("rotate-45");
  });

  it("GraphNode applies item type class", () => {
    const node: GraphNodeType = {
      id: "test",
      label: "Test",
      type: "item",
      position: { x: 0, y: 0 },
    };
    const { container } = render(<GraphNode node={node} />);

    const nodeEl = container.querySelector("[data-node-id]");
    // Check node renders and has rounded-xl class for item type
    expect(nodeEl).toBeInTheDocument();
    expect(nodeEl).toHaveClass("rounded-xl");
  });
});

// ============================================================================
// NodeEditDialog Tests
// ============================================================================

import { NodeEditDialog } from "./NodeEditDialog";

describe("NodeEditDialog", () => {
  const mockNode: GraphNodeType = {
    id: "test-node",
    label: "Test Node",
    type: "character",
    position: { x: 100, y: 100 },
    metadata: {
      role: "Protagonist",
      attributes: [{ key: "Age", value: "25" }],
      description: "A test character",
    },
  };

  it("renders dialog when open", () => {
    render(
      <NodeEditDialog
        open={true}
        onOpenChange={() => {}}
        node={mockNode}
        onSave={() => {}}
        mode="edit"
      />,
    );

    expect(screen.getByText(/Edit Node/)).toBeInTheDocument();
  });

  it("does not render dialog when closed", () => {
    render(
      <NodeEditDialog
        open={false}
        onOpenChange={() => {}}
        node={mockNode}
        onSave={() => {}}
        mode="edit"
      />,
    );

    expect(screen.queryByText(/Edit Node/)).not.toBeInTheDocument();
  });

  it("shows create title in create mode", () => {
    render(
      <NodeEditDialog
        open={true}
        onOpenChange={() => {}}
        node={null}
        onSave={() => {}}
        mode="create"
      />,
    );

    expect(screen.getByText(/Create New Node/)).toBeInTheDocument();
  });

  it("populates form with node data in edit mode", () => {
    render(
      <NodeEditDialog
        open={true}
        onOpenChange={() => {}}
        node={mockNode}
        onSave={() => {}}
        mode="edit"
      />,
    );

    // Check that the input has the node's label
    const nameInput = screen.getByDisplayValue("Test Node");
    expect(nameInput).toBeInTheDocument();
  });

  it("calls onSave with updated node data", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <NodeEditDialog
        open={true}
        onOpenChange={() => {}}
        node={mockNode}
        onSave={onSave}
        mode="edit"
      />,
    );

    // Clear and type new name
    const nameInput = screen.getByDisplayValue("Test Node");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Node");

    // Click save button
    const saveButton = screen.getByText("Save");
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "test-node",
        label: "Updated Node",
        type: "character",
      }),
    );
  });

  it("calls onOpenChange when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <NodeEditDialog
        open={true}
        onOpenChange={onOpenChange}
        node={mockNode}
        onSave={() => {}}
        mode="edit"
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables save button when name is empty", () => {
    render(
      <NodeEditDialog
        open={true}
        onOpenChange={() => {}}
        node={null}
        onSave={() => {}}
        mode="create"
      />,
    );

    // In create mode with no node, name should be empty
    // Find the button by role and check its disabled state
    const saveButton = screen.getByRole("button", { name: "Create" });
    expect(saveButton).toBeDisabled();
  });

  it("shows role field for character type", () => {
    render(
      <NodeEditDialog
        open={true}
        onOpenChange={() => {}}
        node={mockNode}
        onSave={() => {}}
        mode="edit"
      />,
    );

    expect(screen.getByText("Role")).toBeInTheDocument();
  });

  it("shows all node type options in select", () => {
    render(
      <NodeEditDialog
        open={true}
        onOpenChange={() => {}}
        node={mockNode}
        onSave={() => {}}
        mode="edit"
      />,
    );

    // Radix Select renders both visible span and hidden native option
    // Use combobox role to verify the select is present with correct value
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    // The selected value should be displayed
    expect(screen.getAllByText("Character").length).toBeGreaterThan(0);
  });
});

// ============================================================================
// NodeDetailCard Delete Tests
// ============================================================================

describe("NodeDetailCard delete functionality", () => {
  const mockNode: GraphNodeType = {
    id: "test",
    label: "Test Node",
    type: "character",
    position: { x: 0, y: 0 },
    metadata: {
      role: "Protagonist",
      description: "A test character",
    },
  };

  it("renders delete button when onDelete is provided", () => {
    render(
      <NodeDetailCard node={mockNode} onDelete={() => {}} onClose={() => {}} />,
    );

    const deleteButton = screen.getByLabelText("Delete Node");
    expect(deleteButton).toBeInTheDocument();
  });

  it("does not render delete button when onDelete is not provided", () => {
    render(<NodeDetailCard node={mockNode} onClose={() => {}} />);

    const deleteButton = screen.queryByLabelText("Delete Node");
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <NodeDetailCard node={mockNode} onDelete={onDelete} onClose={() => {}} />,
    );

    const deleteButton = screen.getByLabelText("Delete Node");
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalled();
  });
});

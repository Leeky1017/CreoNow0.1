import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KgListView } from "./KgListView";
import { TimelineView } from "./TimelineView";

vi.mock("../../components/features/AiDialogs/SystemDialog", () => ({
  SystemDialog: () => null,
}));

function createListState(overrides: Record<string, unknown> = {}) {
  return {
    t: (key: string) => {
      const map: Record<string, string> = {
        "kg.panel.title": "Knowledge Graph",
        "kg.panel.entities": "Entities",
        "kg.panel.relations": "Relations",
        "kg.panel.noEntities": "No entities yet",
        "kg.panel.noRelations": "No relations yet",
        "kg.panel.dismiss": "Dismiss",
        "kg.panel.namePlaceholder": "Name",
        "kg.panel.typePlaceholder": "Type",
        "kg.panel.descriptionPlaceholder": "Description",
        "kg.panel.aliasesPlaceholder": "Aliases",
        "kg.panel.createEntity": "Create Entity",
        "kg.panel.selectEntityPlaceholder": "Select entity",
        "kg.panel.relationTypePlaceholder": "Relation type",
        "kg.panel.createRelation": "Create Relation",
      };
      return map[key] ?? key;
    },
    isReady: true,
    entities: [],
    relations: [],
    lastError: null,
    clearError: vi.fn(),
    editing: { mode: "idle" },
    setEditing: vi.fn(),
    viewMode: "list",
    setViewMode: vi.fn(),
    dialogProps: {},
    onCreateEntity: vi.fn(),
    onDeleteEntity: vi.fn(),
    onDeleteRelation: vi.fn(),
    onSaveEdit: vi.fn(),
    onCreateRelation: vi.fn(),
    getEntityName: vi.fn(),
    createName: "",
    setCreateName: vi.fn(),
    createType: "",
    setCreateType: vi.fn(),
    createDescription: "",
    setCreateDescription: vi.fn(),
    createAliasesInput: "",
    setCreateAliasesInput: vi.fn(),
    relFromId: "",
    setRelFromId: vi.fn(),
    relToId: "",
    setRelToId: vi.fn(),
    relType: "",
    setRelType: vi.fn(),
    ...overrides,
  } as unknown as Parameters<typeof KgListView>[0]["state"];
}

describe("KnowledgeGraphPanel behavior", () => {
  it("renders EmptyState in list view when there are no entities", () => {
    render(<KgListView state={createListState()} />);

    expect(screen.getByText("Knowledge Graph")).toBeInTheDocument();
    expect(screen.getByText("No entities yet")).toBeInTheDocument();
  });

  it("renders ErrorState in list view when state has an error", () => {
    render(
      <KgListView
        state={createListState({
          lastError: { code: "UNKNOWN", message: "Broken KG payload" },
        })}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Something unexpected happened. Please try again later."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("adds elevation classes while dragging timeline events", () => {
    render(
      <TimelineView
        events={[
          { id: "e1", title: "Inciting Incident", chapter: "Ch1", order: 1 },
          { id: "e2", title: "Reveal", chapter: "Ch2", order: 2 },
        ]}
      />,
    );

    const event = screen.getByTestId("timeline-event-e1");
    fireEvent.dragStart(event);

    expect(event).toHaveClass("shadow-[var(--shadow-xl)]");
    expect(event).toHaveClass("scale-[1.02]");
    expect(event).toHaveClass("opacity-90");
  });
});

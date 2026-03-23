import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterPanel } from "./CharacterPanel";
import { CharacterCard } from "./CharacterCard";
import type { Character } from "./types";

/**
 * Sample character data for tests
 */
const SAMPLE_CHARACTERS: Character[] = [
  {
    id: "elara",
    name: "Elara Vance",
    age: 24,
    role: "protagonist",
    group: "main",
    archetype: "reluctant-hero",
    avatarUrl: "https://example.com/elara.jpg",
    description: "A skilled pilot with a mysterious past.",
    traits: ["Brave", "Impulsive", "Loyal"],
    relationships: [
      {
        characterId: "kaelen",
        characterName: "Kaelen Thorne",
        characterRole: "antagonist",
        type: "rival",
      },
    ],
    appearances: [{ id: "ch1", title: "Chapter 1: The Awakening" }],
  },
  {
    id: "kaelen",
    name: "Kaelen Thorne",
    age: 32,
    role: "antagonist",
    group: "main",
    description: "A charismatic leader with a hidden agenda.",
    traits: ["Cunning", "Charismatic"],
    relationships: [],
    appearances: [],
  },
  {
    id: "jax",
    name: "Jax",
    age: 58,
    role: "mentor",
    group: "supporting",
    description: "A grizzled veteran.",
    traits: ["Wise"],
    relationships: [],
    appearances: [],
  },
];

describe("CharacterPanel", () => {
  it("renders the panel with header", () => {
    render(<CharacterPanel characters={[]} />);

    expect(screen.getByText("CHARACTERS")).toBeInTheDocument();
    expect(screen.getByTestId("character-panel")).toBeInTheDocument();
  });

  it("renders grouped character lists", () => {
    render(<CharacterPanel characters={SAMPLE_CHARACTERS} />);

    expect(screen.getByText("Main Characters")).toBeInTheDocument();
    expect(screen.getByText("Supporting")).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();
  });

  it("displays character count per group", () => {
    render(<CharacterPanel characters={SAMPLE_CHARACTERS} />);

    // Main Characters: 2, Supporting: 1, Others: 0
    const counts = screen.getAllByText(/^[0-3]$/);
    expect(counts.length).toBeGreaterThan(0);
  });

  it("renders character cards with name and role", () => {
    render(<CharacterPanel characters={SAMPLE_CHARACTERS} />);

    expect(screen.getByText("Elara Vance")).toBeInTheDocument();
    expect(screen.getByText("Kaelen Thorne")).toBeInTheDocument();
    expect(screen.getByText("Jax")).toBeInTheDocument();
    expect(screen.getByText("Protagonist")).toBeInTheDocument();
    expect(screen.getByText("Antagonist")).toBeInTheDocument();
    expect(screen.getByText("Mentor")).toBeInTheDocument();
  });

  it("shows empty state when no characters", () => {
    render(<CharacterPanel characters={[]} />);

    const emptyStates = screen.getAllByText("No characters");
    expect(emptyStates.length).toBe(3); // One per group
  });

  it("calls onCreate when add button is clicked", async () => {
    const user = userEvent.setup();
    const onCreateMock = vi.fn();

    render(<CharacterPanel characters={[]} onCreate={onCreateMock} />);

    const addButton = screen.getByLabelText("Add new character");
    await user.click(addButton);

    expect(onCreateMock).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect when character is clicked", async () => {
    const user = userEvent.setup();
    const onSelectMock = vi.fn();

    render(
      <CharacterPanel characters={SAMPLE_CHARACTERS} onSelect={onSelectMock} />,
    );

    const elaraCard = screen
      .getByText("Elara Vance")
      .closest('[data-testid="character-card"]');
    expect(elaraCard).toBeInTheDocument();

    if (elaraCard) {
      await user.click(elaraCard);
      expect(onSelectMock).toHaveBeenCalledWith("elara");
    }
  });

  it("shows selected indicator for selected character", () => {
    render(
      <CharacterPanel characters={SAMPLE_CHARACTERS} selectedId="elara" />,
    );

    const elaraCard = screen
      .getByText("Elara Vance")
      .closest('[data-testid="character-card"]');
    expect(elaraCard).toHaveAttribute("aria-pressed", "true");

    const indicator = screen.getByTestId("character-card-selected-indicator");
    expect(indicator).toBeInTheDocument();
  });
});

describe("CharacterCard", () => {
  const character = SAMPLE_CHARACTERS[0];

  it("renders character name and role", () => {
    render(<CharacterCard character={character} />);

    expect(screen.getByText("Elara Vance")).toBeInTheDocument();
    expect(screen.getByText("Protagonist")).toBeInTheDocument();
  });

  it("shows selected indicator when selected", () => {
    render(<CharacterCard character={character} selected />);

    const indicator = screen.getByTestId("character-card-selected-indicator");
    expect(indicator).toBeInTheDocument();
  });

  it("does not show selected indicator when not selected", () => {
    render(<CharacterCard character={character} selected={false} />);

    expect(
      screen.queryByTestId("character-card-selected-indicator"),
    ).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(<CharacterCard character={character} onClick={onClickMock} />);

    const card = screen.getByTestId("character-card");
    await user.click(card);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEditMock = vi.fn();
    const onClickMock = vi.fn();

    render(
      <CharacterCard
        character={character}
        onClick={onClickMock}
        onEdit={onEditMock}
        selected // Show buttons
      />,
    );

    const editButton = screen.getByLabelText(`Edit ${character.name}`);
    await user.click(editButton);

    expect(onEditMock).toHaveBeenCalledTimes(1);
    expect(onClickMock).not.toHaveBeenCalled(); // Should not bubble
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDeleteMock = vi.fn();
    const onClickMock = vi.fn();

    render(
      <CharacterCard
        character={character}
        onClick={onClickMock}
        onDelete={onDeleteMock}
        selected // Show buttons
      />,
    );

    const deleteButton = screen.getByLabelText(`Delete ${character.name}`);
    await user.click(deleteButton);

    expect(onDeleteMock).toHaveBeenCalledTimes(1);
    expect(onClickMock).not.toHaveBeenCalled(); // Should not bubble
  });

  it("is keyboard accessible", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(<CharacterCard character={character} onClick={onClickMock} />);

    const card = screen.getByTestId("character-card");
    expect(card.tagName).toBe("BUTTON");
    expect(card).toHaveAttribute("aria-pressed", "false");

    card.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClickMock).toHaveBeenCalledTimes(2);
  });

  it("displays avatar with fallback initials when no image", () => {
    const characterWithoutAvatar: Character = {
      ...character,
      avatarUrl: undefined,
    };

    render(<CharacterCard character={characterWithoutAvatar} />);

    // Avatar should show initials "EV" for Elara Vance
    expect(screen.getByText("EV")).toBeInTheDocument();
  });
});

describe("v1-10 PanelHeader unification (AC-1)", () => {
  it("should render unified PanelHeader with panel title", () => {
    render(<CharacterPanel characters={[]} />);

    const header = document.querySelector(".panel-header");
    expect(header).toBeInTheDocument();
    expect(screen.getByText("CHARACTERS")).toBeInTheDocument();
  });

  it("should render PanelHeader with add character action button", () => {
    const onCreateMock = vi.fn();
    render(<CharacterPanel characters={[]} onCreate={onCreateMock} />);

    const header = document.querySelector(".panel-header");
    expect(header).toBeInTheDocument();
    expect(screen.getByLabelText("Add new character")).toBeInTheDocument();
  });

  it("should render a 40px-high header with bottom border separator", () => {
    render(<CharacterPanel characters={[]} />);

    const header = document.querySelector(".panel-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("h-10");
    expect(header).toHaveClass("border-b");
  });
});

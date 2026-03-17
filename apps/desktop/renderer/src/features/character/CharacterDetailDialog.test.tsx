import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import type { Character } from "./types";

/**
 * CharacterDetailDialog component tests
 *
 * Tests cover:
 * - Dialog renders with structured profile table
 * - Add Relationship flow updates relationships list
 */
describe("CharacterDetailDialog", () => {
  const elara: Character = {
    id: "elara",
    name: "Elara Vance",
    age: 24,
    birthDate: "2002-03-25",
    zodiac: "aries",
    role: "protagonist",
    group: "main",
    archetype: "reluctant-hero",
    description: "A skilled pilot with a mysterious past.",
    features: ["Flight jacket"],
    traits: ["Brave"],
    relationships: [],
    appearances: [],
  };

  const darius: Character = {
    id: "darius",
    name: "Darius",
    age: 28,
    role: "deuteragonist",
    group: "main",
    traits: ["Steady"],
    relationships: [],
    appearances: [],
  };

  it("renders when open is true and profile can expand", async () => {
    const user = userEvent.setup();

    render(
      <CharacterDetailDialog
        open
        onOpenChange={vi.fn()}
        character={elara}
        availableCharacters={[elara, darius]}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("2002-03-25")).not.toBeInTheDocument();
    expect(screen.getByText("2002-03-25")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expand profile/i }));
    expect(screen.getByDisplayValue("2002-03-25")).toBeInTheDocument();
  });

  it("adds a relationship via Add Relation popover", async () => {
    const user = userEvent.setup();

    render(
      <CharacterDetailDialog
        open
        onOpenChange={vi.fn()}
        character={elara}
        availableCharacters={[elara, darius]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add relation/i }));

    expect(screen.getByText("Add Relationship")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /darius/i }));
    await user.click(screen.getByRole("button", { name: "Friend" }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Darius")).toBeInTheDocument();
  });
});

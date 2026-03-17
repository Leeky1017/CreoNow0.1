import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import type { Character } from "./types";

/**
 * AC-1: Chapter navigation callback tests
 *
 * Tests:
 * - Clicking a chapter link invokes onNavigateToChapter with correct chapterId
 * - Chapter links render for each appearance
 */
describe("CharacterDetailDialog chapter navigation", () => {
  const characterWithAppearances: Character = {
    id: "char-1",
    name: "Lin Xiaofeng",
    age: 30,
    role: "protagonist",
    group: "main",
    traits: ["Brave"],
    relationships: [],
    appearances: [
      { id: "ch-001", title: "Chapter 1: The Beginning" },
      { id: "ch-005", title: "Chapter 5: The Trial" },
    ],
  };

  const characterWithoutAppearances: Character = {
    id: "char-2",
    name: "Mu Qing",
    role: "ally",
    group: "supporting",
    traits: [],
    relationships: [],
    appearances: [],
  };

  it("invokes onNavigateToChapter with chapterId when chapter link clicked", async () => {
    const user = userEvent.setup();
    const navigateSpy = vi.fn();

    render(
      <CharacterDetailDialog
        open
        onOpenChange={vi.fn()}
        character={characterWithAppearances}
        onNavigateToChapter={navigateSpy}
        availableCharacters={[characterWithAppearances]}
      />,
    );

    const chapterButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Chapter 1: The Beginning"));
    expect(chapterButtons.length).toBeGreaterThan(0);

    await user.click(chapterButtons[0]!);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith("ch-001");
  });

  it("renders chapter links for all appearances", () => {
    render(
      <CharacterDetailDialog
        open
        onOpenChange={vi.fn()}
        character={characterWithAppearances}
        availableCharacters={[characterWithAppearances]}
      />,
    );

    expect(screen.getByText("Chapter 1: The Beginning")).toBeInTheDocument();
    expect(screen.getByText("Chapter 5: The Trial")).toBeInTheDocument();
  });

  it("does not throw when onNavigateToChapter is not provided", async () => {
    const user = userEvent.setup();

    render(
      <CharacterDetailDialog
        open
        onOpenChange={vi.fn()}
        character={characterWithAppearances}
        availableCharacters={[characterWithAppearances]}
      />,
    );

    const chapterButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Chapter 5: The Trial"));
    expect(chapterButtons.length).toBeGreaterThan(0);

    // Should not throw
    await user.click(chapterButtons[0]!);
  });

  it("renders a visible warning when navigation degrades", () => {
    render(
      <CharacterDetailDialog
        open
        onOpenChange={vi.fn()}
        character={characterWithAppearances}
        navigationWarning="Chapter navigation is temporarily unavailable."
        availableCharacters={[characterWithAppearances]}
      />,
    );

    expect(
      screen.getByTestId("character-navigation-warning"),
    ).toHaveTextContent("Chapter navigation is temporarily unavailable.");
  });

  it("shows fallback hint when no chapter appearances are available", () => {
    render(
      <CharacterDetailDialog
        open
        onOpenChange={vi.fn()}
        character={characterWithoutAppearances}
        availableCharacters={[characterWithoutAppearances]}
      />,
    );

    expect(
      screen.getByText(
        "If KG recognition is degraded, you can still navigate manually from the file tree.",
      ),
    ).toBeInTheDocument();
  });
});

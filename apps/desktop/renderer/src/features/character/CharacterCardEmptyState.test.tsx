import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CharacterCardList } from "./CharacterCardList";

describe("CharacterCardList.empty-state", () => {
  it("should show empty state and create-character CTA when no character entities", async () => {
    const onCreateCharacter = vi.fn();
    const user = userEvent.setup();

    render(
      <CharacterCardList cards={[]} onCreateCharacter={onCreateCharacter} />,
    );

    expect(
      screen.getByText("No Characters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create your first character"),
    ).toBeInTheDocument();

    const cta = screen.getByRole("button", { name: "Create Character" });
    expect(cta).toBeInTheDocument();

    await user.click(cta);
    expect(onCreateCharacter).toHaveBeenCalledTimes(1);
  });
});

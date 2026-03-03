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
      screen.getByText("暂无角色"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("开始创建你的第一个角色"),
    ).toBeInTheDocument();

    const cta = screen.getByRole("button", { name: "创建角色" });
    expect(cta).toBeInTheDocument();

    await user.click(cta);
    expect(onCreateCharacter).toHaveBeenCalledTimes(1);
  });
});

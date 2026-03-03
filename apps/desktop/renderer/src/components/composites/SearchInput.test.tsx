import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("renders search icon and input", () => {
    render(
      <SearchInput
        value=""
        onChange={() => {}}
        onClear={() => {}}
        placeholder="Search..."
      />,
    );
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("shows clear button only when value is non-empty", () => {
    const { rerender } = render(
      <SearchInput value="" onChange={() => {}} onClear={() => {}} />,
    );
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();

    rerender(
      <SearchInput value="test" onChange={() => {}} onClear={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /clear/i }),
    ).toBeInTheDocument();
  });

  it("calls onClear when clear button clicked", () => {
    const onClear = vi.fn();
    render(
      <SearchInput value="test" onChange={() => {}} onClear={onClear} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

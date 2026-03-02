import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarItem } from "./SidebarItem";

describe("SidebarItem", () => {
  it("renders label and calls onClick", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SidebarItem label="My File" onClick={handleClick} />);

    expect(screen.getByText("My File")).toBeInTheDocument();
    await user.click(screen.getByText("My File"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows active state when active prop is true", () => {
    render(<SidebarItem label="Active Item" active />);

    const item = screen.getByRole("button");
    expect(item).toHaveAttribute("data-active", "true");
  });

  it("renders icon and trailing content", () => {
    render(
      <SidebarItem
        label="With extras"
        icon={<span data-testid="item-icon">📄</span>}
        trailing={<span data-testid="item-trailing">3</span>}
      />,
    );

    expect(screen.getByTestId("item-icon")).toBeInTheDocument();
    expect(screen.getByTestId("item-trailing")).toBeInTheDocument();
  });
});

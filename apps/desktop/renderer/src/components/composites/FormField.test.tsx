import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("renders label and children", () => {
    render(
      <FormField label="Username" htmlFor="username">
        <input id="username" />
      </FormField>,
    );
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders error message when error prop provided", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Invalid email">
        <input id="email" />
      </FormField>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
  });
});

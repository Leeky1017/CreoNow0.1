import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("renders with default value", () => {
    render(<Slider defaultValue={50} min={0} max={100} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders with controlled value", () => {
    render(<Slider value={75} min={0} max={100} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "75");
  });

  it("calls onValueChange when value changes", () => {
    const onValueChange = vi.fn();
    render(
      <Slider
        defaultValue={50}
        min={0}
        max={100}
        onValueChange={onValueChange}
      />,
    );

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "75" } });

    expect(onValueChange).toHaveBeenCalledWith(75);
  });

  it("shows labels when showLabels is true", () => {
    render(
      <Slider
        defaultValue={100}
        min={80}
        max={120}
        showLabels
        formatLabel={(v) => `${v}%`}
      />,
    );

    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("120%")).toBeInTheDocument();
  });

  it("uses default format label (percentage)", () => {
    render(<Slider defaultValue={50} min={0} max={100} showLabels />);

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("respects step value", () => {
    const onValueChange = vi.fn();
    render(
      <Slider
        defaultValue={100}
        min={80}
        max={120}
        step={10}
        onValueChange={onValueChange}
      />,
    );

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("step", "10");
  });

  it("is disabled when disabled prop is true", () => {
    const onValueChange = vi.fn();
    render(<Slider defaultValue={50} disabled onValueChange={onValueChange} />);

    const slider = screen.getByRole("slider");
    expect(slider).toBeDisabled();
  });

  it("updates internal state when uncontrolled", () => {
    render(<Slider defaultValue={50} min={0} max={100} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "75" } });

    expect(slider).toHaveAttribute("aria-valuenow", "75");
  });
});

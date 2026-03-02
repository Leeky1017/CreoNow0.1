import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardSkeleton } from "./DashboardSkeleton";

describe("DashboardSkeleton", () => {
  it("renders skeleton elements for hero and grid areas", () => {
    render(<DashboardSkeleton />);

    const container = screen.getByTestId("dashboard-skeleton");
    expect(container).toBeInTheDocument();

    const skeletons = container.querySelectorAll('[role="progressbar"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

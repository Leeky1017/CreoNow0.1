import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorFeaturedImage } from "../EditorFeaturedImage";

describe("EditorFeaturedImage", () => {
  it("[ED-COVER-01] renders nothing when coverImage is undefined", () => {
    const { container } = render(<EditorFeaturedImage />);
    expect(container.innerHTML).toBe("");
  });

  it("[ED-COVER-02] renders nothing when coverImage is null", () => {
    const { container } = render(<EditorFeaturedImage coverImage={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("[ED-COVER-03] renders featured image area when coverImage is provided", () => {
    render(<EditorFeaturedImage coverImage="https://example.com/cover.jpg" />);
    const wrapper = screen.getByTestId("editor-featured-image");
    expect(wrapper).toBeInTheDocument();
  });

  it("[ED-COVER-04] renders gradient overlay over the image", () => {
    render(<EditorFeaturedImage coverImage="https://example.com/cover.jpg" />);
    const overlay = screen.getByTestId("editor-featured-image-overlay");
    expect(overlay).toBeInTheDocument();
  });

  it("[ED-COVER-05] degrades gracefully when image fails to load", () => {
    render(<EditorFeaturedImage coverImage="https://example.com/broken.jpg" />);
    const wrapper = screen.getByTestId("editor-featured-image");
    const img = wrapper.querySelector("img")!;
    expect(img).toBeTruthy();
    fireEvent.error(img);
    expect(
      screen.queryByTestId("editor-featured-image"),
    ).not.toBeInTheDocument();
  });
});

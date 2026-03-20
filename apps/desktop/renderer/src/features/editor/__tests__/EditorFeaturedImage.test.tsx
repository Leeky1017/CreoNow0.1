import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EditorFeaturedImage } from "../EditorFeaturedImage";

describe("EditorFeaturedImage", () => {
  // ── Primary Proof: conditional rendering ──────────────────────────
  describe("conditional rendering based on coverImage", () => {
    it("renders image when src is provided", () => {
      render(<EditorFeaturedImage src="https://example.com/cover.jpg" />);

      const image = screen.getByRole("img", { name: /featured/i });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/cover.jpg");
    });

    it("does not render when src is null", () => {
      const { container } = render(<EditorFeaturedImage src={null} />);

      expect(
        screen.queryByRole("img", { name: /featured/i }),
      ).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it("does not render when src is undefined", () => {
      const { container } = render(<EditorFeaturedImage src={undefined} />);

      expect(container.firstChild).toBeNull();
    });

    it("does not render when src is empty string", () => {
      const { container } = render(<EditorFeaturedImage src="" />);

      expect(container.firstChild).toBeNull();
    });
  });

  // ── Primary Proof: gradient overlay ────────────────────────────────
  describe("gradient overlay", () => {
    it("renders a gradient overlay element on top of the image", () => {
      render(<EditorFeaturedImage src="https://example.com/cover.jpg" />);

      const overlay = screen.getByTestId("featured-image-overlay");
      expect(overlay).toBeInTheDocument();
    });
  });

  // ── Edge: image load failure ───────────────────────────────────────
  describe("error handling", () => {
    it("hides the featured image area when image fails to load", () => {
      render(<EditorFeaturedImage src="https://example.com/broken.jpg" />);

      const image = screen.getByRole("img", { name: /featured/i });
      fireEvent.error(image);

      expect(
        screen.queryByTestId("featured-image-container"),
      ).not.toBeInTheDocument();
    });
  });

  // ── Edge: alt text accessibility ───────────────────────────────────
  describe("accessibility", () => {
    it("provides meaningful alt text for the featured image", () => {
      render(
        <EditorFeaturedImage
          src="https://example.com/cover.jpg"
          alt="My document cover"
        />,
      );

      const image = screen.getByRole("img", { name: "My document cover" });
      expect(image).toBeInTheDocument();
    });

    it("uses default alt text when none provided", () => {
      render(<EditorFeaturedImage src="https://example.com/cover.jpg" />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt");
      expect(image.getAttribute("alt")).not.toBe("");
    });
  });
});

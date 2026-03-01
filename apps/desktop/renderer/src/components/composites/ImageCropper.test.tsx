import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageCropper } from "./ImageCropper";
import type { CropArea } from "./ImageCropper";

function createMockFile(name = "cover.png"): File {
  return new File(["(fake-image-data)"], name, { type: "image/png" });
}

describe("ImageCropper", () => {
  it("updates crop position on drag", () => {
    const onCropChange = vi.fn<(crop: CropArea) => void>();
    const file = createMockFile();

    render(<ImageCropper file={file} onCropChange={onCropChange} />);

    const container = screen.getByTestId("image-cropper");

    // Simulate drag: pointerdown → pointermove → pointerup
    fireEvent.pointerDown(container, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(container, { clientX: 120, clientY: 130 });
    fireEvent.pointerUp(container);

    expect(onCropChange).toHaveBeenCalled();
    const lastCall = onCropChange.mock.calls.at(-1)!;
    const crop = lastCall[0];

    // Drag moved 20px right and 30px down — x/y should have changed
    expect(crop.x).not.toBe(0);
    expect(crop.y).not.toBe(0);
    expect(crop.zoom).toBe(1);
  });

  it("updates zoom on wheel event", () => {
    const onCropChange = vi.fn<(crop: CropArea) => void>();
    const file = createMockFile();

    render(<ImageCropper file={file} onCropChange={onCropChange} />);

    const container = screen.getByTestId("image-cropper");

    // Scroll down → zoom in
    fireEvent.wheel(container, { deltaY: -100 });

    expect(onCropChange).toHaveBeenCalled();
    const lastCall = onCropChange.mock.calls.at(-1)!;
    const crop = lastCall[0];

    expect(crop.zoom).toBeGreaterThan(1);
  });

  it("clamps zoom within 1x-3x range", () => {
    const onCropChange = vi.fn<(crop: CropArea) => void>();
    const file = createMockFile();

    render(<ImageCropper file={file} onCropChange={onCropChange} />);

    const container = screen.getByTestId("image-cropper");

    // Scroll way up (deltaY very negative) → should not exceed 3
    for (let i = 0; i < 50; i++) {
      fireEvent.wheel(container, { deltaY: -200 });
    }

    const lastZoomIn = onCropChange.mock.calls.at(-1)![0];
    expect(lastZoomIn.zoom).toBeLessThanOrEqual(3);
    expect(lastZoomIn.zoom).toBeGreaterThanOrEqual(1);

    onCropChange.mockClear();

    // Scroll way down (deltaY very positive) → should not go below 1
    for (let i = 0; i < 50; i++) {
      fireEvent.wheel(container, { deltaY: 200 });
    }

    const lastZoomOut = onCropChange.mock.calls.at(-1)![0];
    expect(lastZoomOut.zoom).toBeGreaterThanOrEqual(1);
    expect(lastZoomOut.zoom).toBeLessThanOrEqual(3);
  });
});

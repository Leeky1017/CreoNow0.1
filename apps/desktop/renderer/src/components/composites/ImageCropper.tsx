import React, { useState, useCallback, useRef, useEffect } from "react";

// =============================================================================
// Types
// =============================================================================

export type CropArea = {
  x: number;
  y: number;
  zoom: number;
};

export interface ImageCropperProps {
  /** The image file to crop */
  file: File | null;
  /** Callback when crop parameters change */
  onCropChange: (crop: CropArea) => void;
  /** Aspect ratio for the crop area (width / height) */
  aspectRatio?: number;
}

// =============================================================================
// Constants
// =============================================================================

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

// =============================================================================
// Component
// =============================================================================

/**
 * ImageCropper — a drag-to-pan, scroll-to-zoom image cropper.
 *
 * Outputs `{ x, y, zoom }` crop parameters via `onCropChange`.
 * The container clips overflow; the image is transformed with translate + scale.
 */
export function ImageCropper({
  file,
  onCropChange,
  aspectRatio,
}: ImageCropperProps): JSX.Element | null {
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, zoom: 1 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // ── Preview URL lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // ── Sync crop changes to parent ───────────────────────────────────────────
  useEffect(() => {
    onCropChange(crop);
  }, [crop, onCropChange]);

  // ── Reset crop when file changes ──────────────────────────────────────────
  useEffect(() => {
    setCrop({ x: 0, y: 0, zoom: 1 });
    // Only reset when file identity changes, not on onCropChange reference
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset crop on file identity change, not on onCropChange reference
  }, [file]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      setCrop((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
        zoom: prev.zoom,
      }));
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ── Wheel / zoom handler ──────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      setCrop((prev) => {
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        const rawZoom = prev.zoom + delta;
        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rawZoom));

        return { x: prev.x, y: prev.y, zoom: clampedZoom };
      });
    },
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!file) return null;

  const containerStyle: React.CSSProperties = {
    overflow: "hidden",
    position: "relative",
    width: "100%",
    touchAction: "none",
    ...(aspectRatio ? { aspectRatio: `${aspectRatio}` } : { height: 200 }),
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `translate(${crop.x}px, ${crop.y}px) scale(${crop.zoom})`,
    transformOrigin: "center center",
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <div
      data-testid="image-cropper"
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      className="cursor-grab rounded-[var(--radius-sm)] border border-[var(--color-border-default)] active:cursor-grabbing"
    >
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Crop preview"
          style={imgStyle}
          draggable={false}
        />
      )}
    </div>
  );
}

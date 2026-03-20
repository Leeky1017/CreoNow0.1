import { useState } from "react";
import { useTranslation } from "react-i18next";

interface EditorFeaturedImageProps {
  /** URL of the cover image. When falsy, the component renders nothing. */
  src: string | null | undefined;
  /** Alt text for the image. Falls back to i18n key if not provided. */
  alt?: string;
}

/**
 * Featured image displayed at the top of the editor.
 * Renders a cover image with a gradient overlay that fades into the
 * editor content area. Gracefully degrades: renders nothing when src
 * is absent, and hides itself when the image fails to load.
 */
export function EditorFeaturedImage({ src, alt }: EditorFeaturedImageProps) {
  const { t } = useTranslation();
  const [loadError, setLoadError] = useState(false);

  if (!src || loadError) {
    return null;
  }

  const resolvedAlt = alt || t("editor.featuredImage.alt", "Featured image");

  return (
    <div
      data-testid="featured-image-container"
      className="relative w-full overflow-hidden"
      style={{ height: "var(--space-featured-image-height, 280px)" }}
    >
      <img
        src={src}
        alt={resolvedAlt}
        className="h-full w-full object-cover"
        onError={() => setLoadError(true)}
      />
      <div
        data-testid="featured-image-overlay"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 40%, var(--color-bg-base) 100%)",
        }}
      />
    </div>
  );
}

import React from "react";

interface EditorFeaturedImageProps {
  coverImage?: string | null;
}

export function EditorFeaturedImage({
  coverImage,
}: EditorFeaturedImageProps): JSX.Element | null {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [coverImage]);

  if (!coverImage || hasError) {
    return null;
  }

  return (
    <div
      data-testid="editor-featured-image"
      className="relative mx-auto mb-[var(--space-8)] w-full overflow-hidden rounded-[var(--radius-sm)]"
      style={{
        maxWidth: "var(--editor-content-max-width)",
        height: "var(--editor-featured-image-height)",
      }}
    >
      <div
        data-testid="editor-featured-image-overlay"
        className="absolute inset-0 opacity-80"
        style={{
          zIndex: "var(--z-overlay)" as unknown as number,
          background:
            "linear-gradient(to bottom, transparent, var(--color-bg-base))",
        }}
      />
      <img
        src={coverImage}
        alt=""
        className="h-full w-full object-cover opacity-50 grayscale transition-opacity"
        style={{ transitionDuration: "var(--duration-slower)" }}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

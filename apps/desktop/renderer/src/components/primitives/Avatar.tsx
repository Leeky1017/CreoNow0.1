import React from "react";

/**
 * Avatar sizes
 *
 * | Size | Diameter |
 * |------|----------|
 * | xs   | 24px     |
 * | sm   | 32px     |
 * | md   | 40px     |
 * | lg   | 56px     |
 * | xl   | 80px     |
 */
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string;
  /** Alt text for image (required for accessibility when src is provided) */
  alt?: string;
  /** Fallback text (usually initials) when no image */
  fallback?: string;
  /** Size of the avatar */
  size?: AvatarSize;
}

/**
 * Size-specific styles
 */
const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: "w-6 h-6", text: "text-(--text-label)" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-lg" },
  xl: { container: "w-20 h-20", text: "text-2xl" },
};

/**
 * Base styles for avatar container
 */
const baseStyles = [
  "inline-flex",
  "items-center",
  "justify-center",
  "rounded-[var(--radius-full)]",
  "overflow-hidden",
  "bg-[var(--color-bg-hover)]",
  "text-[var(--color-fg-muted)]",
  "font-medium",
  "select-none",
  "flex-shrink-0",
].join(" ");

/**
 * Get initials from a name string
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Avatar component for displaying user profile images or initials
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" size="md" />
 * <Avatar fallback="John Doe" size="lg" />
 * <Avatar fallback="JD" size="sm" />
 * ```
 */
export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className = "",
  ...props
}: AvatarProps): JSX.Element {
  const [imageError, setImageError] = React.useState(false);

  const showImage = src && !imageError;
  const displayFallback = fallback ? getInitials(fallback) : "?";

  const containerClasses = [baseStyles, sizeStyles[size].container, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={containerClasses}
      role="img"
      aria-label={alt || fallback || "Avatar"}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || ""}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={sizeStyles[size].text}>{displayFallback}</span>
      )}
    </div>
  );
}

/**
 * Settings dialog — shared CSS style class constants.
 */

/**
 * Overlay styles.
 */
export const overlayStyles = [
  "fixed",
  "inset-0",
  "z-[var(--z-modal)]",
  "bg-[var(--color-scrim)]",
  "backdrop-blur-sm",
  "transition-opacity",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=closed]:opacity-0",
].join(" ");

/**
 * Content styles.
 */
export const contentStyles = [
  "fixed",
  "left-1/2",
  "top-1/2",
  "-translate-x-1/2",
  "-translate-y-1/2",
  "z-[var(--z-modal)]",
  "w-[calc(100vw-2rem)]",
  "max-w-5xl",
  "h-[85vh]",
  "max-h-[52rem]",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-lg)]",
  "shadow-[var(--shadow-xl)]",
  "flex",
  "overflow-hidden",
  // Animation
  "transition-[opacity,transform]",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95",
  "focus:outline-none",
].join(" ");

/**
 * Close button styles.
 */
export const closeButtonStyles = [
  "absolute",
  "top-4",
  "right-4",
  "p-2",
  "text-[var(--color-fg-placeholder)]",
  "hover:text-[var(--color-fg-default)]",
  "transition-colors",
  "z-[var(--z-overlay)]",
  "hover:bg-[var(--color-bg-hover)]",
  "rounded-full",
].join(" ");

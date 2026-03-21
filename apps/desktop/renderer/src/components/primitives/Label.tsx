import React from "react";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const baseStyles = [
  "text-[var(--color-fg-default)]",
  "text-[var(--text-body-size)]",
  "select-none",
].join(" ");

/**
 * Label primitive — semantic <label> wrapper.
 *
 * Preserves `htmlFor` and all native label attributes.
 *
 * @example
 * ```tsx
 * <Label htmlFor="name">Name</Label>
 * ```
 */
export function Label({
  className = "",
  ...props
}: LabelProps): JSX.Element {
  const classes = [baseStyles, className].filter(Boolean).join(" ");
  // eslint-disable-next-line creonow/no-native-html-element -- Primitive: Label wraps native <label>
  return <label className={classes} {...props} />;
}

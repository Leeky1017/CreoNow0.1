import React from "react";

// =============================================================================
// Types
// =============================================================================

export interface FormFieldProps {
  /** Label text for the field */
  label: string;
  /** HTML `for` attribute linking the label to a child input */
  htmlFor: string;
  /** Optional help text displayed below the input */
  help?: string;
  /** Optional error message (overrides help text, renders with role="alert") */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** The form control (input, select, textarea, etc.) */
  children: React.ReactNode;
  /** Additional CSS class for the outer container */
  className?: string;
}

// =============================================================================
// Styles
// =============================================================================

const containerStyles = [
  "flex",
  "flex-col",
  "gap-2",
].join(" ");

const labelStyles = [
  "text-[13px]",
  "text-[color:var(--color-fg-muted)]",
].join(" ");

const labelErrorStyles = [
  "text-[13px]",
  "text-[color:var(--color-error)]",
].join(" ");

const helpStyles = [
  "text-xs",
  "text-[color:var(--color-fg-placeholder)]",
].join(" ");

const errorStyles = [
  "text-xs",
  "text-[color:var(--color-error)]",
].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * FormField — a reusable form field composite.
 *
 * Provides a consistent form field layout with:
 * - Label (linked to child input via htmlFor)
 * - Children slot (for the actual form control)
 * - Help text (optional, muted)
 * - Error message (optional, replaces help text, rendered with role="alert")
 *
 * Used by SettingsGeneral, ExportDialog, CreateProjectDialog, and CharacterDetailDialog.
 *
 * @example
 * ```tsx
 * <FormField label="Username" htmlFor="username" required>
 *   <input id="username" type="text" />
 * </FormField>
 *
 * <FormField label="Email" htmlFor="email" error="Invalid email">
 *   <input id="email" type="email" />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  help,
  error,
  required = false,
  children,
  className = "",
}: FormFieldProps): JSX.Element {
  return (
    <div className={`${containerStyles} ${className}`}>
      <label
        htmlFor={htmlFor}
        className={error ? labelErrorStyles : labelStyles}
      >
        {label}
        {required && (
          <span className="text-[color:var(--color-error)] ml-0.5">*</span>
        )}
      </label>
      {children}
      {error ? (
        <div role="alert" className={errorStyles}>
          {error}
        </div>
      ) : help ? (
        <div className={helpStyles}>{help}</div>
      ) : null}
    </div>
  );
}

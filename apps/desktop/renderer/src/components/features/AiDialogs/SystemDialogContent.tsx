import type { TFunction } from "i18next";
import type { SystemDialogType } from "./types";

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
  </svg>
);
const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
  </svg>
);
export const Spinner = ({ className = "" }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export function getDefaultContent(t: TFunction): Record<
  SystemDialogType,
  {
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
    tertiaryLabel?: string;
  }
> {
  return {
    delete: {
      title: t("systemDialog.delete.title"),
      description: t("systemDialog.delete.description"),
      primaryLabel: t("systemDialog.delete.primaryLabel"),
      secondaryLabel: t("systemDialog.delete.secondaryLabel"),
    },
    unsaved_changes: {
      title: t("systemDialog.unsavedChanges.title"),
      description: t("systemDialog.unsavedChanges.description"),
      primaryLabel: t("systemDialog.unsavedChanges.primaryLabel"),
      secondaryLabel: t("systemDialog.unsavedChanges.secondaryLabel"),
      tertiaryLabel: t("systemDialog.unsavedChanges.tertiaryLabel"),
    },
    export_complete: {
      title: t("systemDialog.exportComplete.title"),
      description: t("systemDialog.exportComplete.description"),
      primaryLabel: t("systemDialog.exportComplete.primaryLabel"),
      secondaryLabel: t("systemDialog.exportComplete.secondaryLabel"),
    },
  };
}

export function getIconByType(type: SystemDialogType): JSX.Element {
  switch (type) {
    case "delete":
      return <TrashIcon />;
    case "unsaved_changes":
      return <WarningIcon />;
    case "export_complete":
      return <CheckCircleIcon />;
    default:
      return <WarningIcon />;
  }
}

export function getIconColorsByType(type: SystemDialogType): {
  bg: string;
  text: string;
  border: string;
} {
  switch (type) {
    case "delete":
      return {
        bg: "bg-[var(--color-error-subtle)]",
        text: "text-[var(--color-error)]",
        border: "border-[var(--color-error)]/20",
      };
    case "unsaved_changes":
      return {
        bg: "bg-[var(--color-warning-subtle)]",
        text: "text-[var(--color-warning)]",
        border: "border-[var(--color-warning)]/20",
      };
    case "export_complete":
      return {
        bg: "bg-[var(--color-success-subtle)]",
        text: "text-[var(--color-success)]",
        border: "border-[var(--color-success)]/20",
      };
    default:
      return {
        bg: "bg-[var(--color-warning-subtle)]",
        text: "text-[var(--color-warning)]",
        border: "border-[var(--color-warning)]/20",
      };
  }
}

export const iconContainerStyles = [
  "w-12 h-12 rounded-full flex",
  "items-center justify-center mb-4 border",
].join(" ");
export const titleStyles = [
  "text-lg font-semibold text-[var(--color-fg-default)] mb-2",
].join(" ");
export const descriptionStyles = [
  "text-sm text-[var(--color-fg-muted)] mb-6 leading-relaxed",
].join(" ");
export const keyboardHintStyles = [
  "text-[10px] text-[var(--color-fg-muted)] mt-3 flex",
  "items-center gap-3",
].join(" ");
export const kbdStyles = [
  "px-1.5 py-0.5 rounded bg-[var(--color-bg-hover)]",
  "border border-[var(--color-separator)] text-[9px] font-mono",
  "text-[var(--color-fg-muted)]",
].join(" ");
export const buttonContainerStyles = [
  "flex",
  "items-center",
  "gap-3",
  "w-full",
].join(" ");
export const buttonBaseStyles = [
  "h-9 rounded-[var(--radius-lg)] text-sm font-medium",
  "transition-colors duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)] disabled:opacity-50 disabled:cursor-not-allowed",
  "flex items-center justify-center gap-2",
].join(" ");
export const cancelButtonStyles = [
  buttonBaseStyles,
  "flex-1 border border-[var(--color-separator)] bg-transparent",
  "hover:bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]",
].join(" ");
export const deleteButtonStyles = [
  buttonBaseStyles,
  "flex-1 bg-[var(--color-btn-danger-bg)] hover:bg-[var(--color-btn-danger-hover)] text-[var(--color-fg-on-accent)]",
  "shadow-[var(--shadow-lg)]",
].join(" ");
export const discardButtonStyles = [
  buttonBaseStyles,
  "px-4 border border-[var(--color-error)]/20 hover:bg-[var(--color-error-subtle)]",
  "text-[var(--color-error)]",
].join(" ");
export const saveButtonStyles = [
  buttonBaseStyles,
  "px-4 bg-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] text-[var(--color-fg-inverse)]",
].join(" ");
export const doneButtonStyles = [
  buttonBaseStyles,
  "flex-1 border border-[var(--color-separator)] bg-transparent",
  "hover:bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]",
].join(" ");
export const openFileButtonStyles = [
  buttonBaseStyles,
  "flex-1 bg-[var(--color-btn-success-bg)] hover:bg-[var(--color-btn-success-hover)] text-[var(--color-fg-on-accent)]",
  "shadow-[var(--shadow-lg)]",
].join(" ");

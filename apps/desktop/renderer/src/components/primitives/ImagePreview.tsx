/**
 * ImagePreview — preview overlay + remove button.
 *
 * Extracted from ImageUpload.tsx to satisfy AC-20 (≤200 lines per file).
 */
import { useTranslation } from "react-i18next";

export interface ImagePreviewProps {
  /** URL to display */
  previewUrl: string;
}

/**
 * Preview image with hover-to-remove overlay.
 */
export function ImagePreview({ previewUrl }: ImagePreviewProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 w-full h-full rounded-[var(--radius-sm)] overflow-hidden">
      <img
        src={previewUrl}
        alt={t("primitives.imageUpload.previewAlt")}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity"
      />
    </div>
  );
}

export interface ImageUploadPlaceholderProps {
  placeholder: string;
  hint: string;
}

/** Empty-state placeholder with upload icon + text. */
export function ImageUploadPlaceholder({
  placeholder,
  hint,
}: ImageUploadPlaceholderProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] transition-colors p-6">
      <div className="w-10 h-10 rounded-[var(--radius-full)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex items-center justify-center group-hover:border-[var(--color-border-hover)] transition-colors">
        <UploadIcon />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium">{placeholder}</p>
        <p className="text-(--text-label) text-[var(--color-fg-subtle)] mt-1">
          {hint}
        </p>
      </div>
    </div>
  );
}

/** Upload icon for the empty state */
export function UploadIcon(): JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

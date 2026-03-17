import React, { useCallback, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface ImageUploadProps {
  /** Current value (File object or URL string) */
  value?: File | string | null;
  /** Callback when file changes */
  onChange?: (file: File | null) => void;
  /** Accepted file types (default: "image/*") */
  accept?: string;
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
  /** Error callback for validation failures */
  onError?: (error: string) => void;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Hint text (e.g., "PNG, JPG up to 5MB") */
  hint?: string;
}

/**
 * Default max file size: 5MB
 */
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

/**
 * ImageUpload component
 *
 * A drop zone for uploading images with preview and remove functionality.
 * Follows design spec for dashed border, drag states, and preview overlay.
 *
 * @example
 * ```tsx
 * const [cover, setCover] = useState<File | null>(null);
 *
 * <ImageUpload
 *   value={cover}
 *   onChange={setCover}
 *   placeholder="Click or drag image to upload"
 *   hint="PNG, JPG up to 5MB"
 * />
 * ```
 */
export function ImageUpload({
  value,
  onChange,
  accept = "image/*",
  maxSize = DEFAULT_MAX_SIZE,
  onError,
  disabled = false,
  className = "",
  placeholder,
  hint,
}: ImageUploadProps): JSX.Element {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("primitives.imageUpload.placeholder");
  const resolvedHint = hint ?? t("primitives.imageUpload.hint");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the last created object URL for cleanup
  const lastObjectUrlRef = useRef<string | null>(null);

  // Derive preview URL from value - using a layout effect to avoid flicker
  React.useLayoutEffect(() => {
    // Cleanup previous object URL
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }

    if (!value) {
      setPreviewUrl(null);
      return;
    }

    if (typeof value === "string") {
      setPreviewUrl(value);
      return;
    }

    // Create object URL for File
    const url = URL.createObjectURL(value);
    lastObjectUrlRef.current = url;
    setPreviewUrl(url);

    return () => {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, [value]);

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file type
      if (!file.type.startsWith("image/")) {
        onError?.(t("primitives.imageUpload.errorNotImage"));
        return false;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        onError?.(t("primitives.imageUpload.errorTooLarge", { maxMB }));
        return false;
      }

      return true;
    },
    [maxSize, onError, t],
  );

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        onChange?.(null);
        return;
      }

      if (validateFile(file)) {
        onChange?.(file);
      }
    },
    [onChange, validateFile],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile],
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFile],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFile(null);
    },
    [handleFile],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  const baseStyles = [
    "relative",
    "group",
    "cursor-pointer",
    "border-2",
    "border-dashed",
    "rounded-[var(--radius-sm)]",
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- Primitive: minimum upload area for usability
    "min-h-[140px]",
    "flex",
    "flex-col",
    "items-center",
    "justify-center",
    "transition-all",
    "duration-[var(--duration-fast)]",
    // Focus visible
    "focus-visible:outline",
    "focus-visible:outline-[length:var(--ring-focus-width)]",
    "focus-visible:outline-offset-[var(--ring-focus-offset)]",
    "focus-visible:outline-[var(--color-ring-focus)]",
  ];

  const stateStyles = disabled
    ? [
        "border-[var(--color-border-default)]",
        "bg-[var(--color-bg-disabled)]",
        "cursor-not-allowed",
        "opacity-50",
      ]
    : isDragging
      ? [
          "border-[var(--color-accent)]",
          "bg-[var(--color-accent-subtle)]",
        ]
      : [
          "border-[var(--color-border-default)]",
          "hover:border-[var(--color-border-hover)]",
          "hover:bg-[var(--color-bg-hover)]",
        ];

  const containerStyles = [...baseStyles, ...stateStyles, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={containerStyles}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      data-testid="image-upload"
    >
      {/* Hidden file input */}
      {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: hidden file <input> for native file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        data-testid="image-upload-input"
      />

      {/* Preview or Placeholder */}
      {previewUrl ? (
        <div className="absolute inset-0 w-full h-full rounded-[var(--radius-sm)] overflow-hidden">
          <img
            src={previewUrl}
            alt={t("primitives.imageUpload.previewAlt")}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity"
          />
          {/* Remove button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: ImageUpload remove button is internal */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="bg-[var(--color-error)]/20 hover:bg-[var(--color-error)]/40 text-[var(--color-error)] px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-error)]/30 transition-colors backdrop-blur-sm"
              data-testid="image-upload-remove"
            >
              {t("primitives.imageUpload.remove")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] transition-colors p-6">
          {/* Icon */}
          <div className="w-10 h-10 rounded-[var(--radius-full)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex items-center justify-center group-hover:border-[var(--color-border-hover)] transition-colors">
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
          </div>
          {/* Text */}
          <div className="text-center">
            <p className="text-xs font-medium">{resolvedPlaceholder}</p>
            <p className="text-[10px] text-[var(--color-fg-subtle)] mt-1">
              {resolvedHint}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

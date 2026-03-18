/**
 * ImageUpload — drag/drop zone + file validation.
 *
 * Preview rendering extracted to ImagePreview.tsx (AC-20).
 */
import React, { useCallback, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImagePreview, UploadIcon } from "./ImagePreview";

export interface ImageUploadProps {
  value?: File | string | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  hint?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

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
  const resolvedPlaceholder =
    placeholder ?? t("primitives.imageUpload.placeholder");
  const resolvedHint = hint ?? t("primitives.imageUpload.hint");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastObjectUrlRef = useRef<string | null>(null);

  React.useLayoutEffect(() => {
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
      if (!file.type.startsWith("image/")) {
        onError?.(t("primitives.imageUpload.errorNotImage"));
        return false;
      }
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
      if (!disabled) setIsDragging(true);
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
      if (!disabled) setIsDragging(true);
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
      if (files?.[0]) handleFile(files[0]);
    },
    [disabled, handleFile],
  );

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) handleFile(files[0]);
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
    "relative group cursor-pointer border-2 border-dashed rounded-[var(--radius-sm)]",
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- Primitive: minimum upload area for usability
    "min-h-[140px] flex flex-col items-center justify-center",
    "transition-all duration-[var(--duration-fast)]",
    "focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
    "focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
  ];

  const stateStyles = disabled
    ? [
        "border-[var(--color-border-default)] bg-[var(--color-bg-disabled)] cursor-not-allowed opacity-50",
      ]
    : isDragging
      ? ["border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"]
      : [
          "border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]",
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
      {previewUrl ? (
        <ImagePreview
          previewUrl={previewUrl}
          disabled={disabled}
          onRemove={handleRemove}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] transition-colors p-6">
          <div className="w-10 h-10 rounded-[var(--radius-full)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex items-center justify-center group-hover:border-[var(--color-border-hover)] transition-colors">
            <UploadIcon />
          </div>
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

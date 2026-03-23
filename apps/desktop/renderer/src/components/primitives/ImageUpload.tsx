/** ImageUpload — drag/drop zone + file validation. Preview + placeholder in ImagePreview.tsx. */
import React, { useCallback, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImagePreview, ImageUploadPlaceholder } from "./ImagePreview";

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
      if (!file) return onChange?.(null);
      if (validateFile(file)) onChange?.(file);
    },
    [onChange, validateFile],
  );

  const handleDragActivate = useCallback(
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

  const wrapperStyles = ["group", "relative"].join(" ");

  const triggerStyles = [
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- Primitive: minimum upload area for usability
    "relative w-full cursor-pointer border-2 border-dashed rounded-[var(--radius-sm)] min-h-[140px] flex flex-col items-center justify-center",
    "transition-all duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]",
    disabled
      ? "border-[var(--color-border-default)] bg-[var(--color-bg-disabled)] cursor-not-allowed opacity-50"
      : isDragging
        ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
        : "border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: hidden file <input> for native file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        data-testid="image-upload-input"
      />
      <div className={wrapperStyles}>
        {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: upload surface is a native button while remove remains a separate sibling button */}
        <button
          type="button"
          className={triggerStyles}
          onDragEnter={handleDragActivate}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragActivate}
          onDrop={handleDrop}
          onClick={handleClick}
          aria-disabled={disabled}
          disabled={disabled}
          data-testid="image-upload"
        >
          {previewUrl ? (
            <ImagePreview previewUrl={previewUrl} />
          ) : (
            <ImageUploadPlaceholder
              placeholder={resolvedPlaceholder}
              hint={resolvedHint}
            />
          )}
        </button>
        {previewUrl ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {/* eslint-disable-next-line creonow/no-native-html-element -- Primitive: remove affordance must remain a separate native button outside the upload trigger */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="pointer-events-auto bg-[var(--color-error)]/20 hover:bg-[var(--color-error)]/40 text-[var(--color-error)] px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-error)]/30 transition-colors backdrop-blur-sm"
              data-testid="image-upload-remove"
            >
              {t("primitives.imageUpload.remove")}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

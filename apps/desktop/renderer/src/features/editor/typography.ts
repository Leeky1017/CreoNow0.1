const CJK_LOCALE_PATTERN = /^(zh|ja|ko)(-|_|$)/i;

/**
 * Resolve editor line-height token based on locale.
 */
export function resolveEditorLineHeightToken(
  locale: string | null | undefined,
): string {
  if (locale && CJK_LOCALE_PATTERN.test(locale)) {
    return "var(--text-editor-line-height-cjk)";
  }
  return "var(--text-editor-line-height)";
}

/**
 * Resolve tokenized scale factor for system font scaling tiers.
 */
export function resolveEditorScaleFactor(
  scalePercent: number | null | undefined,
): string {
  if (scalePercent && scalePercent >= 150) {
    return "var(--text-scale-factor-150)";
  }
  if (scalePercent && scalePercent >= 125) {
    return "var(--text-scale-factor-125)";
  }
  return "var(--text-scale-factor-default)";
}

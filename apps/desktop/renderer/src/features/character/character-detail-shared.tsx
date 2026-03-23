import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives";
import { X } from "lucide-react";
import type { ZodiacSign } from "./types";

/**
 * Get overlay styles based on whether a container is provided.
 * When container is provided, use absolute positioning for Storybook compatibility.
 */
export function getOverlayStyles(hasContainer: boolean): string {
  return [
    hasContainer ? "absolute" : "fixed",
    "inset-0",
    "z-[var(--z-modal)]",
    "bg-[var(--color-scrim)]",
    "backdrop-blur-[4px]",
    "transition-opacity",
    "duration-[var(--duration-slow)]",
    "ease-[var(--ease-default)]",
    "data-[state=open]:opacity-100",
    "data-[state=closed]:opacity-0",
  ].join(" ");
}

/**
 * Get content styles based on whether a container is provided.
 * When container is provided, use absolute positioning for Storybook compatibility.
 */
export function getContentStyles(hasContainer: boolean): string {
  return [
    hasContainer ? "absolute" : "fixed",
    "left-1/2",
    hasContainer ? "top-14" : "top-1/2",
    "-translate-x-1/2",
    hasContainer ? "translate-y-0" : "-translate-y-1/2",
    "z-[var(--z-modal)]",
    // 审计：v1-13 #001 KEEP
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- 技术原因：dialog content width per design spec (w-[560px])
    "w-[560px]",
    // 审计：v1-18b #1240 KEEP — max-h-[92vh] 无标准 token，对话框最大高度为视口相对值
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- no standard token for viewport-relative max-height
    hasContainer ? "max-h-[calc(100%-3.5rem)]" : "max-h-[92vh]",
    "bg-[var(--color-bg-surface)]",
    "border",
    "border-[var(--color-border-default)]",
    "rounded-[var(--radius-xl)]",
    "shadow-[var(--shadow-xl)]",
    "flex",
    "flex-col",
    "overflow-hidden",
    "transition-[opacity,transform]",
    "duration-[var(--duration-slow)]",
    "ease-[cubic-bezier(0.16,1,0.3,1)]",
    "data-[state=open]:opacity-100",
    "data-[state=open]:scale-100",
    "data-[state=closed]:opacity-0",
    "data-[state=closed]:scale-[0.98]",
    "focus:outline-none",
  ].join(" ");
}

/** Zodiac date-range table (month×100+day bounds). */
const ZODIAC_DATE_RANGES: ReadonlyArray<{
  min: number;
  max: number;
  sign: ZodiacSign;
}> = [
  { min: 321, max: 419, sign: "aries" },
  { min: 420, max: 520, sign: "taurus" },
  { min: 521, max: 620, sign: "gemini" },
  { min: 621, max: 722, sign: "cancer" },
  { min: 723, max: 822, sign: "leo" },
  { min: 823, max: 922, sign: "virgo" },
  { min: 923, max: 1022, sign: "libra" },
  { min: 1023, max: 1121, sign: "scorpio" },
  { min: 1122, max: 1221, sign: "sagittarius" },
  { min: 120, max: 218, sign: "aquarius" },
  { min: 219, max: 320, sign: "pisces" },
];

/** Compute zodiac sign from ISO birth date (YYYY-MM-DD). */
export function getZodiacFromBirthDate(
  birthDate: string,
): ZodiacSign | undefined {
  const parts = birthDate.split("-");
  if (parts.length !== 3) return undefined;
  const month = Number.parseInt(parts[1] ?? "", 10);
  const day = Number.parseInt(parts[2] ?? "", 10);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return undefined;
  const md = month * 100 + day;
  if (md >= 1222 || md <= 119) return "capricorn";
  return ZODIAC_DATE_RANGES.find((r) => md >= r.min && md <= r.max)?.sign;
}

export const labelStyles = [
  "text-(--text-label)",
  "uppercase",
  "tracking-[0.1em]",
  "text-[var(--color-fg-placeholder)]",
  "font-semibold",
  "pl-0.5",
].join(" ");

export const sectionHeaderStyles = [
  "flex",
  "items-center",
  "justify-between",
  "border-b",
  "border-[var(--color-border-default)]",
  "pb-2",
].join(" ");

/** ProfileTableRow — single row in the structured character settings table. */
export function ProfileTableRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr]">
      <div className="px-4 py-3 bg-[var(--color-bg-base)] border-r border-[var(--color-border-default)] text-(--text-label) uppercase tracking-[0.1em] text-[var(--color-fg-placeholder)] font-semibold">
        {label}
      </div>
      <div className="px-4 py-3 min-w-0">{children}</div>
    </div>
  );
}

/** ProfileSummaryItem — compact key/value pill for collapsed profile view. */
export function ProfileSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 py-1 text-(--text-status)">
      <span className="text-[var(--color-fg-placeholder)]">{label}</span>
      <span className="text-[var(--color-fg-default)]">{value}</span>
    </div>
  );
}

/** Personality/feature trait tag with optional remove button. */
export function TraitTag({
  trait,
  onRemove,
}: {
  trait: string;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={[
        "px-2.5 py-1 rounded",
        "bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]",
        "text-xs text-[var(--color-fg-muted)]",
        "flex items-center gap-2",
        "hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]",
        "transition-colors cursor-default select-none group",
      ].join(" ")}
    >
      {trait}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className={[
            "!p-0 !h-auto !w-auto !min-h-0 !rounded-none",
            "opacity-0 group-hover:opacity-100",
            "text-[var(--color-fg-placeholder)] hover:text-[var(--color-error)]",
            "transition-[opacity,transform] scale-75 group-hover:scale-100",
          ].join(" ")}
          aria-label={t("character.detail.removeTrait", { trait })}
        >
          <X size={20} strokeWidth={1.5} />
        </Button>
      )}
    </div>
  );
}

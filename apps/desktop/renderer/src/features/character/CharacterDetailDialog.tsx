import React from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Avatar,
  Button,
  Input,
  Textarea,
  Select,
} from "../../components/primitives";
import { AddRelationshipPopover } from "./AddRelationshipPopover";
import { GroupSelector } from "./GroupSelector";
import { RoleSelector } from "./RoleSelector";
import type {
  Character,
  CharacterRelationship,
  ChapterAppearance,
  ZodiacSign,
} from "./types";
import {
  ARCHETYPE_OPTIONS,
  ROLE_DISPLAY,
  RELATIONSHIP_TYPE_DISPLAY,
  ZODIAC_OPTIONS,
} from "./types";

import {
  ArrowRight,
  Camera,
  ChevronDown,
  FileText,
  Trash2,
  X,
} from "lucide-react";

/* eslint-disable creonow/no-native-html-element -- CharacterDetailDialog uses form fields (inputs, labels) and specialized buttons throughout that don't map to design system primitives */

export interface CharacterDetailDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Character to display/edit */
  character: Character | null;
  /** Callback when character is saved */
  onSave?: (character: Character) => void;
  /** Callback when character is deleted */
  onDelete?: (characterId: string) => void;
  /** Callback when navigating to a chapter */
  onNavigateToChapter?: (chapterId: string) => void;
  /** User-visible warning shown when chapter navigation degrades or fails */
  navigationWarning?: string | null;
  /** Available characters for adding relationships */
  availableCharacters?: Character[];
  /**
   * Container element for Portal rendering.
   * Use in Storybook to constrain Dialog rendering within the story container.
   * If not provided, Dialog renders to document.body.
   */
  container?: HTMLElement | null;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Get overlay styles based on whether a container is provided
 * When container is provided, use absolute positioning for Storybook compatibility
 */
function getOverlayStyles(hasContainer: boolean): string {
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
 * Get content styles based on whether a container is provided
 * When container is provided, use absolute positioning for Storybook compatibility
 */
function getContentStyles(hasContainer: boolean): string {
  return [
    hasContainer ? "absolute" : "fixed",
    "left-1/2",
    hasContainer ? "top-14" : "top-1/2",
    "-translate-x-1/2",
    hasContainer ? "translate-y-0" : "-translate-y-1/2",
    "z-[var(--z-modal)]",
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- dialog content width per design spec
    "w-[560px]",
    hasContainer ? "max-h-[calc(100%-3.5rem)]" : "max-h-[92vh]",
    "bg-[var(--color-bg-surface)]",
    "border",
    "border-[var(--color-border-default)]",
    "rounded-[var(--radius-xl)]",
    "shadow-[var(--shadow-xl)]",
    "flex",
    "flex-col",
    "overflow-hidden",
    // Animation
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

/**
 * Zodiac date-range table (month×100+day bounds).
 * Capricorn handled separately since it spans the year boundary.
 */
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

/**
 * Compute zodiac sign from ISO birth date (YYYY-MM-DD).
 *
 * Returns undefined when birthDate is missing or invalid.
 */
function getZodiacFromBirthDate(birthDate: string): ZodiacSign | undefined {
  const parts = birthDate.split("-");
  if (parts.length !== 3) return undefined;

  const month = Number.parseInt(parts[1] ?? "", 10);
  const day = Number.parseInt(parts[2] ?? "", 10);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return undefined;

  const md = month * 100 + day;

  // Capricorn spans the year boundary (Dec 22 – Jan 19)
  if (md >= 1222 || md <= 119) return "capricorn";

  return ZODIAC_DATE_RANGES.find((r) => md >= r.min && md <= r.max)?.sign;
}

const labelStyles = [
  "text-[10px]",
  "uppercase",
  "tracking-[0.1em]",
  "text-[var(--color-fg-placeholder)]",
  "font-semibold",
  "pl-0.5",
].join(" ");

const sectionHeaderStyles = [
  "flex",
  "items-center",
  "justify-between",
  "border-b",
  "border-[var(--color-border-default)]",
  "pb-2",
].join(" ");

// ============================================================================
// Sub-components
// ============================================================================

/**
 * ProfileTableRow - A single row in the structured character settings table.
 */
function ProfileTableRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr]">
      <div className="px-4 py-3 bg-[var(--color-bg-base)] border-r border-[var(--color-border-default)] text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-placeholder)] font-semibold">
        {label}
      </div>
      <div className="px-4 py-3 min-w-0">{children}</div>
    </div>
  );
}

/**
 * ProfileSummaryItem - Compact key/value pill for collapsed profile view.
 *
 * Keeps the dialog scannable while still showing essential info.
 */
function ProfileSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 py-1 text-[11px]">
      <span className="text-[var(--color-fg-placeholder)]">{label}</span>
      <span className="text-[var(--color-fg-default)]">{value}</span>
    </div>
  );
}

/**
 * ChevronDownIcon - Small chevron used in expand/collapse toggles.
 */
function ChevronDownIcon({ className }: { className?: string }): JSX.Element {
  return (
    <ChevronDown
      className={className}
      size={16}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

/**
 * Camera icon for avatar upload
 */
function CameraIcon() {
  return (
    <Camera
      className="text-[var(--color-fg-on-accent)] w-5 h-5 drop-shadow-md"
      size={20}
      strokeWidth={1.5}
    />
  );
}

/**
 * Close icon
 */
function CloseIcon() {
  return <X size={20} strokeWidth={1.5} />;
}

/**
 * Document icon
 */
function DocumentIcon() {
  return <FileText size={16} strokeWidth={1.5} />;
}

/**
 * Arrow right icon
 */
function ArrowRightIcon() {
  return <ArrowRight size={16} strokeWidth={1.5} />;
}

/**
 * Trash icon
 */
function TrashIcon() {
  return <Trash2 size={16} strokeWidth={1.5} />;
}

/**
 * Personality trait tag component
 */
function TraitTag({
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
        "px-2.5",
        "py-1",
        "rounded",
        "bg-[var(--color-bg-raised)]",
        "border",
        "border-[var(--color-border-default)]",
        "text-xs",
        "text-[var(--color-fg-muted)]",
        "flex",
        "items-center",
        "gap-2",
        "hover:border-[var(--color-border-hover)]",
        "hover:bg-[var(--color-bg-hover)]",
        "transition-colors",
        "cursor-default",
        "select-none",
        "group",
      ].join(" ")}
    >
      {trait}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={[
            "focus-ring",
            "opacity-0",
            "group-hover:opacity-100",
            "text-[var(--color-fg-placeholder)]",
            "hover:text-[var(--color-error)]",
            "transition-[opacity,transform]",
            "scale-75",
            "group-hover:scale-100",
          ].join(" ")}
          aria-label={t("character.detail.removeTrait", { trait })}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

/**
 * Relationship item component
 */
function RelationshipItem({
  relationship,
  onRemove,
}: {
  relationship: CharacterRelationship;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const typeConfig = RELATIONSHIP_TYPE_DISPLAY[relationship.type];

  return (
    <div className="flex items-center justify-between p-3 hover:bg-[var(--color-bg-surface)] transition-colors group">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar
            src={relationship.characterAvatar}
            fallback={relationship.characterName}
            size="sm"
            className="grayscale opacity-60 border border-[var(--color-border-default)]"
          />
          <div className="absolute -bottom-1 -right-1 bg-[var(--color-bg-hover)] rounded-full p-[2px] border border-[var(--color-border-default)]">
            <div className={`w-2 h-2 rounded-full ${typeConfig.color}`} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[var(--color-fg-muted)]">
            {relationship.characterName}
          </span>
          <span className="text-[10px] text-[var(--color-fg-placeholder)]">
            {relationship.characterRole
              ? ROLE_DISPLAY[relationship.characterRole]?.label
              : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-medium text-[var(--color-fg-muted)] bg-[var(--color-bg-hover)] px-2 py-1 rounded border border-[var(--color-border-default)]">
          {typeConfig.label}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="focus-ring opacity-0 group-hover:opacity-100 text-[var(--color-fg-placeholder)] hover:text-[var(--color-error)] transition-[opacity,color]"
            aria-label={t("character.detail.removeRelationship", {
              name: relationship.characterName,
            })}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Chapter appearance link component
 */
function ChapterLink({
  appearance,
  onNavigate,
}: {
  appearance: ChapterAppearance;
  onNavigate?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={[
        "focus-ring",
        "group",
        "flex",
        "items-center",
        "justify-between",
        "p-2.5",
        "w-full",
        "text-left",
        "hover:bg-[var(--color-bg-raised)]",
        "rounded",
        "border",
        "border-transparent",
        "hover:border-[var(--color-border-default)]",
        "transition-colors",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-info)] transition-colors">
          <DocumentIcon />
        </span>
        <span className="text-xs text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] transition-colors">
          {appearance.title}
        </span>
      </div>
      <span className="text-[var(--color-border-default)] group-hover:text-[var(--color-fg-placeholder)] opacity-0 group-hover:opacity-100 transition-[color,opacity]">
        <ArrowRightIcon />
      </span>
    </button>
  );
}

// ============================================================================
// Extracted Section Components
// ============================================================================

/**
 * CharacterProfileSection – expanded table / collapsed summary for character
 * profile fields (age, birth, zodiac, archetype, features, traits).
 */
function CharacterProfileSection(props: {
  character: Character;
  isExpanded: boolean;
  onToggleExpand: () => void;
  contentId: string;
  zodiacLabel: string | undefined;
  archetypeLabel: string | undefined;
  newTrait: string;
  onNewTraitChange: (v: string) => void;
  onAddTrait: () => void;
  onRemoveTrait: (trait: string) => void;
  onTraitKeyDown: (e: React.KeyboardEvent) => void;
  newFeature: string;
  onNewFeatureChange: (v: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (feature: string) => void;
  onFeatureKeyDown: (e: React.KeyboardEvent) => void;
  onFieldChange: <K extends keyof Character>(
    field: K,
    value: Character[K],
  ) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const c = props.character;

  return (
    <div className="space-y-3">
      <div className={sectionHeaderStyles}>
        <label className={labelStyles}>{t("character.detail.profile")}</label>
        <button
          type="button"
          onClick={props.onToggleExpand}
          aria-expanded={props.isExpanded}
          aria-controls={props.contentId}
          aria-label={
            props.isExpanded
              ? t("character.detail.collapseProfile")
              : t("character.detail.expandProfile")
          }
          className="focus-ring text-[10px] text-[var(--color-fg-placeholder)] hover:text-[var(--color-fg-muted)] inline-flex items-center gap-1 font-medium transition-colors"
        >
          <span aria-hidden="true">
            {props.isExpanded
              ? t("character.detail.collapse")
              : t("character.detail.expand")}
          </span>
          <ChevronDownIcon
            className={[
              "transition-transform duration-[var(--duration-fast)]",
              props.isExpanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>

      <div id={props.contentId}>
        {props.isExpanded ? (
          <div className="rounded-lg overflow-hidden border border-[var(--color-border-default)] divide-y divide-[var(--color-border-default)] bg-[var(--color-bg-base)]">
            <ProfileTableRow label={t("character.detail.age")}>
              <Input
                type="text"
                value={c.age?.toString() ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  props.onFieldChange(
                    "age",
                    val ? parseInt(val, 10) : undefined,
                  );
                }}
                fullWidth
              />
            </ProfileTableRow>

            <ProfileTableRow label={t("character.detail.birthDate")}>
              <Input
                type="date"
                value={c.birthDate ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  props.onFieldChange("birthDate", val ? val : undefined);
                  const zodiac = val ? getZodiacFromBirthDate(val) : undefined;
                  if (zodiac) {
                    props.onFieldChange("zodiac", zodiac);
                  }
                }}
                fullWidth
              />
            </ProfileTableRow>

            <ProfileTableRow label={t("character.detail.zodiac")}>
              <Select
                value={c.zodiac ?? ""}
                onValueChange={(val) =>
                  props.onFieldChange(
                    "zodiac",
                    val ? (val as ZodiacSign) : undefined,
                  )
                }
                options={ZODIAC_OPTIONS.map((z) => ({
                  value: z.value,
                  label: z.label,
                }))}
                placeholder={t("character.detail.selectZodiacPlaceholder")}
                fullWidth
                layer="modal"
              />
            </ProfileTableRow>

            <ProfileTableRow label={t("character.detail.archetype")}>
              <Select
                value={c.archetype ?? ""}
                onValueChange={(val) => props.onFieldChange("archetype", val)}
                options={ARCHETYPE_OPTIONS.map((a) => ({
                  value: a.value,
                  label: a.label,
                }))}
                placeholder={t("character.detail.selectArchetypePlaceholder")}
                fullWidth
                layer="modal"
              />
            </ProfileTableRow>

            <ProfileTableRow label={t("character.detail.features")}>
              <div className="flex flex-wrap gap-2">
                {(c.features ?? []).map((feature) => (
                  <TraitTag
                    key={feature}
                    trait={feature}
                    onRemove={() => props.onRemoveFeature(feature)}
                  />
                ))}
                <input
                  type="text"
                  placeholder={t("character.detail.addFeaturePlaceholder")}
                  value={props.newFeature}
                  onChange={(e) => props.onNewFeatureChange(e.target.value)}
                  onKeyDown={props.onFeatureKeyDown}
                  onBlur={props.onAddFeature}
                  className="bg-transparent text-xs text-[var(--color-fg-default)] placeholder-[var(--color-fg-placeholder)] focus:outline-none focus:placeholder-[var(--color-fg-muted)] min-w-20 py-1 px-1 ml-1 hover:bg-[var(--color-bg-surface)] rounded transition-colors"
                />
              </div>
            </ProfileTableRow>

            <ProfileTableRow label={t("character.detail.personality")}>
              <div className="flex flex-wrap gap-2">
                {c.traits.map((trait) => (
                  <TraitTag
                    key={trait}
                    trait={trait}
                    onRemove={() => props.onRemoveTrait(trait)}
                  />
                ))}
                <input
                  type="text"
                  placeholder={t("character.detail.addTraitPlaceholder")}
                  value={props.newTrait}
                  onChange={(e) => props.onNewTraitChange(e.target.value)}
                  onKeyDown={props.onTraitKeyDown}
                  onBlur={props.onAddTrait}
                  className="bg-transparent text-xs text-[var(--color-fg-default)] placeholder-[var(--color-fg-placeholder)] focus:outline-none focus:placeholder-[var(--color-fg-muted)] min-w-15 py-1 px-1 ml-1 hover:bg-[var(--color-bg-surface)] rounded transition-colors"
                />
              </div>
            </ProfileTableRow>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-3">
            <div className="flex flex-wrap gap-2">
              <ProfileSummaryItem
                label={t("character.detail.age")}
                value={c.age !== undefined ? String(c.age) : "—"}
              />
              <ProfileSummaryItem
                label={t("character.detail.birth")}
                value={c.birthDate ?? "—"}
              />
              <ProfileSummaryItem
                label={t("character.detail.zodiac")}
                value={props.zodiacLabel ?? "—"}
              />
              <ProfileSummaryItem
                label={t("character.detail.archetype")}
                value={props.archetypeLabel ?? "—"}
              />
              <ProfileSummaryItem
                label={t("character.detail.features")}
                value={String((c.features ?? []).length)}
              />
              <ProfileSummaryItem
                label={t("character.detail.traits")}
                value={String(c.traits.length)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CharacterRelationshipsSection – relationship list with add/remove.
 */
function CharacterRelationshipsSection(props: {
  character: Character;
  availableCharacters: Character[] | undefined;
  onFieldChange: <K extends keyof Character>(
    field: K,
    value: Character[K],
  ) => void;
  onRemoveRelationship: (characterId: string) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const c = props.character;

  const candidates = (props.availableCharacters ?? []).filter(
    (ch) => ch.id !== c.id,
  );

  return (
    <div className="space-y-3">
      <div className={sectionHeaderStyles}>
        <label className={labelStyles}>
          {t("character.detail.relationships")}
        </label>
        {candidates.length > 0 ? (
          <AddRelationshipPopover
            availableCharacters={candidates}
            existingRelationships={c.relationships}
            onAdd={(relationship) =>
              props.onFieldChange("relationships", [
                ...c.relationships,
                relationship,
              ])
            }
            layer="modal"
          />
        ) : (
          <span className="text-[10px] text-[var(--color-fg-placeholder)]">
            {t("character.detail.noOtherCharacters")}
          </span>
        )}
      </div>
      {c.relationships.length > 0 ? (
        <div className="rounded-lg overflow-hidden bg-[var(--color-bg-base)] border border-[var(--color-bg-hover)] divide-y divide-[var(--color-bg-hover)]">
          {c.relationships.map((rel) => (
            <RelationshipItem
              key={rel.characterId}
              relationship={rel}
              onRemove={() => props.onRemoveRelationship(rel.characterId)}
            />
          ))}
        </div>
      ) : (
        <div className="text-xs text-[var(--color-fg-placeholder)] py-4 text-center border border-dashed border-[var(--color-border-default)] rounded-lg">
          {t("character.detail.noRelationships")}
        </div>
      )}
    </div>
  );
}

/**
 * CharacterAppearancesSection – chapter appearance links.
 */
function CharacterAppearancesSection(props: {
  appearances: ChapterAppearance[];
  onNavigateToChapter?: (chapterId: string) => void;
  navigationWarning?: string | null;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 pb-2">
      <div className={sectionHeaderStyles}>
        <label className={labelStyles}>
          {t("character.detail.appearances")}
        </label>
        <span className="text-[10px] text-[var(--color-fg-placeholder)]">
          {props.appearances.length} {t("character.detail.chapters")}
        </span>
      </div>
      {props.navigationWarning ? (
        <div
          role="alert"
          data-testid="character-navigation-warning"
          className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-3 py-2 text-xs text-[var(--color-warning-default)]"
        >
          {props.navigationWarning}
        </div>
      ) : null}
      {props.appearances.length > 0 ? (
        <div className="flex flex-col gap-1">
          {props.appearances.map((appearance) => (
            <ChapterLink
              key={appearance.id}
              appearance={appearance}
              onNavigate={() => props.onNavigateToChapter?.(appearance.id)}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="text-xs text-[var(--color-fg-placeholder)] py-4 text-center border border-dashed border-[var(--color-border-default)] rounded-lg">
            {t("character.detail.noAppearances")}
          </div>
          <p className="text-[11px] text-[var(--color-fg-placeholder)]">
            {t("character.detail.noAppearancesFallbackHint")}
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CharacterDetailDialog - Modal dialog for viewing and editing character details.
 */
export function CharacterDetailDialog({
  open,
  onOpenChange,
  character,
  onSave,
  onDelete,
  onNavigateToChapter,
  navigationWarning,
  availableCharacters,
  container,
}: CharacterDetailDialogProps): JSX.Element | null {
  const { t } = useTranslation();

  // Form state
  const [editedCharacter, setEditedCharacter] =
    React.useState<Character | null>(null);
  const [newTrait, setNewTrait] = React.useState("");
  const [newFeature, setNewFeature] = React.useState("");
  const [isProfileExpanded, setIsProfileExpanded] = React.useState(false);

  // Initialize form state when character changes
  React.useEffect(() => {
    if (character) {
      const computedZodiac = character.birthDate
        ? getZodiacFromBirthDate(character.birthDate)
        : undefined;

      setEditedCharacter({
        ...character,
        features: character.features ?? [],
        zodiac: character.zodiac ?? computedZodiac,
      });
    }
  }, [character]);

  // Reset when dialog closes
  React.useEffect(() => {
    if (!open) {
      setNewTrait("");
      setNewFeature("");
    }
  }, [open]);

  // Default collapsed when dialog opens / switches character.
  React.useEffect(() => {
    if (open) {
      setIsProfileExpanded(false);
    }
  }, [open, character?.id]);

  if (!editedCharacter) {
    return null;
  }

  const handleFieldChange = <K extends keyof Character>(
    field: K,
    value: Character[K],
  ) => {
    setEditedCharacter((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleAddTrait = () => {
    const trimmed = newTrait.trim();
    if (
      trimmed &&
      editedCharacter &&
      !editedCharacter.traits.includes(trimmed)
    ) {
      handleFieldChange("traits", [...editedCharacter.traits, trimmed]);
      setNewTrait("");
    }
  };

  const handleRemoveTrait = (trait: string) => {
    if (editedCharacter) {
      handleFieldChange(
        "traits",
        editedCharacter.traits.filter((t) => t !== trait),
      );
    }
  };

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed || !editedCharacter) return;

    const current = editedCharacter.features ?? [];
    if (current.includes(trimmed)) {
      setNewFeature("");
      return;
    }

    handleFieldChange("features", [...current, trimmed]);
    setNewFeature("");
  };

  const handleRemoveFeature = (feature: string) => {
    if (!editedCharacter) return;

    const current = editedCharacter.features ?? [];
    handleFieldChange(
      "features",
      current.filter((f) => f !== feature),
    );
  };

  const handleRemoveRelationship = (characterId: string) => {
    if (editedCharacter) {
      handleFieldChange(
        "relationships",
        editedCharacter.relationships.filter(
          (r) => r.characterId !== characterId,
        ),
      );
    }
  };

  const handleSave = () => {
    if (editedCharacter) {
      onSave?.(editedCharacter);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (editedCharacter) {
      onDelete?.(editedCharacter.id);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleTraitKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTrait();
    }
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const hasContainer = container !== undefined && container !== null;
  const profileContentId = "character-profile-content";
  const zodiacLabel =
    editedCharacter.zodiac &&
    ZODIAC_OPTIONS.find((z) => z.value === editedCharacter.zodiac)?.label;
  const archetypeLabel =
    editedCharacter.archetype &&
    ARCHETYPE_OPTIONS.find((a) => a.value === editedCharacter.archetype)?.label;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className={getOverlayStyles(hasContainer)} />
        <DialogPrimitive.Content className={getContentStyles(hasContainer)}>
          {/* Gradient line at top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-border-hover)] to-transparent opacity-50" />

          {/* Header: Avatar + Name + Role */}
          <div className="p-6 pb-0 flex items-start gap-6 shrink-0">
            {/* Avatar with upload overlay */}
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-16 h-16 rounded-full p-[1px] bg-gradient-to-b from-[var(--color-border-hover)] to-[var(--color-bg-surface)]">
                <Avatar
                  src={editedCharacter.avatarUrl}
                  fallback={editedCharacter.name}
                  size="lg"
                  className="w-full h-full group-hover:brightness-75 transition-[filter]"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon />
              </div>
            </div>

            {/* Name and role */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={editedCharacter.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="bg-transparent text-xl font-semibold text-[var(--color-fg-default)] focus:outline-none border-b border-transparent focus:border-[var(--color-info)]/30 pb-0.5 w-full mr-4 placeholder-[var(--color-fg-placeholder)]"
                  placeholder={t("character.detail.namePlaceholder")}
                />
                <DialogPrimitive.Close
                  className="p-2 text-[var(--color-fg-placeholder)] hover:text-[var(--color-fg-default)] transition-colors rounded hover:bg-[var(--color-bg-hover)]"
                  aria-label={t("character.detail.close")}
                >
                  <CloseIcon />
                </DialogPrimitive.Close>
              </div>
              <div className="flex items-center gap-2">
                <RoleSelector
                  value={editedCharacter.role}
                  onChange={(role) => handleFieldChange("role", role)}
                  layer="modal"
                />
                <div className="h-3 w-[1px] bg-[var(--color-border-hover)]" />
                <GroupSelector
                  value={editedCharacter.group}
                  onChange={(group) => handleFieldChange("group", group)}
                  layer="modal"
                />
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <CharacterProfileSection
              character={editedCharacter}
              isExpanded={isProfileExpanded}
              onToggleExpand={() => setIsProfileExpanded((v) => !v)}
              contentId={profileContentId}
              zodiacLabel={zodiacLabel}
              archetypeLabel={archetypeLabel}
              newTrait={newTrait}
              onNewTraitChange={setNewTrait}
              onAddTrait={handleAddTrait}
              onRemoveTrait={handleRemoveTrait}
              onTraitKeyDown={handleTraitKeyDown}
              newFeature={newFeature}
              onNewFeatureChange={setNewFeature}
              onAddFeature={handleAddFeature}
              onRemoveFeature={handleRemoveFeature}
              onFeatureKeyDown={handleFeatureKeyDown}
              onFieldChange={handleFieldChange}
            />

            {/* Appearance & Description */}
            <div className="space-y-3">
              <div className={sectionHeaderStyles}>
                <label className={labelStyles}>
                  {t("character.detail.appearanceDescription")}
                </label>
              </div>
              <Textarea
                value={editedCharacter.description ?? ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                placeholder={t("character.detail.descriptionPlaceholder")}
                fullWidth
                className="min-h-20 focus:min-h-25 transition-[min-height] resize-none"
              />
            </div>

            <CharacterRelationshipsSection
              character={editedCharacter}
              availableCharacters={availableCharacters}
              onFieldChange={handleFieldChange}
              onRemoveRelationship={handleRemoveRelationship}
            />

            <CharacterAppearancesSection
              appearances={editedCharacter.appearances}
              onNavigateToChapter={onNavigateToChapter}
              navigationWarning={navigationWarning}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] flex items-center justify-between shrink-0">
            {/* Delete 按钮: 图标和文字同一行，gap-1.5 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-[var(--color-error)] opacity-60 hover:opacity-100"
            >
              <span className="inline-flex items-center gap-1.5">
                <TrashIcon />
                {t("character.detail.delete")}
              </span>
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                {t("character.detail.cancel")}
              </Button>
              {/* Save Changes: 无图标，secondary 样式 */}
              <Button variant="secondary" size="sm" onClick={handleSave}>
                {t("character.detail.saveChanges")}
              </Button>
            </div>
          </div>

          {/* Hidden title for accessibility */}
          <DialogPrimitive.Title className="sr-only">
            {t("character.detail.editCharacterTitle", {
              name: editedCharacter.name,
            })}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t("character.detail.editCharacterDescription")}
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

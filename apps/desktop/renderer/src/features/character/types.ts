/**
 * Character feature types
 *
 * Type definitions for the Character Manager feature.
 */

/**
 * Character role type
 */
export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "deuteragonist"
  | "mentor"
  | "ally";

/**
 * Character group category
 */
export type CharacterGroup = "main" | "supporting" | "others";

/**
 * Zodiac sign (12 Western zodiac signs)
 */
export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

/**
 * Relationship types between characters
 */
export type RelationshipType =
  | "rival"
  | "mentor"
  | "ally"
  | "enemy"
  | "friend"
  | "family";

/**
 * Character relationship
 */
export interface CharacterRelationship {
  /** ID of the related character */
  characterId: string;
  /** Name of the related character */
  characterName: string;
  /** Role of the related character */
  characterRole?: CharacterRole;
  /** Avatar URL of the related character */
  characterAvatar?: string;
  /** Type of relationship */
  type: RelationshipType;
}

/**
 * Chapter appearance
 */
export interface ChapterAppearance {
  /** Chapter ID */
  id: string;
  /** Chapter title */
  title: string;
}

/**
 * Character archetype options
 */
export const ARCHETYPE_OPTIONS = [
  { value: "reluctant-hero", label: "The Reluctant Hero" },
  { value: "chosen-one", label: "The Chosen One" },
  { value: "mentor", label: "The Mentor" },
  { value: "trickster", label: "The Trickster" },
  { value: "sage", label: "The Sage" },
] as const;

/**
 * Character data model
 */
export interface Character {
  /** Unique identifier */
  id: string;
  /** Character name */
  name: string;
  /** Character age */
  age?: number;
  /**
   * Birth date in ISO format (YYYY-MM-DD)
   *
   * Stored as string to avoid timezone issues across platforms.
   */
  birthDate?: string;
  /** Zodiac sign */
  zodiac?: ZodiacSign;
  /** Character role */
  role: CharacterRole;
  /** Character group */
  group: CharacterGroup;
  /** Character archetype */
  archetype?: string;
  /** Avatar image URL */
  avatarUrl?: string;
  /** Character description */
  description?: string;
  /** Character features / characteristics */
  features?: string[];
  /** Personality traits */
  traits: string[];
  /** Relationships with other characters */
  relationships: CharacterRelationship[];
  /** Chapter appearances */
  appearances: ChapterAppearance[];
}

/**
 * Role display configuration
 */
export const ROLE_DISPLAY: Record<
  CharacterRole,
  { label: string; color: string }
> = {
  protagonist: {
    label: "Protagonist",
    color: "text-[var(--color-accent-blue)]",
  },
  antagonist: { label: "Antagonist", color: "text-[var(--color-error)]" },
  deuteragonist: {
    label: "Deuteragonist",
    color: "text-[var(--color-accent-purple)]",
  },
  mentor: { label: "Mentor", color: "text-[var(--color-success)]" },
  ally: { label: "Ally", color: "text-[var(--color-warning)]" },
};

/**
 * Relationship type display configuration
 */
export const RELATIONSHIP_TYPE_DISPLAY: Record<
  RelationshipType,
  { label: string; color: string }
> = {
  rival: { label: "Rival", color: "bg-[var(--color-error)]/50" },
  mentor: { label: "Mentor", color: "bg-[var(--color-accent-blue)]/50" },
  ally: { label: "Ally", color: "bg-[var(--color-success)]/50" },
  enemy: { label: "Enemy", color: "bg-[var(--color-error)]/50" },
  friend: { label: "Friend", color: "bg-[var(--color-info)]/50" },
  family: { label: "Family", color: "bg-[var(--color-accent-purple)]/50" },
};

/**
 * Group display options
 */
export const GROUP_OPTIONS: { value: CharacterGroup; label: string }[] = [
  { value: "main", label: "Main Cast" },
  { value: "supporting", label: "Supporting" },
  { value: "others", label: "Others" },
];

/**
 * Zodiac sign options
 */
export const ZODIAC_OPTIONS: { value: ZodiacSign; label: string }[] = [
  { value: "aries", label: "Aries (白羊座)" },
  { value: "taurus", label: "Taurus (金牛座)" },
  { value: "gemini", label: "Gemini (双子座)" },
  { value: "cancer", label: "Cancer (巨蟹座)" },
  { value: "leo", label: "Leo (狮子座)" },
  { value: "virgo", label: "Virgo (处女座)" },
  { value: "libra", label: "Libra (天秤座)" },
  { value: "scorpio", label: "Scorpio (天蝎座)" },
  { value: "sagittarius", label: "Sagittarius (射手座)" },
  { value: "capricorn", label: "Capricorn (摩羯座)" },
  { value: "aquarius", label: "Aquarius (水瓶座)" },
  { value: "pisces", label: "Pisces (双鱼座)" },
];

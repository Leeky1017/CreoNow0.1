/**
 * Character from Knowledge Graph mapping.
 *
 * Maps KG entities (entityType="character") to Character data model.
 * This ensures Characters are a view over KG rather than a separate data store.
 */

import type { KgEntity, KgRelation } from "../../stores/kgStore";
import type {
  Character,
  CharacterGroup,
  CharacterRelationship,
  CharacterRole,
  RelationshipType,
} from "./types";

/**
 * Character metadata stored in KG entity's metadataJson field.
 *
 * Why: metadataJson is the extension point for entity-specific data;
 * storing character fields here keeps KG schema generic.
 */
export interface CharacterMetadata {
  /** Character role (protagonist, antagonist, etc.) */
  role?: CharacterRole;
  /** Character group (main, supporting, others) */
  group?: CharacterGroup;
  /** Age */
  age?: number;
  /** Birth date in ISO format */
  birthDate?: string;
  /** Zodiac sign */
  zodiac?: string;
  /** Archetype */
  archetype?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Personality traits */
  traits?: string[];
  /** Character features */
  features?: string[];
}

/**
 * Default values for character fields when metadata is missing or invalid.
 */
const CHARACTER_DEFAULTS: {
  role: CharacterRole;
  group: CharacterGroup;
  traits: string[];
  features: string[];
} = {
  role: "ally",
  group: "others",
  traits: [],
  features: [],
};

/**
 * Valid character roles for validation.
 */
const VALID_ROLES: CharacterRole[] = [
  "protagonist",
  "antagonist",
  "deuteragonist",
  "mentor",
  "ally",
];

/**
 * Valid character groups for validation.
 */
const VALID_GROUPS: CharacterGroup[] = ["main", "supporting", "others"];

/**
 * Valid relationship types for validation.
 */
const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  "rival",
  "mentor",
  "ally",
  "enemy",
  "friend",
  "family",
];

/**
 * Parse and validate character metadata from JSON string.
 *
 * Why: metadataJson may be malformed or missing fields; this function
 * ensures graceful degradation with defaults.
 *
 * @param metadataJson - Raw JSON string from KG entity
 * @returns Validated metadata with defaults applied
 */
export function parseCharacterMetadata(
  metadataJson: string | null | undefined,
): CharacterMetadata {
  if (!metadataJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadataJson) as Record<string, unknown>;

    // Validate and extract fields
    const role =
      typeof parsed.role === "string" &&
      VALID_ROLES.includes(parsed.role as CharacterRole)
        ? (parsed.role as CharacterRole)
        : undefined;

    const group =
      typeof parsed.group === "string" &&
      VALID_GROUPS.includes(parsed.group as CharacterGroup)
        ? (parsed.group as CharacterGroup)
        : undefined;

    const age =
      typeof parsed.age === "number" && parsed.age > 0 ? parsed.age : undefined;

    const birthDate =
      typeof parsed.birthDate === "string" ? parsed.birthDate : undefined;

    const zodiac =
      typeof parsed.zodiac === "string" ? parsed.zodiac : undefined;

    const archetype =
      typeof parsed.archetype === "string" ? parsed.archetype : undefined;

    const avatarUrl =
      typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : undefined;

    const traits = Array.isArray(parsed.traits)
      ? parsed.traits.filter((t): t is string => typeof t === "string")
      : undefined;

    const features = Array.isArray(parsed.features)
      ? parsed.features.filter((f): f is string => typeof f === "string")
      : undefined;

    return {
      role,
      group,
      age,
      birthDate,
      zodiac,
      archetype,
      avatarUrl,
      traits,
      features,
    };
  } catch (error) {
    // Log warning for debugging but don't crash
    console.warn(
      "[characterFromKg] Failed to parse metadataJson:",
      metadataJson,
      error,
    );
    return {};
  }
}

/**
 * Convert a KG entity to a Character.
 *
 * Why: Characters are a view over KG entities with entityType="character".
 * This mapping centralizes the conversion logic.
 *
 * @param entity - KG entity to convert
 * @param relations - All relations for building relationships
 * @param entityMap - Map of entityId to entity for relationship lookup
 * @returns Character data model
 */
export function kgEntityToCharacter(
  entity: KgEntity,
  relations: KgRelation[],
  entityMap: Map<string, KgEntity>,
): Character {
  const metadata = parseCharacterMetadata(entity.metadataJson);

  // Build relationships from KG relations where this entity is source or target
  const relationships: CharacterRelationship[] = [];

  for (const rel of relations) {
    // Outgoing relations: this character -> other
    if (rel.sourceEntityId === entity.id) {
      const targetEntity = entityMap.get(rel.targetEntityId);
      if (targetEntity && targetEntity.type === "character") {
        const targetMeta = parseCharacterMetadata(targetEntity.metadataJson);
        relationships.push({
          characterId: targetEntity.id,
          characterName: targetEntity.name,
          characterRole: targetMeta.role,
          characterAvatar: targetMeta.avatarUrl,
          type: mapRelationType(rel.relationType),
        });
      }
    }
    // Incoming relations: other -> this character (show as bidirectional)
    if (rel.targetEntityId === entity.id) {
      const sourceEntity = entityMap.get(rel.sourceEntityId);
      if (sourceEntity && sourceEntity.type === "character") {
        const sourceMeta = parseCharacterMetadata(sourceEntity.metadataJson);
        // Check if we already have this relationship (avoid duplicates)
        const existing = relationships.find(
          (r) => r.characterId === sourceEntity.id,
        );
        if (!existing) {
          relationships.push({
            characterId: sourceEntity.id,
            characterName: sourceEntity.name,
            characterRole: sourceMeta.role,
            characterAvatar: sourceMeta.avatarUrl,
            type: mapRelationType(rel.relationType),
          });
        }
      }
    }
  }

  return {
    id: entity.id,
    name: entity.name,
    age: metadata.age,
    birthDate: metadata.birthDate,
    zodiac: metadata.zodiac as Character["zodiac"],
    role: metadata.role ?? CHARACTER_DEFAULTS.role,
    group: metadata.group ?? CHARACTER_DEFAULTS.group,
    archetype: metadata.archetype,
    avatarUrl: metadata.avatarUrl,
    description: entity.description ?? undefined,
    features: metadata.features ?? CHARACTER_DEFAULTS.features,
    traits: metadata.traits ?? CHARACTER_DEFAULTS.traits,
    relationships,
    appearances: [], // Chapter appearances require separate logic
  };
}

/**
 * Map a KG relation type string to a valid RelationshipType.
 *
 * Why: KG relation types are free-form strings; we map them to known types
 * with fallback to "friend" for unknown types.
 */
function mapRelationType(relationType: string): RelationshipType {
  const normalized = relationType.toLowerCase().trim();

  // Direct matches
  if (VALID_RELATIONSHIP_TYPES.includes(normalized as RelationshipType)) {
    return normalized as RelationshipType;
  }

  // Common aliases
  const aliases: Record<string, RelationshipType> = {
    rivals: "rival",
    rivals_with: "rival",
    enemies: "enemy",
    enemy_of: "enemy",
    friends: "friend",
    friend_of: "friend",
    friends_with: "friend",
    mentors: "mentor",
    mentor_of: "mentor",
    mentored_by: "mentor",
    allies: "ally",
    allied_with: "ally",
    family_of: "family",
    related_to: "family",
    sibling: "family",
    parent: "family",
    child: "family",
    spouse: "family",
  };

  return aliases[normalized] ?? "friend";
}

/**
 * Convert a Character to KG entity metadata JSON.
 *
 * Why: When creating/updating characters, we need to serialize
 * character-specific fields to metadataJson.
 */
export function characterToMetadataJson(character: Partial<Character>): string {
  const metadata: CharacterMetadata = {
    role: character.role,
    group: character.group,
    age: character.age,
    birthDate: character.birthDate,
    zodiac: character.zodiac,
    archetype: character.archetype,
    avatarUrl: character.avatarUrl,
    traits: character.traits,
    features: character.features,
  };

  // Remove undefined fields for cleaner JSON
  const cleaned = Object.fromEntries(
    Object.entries(metadata).filter(([, v]) => v !== undefined),
  );

  return JSON.stringify(cleaned);
}

/**
 * Filter KG entities to get only characters.
 *
 * @param entities - All KG entities
 * @returns Entities with entityType="character"
 */
export function filterCharacterEntities(entities: KgEntity[]): KgEntity[] {
  return entities.filter((e) => e.type === "character");
}

/**
 * Convert all character entities to Characters.
 *
 * @param entities - All KG entities
 * @param relations - All KG relations
 * @returns Array of Character models
 */
export function kgToCharacters(
  entities: KgEntity[],
  relations: KgRelation[],
): Character[] {
  const characterEntities = filterCharacterEntities(entities);
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  return characterEntities.map((entity) =>
    kgEntityToCharacter(entity, relations, entityMap),
  );
}

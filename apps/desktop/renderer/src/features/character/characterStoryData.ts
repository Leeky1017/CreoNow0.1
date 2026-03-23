import type { Character } from "./types";

/**
 * Sample character data for stories
 *
 * Uses real meaningful data as required by design spec:
 * - Elara Vance: 24岁, Protagonist, 原型"The Reluctant Hero"
 * - Kaelen Thorne: Antagonist
 * - Darius: Deuteragonist
 * - Jax: Mentor (no avatar, shows initials)
 * - Sarah: Ally
 */
export const SAMPLE_CHARACTERS: Character[] = [
  {
    id: "elara",
    name: "Elara Vance",
    age: 24,
    birthDate: "2002-03-25",
    zodiac: "aries",
    role: "protagonist",
    group: "main",
    archetype: "reluctant-hero",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    description:
      "A skilled pilot with a mysterious past, determined to find the lost coordinates of Earth. She wears a faded flight jacket with an emblem no one recognizes.",
    features: [
      "Wears a faded flight jacket",
      "Quick reflexes",
      "Pilot calluses",
    ],
    traits: ["Brave", "Impulsive", "Loyal"],
    relationships: [
      {
        characterId: "kaelen",
        characterName: "Kaelen Thorne",
        characterRole: "antagonist",
        characterAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=faces",
        type: "rival",
      },
      {
        characterId: "jax",
        characterName: "Jax",
        characterRole: "mentor",
        type: "mentor",
      },
    ],
    appearances: [
      { id: "ch1", title: "Chapter 1: The Awakening" },
      { id: "ch3", title: "Chapter 3: Void Drift" },
    ],
  },
  {
    id: "kaelen",
    name: "Kaelen Thorne",
    age: 32,
    role: "antagonist",
    group: "main",
    archetype: "trickster",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    description:
      "A charismatic leader with a hidden agenda. His charm masks a ruthless ambition.",
    traits: ["Cunning", "Charismatic", "Ambitious"],
    relationships: [
      {
        characterId: "elara",
        characterName: "Elara Vance",
        characterRole: "protagonist",
        characterAvatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=faces",
        type: "rival",
      },
    ],
    appearances: [
      { id: "ch2", title: "Chapter 2: Shadows Fall" },
      { id: "ch3", title: "Chapter 3: Void Drift" },
    ],
  },
  {
    id: "darius",
    name: "Darius",
    age: 28,
    role: "deuteragonist",
    group: "main",
    archetype: "chosen-one",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
    description:
      "Elara's trusted companion, skilled in navigation and survival.",
    traits: ["Steady", "Resourceful", "Protective"],
    relationships: [
      {
        characterId: "elara",
        characterName: "Elara Vance",
        characterRole: "protagonist",
        type: "friend",
      },
    ],
    appearances: [{ id: "ch1", title: "Chapter 1: The Awakening" }],
  },
  {
    id: "jax",
    name: "Jax",
    age: 58,
    role: "mentor",
    group: "supporting",
    archetype: "mentor",
    description:
      "A grizzled veteran who trained Elara. Carries the weight of past failures.",
    traits: ["Wise", "Gruff", "Protective"],
    relationships: [
      {
        characterId: "elara",
        characterName: "Elara Vance",
        characterRole: "protagonist",
        type: "mentor",
      },
    ],
    appearances: [{ id: "ch1", title: "Chapter 1: The Awakening" }],
  },
  {
    id: "sarah",
    name: "Sarah",
    age: 26,
    role: "ally",
    group: "supporting",
    archetype: "sage",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=faces",
    description: "A researcher who helps decode ancient star maps.",
    traits: ["Intelligent", "Curious", "Empathetic"],
    relationships: [],
    appearances: [{ id: "ch2", title: "Chapter 2: Shadows Fall" }],
  },
];

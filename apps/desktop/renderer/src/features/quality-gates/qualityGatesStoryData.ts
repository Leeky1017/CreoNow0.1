import type { CheckGroup } from "./QualityGatesPanel";

/**
 * Sample check data based on design spec
 */
export const SAMPLE_CHECK_GROUPS: CheckGroup[] = [
  {
    id: "style",
    name: "Style",
    checks: [
      {
        id: "passive-voice",
        name: "Passive Voice",
        description: "Detects overuse of passive voice (threshold: 15%)",
        status: "passed",
        resultValue: "8%",
      },
      {
        id: "sentence-variety",
        name: "Sentence Variety",
        description: "Analyzes sentence length distribution...",
        status: "passed",
        resultValue: "76%",
      },
    ],
  },
  {
    id: "consistency",
    name: "Consistency",
    checks: [
      {
        id: "character-names",
        name: "Character Names",
        description: "Ensures consistent naming conventions...",
        status: "warning",
        issues: [
          {
            id: "issue-1",
            description: '"Elara" 在 Chapter 3 被写成 "Elera"',
            location: "Chapter 3, Paragraph 5",
            severity: "warning",
          },
        ],
      },
      {
        id: "timeline",
        name: "Timeline",
        description: "Validates chronological consistency of events.",
        status: "passed",
      },
      {
        id: "settings-consistency",
        name: "Settings",
        description:
          "Checks for consistent descriptions of locations and settings.",
        status: "passed",
      },
    ],
  },
  {
    id: "completeness",
    name: "Completeness",
    checks: [
      {
        id: "plot-threads",
        name: "Plot Threads",
        description: "Tracks unresolved plot threads and story arcs...",
        status: "warning",
        issues: [
          {
            id: "issue-2",
            description:
              "The mystery of the Crystal Key is introduced but never resolved.",
            location: "Chapter 1 - Chapter 12",
            severity: "warning",
          },
        ],
      },
      {
        id: "character-arcs",
        name: "Character Arcs",
        description: "Monitors character development and arc completeness.",
        status: "passed",
      },
    ],
  },
];

export const ALL_PASSED_GROUPS: CheckGroup[] = [
  {
    id: "style",
    name: "Style",
    checks: [
      {
        id: "passive-voice",
        name: "Passive Voice",
        description: "Detects overuse of passive voice (threshold: 15%)",
        status: "passed",
        resultValue: "8%",
      },
      {
        id: "sentence-variety",
        name: "Sentence Variety",
        description: "Analyzes sentence length distribution...",
        status: "passed",
        resultValue: "76%",
      },
    ],
  },
  {
    id: "consistency",
    name: "Consistency",
    checks: [
      {
        id: "character-names",
        name: "Character Names",
        description: "Ensures consistent naming conventions...",
        status: "passed",
      },
      {
        id: "timeline",
        name: "Timeline",
        description: "Validates chronological consistency of events.",
        status: "passed",
      },
      {
        id: "settings-consistency",
        name: "Settings",
        description:
          "Checks for consistent descriptions of locations and settings.",
        status: "passed",
      },
    ],
  },
  {
    id: "completeness",
    name: "Completeness",
    checks: [
      {
        id: "plot-threads",
        name: "Plot Threads",
        description: "Tracks unresolved plot threads and story arcs...",
        status: "passed",
      },
      {
        id: "character-arcs",
        name: "Character Arcs",
        description: "Monitors character development and arc completeness.",
        status: "passed",
      },
    ],
  },
];

export const RUNNING_GROUPS: CheckGroup[] = [
  {
    id: "style",
    name: "Style",
    checks: [
      {
        id: "passive-voice",
        name: "Passive Voice",
        description: "Detects overuse of passive voice (threshold: 15%)",
        status: "running",
      },
      {
        id: "sentence-variety",
        name: "Sentence Variety",
        description: "Analyzes sentence length distribution...",
        status: "passed",
        resultValue: "76%",
      },
    ],
  },
  {
    id: "consistency",
    name: "Consistency",
    checks: [
      {
        id: "character-names",
        name: "Character Names",
        description: "Ensures consistent naming conventions...",
        status: "passed",
      },
      {
        id: "timeline",
        name: "Timeline",
        description: "Validates chronological consistency of events.",
        status: "passed",
      },
      {
        id: "settings-consistency",
        name: "Settings",
        description:
          "Checks for consistent descriptions of locations and settings.",
        status: "passed",
      },
    ],
  },
  {
    id: "completeness",
    name: "Completeness",
    checks: [
      {
        id: "plot-threads",
        name: "Plot Threads",
        description: "Tracks unresolved plot threads and story arcs...",
        status: "passed",
      },
      {
        id: "character-arcs",
        name: "Character Arcs",
        description: "Monitors character development and arc completeness.",
        status: "passed",
      },
    ],
  },
];

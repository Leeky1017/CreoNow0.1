import assert from "node:assert/strict";

import type { AiContextLevel } from "../kgService";
import { matchEntities, type MatchableEntity } from "../entityMatcher";

function createEntity(args: {
  id: string;
  name: string;
  aliases?: string[];
  aiContextLevel?: AiContextLevel;
}): MatchableEntity {
  return {
    id: args.id,
    name: args.name,
    aliases: args.aliases ?? [],
    aiContextLevel: args.aiContextLevel ?? "when_detected",
  };
}

function measureElapsedMs(operation: () => void): number {
  const startedAt = performance.now();
  operation();
  return performance.now() - startedAt;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted[middle]!;
}

// Scenario: BE-KGQ-S4
// entity matcher should pick the earliest hit across name/aliases per entity.
{
  const text = "影子先到，主角林远后到，白塔守望。";
  const entities: MatchableEntity[] = [
    createEntity({ id: "e-1", name: "林远", aliases: ["影子", "小远"] }),
    createEntity({ id: "e-2", name: "白塔", aliases: ["塔楼"] }),
    createEntity({ id: "e-3", name: "旁白", aiContextLevel: "always" }),
  ];

  const results = matchEntities(text, entities);

  assert.deepEqual(results, [
    {
      entityId: "e-1",
      matchedTerm: "影子",
      position: text.indexOf("影子"),
    },
    {
      entityId: "e-2",
      matchedTerm: "白塔",
      position: text.indexOf("白塔"),
    },
  ]);
}

// Scenario: BE-KGQ-S4
// matcher cost should not scale linearly with entity count on worst-case text.
{
  const text = "a".repeat(200_000);
  const sharedPrefix = "a".repeat(20);

  const buildEntities = (count: number): MatchableEntity[] =>
    Array.from({ length: count }, (_, index) => {
      const suffix = String(index).padStart(5, "0");
      return createEntity({
        id: `perf-${index}`,
        name: `${sharedPrefix}${suffix}Z`,
        aliases: [
          `${sharedPrefix}${suffix}A`,
          `${sharedPrefix}${suffix}B`,
          `${sharedPrefix}${suffix}C`,
        ],
      });
    });

  const small = buildEntities(500);
  const large = buildEntities(2500);

  // Warm up to reduce one-time JIT noise.
  matchEntities(text, buildEntities(16));

  const rounds = 7;
  const smallSamples: number[] = [];
  const largeSamples: number[] = [];
  for (let index = 0; index < rounds; index += 1) {
    smallSamples.push(
      measureElapsedMs(() => {
        matchEntities(text, small);
      }),
    );
    largeSamples.push(
      measureElapsedMs(() => {
        matchEntities(text, large);
      }),
    );
  }

  const smallElapsedMs = median(smallSamples);
  const largeElapsedMs = median(largeSamples);

  assert.equal(
    largeElapsedMs <= smallElapsedMs * 3.5,
    true,
    `expected sublinear-ish scaling, smallMedian=${smallElapsedMs.toFixed(2)}ms largeMedian=${largeElapsedMs.toFixed(2)}ms`,
  );
}

console.log(
  "entity-matcher.aho-corasick.contract.test.ts: all assertions passed",
);

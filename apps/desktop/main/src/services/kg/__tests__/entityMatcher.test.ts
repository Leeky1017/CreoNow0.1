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

// Scenario KG-S2-EM-S1
// matches entity names and aliases.
{
  const text = "林默推开门，小默回头看向长安城";
  const entities: MatchableEntity[] = [
    createEntity({ id: "e-1", name: "林默", aliases: ["小默", "默哥"] }),
    createEntity({ id: "e-2", name: "长安城", aliases: ["长安"] }),
    createEntity({ id: "e-3", name: "旁白", aiContextLevel: "always" }),
  ];

  const results = matchEntities(text, entities);

  assert.deepEqual(results, [
    { entityId: "e-1", matchedTerm: "林默", position: text.indexOf("林默") },
    {
      entityId: "e-2",
      matchedTerm: "长安城",
      position: text.indexOf("长安城"),
    },
  ]);
}

// Scenario KG-S2-EM-S2
// matches 100 entities in 1000 chars under 10ms.
{
  const entities: MatchableEntity[] = Array.from({ length: 100 }, (_, index) =>
    createEntity({
      id: `e-${index}`,
      name: `角色${index}`,
      aliases: [`别名${index}-A`, `别名${index}-B`],
    }),
  );
  const text = "天地玄黄宇宙洪荒".repeat(125);
  assert.equal(text.length, 1000);

  const startedAt = performance.now();
  matchEntities(text, entities);
  const elapsed = performance.now() - startedAt;

  assert.equal(elapsed < 10, true);
}

// Scenario KG-S2-EM-S3
// handles overlap cn text and empty input.
{
  const text = "长安城外，长安的风吹过。";
  const entities: MatchableEntity[] = [
    createEntity({ id: "e-short", name: "长安" }),
    createEntity({ id: "e-long", name: "长安城" }),
    createEntity({ id: "e-cn-alias", name: "神都", aliases: ["长安"] }),
  ];

  const results = matchEntities(text, entities);
  assert.deepEqual(results, [
    {
      entityId: "e-long",
      matchedTerm: "长安城",
      position: text.indexOf("长安城"),
    },
    {
      entityId: "e-short",
      matchedTerm: "长安",
      position: text.indexOf("长安"),
    },
    {
      entityId: "e-cn-alias",
      matchedTerm: "长安",
      position: text.indexOf("长安"),
    },
  ]);
  assert.deepEqual(matchEntities("", entities), []);
}

// Scenario KG-S2-EM-S4
// does not drop later entries that share the same entityId.
{
  const text = "影子从门口掠过。";
  const entities: MatchableEntity[] = [
    createEntity({ id: "e-dup", name: "林默", aliases: ["小默"] }),
    createEntity({ id: "e-dup", name: "影子", aliases: ["影卫"] }),
  ];

  const results = matchEntities(text, entities);
  assert.deepEqual(results, [
    {
      entityId: "e-dup",
      matchedTerm: "影子",
      position: text.indexOf("影子"),
    },
  ]);
}

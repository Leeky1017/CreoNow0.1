import assert from "node:assert/strict";

import type { MatchResult, MatchableEntity } from "../../kg/entityMatcher";
import type {
  KnowledgeEntity,
  KnowledgeGraphService,
} from "../../kg/kgService";
import { createRetrievedFetcher } from "../fetchers/retrievedFetcher";

function createEntity(args: {
  id: string;
  name: string;
  aiContextLevel: KnowledgeEntity["aiContextLevel"];
  aliases?: string[];
  description?: string;
}): KnowledgeEntity {
  return {
    id: args.id,
    projectId: "proj-retrieved-fetcher-detected",
    type: "character",
    name: args.name,
    description: args.description ?? `${args.name} 描述`,
    attributes: {},
    aiContextLevel: args.aiContextLevel,
    aliases: args.aliases ?? [],
    version: 1,
    createdAt: "2026-02-14T00:00:00.000Z",
    updatedAt: "2026-02-14T00:00:00.000Z",
  };
}

const BASE_REQUEST = {
  projectId: "proj-retrieved-fetcher-detected",
  documentId: "doc-1",
  cursorPosition: 10,
  skillId: "continue-writing",
};

async function runCeS2FdS1InjectsWhenDetectedEntityWhenTextMatches() {
  const entityList = () => ({
    ok: true as const,
    data: {
      items: [
        createEntity({
          id: "e-when",
          name: "林小雨",
          aliases: ["小雨"],
          aiContextLevel: "when_detected",
          description: "林默的妹妹",
        }),
      ],
      totalCount: 1,
    },
  });

  const matcher = (
    text: string,
    entities: MatchableEntity[],
  ): MatchResult[] => {
    assert.equal(text, "小雨推开门走了进来");
    assert.equal(entities.length, 1);
    assert.equal(entities[0]?.id, "e-when");
    return [{ entityId: "e-when", matchedTerm: "小雨", position: 0 }];
  };

  const fetcher = createRetrievedFetcher({
    kgService: { entityList },
    matchEntities: matcher,
  });

  const result = await fetcher({
    ...BASE_REQUEST,
    additionalInput: "小雨推开门走了进来",
  });

  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0]?.source, "codex:detected:e-when");
  assert.equal(result.chunks[0]?.content.includes("林小雨"), true);
  assert.equal(result.chunks[0]?.content.includes("林默的妹妹"), true);
}

async function runCeS2FdS2SkipsEntitiesWithAiContextLevelNever() {
  const entityList = () => ({
    ok: true as const,
    data: {
      items: [
        createEntity({
          id: "e-when",
          name: "林小雨",
          aliases: ["小雨"],
          aiContextLevel: "when_detected",
        }),
        createEntity({
          id: "e-never",
          name: "禁注角色",
          aliases: ["禁角"],
          aiContextLevel: "never",
        }),
      ],
      totalCount: 2,
    },
  });

  const matcher = (): MatchResult[] => [
    { entityId: "e-when", matchedTerm: "小雨", position: 0 },
    { entityId: "e-never", matchedTerm: "禁角", position: 4 },
  ];

  const fetcher = createRetrievedFetcher({
    kgService: { entityList },
    matchEntities: matcher,
  });

  const result = await fetcher({
    ...BASE_REQUEST,
    additionalInput: "小雨和禁角一起出现",
  });

  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0]?.source, "codex:detected:e-when");
  assert.equal(
    result.chunks.some((chunk) => chunk.source === "codex:detected:e-never"),
    false,
  );
}

async function runCeS2FdS3ReturnsDegradableWarningWhenMatcherOrQueryFails() {
  const entityListOk = () => ({
    ok: true as const,
    data: {
      items: [
        createEntity({
          id: "e-when",
          name: "林小雨",
          aliases: ["小雨"],
          aiContextLevel: "when_detected",
        }),
      ],
      totalCount: 1,
    },
  });

  const matcherThrows = () => {
    throw new Error("matcher boom");
  };
  const matcherFailureFetcher = createRetrievedFetcher({
    kgService: { entityList: entityListOk },
    matchEntities: matcherThrows,
  });

  const matcherFailed = await matcherFailureFetcher({
    ...BASE_REQUEST,
    additionalInput: "小雨推开门走了进来",
  });
  assert.deepEqual(matcherFailed.chunks, []);
  assert.equal(
    matcherFailed.warnings?.[0],
    "ENTITY_MATCH_FAILED: 实体匹配异常",
  );

  const entityListThrows: KnowledgeGraphService["entityList"] = () => {
    throw new Error("query boom");
  };
  const queryFailureFetcher = createRetrievedFetcher({
    kgService: { entityList: entityListThrows },
    matchEntities: () => [],
  });

  const queryFailed = await queryFailureFetcher({
    ...BASE_REQUEST,
    additionalInput: "小雨推开门走了进来",
  });
  assert.deepEqual(queryFailed.chunks, []);
  assert.equal(queryFailed.warnings?.[0], "KG_UNAVAILABLE: 知识图谱数据未注入");
}

await runCeS2FdS1InjectsWhenDetectedEntityWhenTextMatches();
await runCeS2FdS2SkipsEntitiesWithAiContextLevelNever();
await runCeS2FdS3ReturnsDegradableWarningWhenMatcherOrQueryFails();

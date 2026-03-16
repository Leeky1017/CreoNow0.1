import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgeEntity,
  KnowledgeGraphService,
} from "../../kg/kgService";
import { createRulesFetcher } from "../fetchers/rulesFetcher";
import { formatEntityForContext } from "../utils/formatEntity";

function createEntity(args: {
  id: string;
  projectId?: string;
  name: string;
  type: KnowledgeEntity["type"];
  description: string;
  aiContextLevel?: KnowledgeEntity["aiContextLevel"];
  attributes?: Record<string, string>;
  aliases?: string[];
}): KnowledgeEntity & { aliases: string[] } {
  return {
    id: args.id,
    projectId: args.projectId ?? "proj-rules-fetcher",
    name: args.name,
    type: args.type,
    description: args.description,
    attributes: args.attributes ?? {},
    aiContextLevel: args.aiContextLevel ?? "always",
    version: 1,
    createdAt: "2026-02-13T00:00:00.000Z",
    updatedAt: "2026-02-13T00:00:00.000Z",
    aliases: args.aliases ?? [],
  };
}

test("CE-S2-FA-S1 injects always entities into rules context chunks", async () => {
  const calls: Array<Parameters<KnowledgeGraphService["entityList"]>[0]> = [];
  const kgService: Pick<KnowledgeGraphService, "entityList"> = {
    entityList: (args) => {
      calls.push(args);
      return {
        ok: true,
        data: {
          items: [
            createEntity({
              id: "ent-1",
              name: "林默",
              type: "character",
              description: "28岁侦探",
              attributes: { age: "28" },
              aliases: ["小默"],
            }),
            createEntity({
              id: "ent-2",
              name: "魔法系统",
              type: "item",
              description: "本世界的超能力体系",
            }),
          ],
            totalCount: 2,
        },
      };
    },
  };
  const fetcher = createRulesFetcher({ kgService });

  const result = await fetcher({
    projectId: "proj-rules-fetcher",
    documentId: "doc-1",
    cursorPosition: 8,
    skillId: "continue-writing",
  });

  assert.deepEqual(calls, [
    {
      projectId: "proj-rules-fetcher",
      filter: { aiContextLevel: "always" },
    },
  ]);
  assert.equal(result.chunks.length >= 2, true);
  assert.equal(result.chunks[0]?.source, "kg:always:ent-1");
  assert.equal(result.chunks[0]?.content.includes("林默"), true);
  assert.equal(result.chunks[0]?.content.includes("28岁侦探"), true);
  assert.equal(result.chunks[1]?.content.includes("魔法系统"), true);
});

test("CE-S2-FA-S2 does not inject chunks when no always entities exist", async () => {
  const kgService: Pick<KnowledgeGraphService, "entityList"> = {
    entityList: (_args) => ({
      ok: true,
      data: {
        items: [
          createEntity({
            id: "ent-detected",
            name: "临时线索",
            type: "event",
            description: "只在命中时注入",
            aiContextLevel: "when_detected",
          }),
        ],
          totalCount: 1,
      },
    }),
  };
  const fetcher = createRulesFetcher({ kgService });

  const result = await fetcher({
    projectId: "proj-rules-fetcher",
    documentId: "doc-2",
    cursorPosition: 9,
    skillId: "continue-writing",
  });

  assert.deepEqual(result.chunks, []);
  assert.equal(result.warnings, undefined);
});

test("CE-S2-FA-S3 degrades with explicit warning on KG query failure", async () => {
  const kgService: Pick<KnowledgeGraphService, "entityList"> = {
    entityList: (_args) => {
      throw new Error("DB connection lost");
    },
  };
  const fetcher = createRulesFetcher({ kgService });

  const result = await fetcher({
    projectId: "proj-rules-fetcher",
    documentId: "doc-3",
    cursorPosition: 10,
    skillId: "continue-writing",
  });

  assert.deepEqual(result.chunks, []);
  assert.deepEqual(result.warnings, ["KG_UNAVAILABLE: 知识图谱数据未注入"]);
});

test("formats entity with type, description, attributes", () => {
  const content = formatEntityForContext(
    createEntity({
      id: "ent-format",
      name: "林默",
      type: "character",
      description: "侦探",
      attributes: { age: "28", skill: "推理" },
    }),
  );

  assert.equal(content.includes("## 角色：林默"), true);
  assert.equal(content.includes("类型：character"), true);
  assert.equal(content.includes("描述：侦探"), true);
  assert.equal(content.includes("age=28"), true);
  assert.equal(content.includes("skill=推理"), true);
});

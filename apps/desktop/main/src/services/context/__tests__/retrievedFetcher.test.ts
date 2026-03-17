import { describe, expect, it, vi } from "vitest";

import type { MatchResult, MatchableEntity } from "../../kg/entityMatcher";
import type {
  KnowledgeEntity,
  KnowledgeGraphService,
} from "../../kg/kgService";
import { createRetrievedFetcher } from "../fetchers/retrievedFetcher";

function createEntity(args: {
  id: string;
  name: string;
  type?: KnowledgeEntity["type"];
  description?: string;
  attributes?: Record<string, string>;
  aliases?: string[];
  aiContextLevel?: KnowledgeEntity["aiContextLevel"];
}): KnowledgeEntity {
  return {
    id: args.id,
    projectId: "proj-retrieved-fetcher",
    type: args.type ?? "character",
    name: args.name,
    description: args.description ?? "角色描述",
    attributes: args.attributes ?? {},
    aiContextLevel: args.aiContextLevel ?? "when_detected",
    aliases: args.aliases ?? [],
    version: 1,
    createdAt: "2026-02-13T00:00:00.000Z",
    updatedAt: "2026-02-13T00:00:00.000Z",
  };
}

const BASE_REQUEST = {
  projectId: "proj-retrieved-fetcher",
  documentId: "doc-1",
  cursorPosition: 10,
  skillId: "continue-writing",
};

describe("createRetrievedFetcher", () => {
  it("should inject detected entities into retrieved layer", async () => {
    const entityList = vi.fn<KnowledgeGraphService["entityList"]>(() => ({
      ok: true,
      data: {
        items: [
          createEntity({
            id: "e1",
            name: "林小雨",
            aliases: ["小雨"],
            description: "林默的妹妹",
          }),
        ],
        totalCount: 1,
      },
    }));
    const matcher = vi.fn<
      (text: string, entities: MatchableEntity[]) => MatchResult[]
    >(() => [{ entityId: "e1", matchedTerm: "小雨", position: 0 }]);
    const fetcher = createRetrievedFetcher({
      kgService: { entityList },
      matchEntities: matcher,
    });

    const result = await fetcher({
      ...BASE_REQUEST,
      additionalInput: "小雨推开门走了进来",
    });

    expect(entityList).toHaveBeenCalledWith({
      projectId: "proj-retrieved-fetcher",
      filter: { aiContextLevel: "when_detected" },
    });
    expect(matcher).toHaveBeenCalledWith("小雨推开门走了进来", [
      {
        id: "e1",
        name: "林小雨",
        aliases: ["小雨"],
        aiContextLevel: "when_detected",
      },
    ]);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]?.source).toBe("codex:detected:e1");
    expect(result.chunks[0]?.content).toContain("林小雨");
    expect(result.chunks[0]?.content).toContain("林默的妹妹");
  });

  it("should return empty when no entities matched", async () => {
    const entityList = vi.fn<KnowledgeGraphService["entityList"]>(() => ({
      ok: true,
      data: {
        items: [
          createEntity({
            id: "e1",
            name: "林小雨",
            aliases: ["小雨"],
          }),
        ],
        totalCount: 1,
      },
    }));
    const matcher = vi.fn<
      (text: string, entities: MatchableEntity[]) => MatchResult[]
    >(() => []);
    const fetcher = createRetrievedFetcher({
      kgService: { entityList },
      matchEntities: matcher,
    });

    const result = await fetcher({
      ...BASE_REQUEST,
      additionalInput: "天气很好，阳光明媚",
    });

    expect(result.chunks).toEqual([]);
    expect(result.warnings).toBeUndefined();
  });

  it("should skip detection when additionalInput is empty", async () => {
    const entityList = vi.fn<KnowledgeGraphService["entityList"]>(() => ({
      ok: true,
      data: {
        items: [createEntity({ id: "e1", name: "林小雨" })],
        totalCount: 1,
      },
    }));
    const matcher = vi.fn<
      (text: string, entities: MatchableEntity[]) => MatchResult[]
    >(() => [{ entityId: "e1", matchedTerm: "林小雨", position: 0 }]);
    const fetcher = createRetrievedFetcher({
      kgService: { entityList },
      matchEntities: matcher,
    });

    const result = await fetcher({
      ...BASE_REQUEST,
      additionalInput: "",
    });

    expect(result.chunks).toEqual([]);
    expect(entityList).not.toHaveBeenCalled();
    expect(matcher).not.toHaveBeenCalled();
  });

  it("should degrade with KG_UNAVAILABLE on kg error", async () => {
    const entityList = vi.fn<KnowledgeGraphService["entityList"]>(() => {
      throw new Error("DB error");
    });
    const matcher = vi.fn<
      (text: string, entities: MatchableEntity[]) => MatchResult[]
    >(() => []);
    const fetcher = createRetrievedFetcher({
      kgService: { entityList },
      matchEntities: matcher,
    });

    const result = await fetcher({
      ...BASE_REQUEST,
      additionalInput: "小雨推开门走了进来",
    });

    expect(result.chunks).toEqual([]);
    expect(result.warnings?.[0]).toContain("KG_UNAVAILABLE");
    expect(matcher).not.toHaveBeenCalled();
  });

  it("should degrade with ENTITY_MATCH_FAILED on matcher error", async () => {
    const entityList = vi.fn<KnowledgeGraphService["entityList"]>(() => ({
      ok: true,
      data: {
        items: [createEntity({ id: "e1", name: "林小雨", aliases: ["小雨"] })],
        totalCount: 1,
      },
    }));
    const matcher = vi.fn<
      (text: string, entities: MatchableEntity[]) => MatchResult[]
    >(() => {
      throw new Error("pattern compile failed");
    });
    const fetcher = createRetrievedFetcher({
      kgService: { entityList },
      matchEntities: matcher,
    });

    const result = await fetcher({
      ...BASE_REQUEST,
      additionalInput: "小雨推开门走了进来",
    });

    expect(result.chunks).toEqual([]);
    expect(result.warnings?.[0]).toContain("ENTITY_MATCH_FAILED");
  });
});

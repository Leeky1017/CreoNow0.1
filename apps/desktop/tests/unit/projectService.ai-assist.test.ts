import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  createProjectService,
  type ProjectService,
} from "../../main/src/services/projects/projectService";

import {
  createNoopLogger,
  createProjectTestDb,
} from "./projectService.test-helpers";

async function createDraftService(): Promise<{
  userDataDir: string;
  db: ReturnType<typeof createProjectTestDb>;
  service: Pick<ProjectService, "createAiAssistDraft">;
}> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-pm1-ai-"),
  );
  const db = createProjectTestDb();
  const service = createProjectService({
    db,
    userDataDir,
    logger: createNoopLogger(),
  });

  return {
    userDataDir,
    db,
    service: { createAiAssistDraft: service.createAiAssistDraft },
  };
}

async function cleanupDraftService(args: {
  userDataDir: string;
  db: ReturnType<typeof createProjectTestDb>;
}): Promise<void> {
  args.db.close();
  await fs.rm(args.userDataDir, { recursive: true, force: true });
}

describe("projectService AI assist draft", () => {
  it("should build a novel draft from a novel prompt", async () => {
    const ctx = await createDraftService();

    try {
      const result = ctx.service.createAiAssistDraft({
        prompt: "帮我创建一部校园推理小说，主角是高中女生侦探",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error("expected AI assist draft to succeed");
      }

      expect(result.data).toMatchObject({
        name: "AI 辅助项目",
        type: "novel",
        description: "帮我创建一部校园推理小说，主角是高中女生侦探",
      });
      expect(result.data.chapterOutlines).toHaveLength(5);
      expect(result.data.characters).toHaveLength(3);
    } finally {
      await cleanupDraftService(ctx);
    }
  });

  it("should classify screenplay prompts as screenplay drafts", async () => {
    const ctx = await createDraftService();

    try {
      const result = ctx.service.createAiAssistDraft({
        prompt: "请帮我起草一个悬疑剧本，包含三幕结构",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error("expected screenplay prompt to succeed");
      }

      expect(result.data.type).toBe("screenplay");
      expect(result.data.description).toBe(
        "请帮我起草一个悬疑剧本，包含三幕结构",
      );
    } finally {
      await cleanupDraftService(ctx);
    }
  });

  it("should reject blank prompts", async () => {
    const ctx = await createDraftService();

    try {
      const result = ctx.service.createAiAssistDraft({
        prompt: "   ",
      });

      expect(result.ok).toBe(false);
      if (result.ok) {
        throw new Error("expected blank prompt to be rejected");
      }

      expect(result.error).toMatchObject({
        code: "INVALID_ARGUMENT",
        message: "prompt is required",
      });
    } finally {
      await cleanupDraftService(ctx);
    }
  });
});

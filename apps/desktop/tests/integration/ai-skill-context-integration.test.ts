import assert from "node:assert/strict";
import http from "node:http";

import Database from "better-sqlite3";

import type { Logger } from "../../main/src/logging/logger";
import { createAiProxySettingsService } from "../../main/src/services/ai/aiProxySettingsService";
import { createAiService } from "../../main/src/services/ai/aiService";
import {
  buildLLMMessages,
  estimateMessageTokens,
  type LLMMessage,
} from "../../main/src/services/ai/buildLLMMessages";
import { assembleSystemPrompt } from "../../main/src/services/ai/assembleSystemPrompt";
import { GLOBAL_IDENTITY_PROMPT } from "../../main/src/services/ai/identityPrompt";
import {
  createContextLayerAssemblyService,
  type ContextAssembleResult,
} from "../../main/src/services/context/layerAssemblyService";
import type {
  KnowledgeEntity,
  KnowledgeGraphService,
} from "../../main/src/services/kg/kgService";
import type {
  MemoryInjectionItem,
  MemoryService,
} from "../../main/src/services/memory/memoryService";
import {
  createSkillExecutor,
  type SkillExecutor,
} from "../../main/src/services/skills/skillExecutor";
import type { AiStreamDoneEvent, AiStreamEvent } from "@shared/types/ai";
import type { IpcError } from "@shared/types/ipc-generated";

type JsonRecord = Record<string, unknown>;

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function createNoopLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function asRecord(x: unknown): JsonRecord | null {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    return null;
  }
  return x as JsonRecord;
}

function parseOpenAiMessages(body: unknown): OpenAiMessage[] {
  const record = asRecord(body);
  const messages = record?.messages;
  if (!Array.isArray(messages)) {
    return [];
  }

  const parsed: OpenAiMessage[] = [];
  for (const raw of messages) {
    const row = asRecord(raw);
    const role = row?.role;
    const content = row?.content;
    if (
      (role === "system" || role === "user" || role === "assistant") &&
      typeof content === "string"
    ) {
      parsed.push({ role, content });
    }
  }
  return parsed;
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(raw) as unknown);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function waitForDone(
  events: AiStreamEvent[],
  executionId: string,
  timeoutMs = 2_000,
): Promise<AiStreamDoneEvent> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const done = events.find(
      (event): event is AiStreamDoneEvent =>
        event.type === "done" && event.executionId === executionId,
    );
    if (done) {
      return done;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  throw new Error("timeout waiting for done event");
}

async function withOpenAiMockServer(args: {
  handler: (input: {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    body: JsonRecord;
  }) => Promise<void> | void;
  run: (input: { baseUrl: string }) => Promise<void>;
}): Promise<void> {
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
      res.writeHead(404).end();
      return;
    }

    const body = (await readJson(req)) as JsonRecord;
    await args.handler({ req, res, body });
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to bind server");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await args.run({ baseUrl });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

function createMutableKgService(args: {
  projectId: string;
  always: KnowledgeEntity[];
  detected: KnowledgeEntity[];
}): Pick<KnowledgeGraphService, "entityList"> {
  let alwaysEntities = [...args.always];
  let detectedEntities = [...args.detected];

  return {
    entityList: ({ projectId, filter }) => {
      if (projectId !== args.projectId) {
        return {
          ok: true,
          data: { items: [], total: 0 },
        };
      }
      const level = filter?.aiContextLevel;
      if (level === "always") {
        return {
          ok: true,
          data: {
            items: alwaysEntities,
            total: alwaysEntities.length,
          },
        };
      }
      if (level === "when_detected") {
        return {
          ok: true,
          data: {
            items: detectedEntities,
            total: detectedEntities.length,
          },
        };
      }
      const merged = [...alwaysEntities, ...detectedEntities];
      return {
        ok: true,
        data: {
          items: merged,
          total: merged.length,
        },
      };
    },
    setAlwaysEntities: (entities: KnowledgeEntity[]) => {
      alwaysEntities = [...entities];
    },
    setDetectedEntities: (entities: KnowledgeEntity[]) => {
      detectedEntities = [...entities];
    },
  } as Pick<KnowledgeGraphService, "entityList">;
}

function createMemoryServiceStub(args: {
  items?: MemoryInjectionItem[];
  error?: IpcError;
}): Pick<MemoryService, "previewInjection"> {
  return {
    previewInjection: () => {
      if (args.error) {
        return {
          ok: false,
          error: args.error,
        };
      }
      return {
        ok: true,
        data: {
          items: args.items ?? [],
          mode: "deterministic",
        },
      };
    },
  };
}

function createSkillRunExecutor(args: {
  aiService: ReturnType<typeof createAiService>;
  contextService: {
    assemble: (input: {
      projectId: string;
      documentId: string;
      cursorPosition: number;
      skillId: string;
      additionalInput?: string;
      provider?: string;
      model?: string;
    }) => Promise<ContextAssembleResult>;
  };
}): SkillExecutor {
  return createSkillExecutor({
    resolveSkill: () => {
      return {
        ok: true,
        data: {
          id: "builtin:continue",
          enabled: true,
          valid: true,
          prompt: {
            system: "continue-system",
            user: "{{input}}",
          },
          inputType: "document",
        },
      };
    },
    runSkill: async (input) => {
      return await args.aiService.runSkill(input);
    },
    assembleContext: async (input) => {
      return await args.contextService.assemble(input);
    },
  });
}

function createKnowledgeEntity(args: {
  id: string;
  projectId: string;
  name: string;
  description: string;
  level: "always" | "when_detected";
  aliases?: string[];
}): KnowledgeEntity {
  return {
    id: args.id,
    projectId: args.projectId,
    type: "character",
    name: args.name,
    description: args.description,
    attributes: { mood: "calm" },
    aiContextLevel: args.level,
    aliases: args.aliases ?? [],
    version: 1,
    createdAt: "2026-02-13T00:00:00.000Z",
    updatedAt: "2026-02-13T00:00:00.000Z",
  };
}

// AIS-ERR-S1
// should return AI_NOT_CONFIGURED on run path when API key is missing
{
  const service = createAiService({
    logger: createNoopLogger(),
    env: {
      CREONOW_AI_PROVIDER: "openai",
      CREONOW_AI_BASE_URL: "https://api.openai.com",
    },
    sleep: async () => {},
    rateLimitPerMinute: 1_000,
  });

  const result = await service.runSkill({
    skillId: "builtin:polish",
    input: "input",
    mode: "ask",
    model: "gpt-5.2",
    stream: false,
    ts: Date.now(),
    emitEvent: () => {},
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected missing key to be rejected");
  }
  assert.equal(result.error.code, "AI_NOT_CONFIGURED");
  assert.match(result.error.message, /api key/i);
}

// AIS-HISTORY-S1 / AIS-HISTORY-S2
// should include prior turns and trim oldest history by runtime token budget
{
  const originalFetch = globalThis.fetch;
  const requestBodies: JsonRecord[] = [];
  let requestCount = 0;

  try {
    globalThis.fetch = (async (_input, init) => {
      const rawBody =
        typeof init?.body === "string" ? init.body : JSON.stringify({});
      const body = JSON.parse(rawBody) as JsonRecord;
      requestBodies.push(body);

      requestCount += 1;
      const output = `a${requestCount.toString()}`;

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: output } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

    const systemText = assembleSystemPrompt({
      globalIdentity: GLOBAL_IDENTITY_PROMPT,
    });
    const budget =
      estimateMessageTokens(systemText) + estimateMessageTokens("u3") + 2;

    const service = createAiService({
      logger: createNoopLogger(),
      env: {
        CREONOW_AI_PROVIDER: "openai",
        CREONOW_AI_BASE_URL: "https://api.openai.com",
        CREONOW_AI_API_KEY: "sk-test",
        CREONOW_AI_CHAT_HISTORY_TOKEN_BUDGET: budget.toString(),
      },
      sleep: async () => {},
      rateLimitPerMinute: 1_000,
    });

    await service.runSkill({
      skillId: "builtin:polish",
      input: "u1",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId: "proj-history", documentId: "doc-1" },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    await service.runSkill({
      skillId: "builtin:polish",
      input: "u2",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId: "proj-history", documentId: "doc-1" },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    await service.runSkill({
      skillId: "builtin:polish",
      input: "u3",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId: "proj-history", documentId: "doc-1" },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    const thirdBody = requestBodies[2];
    assert.ok(thirdBody, "expected third request body");

    const actual = parseOpenAiMessages(thirdBody);
    const expected = buildLLMMessages({
      systemPrompt: systemText,
      history: [
        { role: "user", content: "u1" },
        { role: "assistant", content: "a1" },
        { role: "user", content: "u2" },
        { role: "assistant", content: "a2" },
      ],
      currentUserMessage: "u3",
      maxTokenBudget: budget,
    });

    assert.equal(
      expected.length,
      4,
      "expected history trimming to keep 2 turns",
    );
    assert.deepEqual(actual, expected as LLMMessage[]);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// G1
// should complete skill run -> context assemble -> LLM(mock) -> stream
{
  const projectId = "proj-g1";
  const kgService = createMutableKgService({
    projectId,
    always: [
      createKnowledgeEntity({
        id: "kg-always-1",
        projectId,
        name: "林远",
        description: "冷静寡言",
        level: "always",
      }),
    ],
    detected: [
      createKnowledgeEntity({
        id: "kg-detected-1",
        projectId,
        name: "黎夏",
        description: "侦查敏锐",
        level: "when_detected",
      }),
    ],
  });

  const memoryService = createMemoryServiceStub({
    items: [
      {
        id: "mem-1",
        type: "preference",
        scope: "project",
        origin: "manual",
        content: "偏好短句，节奏紧凑",
        reason: { kind: "deterministic" },
      },
    ],
  });

  const contextService = createContextLayerAssemblyService(undefined, {
    kgService,
    memoryService,
  });

  const requestBodies: JsonRecord[] = [];
  await withOpenAiMockServer({
    handler: ({ res, body }) => {
      requestBodies.push(body);

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "flow-" } }] })}\n\n`,
      );
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "ok" } }] })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
    },
    run: async ({ baseUrl }) => {
      const aiService = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "sk-g1",
        },
        sleep: async () => {},
        rateLimitPerMinute: 1_000,
      });

      const executor = createSkillRunExecutor({
        aiService,
        contextService,
      });

      const events: AiStreamEvent[] = [];
      const run = await executor.execute({
        skillId: "builtin:continue",
        input: "黎夏看向林远并继续推进。",
        mode: "ask",
        model: "gpt-5.2",
        context: { projectId, documentId: "doc-g1" },
        stream: true,
        ts: Date.now(),
        emitEvent: (event) => {
          events.push(event);
        },
      });

      assert.equal(run.ok, true);
      if (!run.ok) {
        assert.fail("expected skill execution to start successfully");
      }

      const done = await waitForDone(events, run.data.executionId);
      assert.equal(done.terminal, "completed");
      assert.equal(done.outputText, "flow-ok");

      const firstBody = requestBodies[0];
      assert.ok(firstBody, "expected first request body");
      const systemText =
        parseOpenAiMessages(firstBody).find((item) => item.role === "system")
          ?.content ?? "";

      assert.match(systemText, /## Rules/);
      assert.match(systemText, /## Settings/);
      assert.match(systemText, /林远/);
      assert.match(systemText, /偏好短句，节奏紧凑/);
    },
  });
}

// G2
// should reflect KG updates in subsequent runtime context requests
{
  const projectId = "proj-g2";
  let description = "初始设定";

  const kgService = {
    entityList: ({ projectId: pid, filter }) => {
      if (pid !== projectId) {
        return { ok: true, data: { items: [], total: 0 } };
      }
      if (filter?.aiContextLevel === "always") {
        return {
          ok: true,
          data: {
            items: [
              createKnowledgeEntity({
                id: "kg-g2-1",
                projectId,
                name: "顾澜",
                description,
                level: "always",
              }),
            ],
            total: 1,
          },
        };
      }
      return { ok: true, data: { items: [], total: 0 } };
    },
  } satisfies Pick<KnowledgeGraphService, "entityList">;

  const contextService = createContextLayerAssemblyService(undefined, {
    kgService,
    memoryService: createMemoryServiceStub({}),
  });

  const requestBodies: JsonRecord[] = [];
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (_input, init) => {
      const rawBody =
        typeof init?.body === "string" ? init.body : JSON.stringify({});
      requestBodies.push(JSON.parse(rawBody) as JsonRecord);
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "ok" } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

    const aiService = createAiService({
      logger: createNoopLogger(),
      env: {
        CREONOW_AI_PROVIDER: "openai",
        CREONOW_AI_BASE_URL: "https://api.openai.com",
        CREONOW_AI_API_KEY: "sk-g2",
      },
      sleep: async () => {},
      rateLimitPerMinute: 1_000,
    });

    const executor = createSkillRunExecutor({
      aiService,
      contextService,
    });

    await executor.execute({
      skillId: "builtin:continue",
      input: "顾澜抬头。",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId, documentId: "doc-g2" },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    description = "更新后设定";

    await executor.execute({
      skillId: "builtin:continue",
      input: "顾澜继续前进。",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId, documentId: "doc-g2" },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    const firstSystem =
      parseOpenAiMessages(requestBodies[0]).find(
        (item) => item.role === "system",
      )?.content ?? "";
    const secondSystem =
      parseOpenAiMessages(requestBodies[1]).find(
        (item) => item.role === "system",
      )?.content ?? "";

    assert.match(firstSystem, /初始设定/);
    assert.match(secondSystem, /更新后设定/);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// G3
// should consume persisted API key from settings in upstream authorization header
{
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE settings (
      scope TEXT NOT NULL,
      key TEXT NOT NULL,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (scope, key)
    )
  `);

  const settingsService = createAiProxySettingsService({
    db,
    logger: createNoopLogger(),
    secretStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (plainText: string) =>
        Buffer.from(`enc:${plainText}`, "utf8"),
      decryptString: (cipherText: Buffer) => {
        const text = cipherText.toString("utf8");
        return text.startsWith("enc:") ? text.slice(4) : text;
      },
    },
  });

  const update = settingsService.update({
    patch: {
      providerMode: "openai-byok",
      openAiByokBaseUrl: "https://api.openai.com",
      openAiByokApiKey: "sk-persisted",
    },
  });
  assert.equal(update.ok, true);

  const originalFetch = globalThis.fetch;
  const authHeaders: string[] = [];

  try {
    globalThis.fetch = (async (_input, init) => {
      const headers = new Headers(init?.headers);
      authHeaders.push(headers.get("authorization") ?? "");
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "ok" } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

    const aiService = createAiService({
      logger: createNoopLogger(),
      env: {},
      getProxySettings: () => {
        const raw = settingsService.getRaw();
        return raw.ok ? raw.data : null;
      },
      sleep: async () => {},
      rateLimitPerMinute: 1_000,
    });

    const result = await aiService.runSkill({
      skillId: "builtin:polish",
      input: "text",
      mode: "ask",
      model: "gpt-5.2",
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    assert.equal(result.ok, true);
    assert.equal(authHeaders[0], "Bearer sk-persisted");
  } finally {
    globalThis.fetch = originalFetch;
    db.close();
  }
}

// G5
// should keep AI available when KG + Memory are unavailable
{
  const contextService = createContextLayerAssemblyService(undefined, {
    kgService: {
      entityList: () => {
        return {
          ok: false,
          error: {
            code: "DB_ERROR",
            message: "kg unavailable",
          },
        };
      },
    },
    memoryService: createMemoryServiceStub({
      error: {
        code: "DB_ERROR",
        message: "memory unavailable",
      },
    }),
  });

  const assembled = await contextService.assemble({
    projectId: "proj-g5",
    documentId: "doc-g5",
    cursorPosition: 0,
    skillId: "builtin:continue",
    additionalInput: "继续写作",
    provider: "ai-service",
    model: "gpt-5.2",
  });

  assert.equal(
    assembled.warnings.some((warning) => warning.startsWith("KG_UNAVAILABLE")),
    true,
  );
  assert.equal(
    assembled.warnings.some((warning) =>
      warning.startsWith("MEMORY_UNAVAILABLE"),
    ),
    true,
  );

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (_input, _init) => {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "degrade-ok" } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

    const aiService = createAiService({
      logger: createNoopLogger(),
      env: {
        CREONOW_AI_PROVIDER: "openai",
        CREONOW_AI_BASE_URL: "https://api.openai.com",
        CREONOW_AI_API_KEY: "sk-g5",
      },
      sleep: async () => {},
      rateLimitPerMinute: 1_000,
    });

    const executor = createSkillRunExecutor({
      aiService,
      contextService,
    });

    const run = await executor.execute({
      skillId: "builtin:continue",
      input: "继续写作",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId: "proj-g5", documentId: "doc-g5" },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    assert.equal(run.ok, true);
    if (!run.ok) {
      assert.fail("expected degraded path to keep skill run available");
    }
    assert.equal(run.data.outputText, "degrade-ok");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

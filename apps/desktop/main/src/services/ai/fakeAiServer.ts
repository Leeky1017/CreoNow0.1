import http from "node:http";
import type { AddressInfo } from "node:net";

import type { Logger } from "../../logging/logger";

export type FakeAiMode = "success" | "delay" | "timeout" | "upstream-error";

export type FakeAiServer = {
  baseUrl: string;
  close: () => Promise<void>;
};

type JsonObject = Record<string, unknown>;

const DEFAULT_DELAY_MS = 600;
const STREAM_CHUNK_DELAY_MS = 40;
const STREAM_CHUNK_SIZE = 6;

/**
 * Sleep for a fixed amount of time.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Read and parse a JSON request body.
 *
 * Why: fake server must be deterministic and must not crash on invalid payloads.
 */
async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Narrow an unknown value to a JSON object.
 */
function asObject(x: unknown): JsonObject | null {
  if (typeof x !== "object" || x === null) {
    return null;
  }
  return x as JsonObject;
}

function collectMessageContentText(content: unknown): string[] {
  if (typeof content === "string") {
    return [content];
  }

  if (!Array.isArray(content)) {
    return [];
  }

  const texts: string[] = [];
  for (const partValue of content) {
    const part = asObject(partValue);
    const text = part ? part.text : null;
    if (typeof text === "string") {
      texts.push(text);
    }
  }
  return texts;
}

function extractRequestText(body: unknown): string {
  const obj = asObject(body);
  if (!obj) {
    return "";
  }

  const texts: string[] = [];

  const system = obj.system;
  if (typeof system === "string") {
    texts.push(system);
  } else if (Array.isArray(system)) {
    for (const partValue of system) {
      const part = asObject(partValue);
      const text = part ? part.text : null;
      if (typeof text === "string") {
        texts.push(text);
      }
    }
  }

  const messages = Array.isArray(obj.messages) ? obj.messages : [];
  for (const messageValue of messages) {
    const message = asObject(messageValue);
    if (!message) {
      continue;
    }
    texts.push(...collectMessageContentText(message.content));
  }

  return texts.join("\n");
}

/**
 * Extract user text from an OpenAI chat completion request.
 */
function extractOpenAiUserText(body: unknown): string | null {
  const text = extractRequestText(body);
  return text.length > 0 ? text : null;
}

/**
 * Extract user text from an Anthropic messages request.
 */
function extractAnthropicUserText(body: unknown): string | null {
  const text = extractRequestText(body);
  return text.length > 0 ? text : null;
}

/**
 * Decide fake mode based on env override and user text markers.
 *
 * Why: E2E must be able to deterministically trigger all branches.
 */
function resolveFakeMode(args: {
  env: NodeJS.ProcessEnv;
  userText: string;
}): FakeAiMode {
  const forced = args.env.CREONOW_E2E_AI_MODE;
  if (
    forced === "success" ||
    forced === "delay" ||
    forced === "timeout" ||
    forced === "upstream-error"
  ) {
    return forced;
  }

  if (args.userText.includes("E2E_UPSTREAM_ERROR")) {
    return "upstream-error";
  }
  if (args.userText.includes("E2E_TIMEOUT")) {
    return "timeout";
  }
  if (args.userText.includes("E2E_DELAY")) {
    return "delay";
  }
  return "success";
}

/**
 * Extract the inner text from a `<text>...</text>` block if present.
 *
 * Why: built-in skills wrap user input in `<text>` blocks, but E2E assertions
 * want to treat the input as the "payload" (not the surrounding template).
 */
function extractTextBlockPayload(userText: string): string | null {
  const open = "<text>";
  const close = "</text>";

  const start = userText.indexOf(open);
  if (start < 0) {
    return null;
  }
  const end = userText.indexOf(close, start + open.length);
  if (end < 0) {
    return null;
  }

  return userText.slice(start + open.length, end).trim();
}

/**
 * Extract a markdown block that follows a heading until the next heading.
 *
 * Why: context engineering emits deterministic markdown headings (e.g.
 * `### immediate:ai_panel_input`) while E2E assertions want to focus on the
 * immediate payload text.
 */
function extractMarkdownHeadingBlockPayload(args: {
  text: string;
  heading: string;
}): string | null {
  const start = args.text.indexOf(args.heading);
  if (start < 0) {
    return null;
  }

  const afterHeading = args.text.slice(start + args.heading.length);
  const lines = afterHeading.split("\n");
  // Drop the rest of the heading line (usually empty because heading ends the line).
  lines.shift();

  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift();
  }

  const collected: string[] = [];
  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      break;
    }
    collected.push(line);
  }

  const payload = collected.join("\n").trim();
  return payload.length > 0 ? payload : null;
}

/**
 * Extract the context-engineering `Immediate` payload if present.
 */
function extractContextImmediatePayload(userText: string): string | null {
  return extractMarkdownHeadingBlockPayload({
    text: userText,
    heading: "### immediate:ai_panel_input",
  });
}

/**
 * Write an SSE event block.
 */
function writeSse(args: {
  res: http.ServerResponse;
  event?: string;
  data: unknown;
}): void {
  if (args.event) {
    args.res.write(`event: ${args.event}\n`);
  }
  args.res.write(`data: ${JSON.stringify(args.data)}\n\n`);
}

/**
 * Stream text as multiple SSE deltas.
 */
async function streamText(args: {
  res: http.ServerResponse;
  text: string;
  onChunk: (delta: string) => void;
}): Promise<void> {
  for (let i = 0; i < args.text.length; i += STREAM_CHUNK_SIZE) {
    const delta = args.text.slice(i, i + STREAM_CHUNK_SIZE);
    args.onChunk(delta);
    await sleep(STREAM_CHUNK_DELAY_MS);
  }
}

/**
 * Start the Fake AI server (local HTTP).
 *
 * Why: Windows CI/E2E must not rely on real network or real API keys.
 */
export async function startFakeAiServer(deps: {
  logger: Logger;
  env: NodeJS.ProcessEnv;
}): Promise<FakeAiServer> {
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (req.method === "GET" && req.url === "/v1/models") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          object: "list",
          data: [
            { id: "gpt-5.2", object: "model" },
            { id: "deepseek", object: "model" },
            { id: "claude-opus", object: "model" },
            { id: "creo-w", object: "model" },
          ],
        }),
      );
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(404);
      res.end();
      return;
    }

    const url = req.url ?? "";
    const isOpenAi = url.startsWith("/v1/chat/completions");
    const isAnthropic = url.startsWith("/v1/messages");
    if (!isOpenAi && !isAnthropic) {
      res.writeHead(404);
      res.end();
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: { message: "Invalid JSON body" },
          details: { message: error instanceof Error ? error.message : null },
        }),
      );
      return;
    }

    const userText =
      (isOpenAi
        ? extractOpenAiUserText(body)
        : extractAnthropicUserText(body)) ?? "";
    const mode = resolveFakeMode({ env: deps.env, userText });

    if (mode === "upstream-error") {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Fake upstream error" } }));
      return;
    }

    const bodyObj = asObject(body);
    const stream = Boolean(bodyObj?.stream);

    if (mode === "timeout") {
      // Intentionally never respond; client must enforce timeout and abort.
      req.on("close", () => {
        try {
          res.end();
        } catch {
          // Ignore.
        }
      });
      return;
    }

    if (mode === "delay") {
      await sleep(DEFAULT_DELAY_MS);
    }

    const payloadText = userText.includes("***REDACTED***")
      ? userText
      : (extractContextImmediatePayload(userText) ??
        extractTextBlockPayload(userText) ??
        userText);
    const resultText = `E2E_RESULT: ${payloadText}`.trim();

    if (!stream) {
      res.writeHead(200, { "Content-Type": "application/json" });
      if (isOpenAi) {
        res.end(
          JSON.stringify({
            id: "fake-openai-1",
            object: "chat.completion",
            choices: [
              { index: 0, message: { role: "assistant", content: resultText } },
            ],
          }),
        );
        return;
      }

      res.end(
        JSON.stringify({
          id: "fake-anthropic-1",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: resultText }],
        }),
      );
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    if (isOpenAi) {
      await streamText({
        res,
        text: resultText,
        onChunk: (delta) => {
          writeSse({
            res,
            data: { choices: [{ index: 0, delta: { content: delta } }] },
          });
        },
      });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    writeSse({
      res,
      event: "message_start",
      data: { type: "message_start", message: { id: "fake-msg-1" } },
    });
    writeSse({
      res,
      event: "content_block_start",
      data: {
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "" },
      },
    });

    await streamText({
      res,
      text: resultText,
      onChunk: (delta) => {
        writeSse({
          res,
          event: "content_block_delta",
          data: {
            type: "content_block_delta",
            index: 0,
            delta: { type: "text_delta", text: delta },
          },
        });
      },
    });

    writeSse({
      res,
      event: "content_block_stop",
      data: { type: "content_block_stop", index: 0 },
    });
    writeSse({
      res,
      event: "message_stop",
      data: { type: "message_stop" },
    });
    res.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const addr = server.address();
  if (!addr || typeof addr === "string") {
    throw new Error("Fake AI server failed to bind");
  }
  const port = (addr as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  deps.logger.info("ai_fake_server_started", { baseUrl });

  return {
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    },
  };
}

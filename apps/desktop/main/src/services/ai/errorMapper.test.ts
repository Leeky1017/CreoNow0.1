import { describe, expect, it } from "vitest";

import {
  buildUpstreamHttpError,
  mapUpstreamStatusToIpcErrorCode,
} from "./errorMapper";

function makeResponse(
  status: number,
  body: string,
  contentType = "application/json",
): Response {
  return new Response(body, {
    status,
    headers: { "content-type": contentType },
  });
}

describe("mapUpstreamStatusToIpcErrorCode", () => {
  it("maps auth statuses to AI_AUTH_FAILED", () => {
    expect(mapUpstreamStatusToIpcErrorCode(401)).toBe("AI_AUTH_FAILED");
    expect(mapUpstreamStatusToIpcErrorCode(403)).toBe("AI_AUTH_FAILED");
  });

  it("maps 429 to AI_RATE_LIMITED", () => {
    expect(mapUpstreamStatusToIpcErrorCode(429)).toBe("AI_RATE_LIMITED");
  });

  it("maps all other statuses to LLM_API_ERROR", () => {
    expect(mapUpstreamStatusToIpcErrorCode(400)).toBe("LLM_API_ERROR");
    expect(mapUpstreamStatusToIpcErrorCode(500)).toBe("LLM_API_ERROR");
  });
});

describe("buildUpstreamHttpError", () => {
  it("reads nested JSON error.message", async () => {
    const res = makeResponse(
      500,
      JSON.stringify({ error: { message: "internal error" } }),
    );
    const err = await buildUpstreamHttpError({
      res,
      fallbackMessage: "fallback",
    });

    expect(err.code).toBe("LLM_API_ERROR");
    expect(err.message).toBe("internal error");
    expect(err.details).toMatchObject({
      status: 500,
      upstreamMessage: "internal error",
    });
  });

  it("falls back to top-level JSON message", async () => {
    const res = makeResponse(
      500,
      JSON.stringify({ message: "top level error" }),
    );
    const err = await buildUpstreamHttpError({
      res,
      fallbackMessage: "fallback",
    });

    expect(err.message).toBe("top level error");
    expect(err.details).toMatchObject({
      status: 500,
      upstreamMessage: "top level error",
    });
  });

  it("falls back when JSON is invalid", async () => {
    const res = makeResponse(500, "{invalid-json");
    const err = await buildUpstreamHttpError({
      res,
      fallbackMessage: "fallback",
    });

    expect(err.message).toBe("fallback");
    expect(err.details).toMatchObject({
      status: 500,
      upstreamMessage: "fallback",
    });
  });

  it("falls back for non-JSON plain text body", async () => {
    const res = makeResponse(500, "Internal Server Error", "text/plain");
    const err = await buildUpstreamHttpError({
      res,
      fallbackMessage: "fallback",
    });

    expect(err.message).toBe("fallback");
    expect(err.details).toMatchObject({
      status: 500,
      upstreamMessage: "fallback",
    });
  });

  it("overrides message for auth and rate-limit statuses", async () => {
    const authRes = makeResponse(
      401,
      JSON.stringify({ error: { message: "bad key" } }),
    );
    const authErr = await buildUpstreamHttpError({
      res: authRes,
      fallbackMessage: "fallback",
    });
    expect(authErr.code).toBe("AI_AUTH_FAILED");
    expect(authErr.message).toBe("AI upstream unauthorized");
    expect(authErr.details).toMatchObject({
      status: 401,
      upstreamMessage: "bad key",
    });

    const rateRes = makeResponse(
      429,
      JSON.stringify({ error: { message: "quota exceeded" } }),
    );
    const rateErr = await buildUpstreamHttpError({
      res: rateRes,
      fallbackMessage: "fallback",
    });
    expect(rateErr.code).toBe("AI_RATE_LIMITED");
    expect(rateErr.message).toBe("AI upstream rate limited");
    expect(rateErr.details).toMatchObject({
      status: 429,
      upstreamMessage: "quota exceeded",
    });
  });
});

import { describe, expect, it } from "vitest";

import { validateProviderPreflight } from "../providerPreflight";
import { isModelValidForProvider } from "../knownModels";

describe("validateProviderPreflight", () => {
  describe("API key validation", () => {
    it("rejects missing API key for non-proxy providers", () => {
      const result = validateProviderPreflight({
        provider: "openai",
        model: "gpt-4o",
        apiKey: undefined,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PREFLIGHT_MISSING_API_KEY");
      }
    });

    it("rejects empty API key for non-proxy providers", () => {
      const result = validateProviderPreflight({
        provider: "anthropic",
        model: "claude-3-sonnet",
        apiKey: "   ",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PREFLIGHT_MISSING_API_KEY");
      }
    });

    it("rejects unrecognized API key format", () => {
      const result = validateProviderPreflight({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "not-a-real-key",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PREFLIGHT_INVALID_API_KEY_FORMAT");
      }
    });

    it("accepts valid API key format (sk-prefix)", () => {
      const result = validateProviderPreflight({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "sk-abcdef1234",
      });
      expect(result.ok).toBe(true);
    });

    it("skips API key check for proxy provider", () => {
      const result = validateProviderPreflight({
        provider: "proxy",
        model: "any-model",
        apiKey: undefined,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("model validation", () => {
    it("rejects empty model name", () => {
      const result = validateProviderPreflight({
        provider: "openai",
        model: "",
        apiKey: "sk-abcdef1234",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PREFLIGHT_MISSING_MODEL");
      }
    });

    it("rejects whitespace-only model name", () => {
      const result = validateProviderPreflight({
        provider: "openai",
        model: "   ",
        apiKey: "sk-abcdef1234",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PREFLIGHT_MISSING_MODEL");
      }
    });
  });

  describe("model ↔ provider compatibility", () => {
    it("rejects Anthropic model on OpenAI provider", () => {
      const result = validateProviderPreflight({
        provider: "openai",
        model: "claude-3-sonnet",
        apiKey: "sk-abcdef1234",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PREFLIGHT_MODEL_PROVIDER_MISMATCH");
      }
    });

    it("rejects OpenAI model on Anthropic provider", () => {
      const result = validateProviderPreflight({
        provider: "anthropic",
        model: "gpt-4o",
        apiKey: "sk-abcdef1234",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PREFLIGHT_MODEL_PROVIDER_MISMATCH");
      }
    });

    it("accepts GPT model on OpenAI provider", () => {
      const result = validateProviderPreflight({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "sk-abcdef1234",
      });
      expect(result.ok).toBe(true);
    });

    it("accepts Claude model on Anthropic provider", () => {
      const result = validateProviderPreflight({
        provider: "anthropic",
        model: "claude-3-sonnet-20240229",
        apiKey: "sk-abcdef1234",
      });
      expect(result.ok).toBe(true);
    });

    it("accepts any model on proxy provider", () => {
      const result = validateProviderPreflight({
        provider: "proxy",
        model: "custom-model",
        apiKey: undefined,
      });
      expect(result.ok).toBe(true);
    });
  });
});

describe("isModelValidForProvider", () => {
  it("accepts GPT-4 variants for openai", () => {
    expect(isModelValidForProvider("openai", "gpt-4o")).toBe(true);
    expect(isModelValidForProvider("openai", "gpt-4-turbo")).toBe(true);
  });

  it("accepts o1/o3 models for openai", () => {
    expect(isModelValidForProvider("openai", "o1-preview")).toBe(true);
    expect(isModelValidForProvider("openai", "o3-mini")).toBe(true);
  });

  it("rejects claude models for openai", () => {
    expect(isModelValidForProvider("openai", "claude-3-opus")).toBe(false);
  });

  it("accepts claude models for anthropic", () => {
    expect(isModelValidForProvider("anthropic", "claude-3-opus")).toBe(true);
    expect(isModelValidForProvider("anthropic", "claude-3.5-sonnet")).toBe(true);
  });

  it("rejects gpt models for anthropic", () => {
    expect(isModelValidForProvider("anthropic", "gpt-4o")).toBe(false);
  });

  it("accepts any model for unknown provider", () => {
    expect(isModelValidForProvider("unknown", "whatever")).toBe(true);
  });
});

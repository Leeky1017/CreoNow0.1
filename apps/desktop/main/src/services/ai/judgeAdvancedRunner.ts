import type { Logger } from "../../logging/logger";
import type { JudgeSeverity } from "@shared/types/judge";

type JudgeIssue = {
  severity: JudgeSeverity;
  label: string;
};

export type ProviderConfig = {
  baseUrl: string;
  apiKey: string | null;
  model: string;
};

const JUDGE_SYSTEM_PROMPT = `你是一位专业的创意写作质量评审官。分析给定文本在指定创作约束下的质量问题。

请以 JSON 数组格式返回发现的问题，每个问题包含：
- severity: "high" | "medium" | "low"
- label: 简短的中文描述

规则：
1. 角色/视角一致性：文本是否始终符合叙述视角约束
2. 风格一致性：语气、措辞、节奏是否统一
3. 叙事连贯性：逻辑链是否断裂，情节是否自洽
4. 如果没有发现问题，返回空数组 []

只返回 JSON 数组，不要返回其他内容。`;

function buildUserPrompt(text: string, contextSummary: string): string {
  return `创作约束：${contextSummary}\n\n待评估文本：\n${text}`;
}

function parseJudgeResponse(raw: string): JudgeIssue[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) {
    return [];
  }

  const validSeverities = new Set<string>(["high", "medium", "low"]);
  return parsed
    .filter(
      (item): item is { severity: string; label: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).severity === "string" &&
        validSeverities.has(
          (item as Record<string, unknown>).severity as string,
        ) &&
        typeof (item as Record<string, unknown>).label === "string" &&
        ((item as Record<string, unknown>).label as string).length > 0,
    )
    .map((item) => ({
      severity: item.severity as JudgeSeverity,
      label: item.label,
    }));
}

export function createAdvancedCheckRunner(deps: {
  logger: Logger;
  getProviderConfig: () => ProviderConfig | null;
}): (args: {
  projectId: string;
  traceId: string;
  text: string;
  contextSummary: string;
}) => Promise<JudgeIssue[]> {
  return async (args) => {
    const cfg = deps.getProviderConfig();
    if (!cfg) {
      throw new Error("provider not configured");
    }

    const url = new URL("/v1/chat/completions", cfg.baseUrl).href;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cfg.apiKey) {
      headers["Authorization"] = `Bearer ${cfg.apiKey}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: JUDGE_SYSTEM_PROMPT },
            {
              role: "user",
              content: buildUserPrompt(args.text, args.contextSummary),
            },
          ],
          stream: false,
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`provider returned ${res.status}`);
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("invalid provider response shape");
      }

      return parseJudgeResponse(content);
    } finally {
      clearTimeout(timer);
    }
  };
}

export { parseJudgeResponse };

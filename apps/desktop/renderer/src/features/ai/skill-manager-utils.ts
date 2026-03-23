import type { IpcError } from "@shared/types/ipc-generated";

import { i18n } from "../../i18n";

import type {
  CustomSkillContextRules,
  SkillFormState,
} from "./skill-manager.types";

export const DEFAULT_FORM: SkillFormState = {
  name: "",
  description: "",
  promptTemplate: "",
  inputType: "selection",
  scope: "project",
  enabled: true,
  contextRulesText: "{}",
};

export function buildSkillDraftFromDescription(
  description: string,
): Pick<
  SkillFormState,
  "name" | "description" | "promptTemplate" | "inputType" | "contextRulesText"
> {
  const normalized = description.trim();
  const shortName =
    normalized.slice(0, 16) || i18n.t("ai.skillManager.aiGeneratedSkill");

  return {
    name: shortName,
    description: normalized,
    promptTemplate: `请根据以下要求处理文本：${normalized}\n\n原文：{{input}}`,
    inputType: normalized.includes("续写") ? "document" : "selection",
    contextRulesText: JSON.stringify({ style_guide: true }, null, 2),
  };
}

export function parseContextRulesText(
  text: string,
):
  | { ok: true; data: CustomSkillContextRules }
  | { ok: false; message: string } {
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {
        ok: false,
        message: i18n.t("ai.skillManager.contextRulesMustBeObject"),
      };
    }
    return { ok: true, data: parsed as CustomSkillContextRules };
  } catch {
    return {
      ok: false,
      message: i18n.t("ai.skillManager.contextRulesInvalidJson"),
    };
  }
}

export function readFieldName(error: IpcError): string | null {
  const details = error.details;
  if (!details || typeof details !== "object") {
    return null;
  }
  const fieldName = (details as { fieldName?: unknown }).fieldName;
  return typeof fieldName === "string" ? fieldName : null;
}

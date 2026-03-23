import type { IpcResponseData } from "@shared/types/ipc-generated";
export type CustomSkillListItem =
  IpcResponseData<"skill:custom:list">["items"][number];
export type SkillFormState = {
  name: string;
  description: string;
  promptTemplate: string;
  inputType: "selection" | "document";
  scope: "global" | "project";
  enabled: boolean;
  contextRulesText: string;
};
export type CustomSkillContextRules = Record<string, string | number | boolean>;
export type SkillDraftPick = Pick<
  SkillFormState,
  "name" | "description" | "promptTemplate" | "inputType" | "contextRulesText"
>;
export type ContextRulesParseResult =
  | { ok: true; data: CustomSkillContextRules }
  | { ok: false; message: string };

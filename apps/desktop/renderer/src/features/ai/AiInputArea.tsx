import React from "react";
import { useTranslation } from "react-i18next";
import type { SettingsTab } from "../settings-dialog/SettingsDialog";

import { Tooltip } from "../../components/primitives/Tooltip";

import type { AiMode } from "./ModePicker";
import { ModePicker, getModeName } from "./ModePicker";

import {
  ModelPicker,
  getModelName,
  type AiModel,
  type AiModelOption,
} from "./ModelPicker";

import { SkillPicker } from "./SkillPicker";
import { SkillManagerDialog } from "./SkillManagerDialog";

import type { SkillListItem } from "../../stores/aiStore";

import { ArrowUp } from "lucide-react";
import { Button } from "../../components/primitives/Button";

// ---------------------------------------------------------------------------
// SendStopButton
// ---------------------------------------------------------------------------

function SendStopButton(props: {
  isWorking: boolean;
  disabled?: boolean;
  onSend: () => void;
  onStop: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <Tooltip
      content={
        props.isWorking
          ? t("ai.panel.stopGenerating")
          : t("ai.panel.sendMessage")
      }
    >
      <Button
        data-testid="ai-send-stop"
        type="button"
        aria-label={
          props.isWorking
            ? t("ai.input.stop", "Stop generation")
            : t("ai.input.send", "Send message")
        }
        className="focus-ring w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={props.isWorking ? props.onStop : props.onSend}
        disabled={props.disabled}
      >
        {props.isWorking ? (
          <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
            <div className="w-2 h-2 bg-current rounded-[1px]" />
          </div>
        ) : (
          <ArrowUp size={16} strokeWidth={1.5} />
        )}
      </Button>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// ToolButton
// ---------------------------------------------------------------------------

function ToolButton(props: {
  children: React.ReactNode;
  active?: boolean;
  testId?: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <Button
      data-testid={props.testId}
      type="button"
      className={[
        "focus-ring px-1.5 py-0.5 text-(--text-status) font-medium rounded-[var(--radius-sm)]",
        "transition-colors cursor-pointer",
        props.active
          ? "text-[var(--color-fg-default)] bg-[var(--color-bg-selected)]"
          : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]",
      ].join(" ")}
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// AiInputArea
// ---------------------------------------------------------------------------

export type AiInputAreaProps = {
  hasSelectionReference: boolean;
  selectionPreview: string;
  setSelectionSnapshot: (s: null) => void;
  input: string;
  setInput: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  working: boolean;
  onRun: () => void;
  cancel: () => Promise<void>;
  modeOpen: boolean;
  modelOpen: boolean;
  skillsOpen: boolean;
  setModeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setModelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSkillsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMode: AiMode;
  setSelectedMode: (mode: AiMode) => void;
  modelsStatus: string;
  selectedModel: AiModel;
  setSelectedModel: (model: AiModel) => void;
  skillsStatus: string;
  availableModels: AiModelOption[];
  recentModelIds: string[];
  selectedSkillId: string;
  skills: SkillListItem[];
  handleSkillSelect: (skillId: string) => void;
  handleSkillToggle: (args: { skillId: string; enabled: boolean }) => void;
  handleSkillScopeUpdate: (args: {
    id: string;
    scope: "global" | "project";
  }) => void;
  openSettings: (section?: SettingsTab) => void;
  skillManagerOpen: boolean;
  setSkillManagerOpen: (open: boolean) => void;
  currentProject: { projectId: string } | null;
  projectId: string | null;
  refreshSkills: () => Promise<void>;
};

export const AiInputArea = React.forwardRef<
  HTMLTextAreaElement,
  AiInputAreaProps
>(function AiInputArea(props, ref) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 px-1.5 pb-1.5 pt-2 border-t border-[var(--color-separator)]">
      <div className="relative border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)] focus-within:border-[var(--color-border-focus)]">
        {props.hasSelectionReference ? (
          <div
            data-testid="ai-selection-reference-card"
            className="mx-2 mt-2 mb-1 rounded-[var(--radius-sm)] bg-[var(--color-bg-raised)] px-2 py-1.5"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-(--text-label) uppercase tracking-wide text-[var(--color-fg-muted)]">
                  {t("ai.panel.selectionFromEditor")}
                </div>
                <div
                  data-testid="ai-selection-reference-preview"
                  className="text-(--text-caption) text-[var(--color-fg-default)] whitespace-pre-wrap break-words"
                >
                  {props.selectionPreview}
                </div>
              </div>
              <Tooltip content={t("ai.panel.dismissSelection")}>
                <Button
                  type="button"
                  data-testid="ai-selection-reference-close"
                  className="focus-ring h-5 w-5 shrink-0 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                  onClick={() => props.setSelectionSnapshot(null)}
                >
                  ×
                </Button>
              </Tooltip>
            </div>
          </div>
        ) : null}
        {/* 审计：v1-13 #015 KEEP */}
        {/* eslint-disable-next-line creonow/no-native-html-element -- 技术原因：<textarea> 需要 ref 转发用于自动调整高度，Textarea 原语不支持 forwardRef */}
        <textarea
          ref={ref}
          data-testid="ai-input"
          aria-label={t("ai.input.ariaLabel", "AI input")}
          value={props.input}
          onChange={(e) => props.setInput(e.target.value)}
          onKeyDown={props.handleKeyDown}
          placeholder={t("ai.panel.inputPlaceholder")}
          className="w-full min-h-15 max-h-40 px-3 py-2 bg-transparent border-none resize-none text-(--text-body) text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <ToolButton
              active={props.modeOpen}
              onClick={() => {
                props.setModeOpen((v) => !v);
                props.setModelOpen(false);
                props.setSkillsOpen(false);
              }}
            >
              {getModeName(props.selectedMode, t)}
            </ToolButton>
            <ToolButton
              active={props.modelOpen}
              onClick={() => {
                props.setModelOpen((v) => !v);
                props.setModeOpen(false);
                props.setSkillsOpen(false);
              }}
            >
              {props.modelsStatus === "loading"
                ? t("ai.panel.loading")
                : getModelName(props.selectedModel, props.availableModels)}
            </ToolButton>
            <ToolButton
              active={props.skillsOpen}
              testId="ai-skills-toggle"
              onClick={() => {
                props.setSkillsOpen((v) => !v);
                props.setModeOpen(false);
                props.setModelOpen(false);
              }}
            >
              {props.skillsStatus === "loading"
                ? t("ai.panel.loading")
                : t("ai.panel.skill")}
            </ToolButton>
          </div>
          <SendStopButton
            isWorking={props.working}
            disabled={!props.working && !props.input.trim()}
            onSend={() => void props.onRun()}
            onStop={() => void props.cancel()}
          />
        </div>
        <ModePicker
          open={props.modeOpen}
          selectedMode={props.selectedMode}
          onOpenChange={props.setModeOpen}
          onSelectMode={(mode) => {
            props.setSelectedMode(mode);
            props.setModeOpen(false);
          }}
        />
        <ModelPicker
          open={props.modelOpen}
          models={props.availableModels}
          recentModelIds={props.recentModelIds}
          selectedModel={props.selectedModel}
          onOpenChange={props.setModelOpen}
          onSelectModel={(model) => {
            props.setSelectedModel(model);
            props.setModelOpen(false);
          }}
        />
        <SkillPicker
          open={props.skillsOpen}
          items={props.skills}
          selectedSkillId={props.selectedSkillId}
          onOpenChange={props.setSkillsOpen}
          onSelectSkillId={(skillId) => {
            void props.handleSkillSelect(skillId);
          }}
          onOpenSettings={() => {
            props.setSkillsOpen(false);
            props.openSettings();
          }}
          onCreateSkill={() => {
            props.setSkillsOpen(false);
            props.setSkillManagerOpen(true);
          }}
          onToggleSkill={(skillId, enabled) => {
            void props.handleSkillToggle({ skillId, enabled });
          }}
          onUpdateScope={(id, scope) => {
            void props.handleSkillScopeUpdate({ id, scope });
          }}
        />
        <SkillManagerDialog
          open={props.skillManagerOpen}
          onOpenChange={props.setSkillManagerOpen}
          projectId={props.currentProject?.projectId ?? props.projectId ?? null}
          onSaved={async () => {
            await props.refreshSkills();
          }}
        />
      </div>
    </div>
  );
});

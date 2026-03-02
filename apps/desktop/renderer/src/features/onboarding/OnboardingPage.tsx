import React from "react";

import { Button, Heading, Text } from "../../components/primitives";
import { i18n } from "../../i18n";
import {
  getLanguagePreference,
  setLanguagePreference,
} from "../../i18n/languagePreference";
import { invoke } from "../../lib/ipcClient";

// =============================================================================
// Types
// =============================================================================

export interface OnboardingPageProps {
  /** Callback when user completes onboarding */
  onComplete: () => void;
}

type OnboardingStep = 1 | 2 | 3;

// =============================================================================
// Step Components
// =============================================================================

/**
 * Step 1: Language Selection
 *
 * Why: The first interaction with CreoNow should set the user's preferred
 * language, ensuring all subsequent UI matches their expectation.
 */
function LanguageStep(props: {
  selected: string;
  onSelect: (lng: string) => void;
}): JSX.Element {
  const languages = [
    { value: "zh-CN", label: "中文 (简体)", description: "简体中文界面" },
    { value: "en", label: "English", description: "English interface" },
  ];

  return (
    <div data-testid="onboarding-step-1" className="w-full max-w-[480px]">
      <Heading
        level="h2"
        color="default"
        className="mb-3 text-center text-2xl font-light tracking-tight"
      >
        选择语言 / Select Language
      </Heading>
      <Text size="body" color="muted" className="mb-8 text-center">
        Choose your preferred display language.
      </Text>

      <div
        data-testid="onboarding-language-select"
        className="flex flex-col gap-3"
      >
        {languages.map((lang) => (
          <button
            key={lang.value}
            type="button"
            data-testid={`onboarding-lang-${lang.value}`}
            onClick={() => props.onSelect(lang.value)}
            className={`flex items-center gap-4 rounded-[var(--radius-lg)] border p-5 text-left transition-all duration-[var(--duration-fast)] ${
              props.selected === lang.value
                ? "border-[var(--color-fg-accent)] bg-[var(--color-bg-selected)]"
                : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)]"
            }`}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current">
              {props.selected === lang.value && (
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-fg-accent)]" />
              )}
            </div>
            <div>
              <Text size="body" color="default" className="font-medium">
                {lang.label}
              </Text>
              <Text size="small" color="muted">
                {lang.description}
              </Text>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Step 2: AI Configuration Guidance
 *
 * Why: CreoNow is an AI-native writing IDE — new users benefit from
 * understanding what AI features are available, even if they skip setup.
 */
function AiConfigStep(props: { language: string }): JSX.Element {
  const isEn = props.language === "en";
  return (
    <div data-testid="onboarding-step-2" className="w-full max-w-[480px]">
      <Heading
        level="h2"
        color="default"
        className="mb-3 text-center text-2xl font-light tracking-tight"
      >
        {isEn ? "AI Writing Assistant" : "AI 写作助手"}
      </Heading>
      <Text size="body" color="muted" className="mb-8 text-center">
        {isEn
          ? "CreoNow has built-in AI writing capabilities for continuation, polishing, and inspiration."
          : "CreoNow 内置 AI 写作能力，可以帮你续写、润色、激发灵感。"}
      </Text>

      <div className="space-y-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <path d="M9 13h6" />
                <path d="M9 17h3" />
                <path d="M12 3v6" />
              </svg>
            </div>
            <div>
              <Text size="body" color="default" className="mb-1 font-medium">
                {isEn ? "Smart Continuation & Polish" : "智能续写与润色"}
              </Text>
              <Text size="small" color="muted">
                {isEn
                  ? "Select text to invoke the AI panel for continuation, rewriting, and polishing suggestions."
                  : "选中文本后唤起 AI 面板，即可获得续写、改写、润色建议。"}
              </Text>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <Text size="body" color="default" className="mb-1 font-medium">
                {isEn ? "AI Settings Are Adjustable" : "AI 配置可在设置中调整"}
              </Text>
              <Text size="small" color="muted">
                {isEn
                  ? "You can configure AI models and preferences in Settings → AI anytime."
                  : "你随时可以在「设置 → AI」中配置模型和偏好。"}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 3: Open Folder
 *
 * Why: CreoNow uses "folder as workspace" — the user needs to pick or
 * create a workspace folder to begin writing.
 */
function OpenFolderStep(props: {
  language: string;
  onOpenFolder: () => void;
  onSkip: () => void;
}): JSX.Element {
  const isEn = props.language === "en";
  return (
    <div data-testid="onboarding-step-3" className="w-full max-w-[480px]">
      <Heading
        level="h2"
        color="default"
        className="mb-3 text-center text-2xl font-light tracking-tight"
      >
        {isEn ? "Open Workspace" : "打开工作区"}
      </Heading>
      <Text size="body" color="muted" className="mb-8 text-center">
        {isEn
          ? "Choose a folder as your creative workspace. CreoNow will manage your projects and documents here."
          : "选择一个文件夹作为你的创作工作区，CreoNow 会在此管理你的项目与文档。"}
      </Text>

      <div className="flex flex-col items-center gap-4">
        <Button
          data-testid="onboarding-open-folder"
          variant="primary"
          size="lg"
          onClick={props.onOpenFolder}
          className="rounded-full px-10"
        >
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {isEn ? "Open Folder" : "打开文件夹"}
        </Button>

        <Button
          data-testid="onboarding-skip-folder"
          variant="secondary"
          size="md"
          onClick={props.onSkip}
          className="rounded-full px-8"
        >
          {isEn ? "Skip, choose later" : "跳过，稍后再选"}
        </Button>
      </div>
    </div>
  );
}

/**
 * StepIndicator — Three dots showing wizard progress.
 */
function StepIndicator(props: { current: OnboardingStep }): JSX.Element {
  const steps: OnboardingStep[] = [1, 2, 3];
  return (
    <div
      data-testid="onboarding-step-indicator"
      className="flex items-center gap-2"
    >
      {steps.map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all duration-[var(--duration-normal)] ${
            s === props.current
              ? "w-6 bg-[var(--color-fg-accent)]"
              : s < props.current
                ? "w-2 bg-[var(--color-fg-muted)]"
                : "w-2 bg-[var(--color-border-default)]"
          }`}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * OnboardingPage — Multi-step wizard for first-time users.
 *
 * Why: First-time users need a guided path through language selection,
 * AI capabilities overview, and workspace setup. A single-page dump
 * of features overwhelms more than it guides.
 *
 * Steps:
 *   1. Language selection → persists to localStorage + hot-switches i18n
 *   2. AI configuration guidance → skippable
 *   3. Open Folder → "folder as workspace" entry point
 *
 * @example
 * ```tsx
 * <OnboardingPage onComplete={() => setOnboardingComplete(true)} />
 * ```
 */
export function OnboardingPage({
  onComplete,
}: OnboardingPageProps): JSX.Element {
  const [step, setStep] = React.useState<OnboardingStep>(1);
  const [language, setLanguage] = React.useState(() =>
    getLanguagePreference(),
  );

  const handleLanguageSelect = React.useCallback((lng: string) => {
    setLanguage(lng);
    setLanguagePreference(lng);
    void i18n.changeLanguage(lng);
  }, []);

  const handleOpenFolder = React.useCallback(async () => {
    const result = await invoke("dialog:folder:open", {});
    // Only complete onboarding when user actually selected a folder;
    // cancelled dialog returns data without selectedPath.
    if (result.ok && result.data.selectedPath) {
      onComplete();
    }
  }, [onComplete]);

  const goNext = React.useCallback(() => {
    setStep((s) => (s < 3 ? ((s + 1) as OnboardingStep) : s));
  }, []);

  const goBack = React.useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as OnboardingStep) : s));
  }, []);

  return (
    <div
      data-testid="onboarding-page"
      className="flex h-full w-full items-center justify-center bg-[var(--color-bg-base)]"
    >
      <main className="relative flex h-full max-h-[900px] w-full max-w-[800px] flex-col items-center justify-center p-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-3">
            <div
              data-testid="onboarding-logo"
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-fg-default)] text-xl font-bold text-[var(--color-fg-inverse)]"
            >
              C
            </div>
            <span className="text-xl font-medium tracking-tight text-[var(--color-fg-default)]">
              CreoNow
            </span>
          </div>
          <Heading
            level="h1"
            color="default"
            className="mb-2 text-center text-4xl font-light tracking-tight md:text-5xl"
          >
            {language === "en" ? "Welcome to CreoNow" : "欢迎使用 CreoNow"}
          </Heading>
          <Text size="bodyLarge" color="muted" className="italic">
            {language === "en"
              ? "AI-powered Writing IDE"
              : "AI 驱动的文字创作 IDE"}
          </Text>
        </div>

        {/* Step content */}
        <div className="flex w-full flex-1 items-center justify-center">
          {step === 1 && (
            <LanguageStep
              selected={language}
              onSelect={handleLanguageSelect}
            />
          )}
          {step === 2 && <AiConfigStep language={language} />}
          {step === 3 && (
            <OpenFolderStep
              language={language}
              onOpenFolder={() => void handleOpenFolder()}
              onSkip={onComplete}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex w-full flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button
                data-testid="onboarding-back"
                variant="secondary"
                size="md"
                onClick={goBack}
                className="rounded-full px-6"
              >
                {language === "en" ? "Back" : "返回"}
              </Button>
            )}
            {step === 1 && (
              <Button
                data-testid="onboarding-next"
                variant="primary"
                size="md"
                onClick={goNext}
                className="rounded-full px-8"
              >
                {language === "en" ? "Next" : "下一步"}
              </Button>
            )}
            {step === 2 && (
              <Button
                data-testid="onboarding-ai-skip"
                variant="secondary"
                size="sm"
                onClick={goNext}
                className="rounded-full px-6"
              >
                {language === "en" ? "Skip" : "跳过"}
              </Button>
            )}
          </div>

          {/* Step indicator */}
          <StepIndicator current={step} />
        </div>
      </main>
    </div>
  );
}

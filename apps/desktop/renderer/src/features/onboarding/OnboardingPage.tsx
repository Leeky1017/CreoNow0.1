import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Heading, Text } from "../../components/primitives";
import { i18n } from "../../i18n";
import {
  getLanguagePreference,
  setLanguagePreference,
} from "../../i18n/languagePreference";
import { invoke } from "../../lib/ipcClient";

import { FolderOpen, Pencil, Sparkles } from "lucide-react";
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
  const { t } = useTranslation();
  const languages = [
    { value: "zh-CN", key: "zhCN" },
    { value: "en", key: "en" },
  ];

  return (
    <div data-testid="onboarding-step-1" className="w-full max-w-120">
      <Heading
        level="h2"
        color="default"
        className="mb-3 text-center text-2xl font-light tracking-tight"
      >
        {t("onboarding.selectLanguage")}
      </Heading>
      <Text size="body" color="muted" className="mb-8 text-center">
        {t("onboarding.selectLanguageHint")}
      </Text>

      <div
        data-testid="onboarding-language-select"
        className="flex flex-col gap-3"
      >
        {languages.map((lang) => (
          // eslint-disable-next-line creonow/no-native-html-element -- language selection card button
          <button
            key={lang.value}
            type="button"
            data-testid={`onboarding-lang-${lang.value}`}
            onClick={() => props.onSelect(lang.value)}
            className={`focus-ring flex items-center gap-4 rounded-[var(--radius-lg)] border p-5 text-left transition-colors duration-[var(--duration-fast)] ${
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
                {t(`onboarding.langOptions.${lang.key}.label`)}
              </Text>
              <Text size="small" color="muted">
                {t(`onboarding.langOptions.${lang.key}.description`)}
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
function AiConfigStep(): JSX.Element {
  const { t } = useTranslation();
  return (
    <div data-testid="onboarding-step-2" className="w-full max-w-120">
      <Heading
        level="h2"
        color="default"
        className="mb-3 text-center text-2xl font-light tracking-tight"
      >
        {t("onboarding.step2.title")}
      </Heading>
      <Text size="body" color="muted" className="mb-8 text-center">
        {t("onboarding.step2.subtitle")}
      </Text>

      <div className="space-y-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]">
              <Sparkles size={20} strokeWidth={1.5} />
            </div>
            <div>
              <Text size="body" color="default" className="mb-1 font-medium">
                {t("onboarding.step2.feature1Title")}
              </Text>
              <Text size="small" color="muted">
                {t("onboarding.step2.feature1Desc")}
              </Text>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]">
              <Pencil size={20} strokeWidth={1.5} />
            </div>
            <div>
              <Text size="body" color="default" className="mb-1 font-medium">
                {t("onboarding.step2.feature2Title")}
              </Text>
              <Text size="small" color="muted">
                {t("onboarding.step2.feature2Desc")}
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
  onOpenFolder: () => void;
  onSkip: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div data-testid="onboarding-step-3" className="w-full max-w-120">
      <Heading
        level="h2"
        color="default"
        className="mb-3 text-center text-2xl font-light tracking-tight"
      >
        {t("onboarding.step3.title")}
      </Heading>
      <Text size="body" color="muted" className="mb-8 text-center">
        {t("onboarding.step3.subtitle")}
      </Text>

      <div className="flex flex-col items-center gap-4">
        <Button
          data-testid="onboarding-open-folder"
          variant="primary"
          size="lg"
          onClick={props.onOpenFolder}
          className="rounded-full px-10"
        >
          <FolderOpen className="mr-2 h-4 w-4" size={16} strokeWidth={1.5} />
          {t("onboarding.step3.openFolder")}
        </Button>

        <Button
          data-testid="onboarding-skip-folder"
          variant="secondary"
          size="md"
          onClick={props.onSkip}
          className="rounded-full px-8"
        >
          {t("onboarding.step3.skipLater")}
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
          className={`h-2 rounded-full transition-[width,background-color] duration-[var(--duration-normal)] ${
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
  const { t } = useTranslation();

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
      {/* eslint-disable-next-line creonow/no-hardcoded-dimension -- onboarding page layout bounds */}
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
              {t("onboarding.appName")}
            </span>
          </div>
          <Heading
            level="h1"
            color="default"
            className="mb-2 text-center text-4xl font-light tracking-tight md:text-5xl"
          >
            {t("onboarding.welcome")}
          </Heading>
          <Text size="bodyLarge" color="muted" className="italic">
            {t("onboarding.subtitle")}
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
          {step === 2 && <AiConfigStep />}
          {step === 3 && (
            <OpenFolderStep
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
                {t("onboarding.back")}
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
                {t("onboarding.next")}
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
                {t("onboarding.skip")}
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

import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Heading, Text } from "../../components/primitives";
import { i18n } from "../../i18n";
import {
  getLanguagePreference,
  setLanguagePreference,
} from "../../i18n/languagePreference";
import { invoke } from "../../lib/ipcClient";
import {
  LanguageStep,
  AiConfigStep,
  OpenFolderStep,
  StepIndicator,
} from "./OnboardingSteps";

export interface OnboardingPageProps {
  onComplete: () => void;
}

type OnboardingStep = 1 | 2 | 3;

/** OnboardingPage — Multi-step wizard for first-time users. */
export function OnboardingPage({
  onComplete,
}: OnboardingPageProps): JSX.Element {
  const [step, setStep] = React.useState<OnboardingStep>(1);
  const [language, setLanguage] = React.useState(() => getLanguagePreference());
  const { t } = useTranslation();

  const handleLanguageSelect = React.useCallback((lng: string) => {
    setLanguage(lng);
    setLanguagePreference(lng);
    void i18n.changeLanguage(lng);
  }, []);

  const handleOpenFolder = React.useCallback(async () => {
    const result = await invoke("dialog:folder:open", {});
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
            <LanguageStep selected={language} onSelect={handleLanguageSelect} />
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

          <StepIndicator current={step} />
        </div>
      </main>
    </div>
  );
}

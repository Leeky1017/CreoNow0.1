import { useTranslation } from "react-i18next";
import { Button, Heading, Text } from "../../components/primitives";
import { FolderOpen, Pencil, Sparkles } from "lucide-react";

type OnboardingStep = 1 | 2 | 3;

/**
 * Step 1: Language Selection
 */
export function LanguageStep(props: {
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
 */
export function AiConfigStep(): JSX.Element {
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
 */
export function OpenFolderStep(props: {
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
export function StepIndicator(props: { current: OnboardingStep }): JSX.Element {
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

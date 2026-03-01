import { Button, Heading, Text } from "../../components/primitives";
import { invoke } from "../../lib/ipcClient";

/**
 * Feature item definition for onboarding display.
 */
interface FeatureItem {
  /** Unique key for React rendering */
  key: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** SVG icon element */
  icon: React.ReactNode;
}

/**
 * SVG icons for feature cards.
 *
 * Why: inline SVGs allow easy theming via currentColor.
 */
const icons = {
  aiWriting: (
    <svg
      width="24"
      height="24"
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
      <path d="M12 9l-3.5-3.5" />
      <path d="M12 9l3.5-3.5" />
    </svg>
  ),
  character: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  knowledgeGraph: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  versionHistory: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
};

/**
 * Feature list for onboarding page.
 */
const features: FeatureItem[] = [
  {
    key: "ai-writing",
    title: "AI 辅助写作",
    description: "智能续写、润色与灵感激发，让创作不再卡顿。",
    icon: icons.aiWriting,
  },
  {
    key: "character",
    title: "角色管理",
    description: "深度构建角色档案与关系网，保持人设一致性。",
    icon: icons.character,
  },
  {
    key: "knowledge-graph",
    title: "知识图谱",
    description: "可视化管理世界观与剧情线索，掌控复杂叙事。",
    icon: icons.knowledgeGraph,
  },
  {
    key: "version-history",
    title: "版本历史",
    description: "全自动保存，随时回溯创作轨迹，安全无忧。",
    icon: icons.versionHistory,
  },
];

export interface OnboardingPageProps {
  /** Callback when user completes or skips onboarding */
  onComplete: () => void;
}

/**
 * Feature card component for displaying a single feature.
 */
function FeatureCard({ item }: { item: FeatureItem }): JSX.Element {
  return (
    <div
      data-testid={`feature-card-${item.key}`}
      className="flex items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-border-hover)]"
      style={{ height: 120 }}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]">
        {item.icon}
      </div>
      <div className="flex flex-col gap-1">
        <Text
          as="span"
          size="body"
          color="default"
          className="font-medium"
        >
          {item.title}
        </Text>
        <Text
          size="small"
          color="muted"
          className="font-[var(--font-family-body)] italic leading-relaxed"
        >
          {item.description}
        </Text>
      </div>
    </div>
  );
}


/**
 * Arrow icon for the next button.
 */
function ArrowRightIcon(): JSX.Element {
  return (
    <svg
      className="ml-2 h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

/**
 * OnboardingPage renders the welcome screen for first-time users.
 *
 * Why: First-time users need a guided introduction to CreoNow's features.
 * Single-page design based on `design/Variant/designs/02-onboarding.html`.
 *
 * @example
 * ```tsx
 * <OnboardingPage onComplete={() => setOnboardingComplete(true)} />
 * ```
 */
export function OnboardingPage({ onComplete }: OnboardingPageProps): JSX.Element {
  return (
    <div
      data-testid="onboarding-page"
      className="flex h-full w-full items-center justify-center bg-[var(--color-bg-base)]"
    >
      <main className="relative flex h-full max-h-[900px] w-full max-w-[800px] flex-col items-center justify-center p-8">
        {/* Logo */}
        <div className="mb-12 flex animate-fade-in-up flex-col items-center">
          <div className="mb-6 flex items-center gap-3">
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
        </div>

        {/* Welcome text */}
        <div className="mb-16 animate-fade-in-up text-center animation-delay-100">
          <Heading
            level="h1"
            color="default"
            className="mb-4 text-4xl font-light tracking-tight md:text-5xl"
          >
            欢迎使用 CreoNow
          </Heading>
          <Text
            size="bodyLarge"
            color="muted"
            className="italic"
          >
            AI 驱动的文字创作 IDE
          </Text>
        </div>

        {/* Feature cards grid */}
        <div className="mb-16 grid w-full animate-fade-in-up grid-cols-1 gap-4 animation-delay-200 md:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.key} item={feature} />
          ))}
        </div>

        {/* Navigation footer */}
        <div className="mt-auto flex w-full animate-fade-in-up flex-col items-center justify-center gap-3 pt-8 animation-delay-300">
          <Button
            data-testid="onboarding-start"
            variant="primary"
            size="lg"
            onClick={onComplete}
            className="rounded-full px-10"
          >
            开始使用
            <ArrowRightIcon />
          </Button>
          <Button
            data-testid="onboarding-open-folder"
            variant="secondary"
            size="md"
            onClick={async () => {
              await invoke("dialog:folder:open", {});
            }}
            className="rounded-full px-8"
          >
            打开已有文件夹
          </Button>
        </div>
      </main>
    </div>
  );
}

/**
 * Brand Illustration Components
 *
 * React components for the brand SVG illustrations used in empty states.
 * Uses CSS variables for theming — accent elements use `var(--color-accent)`.
 *
 * @see design spec §12.1 (Empty States)
 */

interface IllustrationProps {
  className?: string;
}

const SHARED_PROPS = {
  width: 120,
  height: 120,
  viewBox: "0 0 120 120",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
};

/** 项目文件夹 — variant: project / files */
export function ProjectIllustration({
  className,
}: IllustrationProps): JSX.Element {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <path
        d="M30 45h60a4 4 0 014 4v30a4 4 0 01-4 4H30a4 4 0 01-4-4V41a4 4 0 014-4z"
        opacity="0.4"
      />
      <path d="M26 45V37a4 4 0 014-4h18l6 6h36a4 4 0 014 4v2" />
      <line
        x1="60"
        y1="55"
        x2="60"
        y2="73"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <line
        x1="51"
        y1="64"
        x2="69"
        y2="64"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
    </svg>
  );
}

/** 搜索放大镜 — variant: search */
export function SearchIllustration({
  className,
}: IllustrationProps): JSX.Element {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <circle cx="52" cy="52" r="22" opacity="0.4" />
      <line x1="68" y1="68" x2="90" y2="90" strokeWidth="2.5" />
      <path
        d="M48 44a8 8 0 018-8 8 8 0 016.9 4"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <path d="M56 48v6" stroke="var(--color-accent)" strokeWidth="2" />
      <circle cx="56" cy="60" r="1" fill="var(--color-accent)" stroke="none" />
    </svg>
  );
}

/** 角色人形 — variant: characters */
export function CharacterIllustration({
  className,
}: IllustrationProps): JSX.Element {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <circle cx="60" cy="40" r="14" opacity="0.4" />
      <path d="M36 92v-6a24 24 0 0148 0v6" opacity="0.4" />
      <line
        x1="90"
        y1="36"
        x2="90"
        y2="52"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <line
        x1="82"
        y1="44"
        x2="98"
        y2="44"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
    </svg>
  );
}

/** AI 对话气泡 */
export function AiIllustration({ className }: IllustrationProps): JSX.Element {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <path
        d="M32 40h40a6 6 0 016 6v20a6 6 0 01-6 6H52l-10 10V72H32a6 6 0 01-6-6V46a6 6 0 016-6z"
        opacity="0.4"
      />
      <path
        d="M80 30l4-8 4 8-8 4 8 4-4 8-4-8-8-4z"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="44" cy="56" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="54" cy="56" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="64" cy="56" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** 记忆灯泡 */
export function MemoryIllustration({
  className,
}: IllustrationProps): JSX.Element {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <path
        d="M60 28a22 22 0 00-10 41.6V78a4 4 0 004 4h12a4 4 0 004-4v-8.4A22 22 0 0060 28z"
        opacity="0.4"
      />
      <line x1="52" y1="86" x2="68" y2="86" opacity="0.4" />
      <line x1="54" y1="92" x2="66" y2="92" opacity="0.4" />
      <line
        x1="60"
        y1="14"
        x2="60"
        y2="20"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <line
        x1="88"
        y1="50"
        x2="94"
        y2="50"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <line
        x1="26"
        y1="50"
        x2="32"
        y2="50"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <line
        x1="80"
        y1="30"
        x2="84"
        y2="26"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <line
        x1="36"
        y1="26"
        x2="40"
        y2="30"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
    </svg>
  );
}

/** 大纲列表 */
export function OutlineIllustration({
  className,
}: IllustrationProps): JSX.Element {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <line x1="38" y1="40" x2="82" y2="40" opacity="0.4" />
      <line x1="38" y1="52" x2="74" y2="52" opacity="0.4" />
      <line x1="38" y1="64" x2="78" y2="64" opacity="0.4" />
      <line
        x1="38"
        y1="76"
        x2="70"
        y2="76"
        strokeDasharray="4 4"
        stroke="var(--color-accent)"
      />
      <line
        x1="38"
        y1="88"
        x2="62"
        y2="88"
        strokeDasharray="4 4"
        stroke="var(--color-accent)"
      />
      <circle cx="32" cy="40" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="32" cy="52" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="32" cy="64" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="32" cy="76" r="2" fill="var(--color-accent)" stroke="none" />
      <circle cx="32" cy="88" r="2" fill="var(--color-accent)" stroke="none" />
    </svg>
  );
}

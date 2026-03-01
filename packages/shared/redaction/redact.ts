export type RedactionEvidenceItem = {
  patternId: string;
  sourceRef: string;
  matchCount: number;
};

export type RedactionResult = {
  redactedText: string;
  evidence: RedactionEvidenceItem[];
};

type Pattern = {
  id: string;
  re: RegExp;
};

const REDACTED = "***REDACTED***";

const PATTERNS: Pattern[] = [
  {
    id: "openai_api_key_sk",
    re: /sk-[A-Za-z0-9_-]{8,}/g,
  },
  {
    id: "aws_access_key_id",
    re: /AKIA[0-9A-Z]{16}/g,
  },
  {
    id: "github_token",
    re: /\b(?:gho|ghp|github_pat)_[A-Za-z0-9_]{10,}\b/g,
  },
  {
    id: "windows_abs_path",
    re: /\b[A-Za-z]:\\(?:[^\\\r\n\t"']+\\?)+/g,
  },
  {
    id: "unix_abs_path",
    re: /\/(?:Users|home)\/[^\r\n\t"']+/g,
  },
];

function countMatches(text: string, re: RegExp): number {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

/**
 * Redact sensitive content from a string and return structured evidence.
 *
 * Why: viewer/log/prompt injection must never leak secrets or absolute paths,
 * and E2E needs a deterministic evidence structure for assertions.
 */
export function redactText(args: {
  text: string;
  sourceRef: string;
}): RedactionResult {
  let redactedText = args.text;
  const evidence: RedactionEvidenceItem[] = [];

  for (const pattern of PATTERNS) {
    const matchCount = countMatches(redactedText, pattern.re);
    if (matchCount > 0) {
      evidence.push({
        patternId: pattern.id,
        sourceRef: args.sourceRef,
        matchCount,
      });
      redactedText = redactedText.replace(pattern.re, REDACTED);
    }
  }

  return { redactedText, evidence };
}

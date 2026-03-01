import assert from "node:assert/strict";

import { redactText } from "./redact";

const githubTokens = [
  "gho_ABCDEF1234567890",
  "ghp_QWERTY0987654321",
  "github_pat_11AA22BB33CC44DD55EE66FF77GG88HH99II",
];

const redaction = redactText({
  text: githubTokens.join(" "),
  sourceRef: "packages/shared/redaction/redact.github-token.test.ts",
});

for (const token of githubTokens) {
  assert(
    !redaction.redactedText.includes(token),
    `${token.slice(0, 16)}... should be redacted`,
  );
}

const githubTokenEvidence = redaction.evidence.find(
  (item) => item.patternId === "github_token",
);
assert(githubTokenEvidence, "github token evidence should exist");
assert.equal(githubTokenEvidence.matchCount, 3);

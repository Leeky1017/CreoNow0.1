import assert from "node:assert/strict";

import { trimUtf8ToTokenBudget } from "@shared/tokenBudget";

const splitEmojiInput = "ab🙂cd";
const splitEmojiTrimmed = trimUtf8ToTokenBudget(splitEmojiInput, 1);
assert.equal(
  splitEmojiTrimmed,
  "ab",
  "trimUtf8ToTokenBudget should drop incomplete UTF-8 tail instead of injecting replacement char",
);
assert.equal(
  splitEmojiTrimmed.includes("\uFFFD"),
  false,
  "trimUtf8ToTokenBudget should never emit replacement char for valid input",
);

const exactEmojiBoundary = trimUtf8ToTokenBudget("🙂a", 1);
assert.equal(
  exactEmojiBoundary,
  "🙂",
  "trimUtf8ToTokenBudget should preserve a complete multibyte character at byte boundary",
);

console.log("token-budget-utf8-boundary.test.ts: all assertions passed");

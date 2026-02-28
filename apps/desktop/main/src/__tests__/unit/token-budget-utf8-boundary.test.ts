import assert from "node:assert/strict";

import {
  estimateUtf8TokenCount,
  trimUtf8ToTokenBudget,
} from "@shared/tokenBudget";

{
  const trimmed = trimUtf8ToTokenBudget("你你", 1);
  assert.equal(trimmed, "你");
  assert.equal(trimmed.includes("\uFFFD"), false);
  assert.equal(estimateUtf8TokenCount(trimmed), 1);
}

{
  const trimmed = trimUtf8ToTokenBudget("ab你cd", 1);
  assert.equal(trimmed, "ab");
  assert.equal(trimmed.includes("\uFFFD"), false);
  assert.equal(estimateUtf8TokenCount(trimmed) <= 1, true);
}

console.log("token-budget-utf8-boundary.test.ts: all assertions passed");

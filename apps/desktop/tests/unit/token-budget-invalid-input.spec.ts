import assert from "node:assert/strict";

import {
  tokenBudgetToUtf8ByteLimit,
  trimUtf8ToTokenBudget,
} from "@shared/tokenBudget";

// Scenario Mapping: AUD-M3-S4 Edge Case (NaN budget should not create accidental empty output) [ADDED]
{
  const text = "hello";
  assert.equal(tokenBudgetToUtf8ByteLimit(Number.NaN), 0);
  assert.equal(trimUtf8ToTokenBudget(text, Number.NaN), "");
}

// Scenario Mapping: AUD-M3-S5 Core Path (Infinity budget keeps text unchanged) [ADDED]
{
  const text = "你好，world";
  assert.equal(tokenBudgetToUtf8ByteLimit(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
  assert.equal(trimUtf8ToTokenBudget(text, Number.POSITIVE_INFINITY), text);
}

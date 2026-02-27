import assert from "node:assert/strict";

import {
  estimateUtf8TokenCount,
  tokenBudgetToUtf8ByteLimit,
  trimUtf8ToTokenBudget,
} from "@shared/tokenBudget";

{
  assert.equal(tokenBudgetToUtf8ByteLimit(0), 0);
  assert.equal(tokenBudgetToUtf8ByteLimit(1.5), 6);
}

{
  const input = "hello";
  assert.equal(trimUtf8ToTokenBudget(input, 10), input);
  assert.equal(estimateUtf8TokenCount(input), 2);
}

{
  const input = "你";
  const trimmed = trimUtf8ToTokenBudget(input, 0.5);
  assert.equal(trimmed.includes("�"), false);
  assert.equal(trimmed, "");
}

{
  const input = "你";
  const trimmed = trimUtf8ToTokenBudget(input, 0.75);
  assert.equal(trimmed, input);
}

{
  assert.equal(trimUtf8ToTokenBudget("abc", 0), "");
  assert.equal(trimUtf8ToTokenBudget("abc", -1), "");
}

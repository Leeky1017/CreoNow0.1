import assert from "node:assert/strict";

import {
  RECOMMENDED_BUSY_TIMEOUT_MS,
  RECOMMENDED_CACHE_SIZE_PAGES,
  RECOMMENDED_MMAP_SIZE_BYTES,
  applyRecommendedPragmas,
} from "../recommendedPragmas";

/**
 * Scenario: BE-GHB-S1
 * applyRecommendedPragmas should set busy_timeout/synchronous/mmap_size/cache_size.
 */
{
  const pragmaCalls: string[] = [];
  const db = {
    pragma: (statement: string): void => {
      pragmaCalls.push(statement);
    },
  } as Parameters<typeof applyRecommendedPragmas>[0];

  applyRecommendedPragmas(db);

  assert.deepEqual(pragmaCalls, [
    `busy_timeout = ${RECOMMENDED_BUSY_TIMEOUT_MS}`,
    "synchronous = NORMAL",
    `mmap_size = ${RECOMMENDED_MMAP_SIZE_BYTES}`,
    `cache_size = ${RECOMMENDED_CACHE_SIZE_PAGES}`,
  ]);
}

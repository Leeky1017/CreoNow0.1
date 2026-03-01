import assert from "node:assert/strict";

import { createAiStreamSubscriptionRegistry } from "../../preload/src/aiStreamSubscriptions";

// S1: duplicate id should retry to a fresh id and keep count/release semantics consistent.
{
  const ids = ["dup-fixed-id", "dup-fixed-id", "fresh-id-2"];
  let idx = 0;

  const registry = createAiStreamSubscriptionRegistry({
    rendererId: "renderer-dup-retry",
    maxSubscriptions: 5,
    idFactory: () => ids[idx++] ?? `fresh-id-${idx}`,
  });

  const first = registry.register();
  const second = registry.register();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) {
    assert.fail("expected successful subscriptions");
  }

  assert.notEqual(
    first.data.subscriptionId,
    second.data.subscriptionId,
    "duplicate subscription id must be retried to a new id",
  );
  assert.equal(registry.count(), 2);

  registry.release(first.data.subscriptionId);
  assert.equal(registry.count(), 1);
  registry.release(second.data.subscriptionId);
  assert.equal(registry.count(), 0);
}

// S2: if id collisions keep happening, register should fail explicitly.
{
  const registry = createAiStreamSubscriptionRegistry({
    rendererId: "renderer-dup-exhausted",
    maxSubscriptions: 5,
    idFactory: () => "dup-fixed-id",
  });

  const first = registry.register();
  const second = registry.register();

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  if (second.ok) {
    assert.fail("expected explicit collision failure");
  }

  assert.equal(second.error.code, "CONFLICT");
  assert.equal(registry.count(), 1);

  registry.release("dup-fixed-id");
  assert.equal(registry.count(), 0);
}

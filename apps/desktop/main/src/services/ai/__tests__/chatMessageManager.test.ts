import assert from "node:assert/strict";

import { createChatMessageManager } from "../chatMessageManager";

// --- add appends message ---

{
  const mgr = createChatMessageManager();

  mgr.add({
    id: "msg-1",
    role: "user",
    content: "Hello",
    timestamp: 1000,
  });

  assert.equal(mgr.getMessages().length, 1);
  assert.equal(mgr.getMessages()[0].content, "Hello");
}

// --- add preserves order ---

{
  const mgr = createChatMessageManager();

  mgr.add({ id: "m1", role: "user", content: "First", timestamp: 1000 });
  mgr.add({ id: "m2", role: "assistant", content: "Reply", timestamp: 2000 });
  mgr.add({ id: "m3", role: "user", content: "Second", timestamp: 3000 });

  const msgs = mgr.getMessages();
  assert.equal(msgs.length, 3);
  assert.equal(msgs[0].id, "m1");
  assert.equal(msgs[1].id, "m2");
  assert.equal(msgs[2].id, "m3");
}

// --- clear empties messages array ---

{
  const mgr = createChatMessageManager();

  mgr.add({ id: "m1", role: "user", content: "Hello", timestamp: 1000 });
  mgr.add({ id: "m2", role: "assistant", content: "Hi", timestamp: 2000 });

  assert.equal(mgr.getMessages().length, 2);

  mgr.clear();

  assert.equal(mgr.getMessages().length, 0);
}

// --- removeById removes exact message ---

{
  const mgr = createChatMessageManager();

  mgr.add({ id: "m1", role: "user", content: "Hello", timestamp: 1000 });
  mgr.add({ id: "m2", role: "assistant", content: "Hi", timestamp: 2000 });
  mgr.add({ id: "m3", role: "assistant", content: "Again", timestamp: 3000 });

  mgr.removeById("m2");

  const msgs = mgr.getMessages();
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0]?.id, "m1");
  assert.equal(msgs[1]?.id, "m3");
}

// --- removeById is no-op for unknown id ---

{
  const mgr = createChatMessageManager();

  mgr.add({ id: "m1", role: "user", content: "Hello", timestamp: 1000 });
  mgr.removeById("missing");

  assert.equal(mgr.getMessages().length, 1);
  assert.equal(mgr.getMessages()[0]?.id, "m1");
}

// --- getMessages returns a copy (not mutable reference) ---

{
  const mgr = createChatMessageManager();

  mgr.add({ id: "m1", role: "user", content: "Hello", timestamp: 1000 });

  const snapshot1 = mgr.getMessages();
  mgr.add({ id: "m2", role: "assistant", content: "Hi", timestamp: 2000 });
  const snapshot2 = mgr.getMessages();

  assert.equal(
    snapshot1.length,
    1,
    "first snapshot must not be affected by later adds",
  );
  assert.equal(snapshot2.length, 2);
}

// --- metadata is optional ---

{
  const mgr = createChatMessageManager();

  mgr.add({
    id: "m1",
    role: "user",
    content: "Test",
    timestamp: 1000,
    metadata: { tokenCount: 10, model: "gpt-4" },
  });

  assert.equal(mgr.getMessages()[0].metadata?.tokenCount, 10);
}

// --- defensive copy also isolates one-level metadata mutations ---

{
  const mgr = createChatMessageManager();

  mgr.add({
    id: "m1",
    role: "assistant",
    content: "Reply",
    timestamp: 1001,
    metadata: { tokenCount: 11, model: "gpt-4o-mini" },
  });

  const view = mgr.getMessages();
  if (!view[0].metadata) {
    throw new Error("metadata should exist for this scenario");
  }
  view[0].metadata.tokenCount = 999;

  assert.equal(
    mgr.getMessages()[0].metadata?.tokenCount,
    11,
    "external metadata mutation must not affect internal state",
  );
}

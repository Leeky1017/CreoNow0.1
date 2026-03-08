import assert from "node:assert/strict";

import {
  computePanelMax,
  computeSidebarMax,
  extractZenModeContent,
} from "../../renderer/src/components/layout/appShellLayoutHelpers";

// Scenario Mapping: aud-h6c Core Path Stabilized
{
  const content = extractZenModeContent(
    JSON.stringify({
      content: [
        {
          type: "heading",
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph one" }],
        },
      ],
    }),
  );

  assert.equal(content.title, "Title");
  assert.equal(content.wordCount, 3);
}

// Scenario Mapping: aud-h6c Error Path Deterministic
{
  const sidebarMax = computeSidebarMax(1200, 320, false);
  const panelMax = computePanelMax(1200, 240, false);

  assert.equal(sidebarMax >= 180, true);
  assert.equal(panelMax >= 280, true);
}

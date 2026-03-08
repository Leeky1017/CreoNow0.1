/**
 * Custom ESLint rule: no-hardcoded-dimension
 *
 * Forbids large hardcoded pixel dimensions in Tailwind arbitrary values.
 * Small values (≤48px) are exempted (icons, spacing tokens).
 * Non-px units (vh, vw, %, rem, em) are exempted.
 * Tailwind predefined classes (h-full, max-w-prose) are exempted.
 *
 * @see docs/references/design-ui-architecture.md
 */

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow large hardcoded pixel dimensions in Tailwind arbitrary values. Use responsive/relative sizing instead.",
    },
    messages: {
      hardcodedDimension:
        "Avoid hardcoded dimension '{{value}}' ({{px}}px > 48px threshold). Use responsive or relative sizing instead.",
    },
    schema: [],
  },

  create(context) {
    // Matches: h-[600px], w-[400px], min-h-[800px], max-w-[320px], etc.
    const DIMENSION_RE =
      /\b(?:[\w-]*:)?(?:h|w|min-h|min-w|max-h|max-w)-\[(\d+)px\]/g;

    const THRESHOLD = 48;

    /**
     * @param {import("estree").Node} node
     * @param {string} value
     */
    function checkValue(node, value) {
      DIMENSION_RE.lastIndex = 0;
      let match;
      while ((match = DIMENSION_RE.exec(value)) !== null) {
        const px = parseInt(match[1], 10);
        if (px > THRESHOLD) {
          context.report({
            node,
            messageId: "hardcodedDimension",
            data: { value: match[0], px: String(px) },
          });
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        checkValue(node, node.value);
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkValue(quasi, quasi.value.raw);
        }
      },
    };
  },
};

module.exports = rule;

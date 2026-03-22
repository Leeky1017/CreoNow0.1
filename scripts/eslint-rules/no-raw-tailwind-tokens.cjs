/**
 * Custom ESLint rule: no-raw-tailwind-tokens
 *
 * Forbids raw Tailwind color values (e.g., bg-red-600, text-gray-300)
 * in ANY string literal or template literal. This covers all usage patterns:
 *   - className="bg-red-600"           (direct JSX attribute)
 *   - className={`shadow-lg ${x}`}     (template literal)
 *   - ["shadow-2xl", ...].join(" ")    (array → join)
 *   - cn("hover:bg-red-600", ...)      (clsx/cn helper)
 *   - { color: "text-blue-400" }       (object property value)
 *
 * Note: shadow-xs/sm/md/lg/xl/2xl are exported via @theme and map to
 * our design tokens. They are no longer flagged.
 *
 * The regex patterns are specific enough (e.g., bg-red-600) that false
 * positives on non-Tailwind strings are essentially impossible.
 *
 * @see docs/references/design-ui-architecture.md
 */

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow raw Tailwind color values in any string literal. Use semantic Design Tokens instead.",
    },
    messages: {
      rawColor:
        "Avoid raw Tailwind color '{{value}}'. Use a semantic Design Token instead. See docs/references/design-ui-architecture.md.",
    },
    schema: [],
  },

  create(context) {
    // Matches: bg-red-600, text-gray-300, border-blue-500, ring-emerald-200, etc.
    // Also matches modifier prefixes: hover:bg-red-600, focus:text-gray-300
    // Also matches opacity suffixes: shadow-red-500/20, bg-red-600/50
    const RAW_COLOR_RE =
      /\b(?:[\w-]*:)?(?:bg|text|border|ring|shadow|outline|fill|stroke|from|via|to|divide|placeholder|accent|caret|decoration)-(?:red|blue|green|yellow|purple|pink|indigo|violet|cyan|teal|emerald|lime|amber|orange|fuchsia|rose|sky|slate|gray|zinc|neutral|stone|warm)-\d{1,3}(?:\/\d{1,3})?\b/g;

    /**
     * Check a string value for raw Tailwind tokens.
     * @param {import("estree").Node} node
     * @param {string} value
     */
    function checkValue(node, value) {
      let match;
      RAW_COLOR_RE.lastIndex = 0;
      while ((match = RAW_COLOR_RE.exec(value)) !== null) {
        context.report({
          node,
          messageId: "rawColor",
          data: { value: match[0] },
        });
      }
    }

    /**
     * Returns true if this node is inside a JSDoc / block comment context
     * (i.e. we should skip it — comments are not AST Literal nodes anyway,
     * but template-tag descriptions sometimes are).
     */
    function isInsideComment(node) {
      const parent = node.parent;
      // Skip string literals that are the expression of an ExpressionStatement
      // at the Program/top level (often stray doc strings that got parsed).
      return (
        parent &&
        parent.type === "ExpressionStatement" &&
        parent.parent &&
        parent.parent.type === "Program"
      );
    }

    return {
      // Scan ALL string literals
      Literal(node) {
        if (typeof node.value !== "string") return;
        if (isInsideComment(node)) return;
        checkValue(node, node.value);
      },

      // Scan ALL template literals
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkValue(quasi, quasi.value.raw);
        }
      },
    };
  },
};

module.exports = rule;

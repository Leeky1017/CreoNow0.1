/**
 * Custom ESLint rule: no-raw-tailwind-tokens
 *
 * Forbids raw Tailwind color values (e.g., bg-red-600, text-gray-300)
 * and built-in shadow classes (shadow-lg, shadow-xl, shadow-2xl)
 * in JSX className attributes. Enforces use of semantic Design Tokens.
 *
 * @see docs/references/design-ui-architecture.md
 */

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow raw Tailwind color values and built-in shadow classes in className attributes. Use semantic Design Tokens instead.",
    },
    messages: {
      rawColor:
        "Avoid raw Tailwind color '{{value}}'. Use a semantic Design Token instead. See docs/references/design-ui-architecture.md.",
      rawShadow:
        "Avoid Tailwind built-in shadow class '{{value}}'. Use --shadow-* Design Token instead.",
    },
    schema: [],
  },

  create(context) {
    // Matches: bg-red-600, text-gray-300, border-blue-500, ring-emerald-200, etc.
    const RAW_COLOR_RE =
      /\b(?:bg|text|border|ring|shadow|outline|fill|stroke|from|via|to|divide|placeholder|accent|caret|decoration)-(?:red|blue|green|yellow|purple|pink|indigo|violet|cyan|teal|emerald|lime|amber|orange|fuchsia|rose|sky|slate|gray|zinc|neutral|stone|warm)-\d{1,3}\b/g;

    // Matches: shadow-lg, shadow-xl, shadow-2xl (but not shadow-[custom] or shadow-surface etc.)
    const RAW_SHADOW_RE = /\bshadow-(?:sm|md|lg|xl|2xl)\b/g;

    /**
     * Check a string value for raw Tailwind tokens.
     * @param {import("eslint").AST.Token | import("estree").Node} node
     * @param {string} value
     */
    function checkValue(node, value) {
      let match;
      RAW_COLOR_RE.lastIndex = 0;
      while ((match = RAW_COLOR_RE.exec(value)) !== null) {
        context.report({ node, messageId: "rawColor", data: { value: match[0] } });
      }
      RAW_SHADOW_RE.lastIndex = 0;
      while ((match = RAW_SHADOW_RE.exec(value)) !== null) {
        context.report({ node, messageId: "rawShadow", data: { value: match[0] } });
      }
    }

    return {
      // className="bg-red-600 shadow-lg"
      JSXAttribute(node) {
        if (
          node.name &&
          node.name.name === "className" &&
          node.value
        ) {
          // Direct string literal: className="..."
          if (node.value.type === "Literal" && typeof node.value.value === "string") {
            checkValue(node.value, node.value.value);
          }
          // JSX expression: className={"..."} or className={`...`}
          if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr.type === "Literal" && typeof expr.value === "string") {
              checkValue(expr, expr.value);
            }
            if (expr.type === "TemplateLiteral") {
              for (const quasi of expr.quasis) {
                checkValue(quasi, quasi.value.raw);
              }
            }
          }
        }
      },
    };
  },
};

module.exports = rule;

/**
 * Custom ESLint rule: no-raw-error-code-in-ui
 *
 * Forbids rendering error.code / err.code / *.errorCode directly in JSX.
 * Error codes should be mapped to user-friendly messages via i18n.
 *
 * Allows:
 * - if (error.code === 'X') — conditional checks
 * - switch (error.code) — branching
 * - console.error(error.code) — logging
 * - catch (e) { logger.warn(e.code) } — error handling
 *
 * @see docs/references/coding-standards.md
 */

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow rendering error.code directly in JSX. Map to i18n messages instead.",
    },
    messages: {
      rawErrorCode:
        "Do not render '{{expression}}' directly in UI. Map error codes to user-friendly messages via i18n.",
    },
    schema: [],
  },

  create(context) {
    const CODE_PROPERTIES = new Set(["code", "errorCode"]);

    /**
     * Check if a node is inside a JSX expression context.
     * @param {import("estree").Node} node
     * @returns {boolean}
     */
    function isInJSXContext(node) {
      let current = node.parent;
      while (current) {
        if (current.type === "JSXExpressionContainer") return true;
        if (current.type === "TemplateLiteral") {
          // Check if the template literal itself is in JSX
          let tplParent = current.parent;
          while (tplParent) {
            if (tplParent.type === "JSXExpressionContainer") return true;
            tplParent = tplParent.parent;
          }
        }
        current = current.parent;
      }
      return false;
    }

    /**
     * Check if the node is inside a conditional/logging context (not rendering).
     * @param {import("estree").Node} node
     * @returns {boolean}
     */
    function isInExcludedContext(node) {
      let current = node.parent;
      while (current) {
        switch (current.type) {
          case "IfStatement":
          case "ConditionalExpression":
          case "SwitchStatement":
          case "SwitchCase":
            return true;
          case "BinaryExpression":
            if (["===", "!==", "==", "!="].includes(current.operator))
              return true;
            break;
          case "CallExpression": {
            const callee = current.callee;
            // console.* or logger.*
            if (
              callee.type === "MemberExpression" &&
              callee.object.type === "Identifier" &&
              ["console", "logger", "log"].includes(callee.object.name)
            ) {
              return true;
            }
            break;
          }
          case "CatchClause":
            // Only if the direct usage context is NOT JSX
            // catch blocks can still render JSX, so only exclude if
            // the immediate parent chain to this point doesn't include JSX
            break;
        }
        current = current.parent;
      }
      return false;
    }

    return {
      MemberExpression(node) {
        if (node.computed) return;
        if (node.property.type !== "Identifier") return;
        if (!CODE_PROPERTIES.has(node.property.name)) return;

        // Only flag if in JSX context
        if (!isInJSXContext(node)) return;

        // Exclude conditional/logging contexts
        if (isInExcludedContext(node)) return;

        const objectName =
          node.object.type === "Identifier" ? node.object.name : "obj";
        context.report({
          node,
          messageId: "rawErrorCode",
          data: {
            expression: `${objectName}.${node.property.name}`,
          },
        });
      },
    };
  },
};

module.exports = rule;

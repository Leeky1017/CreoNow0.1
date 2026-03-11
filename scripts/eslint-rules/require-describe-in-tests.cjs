/**
 * Custom ESLint rule: require-describe-in-tests
 *
 * Requires test files (.test.ts, .test.tsx, .spec.ts, .spec.tsx)
 * to contain at least one `describe()` call, enforcing structured
 * test organization over script-style or bare-block patterns.
 *
 * @see docs/references/testing/01-philosophy-and-anti-patterns.md
 * @see docs/references/testing/06-guard-and-lint-policy.md
 */

const TEST_FILE_PATTERN = /\.(test|spec)\.[tj]sx?$/;

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require test files to contain at least one describe() block.",
    },
    messages: {
      missingDescribe:
        "Test files must use describe() to organize tests. Wrap your test cases in a describe() block.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();
    if (!TEST_FILE_PATTERN.test(filename)) return {};

    let hasDescribe = false;

    return {
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "describe"
        ) {
          hasDescribe = true;
        }
      },

      "Program:exit"(node) {
        if (!hasDescribe) {
          context.report({
            node,
            messageId: "missingDescribe",
          });
        }
      },
    };
  },
};

module.exports = rule;

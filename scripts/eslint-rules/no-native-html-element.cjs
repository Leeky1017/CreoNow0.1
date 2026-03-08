/**
 * Custom ESLint rule: no-native-html-element
 *
 * Forbids native interactive HTML elements in renderer production code.
 * These should be replaced with design system components for consistency.
 *
 * @see docs/references/design-ui-architecture.md
 */

/** @type {Record<string, string>} */
const REPLACEMENT_MAP = {
  button: "Button",
  input: "Input",
  select: "Select",
  textarea: "Textarea",
  dialog: "Dialog",
  a: "Link",
  label: "Label",
};

const FORBIDDEN_TAGS = new Set(Object.keys(REPLACEMENT_MAP));

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow native interactive HTML elements. Use design system components instead.",
    },
    messages: {
      noNativeElement:
        "Avoid native <{{tag}}> element. Use <{{replacement}}> from the design system instead.",
    },
    schema: [],
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name;
        if (name.type !== "JSXIdentifier") return;
        const tag = name.name;
        if (!FORBIDDEN_TAGS.has(tag)) return;

        context.report({
          node,
          messageId: "noNativeElement",
          data: {
            tag,
            replacement: REPLACEMENT_MAP[tag],
          },
        });
      },
    };
  },
};

module.exports = rule;

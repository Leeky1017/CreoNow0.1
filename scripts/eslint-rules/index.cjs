/**
 * Local ESLint plugin for CreoNow custom rules.
 *
 * Usage in .eslintrc.cjs:
 *   plugins: ["creonow"]
 *   rules: { "creonow/no-raw-tailwind-tokens": "warn" }
 *
 * Resolved via eslintrc "plugins" + package.json alias or --rulesdir.
 */

const noRawTailwindTokens = require("./no-raw-tailwind-tokens.cjs");

module.exports = {
  rules: {
    "no-raw-tailwind-tokens": noRawTailwindTokens,
  },
};

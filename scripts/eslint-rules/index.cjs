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
const noNativeHtmlElement = require("./no-native-html-element.cjs");
const noRawErrorCodeInUi = require("./no-raw-error-code-in-ui.cjs");
const noHardcodedDimension = require("./no-hardcoded-dimension.cjs");

module.exports = {
  rules: {
    "no-raw-tailwind-tokens": noRawTailwindTokens,
    "no-native-html-element": noNativeHtmlElement,
    "no-raw-error-code-in-ui": noRawErrorCodeInUi,
    "no-hardcoded-dimension": noHardcodedDimension,
  },
};

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "i18next", "creonow"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  settings: {
    react: { version: "detect" },
  },
  ignorePatterns: [
    "dist/",
    "apps/**/dist/",
    "apps/**/dist-electron/",
    "playwright-report/",
    "test-results/",
    ".worktrees/",
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    complexity: ["error", 25],
    "max-lines-per-function": [
      "error",
      { max: 300, skipBlankLines: true, skipComments: true },
    ],
    "react/react-in-jsx-scope": "off",
  },
  overrides: [
    {
      // i18n + token compliance for renderer production code (excludes tests and stories)
      files: ["apps/desktop/renderer/src/**/*.{ts,tsx}"],
      excludedFiles: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
        "**/__tests__/**",
      ],
      rules: {
        "i18next/no-literal-string": [
          "error",
          {
            ignore: [
              "^[A-Z_]+$",
              "^\\d+[%a-z]*$",
              "^\\s*$",
              "^[\\+\\-\\*\\/\\=\\<\\>\\!\\&\\|\\?\\:\\,\\.\\;\\(\\)\\[\\]\\{\\}]+$",
              "^[a-z]+(-[a-z]+)*$",
            ],
            ignoreCallee: [
              "console.*",
              "logger.*",
              "describe",
              "it",
              "test",
              "expect",
              "Error",
              "TypeError",
              "RangeError",
              "require",
              "t",
              "t\\.",
              "i18n.*",
              "z\\..*",
              "addEventListener",
              "removeEventListener",
              "querySelector",
              "getElementById",
              "setAttribute",
              "*.debug",
              "*.warn",
              "*.error",
              "*.info",
              "*.trace",
            ],
            ignoreAttribute: [
              "data-testid",
              "data-*",
              "className",
              "key",
              "id",
              "name",
              "type",
              "role",
              "aria-*",
              "htmlFor",
              "src",
              "href",
              "target",
              "rel",
              "method",
              "action",
              "as",
              "viewBox",
              "fill",
              "stroke",
              "d",
              "strokeLinecap",
              "strokeLinejoin",
              "clipRule",
              "fillRule",
              "xmlns",
              "preserveAspectRatio",
            ],
          },
        ],
        "creonow/no-raw-tailwind-tokens": "error",
        "creonow/no-native-html-element": "warn",
        "creonow/no-raw-error-code-in-ui": "warn",
        "creonow/no-hardcoded-dimension": "warn",
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "UnaryExpression[operator='void'][argument.type='CallExpression'][argument.callee.type='ArrowFunctionExpression'][argument.callee.async=true]",
            message:
              "Do not use bare void async IIFE. Use runFireAndForget() with explicit error handling.",
          },
        ],
      },
    },
    {
      // Stories: relax i18n but warn on raw tokens
      files: ["**/*.stories.{ts,tsx}"],
      rules: {
        "i18next/no-literal-string": "off",
        "creonow/no-raw-tailwind-tokens": "warn",
      },
    },
    {
      files: ["apps/desktop/renderer/src/stores/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "UnaryExpression[operator='void'][argument.type='CallExpression'][argument.callee.type='ArrowFunctionExpression'][argument.callee.async=true]",
            message:
              "Do not use bare void async IIFE. Use runFireAndForget() with explicit error handling.",
          },
          {
            selector:
              "CallExpression[callee.type='MemberExpression'][callee.object.name='React'][callee.property.name='createElement']",
            message:
              "Use JSX syntax instead of React.createElement in stores.",
          },
        ],
      },
    },
  ],
};

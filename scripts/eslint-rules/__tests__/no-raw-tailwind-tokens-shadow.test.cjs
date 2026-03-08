// @ts-nocheck — ESLint RuleTester is JS-only
// Additional tests for shadow class matching in no-raw-tailwind-tokens
const { RuleTester } = require("eslint");
const rule = require("../no-raw-tailwind-tokens.cjs");

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

tester.run("creonow/no-raw-tailwind-tokens (shadow extension)", rule, {
  valid: [
    // CSS variable reference — should not trigger
    { code: `const x = "shadow-[var(--shadow-card)]";` },
    // Custom shadow with arbitrary value — should not trigger
    { code: `const x = "shadow-[0_4px_6px_rgba(0,0,0,0.1)]";` },
    // Design token usage — should not trigger
    { code: `const x = "shadow-surface";` },
    // Drop shadow variant — should not trigger
    { code: `const x = "drop-shadow-md";` },
    // CSS variable name — should not trigger
    { code: `const x = "--shadow-md";` },
  ],
  invalid: [
    // Built-in shadow-lg — should trigger
    {
      code: `const cls = "shadow-lg";`,
      errors: [{ messageId: "rawShadow" }],
    },
    // Built-in shadow-xl — should trigger
    {
      code: `const cls = "shadow-xl";`,
      errors: [{ messageId: "rawShadow" }],
    },
    // Built-in shadow-2xl — should trigger
    {
      code: `const cls = "shadow-2xl";`,
      errors: [{ messageId: "rawShadow" }],
    },
    // Built-in shadow-sm — should trigger
    {
      code: `const cls = "shadow-sm";`,
      errors: [{ messageId: "rawShadow" }],
    },
    // Multiple shadows in one string — should trigger twice
    {
      code: `const cls = "shadow-xl shadow-2xl";`,
      errors: [{ messageId: "rawShadow" }, { messageId: "rawShadow" }],
    },
    // With modifier prefix — should trigger
    {
      code: `const cls = "hover:shadow-lg";`,
      errors: [{ messageId: "rawShadow" }],
    },
  ],
});

console.log("✅ no-raw-tailwind-tokens (shadow extension): all tests passed");

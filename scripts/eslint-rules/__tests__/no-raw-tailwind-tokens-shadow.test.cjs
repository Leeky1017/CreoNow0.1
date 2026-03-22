// @ts-nocheck — ESLint RuleTester is JS-only
// Shadow classes (shadow-xs/sm/md/lg/xl/2xl) are exported via @theme
// and map to our design tokens. They are no longer flagged.
const { RuleTester } = require("eslint");
const rule = require("../no-raw-tailwind-tokens.cjs");

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

tester.run(
  "creonow/no-raw-tailwind-tokens (shadow — now allowed via @theme)",
  rule,
  {
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
      // @theme-exported shadow utilities — should not trigger
      { code: `const cls = "shadow-xs";` },
      { code: `const cls = "shadow-sm";` },
      { code: `const cls = "shadow-lg";` },
      { code: `const cls = "shadow-xl";` },
      { code: `const cls = "shadow-2xl";` },
      { code: `const cls = "hover:shadow-lg";` },
      { code: `const cls = "shadow-xl shadow-2xl";` },
    ],
    invalid: [],
  },
);

console.log(
  "✅ no-raw-tailwind-tokens (shadow — @theme allowed): all tests passed",
);

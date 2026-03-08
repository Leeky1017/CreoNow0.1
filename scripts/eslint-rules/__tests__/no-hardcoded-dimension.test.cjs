// @ts-nocheck — ESLint RuleTester is JS-only; skip TS checks
const { RuleTester } = require("eslint");
const rule = require("../no-hardcoded-dimension.cjs");

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

tester.run("creonow/no-hardcoded-dimension", rule, {
  valid: [
    // Small pixel value (≤48px) — exempted
    { code: `const x = <div className="h-[16px]" />;` },
    { code: `const x = <div className="w-[48px]" />;` },
    { code: `const x = <div className="h-[32px]" />;` },
    // Tailwind predefined class — not arbitrary
    { code: `const x = <div className="h-full" />;` },
    { code: `const x = <div className="max-w-prose" />;` },
    { code: `const x = <div className="w-screen" />;` },
    // Non-px unit — exempted
    { code: `const x = <div className="h-[50vh]" />;` },
    { code: `const x = <div className="w-[80%]" />;` },
    { code: `const x = <div className="min-h-[100dvh]" />;` },
  ],
  invalid: [
    // Large hardcoded height
    {
      code: `const x = <div className="h-[600px]" />;`,
      errors: [{ messageId: "hardcodedDimension" }],
    },
    // Large hardcoded width
    {
      code: `const x = <div className="w-[400px]" />;`,
      errors: [{ messageId: "hardcodedDimension" }],
    },
    // Large min-height
    {
      code: `const x = <div className="min-h-[800px]" />;`,
      errors: [{ messageId: "hardcodedDimension" }],
    },
    // Large max-width
    {
      code: `const x = <div className="max-w-[960px]" />;`,
      errors: [{ messageId: "hardcodedDimension" }],
    },
    // With modifier prefix
    {
      code: `const x = <div className="md:h-[500px]" />;`,
      errors: [{ messageId: "hardcodedDimension" }],
    },
  ],
});

console.log("✅ no-hardcoded-dimension: all tests passed");

// @ts-nocheck — ESLint RuleTester is JS-only; skip TS checks
const { RuleTester } = require("eslint");
const rule = require("../no-raw-error-code-in-ui.cjs");

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

tester.run("creonow/no-raw-error-code-in-ui", rule, {
  valid: [
    // Conditional check — should not trigger
    { code: `if (error.code === 'NOT_FOUND') { handle(); }` },
    // Switch statement — should not trigger
    { code: `switch (error.code) { case 'X': break; }` },
    // Console logging — should not trigger
    { code: `console.error(error.code);` },
    // Logger usage — should not trigger
    { code: `logger.warn(err.code);` },
    // Non-.code member access — should not trigger
    { code: `const x = <p>{error.message}</p>;` },
    // Assignment — should not trigger
    { code: `const code = error.code;` },
    // Ternary with condition — should not trigger
    { code: `const x = error.code === 'X' ? <p>A</p> : <p>B</p>;` },
  ],
  invalid: [
    // Direct rendering of error.code in JSX — should trigger
    {
      code: `const x = <p>{error.code}</p>;`,
      errors: [
        {
          messageId: "rawErrorCode",
          data: { expression: "error.code" },
        },
      ],
    },
    // Rendering err.errorCode in JSX — should trigger
    {
      code: `const x = <span>{err.errorCode}</span>;`,
      errors: [
        {
          messageId: "rawErrorCode",
          data: { expression: "err.errorCode" },
        },
      ],
    },
  ],
});

console.log("✅ no-raw-error-code-in-ui: all tests passed");

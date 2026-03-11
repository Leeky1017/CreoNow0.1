// @ts-nocheck — ESLint RuleTester is JS-only; skip TS checks
const { RuleTester } = require("eslint");
const rule = require("../require-describe-in-tests.cjs");

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

tester.run("creonow/require-describe-in-tests", rule, {
  valid: [
    // Has describe() — should pass
    {
      code: `
        import { describe, it, expect } from 'vitest';
        describe('MyModule', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `,
      filename: "src/foo.test.ts",
    },
    // Has nested describe() — should pass
    {
      code: `
        import { describe, it } from 'vitest';
        describe('outer', () => {
          describe('inner', () => {
            it('works', () => {});
          });
        });
      `,
      filename: "src/bar.test.ts",
    },
    // Non-test file without describe — should not trigger
    {
      code: `export const x = 1;`,
      filename: "src/utils.ts",
    },
    // Non-test file (.tsx) without describe — should not trigger
    {
      code: `export default function App() { return null; }`,
      filename: "src/App.tsx",
    },
    // .spec.ts with describe — should pass
    {
      code: `
        describe('spec file', () => {
          it('works', () => {});
        });
      `,
      filename: "tests/e2e/login.spec.ts",
    },
    // describe inside conditional still counts
    {
      code: `
        if (process.env.CI) {
          describe('conditional', () => {
            it('runs on CI', () => {});
          });
        }
      `,
      filename: "src/cond.test.ts",
    },
  ],
  invalid: [
    // No describe() in .test.ts — should error
    {
      code: `
        import { it, expect } from 'vitest';
        it('should work', () => {
          expect(1).toBe(1);
        });
      `,
      filename: "src/foo.test.ts",
      errors: [{ messageId: "missingDescribe" }],
    },
    // No describe() in .test.tsx — should error
    {
      code: `
        test('renders', () => {
          expect(true).toBe(true);
        });
      `,
      filename: "src/Comp.test.tsx",
      errors: [{ messageId: "missingDescribe" }],
    },
    // Script-style test file — should error
    {
      code: `
        async function main() {
          console.log('testing...');
        }
        main();
      `,
      filename: "scripts/tests/check.test.ts",
      errors: [{ messageId: "missingDescribe" }],
    },
    // No describe() in .spec.ts — should error
    {
      code: `
        it('bare spec', () => {});
      `,
      filename: "tests/e2e/bare.spec.ts",
      errors: [{ messageId: "missingDescribe" }],
    },
  ],
});

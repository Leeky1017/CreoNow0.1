// @ts-nocheck — ESLint RuleTester is JS-only; skip TS checks
const { RuleTester } = require("eslint");
const rule = require("../no-native-html-element.cjs");

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

tester.run("creonow/no-native-html-element", rule, {
  valid: [
    // Design system component (uppercase) — should not trigger
    { code: `const x = <Button onClick={fn}>Click</Button>;` },
    // Layout elements — should not trigger
    { code: `const x = <div className="flex"><span>text</span></div>;` },
    { code: `const x = <p>Paragraph</p>;` },
    { code: `const x = <h1>Title</h1>;` },
    { code: `const x = <h2>Subtitle</h2>;` },
    // Media elements — should not trigger
    { code: `const x = <img src="foo.png" />;` },
    { code: `const x = <video src="bar.mp4" />;` },
    { code: `const x = <canvas />;` },
    // Semantic elements — should not trigger
    { code: `const x = <section><article>Content</article></section>;` },
    { code: `const x = <nav>Navigation</nav>;` },
    { code: `const x = <main>Main</main>;` },
    { code: `const x = <footer>Footer</footer>;` },
  ],
  invalid: [
    // Native <button> — should trigger
    {
      code: `const x = <button onClick={fn}>Click</button>;`,
      errors: [
        {
          messageId: "noNativeElement",
          data: { tag: "button", replacement: "Button" },
        },
      ],
    },
    // Native <input> — should trigger
    {
      code: `const x = <input type="text" />;`,
      errors: [
        {
          messageId: "noNativeElement",
          data: { tag: "input", replacement: "Input" },
        },
      ],
    },
    // Native <select> — should trigger
    {
      code: `const x = <select><option>A</option></select>;`,
      errors: [
        {
          messageId: "noNativeElement",
          data: { tag: "select", replacement: "Select" },
        },
      ],
    },
    // Native <textarea> — should trigger
    {
      code: `const x = <textarea rows={3} />;`,
      errors: [
        {
          messageId: "noNativeElement",
          data: { tag: "textarea", replacement: "Textarea" },
        },
      ],
    },
    // Native <dialog> — should trigger
    {
      code: `const x = <dialog open>Content</dialog>;`,
      errors: [
        {
          messageId: "noNativeElement",
          data: { tag: "dialog", replacement: "Dialog" },
        },
      ],
    },
    // Native <a> — should trigger
    {
      code: `const x = <a href="/page">Link</a>;`,
      errors: [
        {
          messageId: "noNativeElement",
          data: { tag: "a", replacement: "Link" },
        },
      ],
    },
    // Native <label> — should trigger
    {
      code: `const x = <label htmlFor="id">Label</label>;`,
      errors: [
        {
          messageId: "noNativeElement",
          data: { tag: "label", replacement: "Label" },
        },
      ],
    },
  ],
});

console.log("✅ no-native-html-element: all tests passed");

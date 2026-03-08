import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  scanErrorBoundaryCoverage,
  writeBaseline,
  runGate,
} from "../error-boundary-coverage-gate";

// ── Test: global ErrorBoundary in main.tsx → no violations ──
{
  const root = mkdtempSync(path.join(tmpdir(), "eb-gate-global-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "main.tsx"),
    `
    import { ErrorBoundary } from "./components/patterns";
    ReactDOM.createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    `,
  );
  const violations = scanErrorBoundaryCoverage(root);
  assert.equal(violations.length, 0, "Global ErrorBoundary should cover all routes");
}

// ── Test: no ErrorBoundary at all → page components reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "eb-gate-missing-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  const pagesDir = path.join(srcDir, "pages");
  mkdirSync(pagesDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "main.tsx"),
    `
    ReactDOM.createRoot(rootEl).render(<App />);
    `,
  );
  writeFileSync(
    path.join(pagesDir, "SettingsPage.tsx"),
    `
    export function SettingsPage() {
      return <div>Settings</div>;
    }
    `,
  );
  const violations = scanErrorBoundaryCoverage(root);
  assert.equal(violations.length, 1, "Page without ErrorBoundary should be reported");
  assert.ok(violations[0].file.includes("SettingsPage.tsx"));
}

// ── Test: page with local ErrorBoundary → not reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "eb-gate-local-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  const pagesDir = path.join(srcDir, "pages");
  mkdirSync(pagesDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "main.tsx"),
    `
    ReactDOM.createRoot(rootEl).render(<App />);
    `,
  );
  writeFileSync(
    path.join(pagesDir, "EditorPage.tsx"),
    `
    import { ErrorBoundary } from "../components/patterns";
    export function EditorPage() {
      return <ErrorBoundary><Editor /></ErrorBoundary>;
    }
    `,
  );
  const violations = scanErrorBoundaryCoverage(root);
  assert.equal(violations.length, 0, "Page with local ErrorBoundary should not be reported");
}

// ── Test: violations ≤ baseline → PASS ──
{
  const root = mkdtempSync(path.join(tmpdir(), "eb-gate-pass-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(5, root);
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(path.join(srcDir, "main.tsx"), `ReactDOM.createRoot(rootEl).render(<App />);`);
  // No page files → 0 violations ≤ 5 baseline
  const result = runGate(root);
  assert.ok(result.ok, "violations ≤ baseline should PASS");
}

// ── Test: violations > baseline → FAIL ──
{
  const root = mkdtempSync(path.join(tmpdir(), "eb-gate-fail-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(0, root);
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  const pagesDir = path.join(srcDir, "pages");
  mkdirSync(pagesDir, { recursive: true });
  writeFileSync(path.join(srcDir, "main.tsx"), `ReactDOM.createRoot(rootEl).render(<App />);`);
  writeFileSync(
    path.join(pagesDir, "DashboardPage.tsx"),
    `export function DashboardPage() { return <div>Dashboard</div>; }`,
  );
  const result = runGate(root);
  assert.ok(!result.ok, "violations > baseline should FAIL");
}

console.log("✅ error-boundary-coverage-gate: all tests passed");

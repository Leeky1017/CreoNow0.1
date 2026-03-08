import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  scanArchitectureHealth,
  countProviderNestingDepth,
  hasAriaLive,
  writeBaseline,
  runGate,
} from "../architecture-health-gate";

// ── Test: Provider nesting depth 13 > threshold 10 → violation ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-nest-deep-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "App.tsx"),
    `
    export function App() {
      return (
        <AProvider>
          <BProvider>
            <CProvider>
              <DProvider>
                <EProvider>
                  <FProvider>
                    <GProvider>
                      <HProvider>
                        <IProvider>
                          <JProvider>
                            <KProvider>
                              <LProvider>
                                <MProvider>
                                  <div>Deep</div>
                                </MProvider>
                              </LProvider>
                            </KProvider>
                          </JProvider>
                        </IProvider>
                      </HProvider>
                    </GProvider>
                  </FProvider>
                </DProvider>
              </CProvider>
            </BProvider>
          </AProvider>
        </AProvider>
      );
    }
    `,
  );
  const violations = scanArchitectureHealth(root);
  const nestingViolations = violations.filter((v) => v.category === "provider-nesting");
  assert.ok(nestingViolations.length > 0, "Provider nesting > 10 should be reported");
  assert.ok(nestingViolations[0].value! > 10, "Depth should exceed threshold");
}

// ── Test: Provider nesting depth ≤ 10 → no violation ──
{
  const content = `
    <AProvider>
      <BProvider>
        <CProvider>
          <div>Shallow</div>
        </CProvider>
      </BProvider>
    </AProvider>
  `;
  const depth = countProviderNestingDepth(content);
  assert.ok(depth <= 10, "3-deep nesting should not exceed threshold");
}

// ── Test: file size > 500 lines → violation ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-size-big-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(srcDir, { recursive: true });
  // Generate a file with 650 lines
  const lines = Array.from({ length: 650 }, (_, i) => `const line${i} = ${i};`);
  writeFileSync(path.join(srcDir, "BigComponent.tsx"), lines.join("\n"));
  const violations = scanArchitectureHealth(root);
  const sizeViolations = violations.filter((v) => v.category === "file-size");
  assert.ok(sizeViolations.length > 0, "File with 650 lines should be reported");
  assert.equal(sizeViolations[0].value, 650);
}

// ── Test: file size ≤ 500 lines → no violation ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-size-small-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(srcDir, { recursive: true });
  const lines = Array.from({ length: 100 }, (_, i) => `const x${i} = ${i};`);
  writeFileSync(path.join(srcDir, "SmallComponent.tsx"), lines.join("\n"));
  const violations = scanArchitectureHealth(root);
  const sizeViolations = violations.filter((v) => v.category === "file-size");
  assert.equal(sizeViolations.length, 0, "File with 100 lines should not be reported");
}

// ── Test: test/stories files excluded from size check ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-size-excluded-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(srcDir, { recursive: true });
  const lines = Array.from({ length: 650 }, (_, i) => `const x${i} = ${i};`);
  writeFileSync(path.join(srcDir, "Button.test.tsx"), lines.join("\n"));
  writeFileSync(path.join(srcDir, "Button.stories.tsx"), lines.join("\n"));
  const violations = scanArchitectureHealth(root);
  const sizeViolations = violations.filter((v) => v.category === "file-size");
  assert.equal(sizeViolations.length, 0, "Test and story files should be excluded from size check");
}

// ── Test: dynamic component (Toast) without aria-live → violation ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-aria-missing-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  const compDir = path.join(srcDir, "components");
  mkdirSync(compDir, { recursive: true });
  writeFileSync(
    path.join(compDir, "Toast.tsx"),
    `
    export function Toast({ message }: { message: string }) {
      return <div className="toast">{message}</div>;
    }
    `,
  );
  const violations = scanArchitectureHealth(root);
  const ariaViolations = violations.filter((v) => v.category === "aria-live-missing");
  assert.ok(ariaViolations.length > 0, "Toast without aria-live should be reported");
}

// ── Test: dynamic component (Toast) with aria-live → no violation ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-aria-present-"));
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  const compDir = path.join(srcDir, "components");
  mkdirSync(compDir, { recursive: true });
  writeFileSync(
    path.join(compDir, "Toast.tsx"),
    `
    export function Toast({ message }: { message: string }) {
      return <div aria-live="polite" className="toast">{message}</div>;
    }
    `,
  );
  const violations = scanArchitectureHealth(root);
  const ariaViolations = violations.filter((v) => v.category === "aria-live-missing");
  assert.equal(ariaViolations.length, 0, "Toast with aria-live should not be reported");
}

// ── Test: hasAriaLive function ──
{
  assert.ok(hasAriaLive('<div aria-live="polite">content</div>'), "Should detect aria-live");
  assert.ok(!hasAriaLive('<div className="toast">content</div>'), "Should not find aria-live where absent");
}

// ── Test: violations ≤ baseline → PASS ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-gate-pass-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(10, root);
  // No renderer source → 0 violations ≤ 10 baseline
  const result = runGate(root);
  assert.ok(result.ok, "violations ≤ baseline should PASS");
}

// ── Test: violations > baseline → FAIL ──
{
  const root = mkdtempSync(path.join(tmpdir(), "arch-gate-fail-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(0, root);
  const srcDir = path.join(root, "apps", "desktop", "renderer", "src");
  const compDir = path.join(srcDir, "components");
  mkdirSync(compDir, { recursive: true });
  writeFileSync(
    path.join(compDir, "Alert.tsx"),
    `export function Alert() { return <div>Alert</div>; }`,
  );
  const result = runGate(root);
  assert.ok(!result.ok, "violations > baseline should FAIL");
}

console.log("✅ architecture-health-gate: all tests passed");

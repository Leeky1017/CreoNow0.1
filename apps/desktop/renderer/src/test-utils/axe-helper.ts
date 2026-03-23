import { axe, toHaveNoViolations } from "jest-axe";

import { expect } from "vitest";

expect.extend(toHaveNoViolations);

type AxeAuditResults = Awaited<ReturnType<typeof axe>>;

function formatViolationSummary(results: AxeAuditResults): string {
  return results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `    - ${node.target.join(" | ")}`)
        .join("\n");

      return `${violation.id}: ${violation.help}\n${nodes}`;
    })
    .join("\n");
}

export async function expectNoAxeViolations(
  root: HTMLElement,
  context?: string,
): Promise<void> {
  const results = await axe(root);

  if (results.violations.length > 0) {
    const prefix = context ? `${context}\n` : "";
    throw new Error(`${prefix}${formatViolationSummary(results)}`);
  }

  expect(results).toHaveNoViolations();
}

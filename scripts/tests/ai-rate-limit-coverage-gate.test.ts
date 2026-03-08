import assert from 'node:assert/strict';

import {
  runRateLimitCoverageGate,
  verifyAiRateLimitFromGovernance,
  verifySkillSchedulerGovernance,
} from '../ai-rate-limit-coverage-gate';

// PASS fixture: real governance checks succeed
await verifyAiRateLimitFromGovernance();
await verifySkillSchedulerGovernance();

// PASS fixture: aggregate runner reports success
{
  const result = await runRateLimitCoverageGate([
    { label: 'pass-a', run: async () => {} },
    { label: 'pass-b', run: async () => {} },
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.passed, ['pass-a', 'pass-b']);
}

// FAIL fixture: aggregate runner surfaces verifier failure
{
  const result = await runRateLimitCoverageGate([
    { label: 'pass-a', run: async () => {} },
    { label: 'fail-b', run: async () => { throw new Error('boom'); } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0]!, /fail-b/);
}

console.log('✅ ai-rate-limit-coverage-gate: all tests passed');

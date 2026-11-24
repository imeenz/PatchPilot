import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRefreshedVerificationState,
  isVerifiedFixedFromLatest,
} from '../src/services/verificationState.mjs';

test('latest verification evidence determines fixed state', () => {
  for (const result of ['Failed', 'Partially Fixed', 'Inconclusive']) {
    assert.equal(isVerifiedFixedFromLatest([
      { id: 1, verification_result: 'Verified Fixed' },
      { id: 2, verification_result: result },
    ]), false, `${result} evidence must replace older Verified Fixed evidence`);
  }
  assert.equal(isVerifiedFixedFromLatest([
    { id: 2, verification_result: 'Failed' },
    { id: 1, verification_result: 'Verified Fixed' },
  ]), false);
  assert.equal(isVerifiedFixedFromLatest([
    { id: 1, verification_result: 'Failed' },
    { id: 2, verification_result: 'Verified Fixed' },
  ]), true);
  assert.equal(isVerifiedFixedFromLatest([]), false);
});

test('refreshed finding state replaces rather than preserves stale fixed status', () => {
  const findings = [
    { id: 1, is_verified_fixed: true, title: 'Old fixed finding' },
    { id: 2, is_verified_fixed: false, title: 'Other finding' },
  ];
  const refreshed = applyRefreshedVerificationState(findings, { id: 1, is_verified_fixed: false });
  assert.equal(refreshed[0].is_verified_fixed, false);
  assert.equal(refreshed[0].title, 'Old fixed finding');
  assert.equal(refreshed[1], findings[1]);
});

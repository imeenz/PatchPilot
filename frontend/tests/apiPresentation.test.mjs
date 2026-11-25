import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiErrorPresentation, getDataSourceState } from '../src/services/apiPresentation.mjs';

test('network rejection is distinguished from a received HTTP 500', () => {
  assert.deepEqual(getApiErrorPresentation({ kind: 'network' }), {
    network: true,
    title: 'Cannot connect to the PatchPilot backend',
  });
  const serverError = { kind: 'http', status: 500, message: 'Internal Server Error' };
  assert.deepEqual(getApiErrorPresentation(serverError), {
    network: false,
    title: 'Backend internal error',
  });
  assert.equal(serverError.message, 'Internal Server Error');
});

test('HTTP status codes get distinct validation, authorization, and server labels', () => {
  assert.equal(getApiErrorPresentation({ status: 400 }).title, 'Request could not be processed');
  assert.equal(getApiErrorPresentation({ status: 401 }).title, 'Authentication required');
  assert.equal(getApiErrorPresentation({ status: 403 }).title, 'Access denied');
  assert.equal(getApiErrorPresentation({ status: 404 }).title, 'Resource not found');
  assert.equal(getApiErrorPresentation({ status: 422 }).title, 'Request validation failed');
  assert.equal(getApiErrorPresentation({ status: 503 }).title, 'Backend error');
});

test('data source badge only reports live after successful health and data requests', () => {
  assert.equal(getDataSourceState(false, 'checking', 'loading'), 'checking');
  assert.equal(getDataSourceState(false, 'offline', 'failed'), 'offline');
  assert.equal(getDataSourceState(false, 'online', 'failed'), 'degraded');
  assert.equal(getDataSourceState(false, 'degraded', 'success'), 'degraded');
  assert.equal(getDataSourceState(false, 'online', 'success'), 'live');
  assert.equal(getDataSourceState(true, 'offline', 'failed'), 'demo');
});

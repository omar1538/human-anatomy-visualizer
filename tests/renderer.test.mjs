// The app is WebGPU only: checkWebGPU decides between the viewer and the "WebGPU is required" message.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkWebGPU, WebGPUUnavailableError } from '../script/render/renderer.mjs';

const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const setNavigator = (value) =>
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'navigator', original);
  else delete globalThis.navigator;
});

test('no navigator.gpu: WebGPU is reported missing', async () => {
  setNavigator({});
  assert.equal(await checkWebGPU(), 'this browser has no WebGPU');
});

test('navigator.gpu without an adapter: reported as no compatible adapter', async () => {
  setNavigator({ gpu: { requestAdapter: async () => null } });
  assert.equal(await checkWebGPU(), 'no compatible GPU adapter');
});

test('adapter request that throws: reported, not thrown', async () => {
  setNavigator({
    gpu: {
      requestAdapter: async () => {
        throw new Error('blocked');
      },
    },
  });
  assert.equal(await checkWebGPU(), 'the GPU adapter request failed');
});

test('an adapter is available: WebGPU is usable', async () => {
  setNavigator({ gpu: { requestAdapter: async () => ({}) } });
  assert.equal(await checkWebGPU(), null);
});

test('the error has a name main.mjs can recognise', () => {
  const error = new WebGPUUnavailableError('test');
  assert.equal(error.name, 'WebGPUUnavailableError');
  assert.match(error.message, /WebGPU is not available: test/);
});

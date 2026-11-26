// Track A: tests for the frame-rate statistics (scripts/render/perf.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFrameMeter, summarizeFrames } from '../render/perf.mjs';

test('steady 20 ms frames are 50 FPS with no slow frame', () => {
  assert.deepEqual(summarizeFrames([0, 20, 40, 60, 80, 100]), {
    fps: 50,
    avgFrameMs: 20,
    worstFrameMs: 20,
    frames: 5,
    slowFrames: 0,
  });
});

test('counts frames slower than 50 ms and reports the worst one', () => {
  const r = summarizeFrames([0, 10, 60, 160]); // 10, 50 (not slow) and 100 ms
  assert.equal(r.slowFrames, 1);
  assert.equal(r.worstFrameMs, 100);
  assert.equal(r.frames, 3);
});

test('fewer than two frames, or no elapsed time, gives null', () => {
  assert.equal(summarizeFrames([]), null);
  assert.equal(summarizeFrames([5]), null);
  assert.equal(summarizeFrames([5, 5]), null);
});

test('the meter finishes once the duration has passed since its first frame', () => {
  const meter = createFrameMeter(100);
  assert.equal(meter.add(1000), false);
  assert.equal(meter.add(1050), false);
  assert.equal(meter.add(1100), true);
  assert.equal(meter.result().fps, 20);
});

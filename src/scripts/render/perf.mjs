// Track A: frame-rate measurement for docs/TEST_PLAN.md. Plain functions, no GPU: covered by
// src/scripts/tests/perf.test.mjs.

const SLOW_FRAME_MS = 50; // same limit as the test plan

const round = (n) => Math.round(n * 10) / 10;

/**
 * @param {number[]} times time of each drawn frame, in milliseconds
 * @returns {{ fps: number, avgFrameMs: number, worstFrameMs: number, frames: number, slowFrames: number } | null}
 * null with fewer than two frames (there is no interval to measure)
 */
export function summarizeFrames(times) {
  const frames = times.length - 1; // intervals between frames
  if (frames < 1) return null;
  const total = times[frames] - times[0];
  if (!(total > 0)) return null;
  let worst = 0;
  let slowFrames = 0;
  for (let i = 1; i < times.length; i++) {
    const ms = times[i] - times[i - 1];
    worst = Math.max(worst, ms);
    if (ms > SLOW_FRAME_MS) slowFrames += 1;
  }
  return {
    fps: round((frames * 1000) / total),
    avgFrameMs: round(total / frames),
    worstFrameMs: round(worst),
    frames,
    slowFrames,
  };
}

/** Collects frame times until `durationMs` has passed since the first frame. */
export function createFrameMeter(durationMs) {
  const times = [];
  return {
    /** Call once per drawn frame. @returns {boolean} true when the measurement is complete */
    add(nowMs) {
      times.push(nowMs);
      return nowMs - times[0] >= durationMs;
    },
    result: () => summarizeFrames(times),
  };
}

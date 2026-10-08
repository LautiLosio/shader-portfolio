import test from "node:test";
import assert from "node:assert/strict";
import { cursorImpulse, dragTarget, smoothDrag } from "../src/lib/interaction.ts";

test("gesture strength is identical at proportional viewport sizes", () => {
  assert.deepEqual(dragTarget([10, 20], [30, 60], 200), dragTarget([20, 40], [60, 120], 400));
  assert.deepEqual(dragTarget([0, 0], [0, 0], 400), [0, 0]);
  assert.ok(Math.hypot(...dragTarget([0, 0], [1000, 1000], 400)) <= 1.000001);
});
test("follow response uses elapsed seconds, independent of refresh rate", () => {
  function simulate(fps) {
    let result = [0, 0];
    for (let i = 0; i < fps; i++) result = smoothDrag(result, [0.8, 0.6], 1/fps, true);
    return result;
  }
  const slow = simulate(30), fast = simulate(120);
  assert.ok(Math.abs(slow[0] - fast[0]) < 1e-12);
  assert.ok(Math.abs(slow[1] - fast[1]) < 1e-12);
});
test("release returns to exact zero at 30, 60 and 120 FPS", () => {
  for (const fps of [30, 60, 120]) {
    let drag = [0.8, 0.6];
    for (let i = 0; i < fps * 3; i++) drag = smoothDrag(drag, [0, 0], 1/fps, false);
    assert.deepEqual(drag, [0, 0]);
  }
});

test("cursor velocity responds consistently at 30, 60 and 120 FPS", () => {
  function simulate(fps) {
    let impulse = [0, 0];
    for (let i = 0; i < fps; i++) impulse = cursorImpulse(impulse, [100/fps, -50/fps], 600, 1/fps);
    return impulse;
  }
  const reference = simulate(60);
  for (const fps of [30, 120]) {
    const value = simulate(fps);
    assert.ok(Math.abs(value[0] - reference[0]) < 1e-12);
    assert.ok(Math.abs(value[1] - reference[1]) < 1e-12);
  }
});
test("stationary cursor loses its impulse and returns to zero", () => {
  for (const fps of [30, 60, 120]) {
    let impulse = [0.8, 0.6], drag = [0.8, 0.6];
    for (let i = 0; i < fps * 5; i++) {
      impulse = cursorImpulse(impulse, [0, 0], 600, 1/fps);
      drag = smoothDrag(drag, impulse, 1/fps, Math.hypot(...impulse) > 0);
    }
    assert.deepEqual(impulse, [0, 0]);
    assert.deepEqual(drag, [0, 0]);
  }
});
test("cursor response is viewport-normalized and bounded", () => {
  assert.deepEqual(cursorImpulse([0,0], [10,20], 200, 1/60), cursorImpulse([0,0], [20,40], 400, 1/60));
  assert.ok(Math.hypot(...cursorImpulse([0,0], [1000,1000], 200, 1/60)) <= 1.000001);
});

test("ordinary cursor motion produces a moderate impulse without saturation", () => {
  let impulse = [0, 0];
  for (let i = 0; i < 60; i++) impulse = cursorImpulse(impulse, [100/60, 0], 900, 1/60);
  assert.ok(impulse[0] > 0.22 && impulse[0] < 0.23);
});
test("even a maximum impulse decreases on every stationary frame", () => {
  for (const fps of [30, 60, 120]) {
    let impulse = [1, 0];
    for (let i = 0; i < fps; i++) {
      const previous = impulse[0];
      impulse = cursorImpulse(impulse, [0, 0], 900, 1/fps);
      assert.ok(impulse[0] < previous);
    }
    // The effect persists visibly for a second, while decaying immediately.
    assert.ok(impulse[0] > 0.07 && impulse[0] < 0.08);
  }
});
